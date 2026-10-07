from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.crud import get_application
from app.db import DbSession
from app.models import Application, User
from app.security import decode_jwt_token
import jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_application_or_404(db: DbSession, application_id: int) -> Application:
    record = await get_application(db, application_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    return record

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession,
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_jwt_token(token)
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise credentials_error

    user = await db.get(User, user_id)
    if user is None:
        raise credentials_error
    
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

async def get_owned_application(
    db: DbSession,
    application_id: int,
    current_user: CurrentUser,
    
) -> Application:
    stmt = select(Application).where(
        Application.id == application_id,
        Application.owner_id == current_user.id,
    ).options(selectinload(Application.notes))

    application = await db.scalar(stmt)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    return application
