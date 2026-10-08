from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from starlette.concurrency import run_in_threadpool

from app.config import settings

passwordhash = PasswordHash.recommended()
DUMMY_HASH = passwordhash.hash("not-a-real-password")   # for unknown emails


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return passwordhash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return passwordhash.hash(password)


async def verify_password_async(plain_password: str, hashed_password: str) -> bool:
    return await run_in_threadpool(verify_password, plain_password, hashed_password)


async def get_password_hash_async(password: str) -> str:
    return await run_in_threadpool(get_password_hash, password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_minutes))
    payload = {"sub": str(data["user_id"]), "iat": now, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_jwt_token(jwt_token: str) -> dict:
    return jwt.decode(jwt_token, settings.secret_key, algorithms=["HS256"])