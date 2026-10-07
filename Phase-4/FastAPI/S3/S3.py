# 1. Dependency injection in FastAPI
# You've already used it twice: Depends(get_db) and the get_application_or_404 helper. Now the mechanism in full.

from typing import Annotated
from fastapi import Depends

def pagination(skip: int = 0, limit: int = 20):
    return {"skip": skip, "limit": limit}

@router.get("/items")
async def list_items(page: Annotated[dict, Depends(pagination)]): ...

# The core idea: a dependency is any callable. FastAPI inspects its signature, resolves its parameters using the same rules as an endpoint (path, query, body, or other dependencies), calls it per request, and passes the result in.

# What you need to know:
# Dependencies can have dependencies. 
# get_current_user will depend on both a token extractor and get_db, which forms a graph that FastAPI resolves for you.

# Per-request caching. If two dependencies in the same request both need get_db, FastAPI calls it once and shares the result. 
# This matters a lot below, because the auth dependency and your endpoint end up using the same session. Depends(fn, use_cache=False) turns this off.

# Dependencies can read request data. A dependency can declare application_id: int and FastAPI fills it from the path, so it can look up and return the object.
# yield dependencies (what get_db is) run setup before the endpoint and cleanup after.
# Sync vs async. An async def dependency runs on the event loop and a plain def one runs in the threadpool, the same rule as for endpoints.
# Reusable aliases. CurrentUser = Annotated[User, Depends(get_current_user)] lets you write user: CurrentUser in any endpoint.
# Where to attach them:
    # On a parameter, when you need the value.
    # @router.get(..., dependencies=[Depends(check)]), when you only want the side effect, such as raising a 401.
    # APIRouter(dependencies=[...]), to protect a whole router.
    # FastAPI(dependencies=[...]), to cover every route.

# 2. Password hashing
# Never store plaintext or a fast hash such as SHA-256. Use a slow, salted password hash: argon2 or bcrypt.
# The current FastAPI docs use pwdlib[argon2]. Older tutorials use passlib, which is unmaintained and has compatibility problems with recent bcrypt releases, so avoid copying those. Check the docs for the version you install.

from pwdlib import PasswordHash
password_hash = PasswordHash.recommended()          # argon2

hashed = password_hash.hash("s3cret-pass")
password_hash.verify("s3cret-pass", hashed)         # True

# The async trap. Hashing is deliberately CPU-heavy, tens of milliseconds or more, and async doesn't help CPU-bound work. Calling hash() or verify() directly inside an async def blocks the event loop for every other request. Options:
    # await run_in_threadpool(password_hash.verify, plain, hashed) (from starlette.concurrency),
    # await asyncio.to_thread(...), or
    # declare the login endpoint as a plain def, so FastAPI runs it in the threadpool.

# Login hygiene:

# Return one generic error ("Incorrect username or password"). Don't reveal which part was wrong.
# If the user doesn't exist, still run a dummy hash verification, so response time doesn't leak which usernames exist.
# Limit password length. bcrypt only uses the first 72 bytes, and unbounded input lets someone send huge passwords to burn your CPU.

# 3. OAuth2 password flow and the bearer scheme
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# OAuth2PasswordBearer is a dependency that extracts the token from the Authorization: Bearer <token> header. If the header is missing, it automatically returns 401 "Not authenticated".
# It also tells the OpenAPI schema about the auth scheme, so Swagger UI shows an Authorize button and sends the token on every request. This is a major reason to use it.
# tokenUrl points at your login route, which Swagger uses to get a token.
# OAuth2PasswordRequestForm reads form-encoded username and password fields, so it needs the python-multipart package. This differs from your Flask build, which used a JSON login body. The trade-off is that the form flow works with Swagger's Authorize button, while JSON is more natural for SPAs. You can build your own JSON login, but then Authorize won't work.
# HTTPBearer is a simpler scheme that only takes a pasted token.
# OAuth2 scopes exist (Security(..., scopes=[...])), but they're out of scope for this tracker.

# 4. JWT creation and verification (PyJWT)
# The current FastAPI docs use PyJWT (pip install pyjwt). Older tutorials use python-jose, which you should avoid.
import jwt
from datetime import datetime, timedelta, timezone

def create_access_token(user_id: int, expires: timedelta = timedelta(minutes=30)) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + expires}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")

payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])

# Key points:

# Put the user id in sub (as a string), plus exp and iat. PyJWT checks exp for you.
# Always pass algorithms=[...] to decode. It prevents algorithm-confusion attacks, and PyJWT requires it.
# Exceptions: jwt.ExpiredSignatureError is a subclass of jwt.InvalidTokenError, so catching InvalidTokenError covers expired, malformed and badly signed tokens.
# A JWT is signed, not encrypted. Anyone can read the payload, so put no secrets or sensitive data in it.
# The secret key comes from the environment, never from source code. A settings class helps:

