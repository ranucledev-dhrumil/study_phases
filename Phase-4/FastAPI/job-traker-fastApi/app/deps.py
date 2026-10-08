from typing import Annotated

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import DbSession
from app.models import Application, User
from app.security import decode_jwt_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


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


async def _load_owned(db, application_id: int, user: User, with_notes: bool) -> Application:
    stmt = select(Application).where(
        Application.id == application_id, Application.owner_id == user.id
    )
    if with_notes:
        stmt = stmt.options(selectinload(Application.notes))

    application = await db.scalar(stmt)
    if application is None:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")
    return application


async def get_owned_application(
    db: DbSession, application_id: int, current_user: CurrentUser
) -> Application:
    return await _load_owned(db, application_id, current_user, with_notes=False)


async def get_owned_application_detail(
    db: DbSession, application_id: int, current_user: CurrentUser
) -> Application:
    return await _load_owned(db, application_id, current_user, with_notes=True)


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http