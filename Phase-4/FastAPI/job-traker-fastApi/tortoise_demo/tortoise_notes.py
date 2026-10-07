uvicorn tortoise_demo.main:app --reload

# |               | SQLAlchemy Async        | Tortoise            | SQLAlchemy Sync         |
# | ------------- | ----------------------- | ------------------- | ----------------------- |
# | DB calls      | `await`                 | `await`             | normal                  |
# | Session       | `AsyncSession`          | managed by Tortoise | `Session`               |
# | Query style   | SQLAlchemy expressions  | QuerySet API        | SQLAlchemy expressions  |
# | Create        | `db.add()` + `commit()` | `Model.create()`    | `db.add()` + `commit()` |
# | Fetch one     | `scalar(select(...))`   | `get_or_none()`     | `scalar(select(...))`   |
# | Relationships | `selectinload()`        | `fetch_related()`   | `selectinload()`        |
# | Delete        | `db.delete()`           | `.delete()`         | `db.delete()`           |
# | FastAPI fit   | Excellent               | Excellent           | Good                    |
# | Async I/O     | ✅                      | ✅                 | ❌                      |


# The main mental model:

# SQLAlchemy Async:
result = await db.scalars(select(Application))
applications = result.all()

# Tortoise:
applications = await Application.all()

# SQLAlchemy Sync:
applications = db.scalars(select(Application)).all()