from pydantic_settings import BaseSettings   # pip install pydantic-settings

class Settings(BaseSettings):
    secret_key: str
    access_token_minutes: int = 30
    model_config = {"env_file": ".env"}

settings = Settings()
# This is the Pydantic way to do config, and it validates the values at startup. Add .env to .gitignore. Generate a key with openssl rand -hex 32.
# Revocation: stateless JWTs can't be revoked before they expire. The usual answers are a short expiry, refresh tokens, or a denylist. For this tracker, a short-lived access token is enough.

# Comparison: Flask-JWT-Extended gave you create_access_token, @jwt_required() and get_jwt_identity() in one package. Here you assemble the same thing from primitives, and the "decorator" is a dependency. In Spring, this role is played by Spring Security's filter chain.

# 5. The get_current_user dependency
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
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise credentials_error

    user = await db.get(User, user_id)
    if user is None:
        raise credentials_error
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

# Walk through the dependency graph. get_current_user needs oauth2_scheme (to get the token) and get_db (a session). An endpoint that takes user: CurrentUser and db: DbSession resolves get_db once, so both the auth check and the endpoint use the same session. That means the User object is attached to the session your endpoint uses, with no second connection and no detached-object problems.
# 401 vs 403.
# 401 Unauthorized means "who are you?": the token is missing, invalid or expired. Include a WWW-Authenticate: Bearer header.
# 403 Forbidden means "I know who you are, and you can't do this."

# 6. Per-user scoped CRUD
# The rule: every query is filtered by the owner, and the owner is taken from the token, never from the request body.
# model: add an owner
class Application(Base):
    ...
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

async def get_owned_application(
    application_id: int, user: CurrentUser, db: DbSession
) -> Application:
    stmt = select(Application).where(
        Application.id == application_id, Application.owner_id == user.id
    )
    application = await db.scalar(stmt)
    if application is None:
        raise HTTPException(404, f"Application {application_id} not found")
    return application

OwnedApplication = Annotated[Application, Depends(get_owned_application)]

# A chained dependency. get_owned_application reads the path parameter, depends on CurrentUser, and CurrentUser depends on the token and the DB session. Endpoints then just write application: OwnedApplication and the lookup, ownership check and 404 are done. This is your get_application_or_404 evolved into a real dependency.
# Return 404, not 403, for someone else's resource. A 403 confirms the id exists. A 404 reveals nothing. This is a common design choice, and you should be able to argue both sides.
# Notes are scoped through their application. If the dependency resolves the owned application first, every note operation is already limited to that owner.
# List and stats queries also need .where(Application.owner_id == user.id). This is the part people forget, so test it with two users.
# Never accept owner_id from the client. Set it in your create function from user.id.
# Schema changes. create_all won't add owner_id to an existing table, as in the Session 2 quiz, so delete the DB file or use Alembic.

# 7. Users and the auth schemas
class UserCreate(BaseModel):
    email: EmailStr                                   # needs: pip install "pydantic[email]"
    password: str = Field(min_length=8, max_length=128)

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# UserRead must never contain the password hash. This is exactly what response_model filtering protects against.
# Model: email is unique=True, index=True. Normalize it (lowercase, stripped) before saving and before lookup.
# Duplicate registration: catch IntegrityError, call await db.rollback(), and return 409 Conflict. 
# Or check first, but the database constraint is the real guard, because two simultaneous requests can both pass an existence check.

# Endpoints you'll expose: POST /auth/register, POST /auth/login (form body, returns Token), and GET /auth/me (requires auth).

# | Concern                           | Flask (your build)              | Django                             | Spring Security                              | FastAPI                                              |
# | --------------------------------- | ------------------------------- | ---------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
# | **Hash passwords**                | `werkzeug.security` / `bcrypt`  | Built in (`make_password`)         | `PasswordEncoder`                            | `pwdlib` (Argon2), run blocking work in a threadpool |
# | **Issue token**                   | `create_access_token()`         | SimpleJWT                          | JWT library / authentication filter          | PyJWT, typically implemented explicitly              |
# | **Protect a route**               | `@jwt_required()`               | `login_required` / DRF permissions | Security filter chain / `@PreAuthorize`      | Dependency injection (`CurrentUser`)                 |
# | **Get current user**              | `get_jwt_identity()` → DB query | `request.user`                     | `SecurityContext`                            | `user: CurrentUser`                                  |
# | **Config / secret**               | `app.config`                    | `settings.py`                      | `application.yml` / `application.properties` | `pydantic-settings` + `.env`                         |
# | **Swagger auth button**           | Not automatic                   | Not automatic                      | Available with `springdoc` configuration     | Built in with `OAuth2PasswordBearer`                 |
# | **Swap dependencies for testing** | Patch / mocks                   | Test client / `force_login()`      | Test annotations / security test support     | `app.dependency_overrides`                           |

