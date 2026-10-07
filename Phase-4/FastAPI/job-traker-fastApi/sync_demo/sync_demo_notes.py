# 1. Engine:

# Asynchronous version:
create_async_engine(
    "sqlite+aiosqlite:///./tracker.db"
)

# Synchronous version:
create_engine(
    "sqlite:///./sync_tracker.db"
)

# | Async                   | Sync              |
# | ----------------------- | ----------------- |
# | `create_async_engine()` | `create_engine()` |
# | `sqlite+aiosqlite://`   | `sqlite://`       |
# | `AsyncSession`          | `Session`         |
# | `async_sessionmaker`    | `sessionmaker`    |

# 2. Database functions
# Async:
async def get_application(...):
    result = await db.execute(stmt)

# Sync:
def get_application(...):
    result = db.execute(stmt)

# 3. Session lifecycle
# Async:
async def get_db():
    async with SessionLocal() as session:
        yield session

# Sync:
with SessionLocal() as db:
    ...
# No async with.
# No await.

# 4. Commit / refresh
# Async:
await db.commit()
await db.refresh(application)

# Sync:
db.commit()
db.refresh(application)

# 5. Delete
# Async:
await db.delete(application)
await db.commit()

# Sync:
db.delete(application)
db.commit()

# 6. selectinload() does NOT disappear
# This is important.

# You might think eager loading is only an async concern. It isn't.

# We still have:
.options(selectinload(Application.notes))

# because the underlying problem is query loading strategy, not async itself.

# So this: 
detail = get_application_detail(db, application_id)

detail.notes
# works without causing an extra query per application.

# 7. MissingGreenlet is specifically relevant to async
# This is one of the biggest things to understand from your Session 1 work.
# With synchronous SQLAlchemy, lazy loading can happen synchronously.
# With async SQLAlchemy, something like:
application.notes
# can trigger database I/O behind the scenes, but normal attribute access isn't an await point.
# That's where you can encounter: MissingGreenlet

# Hence your async implementation deliberately uses:
selectinload(Application.notes)
# before returning the object.

# 8. FastAPI endpoint difference
# A synchronous FastAPI endpoint could look like:
@router.get("/{application_id}")
def get_application(db: DbSession, application_id: int):
    return get_application_from_db(db, application_id)

# instead of:
@router.get("/{application_id}")
async def get_application(db: DbSession, application_id: int):
    return await get_application_from_db(db, application_id)

# The mental model to remember
# SYNC SQLAlchemy

# Python
#   ↓
# db.execute()
#   ↓
# wait for database
#   ↓
# continue Python

# vs

# ASYNC SQLAlchemy

# Python
#   ↓
# await db.execute()
#   ↓
# database work can happen while event loop does other work
#   ↓
# resume when database operation completes

