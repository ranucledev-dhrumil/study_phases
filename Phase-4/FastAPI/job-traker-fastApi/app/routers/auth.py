from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated
from sqlalchemy import select

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
    email = payload.email
    password = payload.password

    cleaned_email = email.strip().lower()

    stmt = select(User).where(User.email == cleaned_email) 
    existing_user = await db.scalar(stmt) 
    if existing_user is not None: 
        raise HTTPException( status_code=409, detail="User already exists", )
    
    hashed_pass = get_password_hash(password)

    user = User( email=cleaned_email, hashed_password=hashed_pass)

    db.add(user) 
    await db.commit() 
    await db.refresh(user)
    
    return user

@router.post(   "/login", 
                response_model=Token, 
                status_code=200,
                summary="login a User"
            )
async def post_login_user(db: DbSession, form_data: OAuth2PasswordRequestForm = Depends()):
    cleaned_email = form_data.username.strip().lower()

    stmt = select(User).where(User.email == cleaned_email) 
    existing_user = await db.scalar(stmt) 
    if existing_user is None: 
        raise HTTPException( status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}, )
    
    pass_verified = verify_password( form_data.password, existing_user.hashed_password, )

    if not pass_verified: 
        raise HTTPException( status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"}, )

    access_token = create_access_token( {"user_id": existing_user.id} )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get(   "/me", 
                response_model=UserRead, 
                status_code=200,
                summary="Get current user"
            )
async def get_me(current_user: CurrentUser):
    return current_user


