# FastAPI — Phase 4

**Project:** Job Application Tracker (`job-traker-fastApi`)  
**FastAPI version:** 0.142.2 · **Python:** 3.12 · **DB:** SQLite (async SQLAlchemy 2.0 + aiosqlite)

---

## 📁 Project Structure

```
job-traker-fastApi/
├── app/
│   ├── main.py             ← FastAPI app, middleware, lifespan hook, router registration
│   ├── config.py           ← pydantic-settings Settings class (reads from .env)
│   ├── db.py               ← async engine, SessionLocal, Base, get_db() dependency
│   ├── models.py           ← SQLAlchemy ORM models (User, Application, Note)
│   ├── crud.py             ← data-access functions (all SQL lives here)
│   ├── deps.py             ← reusable dependencies (DbSession, CurrentUser)
│   ├── security.py         ← JWT creation/verification (PyJWT)
│   ├── store.py            ← in-memory store (S1 leftover, not used in main app)
│   ├── routers/
│   │   ├── auth.py         ← POST /auth/register, POST /auth/login, GET /auth/me
│   │   ├── applications.py ← CRUD for /applications
│   │   ├── notes.py        ← CRUD for /applications/{id}/notes
│   │   ├── audit.py        ← audit log
│   │   ├── checks.py       ← URL health checks (async httpx demo)
│   │   └── debug.py        ← debug endpoints
│   └── schemas/
│       ├── users.py        ← UserCreate, UserRead, Token (Pydantic models)
│       ├── applications.py ← ApplicationCreate, ApplicationUpdate, ApplicationRead
│       └── notes.py        ← NoteCreate, NoteRead
├── alembic/                ← Alembic migration files
│   └── versions/
├── alembic.ini             ← Alembic config (points to DB URL)
├── .env                    ← SECRET_KEY, ACCESS_TOKEN_MINUTES, CORS_ORIGIN
├── .env.example            ← template for .env
├── requirements.txt
└── tests/
    └── test_session3.py
```

**Session notes (not runnable — reference files):**  
`S1/S1.py` · `S2/S2.py` · `S3/S3.py` · `S4/S4.py`

---

## 🚀 How to Run

### 1 — Activate the virtual environment

```powershell
cd FastAPI\job-traker-fastApi
venv\Scripts\activate
```

> If the venv doesn't exist yet:
> ```powershell
> python -m venv venv
> venv\Scripts\activate
> pip install -r requirements.txt
> ```

### 2 — Set up the `.env` file

The app **will crash at startup** if `.env` is missing or `SECRET_KEY` is not set.

```powershell
# The .env file already exists in this project. If you ever delete it, recreate it:
copy .env.example .env
```

`.env` contents:
```
SECRET_KEY="verySecretKey0verySecretKey1..."
ACCESS_TOKEN_MINUTES=30
CORS_ORIGIN=["http://localhost:3000"]
```

> Generate a strong key: `python -c "import secrets; print(secrets.token_hex(32))"`

### 3 — Apply database migrations

```powershell
alembic upgrade head
```

This runs all migration files under `alembic/versions/` and creates the SQLite database.

> **If you see `FAILED: Target database is not up to date`:**
> ```powershell
> alembic stamp head   # mark DB as current without running migrations
> alembic upgrade head
> ```

### 4 — Run the app

```powershell
uvicorn app.main:app --reload
```

- API base: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger UI** (interactive docs): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🧪 Running Tests

```powershell
pytest tests/ -v
```

---

## 📚 Session Notes Reference

| File | What it explains |
|------|-----------------|
| `S1/S1.py` | ASGI vs WSGI, `async def` vs `def` rule, `APIRouter`, path/query params, Pydantic v2 (BaseModel, Field, validators), response models, `HTTPException` |
| `S2/S2.py` | Async SQLAlchemy 2.0 setup, `AsyncSession`, `get_db` yield dependency, lifespan hook (`create_all`), lazy-loading pitfall (`MissingGreenlet`), Alembic, Tortoise ORM comparison |
| `S3/S3.py` | Full dependency injection, password hashing with `pwdlib` (argon2), `OAuth2PasswordBearer`, JWT with PyJWT, `get_current_user` dependency, per-user scoped CRUD, 401 vs 403 |
| `S4/S4.py` | Middleware (timing, request IDs), CORS config & gotchas, `BackgroundTasks`, concurrent I/O with `httpx.AsyncClient` + `asyncio.gather`, `asyncio.Semaphore`, testing with `TestClient` / `dependency_overrides` |

---

## 🔧 Troubleshooting

### Quick fixes

| Symptom | Fix |
|---------|-----|
| `ValidationError: secret_key field required` | `.env` file is missing or `SECRET_KEY` not set — see step 2 |
| `ModuleNotFoundError: No module named 'fastapi'` | venv not activated — `venv\Scripts\activate` |
| `alembic: command not found` | venv not activated, or run `pip install alembic` |
| `sqlalchemy.exc.OperationalError: no such table` | Run `alembic upgrade head` |
| Port 8000 in use | `uvicorn app.main:app --reload --port 8001` |
| `401 Unauthorized` on `/docs` | Click the **Authorize** button in Swagger UI → get token from `POST /auth/login` first |
| `422 Unprocessable Entity` | Request body or query params don't match the Pydantic schema — check the `detail` array in the response for which field failed and why |

### Framework-specific gotchas

**`async def` vs `def` — the most important rule**  
FastAPI runs `async def` endpoints on the event loop. Any blocking call inside one (`time.sleep`, `requests.get`, a sync DB driver) **blocks the entire server** — every other request waits.

