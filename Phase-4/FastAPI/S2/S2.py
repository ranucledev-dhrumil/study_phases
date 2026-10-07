# 1. Why a database needs async-aware code
# A sync DB call inside an async def endpoint blocks the event loop, which is the Session 1 time.sleep problem. Async DB access needs two things:
# An async driver: aiosqlite for SQLite, 
# asyncpg for Postgres, and 
# aiomysql or asyncmy for MySQL.

# An async-aware ORM layer: SQLAlchemy 2.0's asyncio extension, or Tortoise ORM, which is async-native.

# pip install sqlalchemy aiosqlite        # + asyncpg for Postgres
# sqlite+aiosqlite:///./tracker.db
# postgresql+asyncpg://user:pass@localhost/tracker

# 2. SQLAlchemy 2.0 async: setup
# app/db.py
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = "sqlite+aiosqlite:///./tracker.db"

# Engine: one per process, holds the connection pool. Built with create_async_engine.
engine = create_async_engine(DATABASE_URL, echo=False)
# async_sessionmaker: a factory that produces AsyncSessions, like Flask-SQLAlchemy's db.session, but explicit.
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
# expire_on_commit=False matters in async code. By default a commit marks every loaded attribute as expired, and the next attribute access triggers a refresh query. In async code that implicit query can't run, so you get MissingGreenlet. Turning expiry off avoids that.

# AsyncAttrs gives you await obj.awaitable_attrs.notes for explicit lazy loads (see section 6).
class Base(AsyncAttrs, DeclarativeBase):
    pass

# Models (2.0 typed style)
# app/models.py
from datetime import date, datetime
from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from app.schemas.applications import ApplicationStatus

class Application(Base):
    __tablename__ = "applications"

    # Mapped[...] is the type, and mapped_column(...) is the column config. 
    id: Mapped[int] = mapped_column(primary_key=True)
    company: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(100))
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, native_enum=False), default=ApplicationStatus.applied
    )
    # X | None means nullable.
    applied_on: Mapped[date | None] = mapped_column(Date)
    url: Mapped[str | None] = mapped_column(String(2048))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # passive_deletes=True plus ondelete="CASCADE" lets the database delete the notes, so SQLAlchemy doesn't need to load them first. Loading them would be a lazy load, which fails in async.`
    notes: Mapped[list["Note"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), index=True
    )
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    application: Mapped["Application"] = relationship(back_populates="notes")

# SQLite doesn't enforce foreign keys by default. To make ON DELETE CASCADE work, enable the pragma on each connection:
from sqlalchemy import event

