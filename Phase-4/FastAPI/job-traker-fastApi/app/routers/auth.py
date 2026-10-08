from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.security import DUMMY_HASH, create_access_token, get_password_hash_async, verify_password_async

from app.schemas.users import UserCreate, UserRead, Token
from app.models import User
from app.db import DbSession
from app.security import get_password_hash, verify_password, create_access_token
from app.deps import get_current_user, CurrentUser

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["users"])

@router.post(   "/register", 
                response_model=UserRead, 
                status_code=201,
                summary="Create a User"
            )
async def post_register_user(db: DbSession, payload: UserCreate):
    cleaned_email = payload.email.strip().lower()

    existing_user = await db.scalar(select(User).where(User.email == cleaned_email))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User already exists")

    hashed_pass = await get_password_hash_async(payload.password)
    user = User(email=cleaned_email, hashed_password=hashed_pass)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:          # simultaneous registrations: the unique index decides
        await db.rollback()
        raise HTTPException(status_code=409, detail="User already exists")
    await db.refresh(user)
    return user

@router.post(   "/login", 
                response_model=Token, 
                status_code=200,
                summary="login a User"
            )
async def post_login_user(db: DbSession, form_data: OAuth2PasswordRequestForm = Depends()):
    cleaned_email = form_data.username.strip().lower()
    existing_user = await db.scalar(select(User).where(User.email == cleaned_email))

    # always verify, so timing doesn't reveal which emails exist; runs in the threadpool
    hashed = existing_user.hashed_password if existing_user else DUMMY_HASH
    pass_verified = await verify_password_async(form_data.password, hashed)

    if existing_user is None or not pass_verified:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"access_token": create_access_token({"user_id": existing_user.id}),
            "token_type": "bearer"}

@router.get(   "/me", 
                response_model=UserRead, 
                status_code=200,
                summary="Get current user"
            )
async def get_me(current_user: CurrentUser):
    return current_user


