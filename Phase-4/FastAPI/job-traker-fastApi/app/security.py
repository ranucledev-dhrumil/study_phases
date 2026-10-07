from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
import jwt
from app.config import settings

passwordhash = PasswordHash.recommended()

def verify_password(plain_password, hashed_password):
    return passwordhash.verify(plain_password, hashed_password)

def get_password_hash(password):
    return passwordhash.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)

    to_encode = {"sub": str(data["user_id"]), "iat": datetime.now(timezone.utc), "exp": expire}

    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")

    return encoded_jwt

def decode_jwt_token(jwt_token: str):
    payload = jwt.decode(jwt_token, settings.secret_key, algorithms=["HS256"])

    return payload