```python
# WRONG — blocks event loop
@app.get("/bad")
async def bad():
    time.sleep(1)        # freezes every other request

# RIGHT — yields control
@app.get("/good")
async def good():
    await asyncio.sleep(1)   # non-blocking

# Also fine — runs in a threadpool
@app.get("/sync-ok")
def sync_ok():
    time.sleep(1)   # only blocks one thread in the pool
```

**Missing `.env` → crash at startup**  
`pydantic-settings` validates all settings at import time. If `SECRET_KEY` is missing, the app crashes before it even starts. This is intentional — it's better than silently running with a broken config.

**`MissingGreenlet` — the async lazy-load trap**  
Accessing a relationship (e.g., `application.notes`) without eager-loading it triggers an implicit query, which fails in async code.

```python
# WRONG — triggers lazy load in async context
application = await db.get(Application, 1)
notes = application.notes   # MissingGreenlet!

# RIGHT — eager-load in the query
from sqlalchemy.orm import selectinload
stmt = select(Application).options(selectinload(Application.notes)).where(Application.id == 1)
application = await db.scalar(stmt)
notes = application.notes   # works
```

**422 errors — read the `detail` array**  
A 422 means Pydantic validation failed. The response body tells you exactly what went wrong:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "title"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

`loc` tells you where: `body`, `query`, or `path` — and which field.

**Alembic `target metadata is None`**  
In `alembic/env.py`, the `target_metadata` must import your `Base`:

```python
# alembic/env.py
from app.models import Base     # ← must point to your actual Base
target_metadata = Base.metadata
```

If this isn't set correctly, `alembic revision --autogenerate` produces empty migrations.

**`create_all` is not a migration tool**  
The `Base.metadata.create_all` call in `lifespan` only creates **missing** tables — it never alters existing ones. Use `alembic revision --autogenerate -m "description"` + `alembic upgrade head` for real schema changes.

**Concurrent tasks need separate `AsyncSession`s**  
Never share one session across `asyncio.gather` tasks — sessions are not task-safe.

```python
# WRONG — shared session
results = await asyncio.gather(query_a(db), query_b(db))

# RIGHT — each task opens its own session
async def query_a():
    async with SessionLocal() as session:
        ...
```

**500 errors showing as CORS errors**  
`CORSMiddleware` wraps the app, but unhandled exceptions produce a 500 **outside** the CORS layer, so the response has no CORS headers. The browser reports it as a CORS error. Check server logs for the real crash first.

---

## 📖 CRUD Recipe — FastAPI

> **Entity used:** `Book` (title, author, published_date)

### Step 1 — Define the Pydantic schemas

```python
# app/schemas/books.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime

class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    author: str = Field(min_length=1, max_length=200)
    published_date: date | None = None

class BookUpdate(BaseModel):
    # PATCH — all fields optional
    title: str | None = Field(default=None, min_length=1, max_length=200)
    author: str | None = None
    published_date: date | None = None

class BookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # read from ORM objects
    id: int
    title: str
    author: str
    published_date: date | None
    created_at: datetime
```

### Step 2 — Define the ORM model

```python
# app/models.py  (add to existing file)
from datetime import datetime
from sqlalchemy import String, Date, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    author: Mapped[str] = mapped_column(String(200))
    published_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
```

### Step 3 — Generate and apply an Alembic migration

```powershell
alembic revision --autogenerate -m "add books table"
alembic upgrade head
```

### Step 4 — Create the router

```python
# app/routers/books.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from app.db import DbSession
from app.models import Book
from app.schemas.books import BookCreate, BookUpdate, BookRead

router = APIRouter(prefix="/books", tags=["books"])

# READ — list all
@router.get("/", response_model=list[BookRead])
async def list_books(db: DbSession):
    rows = (await db.scalars(select(Book))).all()
    return rows

# READ — single
@router.get("/{book_id}", response_model=BookRead)
async def get_book(book_id: int, db: DbSession):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

# CREATE
@router.post("/", response_model=BookRead, status_code=201)
async def create_book(payload: BookCreate, db: DbSession):
    book = Book(**payload.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)   # pull server-generated id and created_at
    return book

# UPDATE (PATCH — partial)
@router.patch("/{book_id}", response_model=BookRead)
async def update_book(book_id: int, payload: BookUpdate, db: DbSession):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    # only update fields the client actually sent
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(book, field, value)
    await db.commit()
    await db.refresh(book)
    return book

# DELETE
@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int, db: DbSession):
    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    await db.delete(book)
    await db.commit()
```

### Step 5 — Register the router in `main.py`

```python
# app/main.py
from app.routers.books import router as books_router
app.include_router(books_router)
```

### Step 6 — Test via Swagger UI or curl

```bash
# Create
curl -X POST http://localhost:8000/books/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Clean Code", "author": "Martin"}'

# List
curl http://localhost:8000/books/

# Get one
curl http://localhost:8000/books/1

# Partial update
curl -X PATCH http://localhost:8000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Clean Code (2nd Ed)"}'

# Delete
curl -X DELETE http://localhost:8000/books/1
```

Or open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) — all endpoints are listed with interactive forms.

---

## 🔑 Key FastAPI Patterns Quick Reference

```python
# Dependency injection — reusable across routes
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db

DbSession = Annotated[AsyncSession, Depends(get_db)]

# Use in any endpoint:
async def my_endpoint(db: DbSession): ...

# Protect a whole router
from fastapi import APIRouter
router = APIRouter(prefix="/books", dependencies=[Depends(get_current_user)])

# PATCH — only update sent fields
changes = payload.model_dump(exclude_unset=True)
for k, v in changes.items():
    setattr(obj, k, v)
```