@event.listens_for(engine.sync_engine, "connect")
def _fk_on(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")
    # Gotcha: Pydantic's HttpUrl is an object, not a str. Convert with str(payload.url) before assigning it to a string column.

# 3. Creating tables and the lifespan hook
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # run_sync is the bridge for sync-only APIs such as create_all. It runs them on the connection inside the async context.
        await conn.run_sync(Base.metadata.create_all)   # dev only
        # create_all is not a migration tool. It only creates missing tables and never alters existing ones. For real schema changes use Alembic (alembic init -t async), which is the equivalent of Django's makemigrations and migrate. You don't need it for the task, but know it exists.
    yield
    await engine.dispose()                              # clean shutdown

app = FastAPI(title="Job Application Tracker", lifespan=lifespan)
# lifespan is FastAPI's startup/shutdown hook. Code before yield runs at startup, and code after it runs at shutdown. It replaces the older @app.on_event("startup"), which is deprecated.

# Comparisons:
# Flask uses an app factory and db.create_all() inside an app context.
# Spring Boot runs @PostConstruct and lifecycle beans.
# Django has no direct equivalent, because the ORM manages connections implicitly.

# 4. One session per request: a yield dependency
# app/db.py (continued)
from typing import Annotated, AsyncIterator
from fastapi import Depends

# Never share one AsyncSession across concurrent tasks. If you asyncio.gather two queries, give each its own session.
# A session is not thread-safe or task-safe, and it holds a transaction. Request-scoped is the correct lifetime.
async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session            # the endpoint runs here
    # session is closed on exit

# Depends(get_db) calls the function per request and injects the result. This is a first look at dependency injection, and Session 3 goes deeper.
DbSession = Annotated[AsyncSession, Depends(get_db)]
# A yield dependency runs its setup before the endpoint and its cleanup after, so the session is always closed, even on errors.

@router.get("/{application_id}")
async def get_application(application_id: int, db: DbSession): 
    ...

# Operation        Code                                                        Await?
# ------------------------------------------------------------------------------------------
# select many      result = await db.execute(select(Application))              Yes (execute)
#                  then .scalars().all()

# shortcut         rows = (await db.scalars(stmt)).all()                       Yes

# one or none      (await db.execute(stmt)).scalar_one_or_none()               Yes (execute)

# by primary key   obj = await db.get(Application, id)                         Yes

# stage insert     db.add(obj)                                                  No
#                  (in-memory only)

# write to DB      await db.commit() / await db.flush()                         Yes

# reload fields    await db.refresh(obj)                                        Yes

# delete           await db.delete(obj)                                         Yes

from sqlalchemy import select, func

stmt = (
    select(Application)
    .where(Application.status == status)
    .where(Application.company.ilike(f"%{q}%") | Application.role.ilike(f"%{q}%"))
    .order_by(Application.id)
    .offset(skip).limit(limit)
)
rows = (await db.scalars(stmt)).all()

# stats in ONE query
stmt = select(Application.status, func.count()).group_by(Application.status)
counts = dict((await db.execute(stmt)).all())

# Filtering, pagination and counting move from Python loops into SQL
# Create: obj = Application(**data); db.add(obj); await db.commit(); await db.refresh(obj). The refresh pulls server-generated values such as id and created_at.
# Update (PATCH): keep your validate-the-merge idea, then for k, v in validated.items(): setattr(obj, k, v) and await db.commit().
# Transactions: a session commits only when you call commit(), and rolls back if the context exits on an exception. For explicit blocks use async with db.begin(): ....
# Constraint errors: catch sqlalchemy.exc.IntegrityError, call await db.rollback(), and raise a 409.

# 6. The lazy-loading pitfall (MissingGreenlet)
# This is the main async-ORM trap. Accessing a not-yet-loaded relationship (app.notes) triggers an implicit query, and async code can't do that implicitly. You get MissingGreenlet: greenlet_spawn has not been called.
# Fixes, best first:

# a. Eager-load in the query:
from sqlalchemy.orm import selectinload
stmt = select(Application).options(selectinload(Application.notes))

# b. Set lazy="selectin" on the relationship, so it always loads eagerly.
# c. Load explicitly when needed: await obj.awaitable_attrs.notes, or await db.refresh(obj, ["notes"]).

# Comparisons:
# Django raises SynchronousOnlyOperation if you touch the sync ORM from async code, and it offers aget(), afirst() and async for.
# Flask-SQLAlchemy lazy-loads transparently, because it's sync.
# Spring's Hibernate has the same shape of problem: LazyInitializationException outside a session.

# 7. Pydantic and ORM objects
class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company: str
    ...
# from_attributes=True lets Pydantic read from an object's attributes instead of only from dict keys. It was orm_mode in v1.
# With it, an endpoint can simply return orm_obj and response_model converts it. The hand-built ApplicationRead(...) calls you removed in Session 1 stay gone.
# If a Read model includes notes: list[NoteRead], the relationship must be loaded before serialization (section 6), or the same lazy-load error appears at response time.
# Keep the Read, Create and Update schemas from Session 1. They are independent of the ORM. The ORM model is the table, and the schemas are the API contract. They stay separate on purpose.

# 8. Keeping the layering
# Your Session 1 design (routers only call store functions) carries over. The store becomes a data-access layer that takes a session:
async def get_application(db: AsyncSession, application_id: int) -> Application | None:
    return await db.get(Application, application_id)

# Routers call await get_application(db, id). The HTTP concerns (404s, status codes) stay in the router or the dependency, and the SQL stays in the data layer.

# 9. Tortoise ORM
# Tortoise is async-native and has a Django-like API, so it's the shorter path if you like Django's querying style.
# app/tmodels.py
from tortoise import fields, models
from app.schemas.applications import ApplicationStatus

class Application(models.Model):
    id = fields.IntField(pk=True)
    company = fields.CharField(max_length=100)
    role = fields.CharField(max_length=100)
    status = fields.CharEnumField(ApplicationStatus, default=ApplicationStatus.applied)
    applied_on = fields.DateField(null=True)
    url = fields.CharField(max_length=2048, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "applications"

class Note(models.Model):
    id = fields.IntField(pk=True)
    application = fields.ForeignKeyField(
        "models.Application", related_name="notes", on_delete=fields.CASCADE
    )
    body = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

# Queries (every DB call is awaited, and there is no session object to manage):
await Application.create(company="Meta", role="SWE")
apps = await Application.filter(status="offer").offset(0).limit(20)
one  = await Application.get_or_none(id=1)          # None if missing
await Application.filter(company__icontains="goo")   # Django-style lookups
await Application.filter(status="offer").count()
await one.save();  await one.delete()
notes = await one.notes.all()                        # related manager
await Application.all().prefetch_related("notes")    # eager load

# Wiring into FastAPI. Tortoise needs registration at startup, and newer versions provide a lifespan-friendly helper:
from tortoise.contrib.fastapi import RegisterTortoise

@asynccontextmanager
async def lifespan(app):
    async with RegisterTortoise(
        app,
        db_url="sqlite://tortoise.db",
        modules={"models": ["app.tmodels"]},
        generate_schemas=True,
        add_exception_handlers=True,
    ):
        yield

# The registration API has changed between Tortoise versions (older code uses register_tortoise), so check the docs for the version you install.

# Extras:
# pydantic_model_creator(Application) generates Pydantic models from Tortoise models. It's convenient, but explicit schemas, which you already have, give you more control.
# Migrations are handled by Aerich, not Alembic.
# Model.get(...) raises DoesNotExist on a miss, and get_or_none returns None.

# 10. SQLAlchemy vs Tortoise vs what you know
# Aspect                  SQLAlchemy 2.0 async       Tortoise                  Django ORM                    Flask-SQLAlchemy
# -------------------------------------------------------------------------------------------------------------------------------
# Async story             explicit session, await     native, no session        partial a* methods           sync

# Session / unit of work  explicit AsyncSession       implicit                  implicit                    db.session

# Query style             select() expressions        Model.filter(...)         Model.objects.filter(...)   legacy Model.query
#                                                                                                          or select()

# Lazy loading            errors in async;            explicit                  SynchronousOnlyOperation    works
#                         eager-load                  prefetch_related

# Migrations              Alembic                     Aerich                    built in                    Alembic (Flask-Migrate)

# Flexibility             very high                   moderate                  moderate                    high

# Ecosystem               largest                     smaller                   huge                        large

# Closest in Java         Hibernate/JPA               Spring Data–like repos   Spring Data JPA             JPA

# In short, SQLAlchemy is the industry default and the most flexible, but you manage sessions and eager loading yourself. Tortoise is simpler and easier to pick up, but the ecosystem is smaller.
