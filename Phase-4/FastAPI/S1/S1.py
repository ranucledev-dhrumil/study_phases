# 1. Why FastAPI, and the async I/O model
# The stack. FastAPI is a thin layer on two libraries:

# Starlette handles routing, requests/responses, middleware, WebSockets and the test client. It is an ASGI toolkit.
# Pydantic handles validation, parsing and serialization.
# uvicorn is the ASGI server that runs the app. It plays the role gunicorn plays for Flask.

# WSGI vs ASGI.
# Flask and classic Django are WSGI. One request occupies one worker thread or process from start to finish, and concurrency comes from running many workers.
# ASGI apps run on an event loop. A single thread can interleave thousands of in-flight requests, because an await on I/O (DB, HTTP, disk) hands control back to the loop until the result is ready.

# Where async helps. It helps with I/O-bound work, where requests spend most of their time waiting. It does nothing for CPU-bound work like image processing or heavy parsing, and that work can still block the loop.

# Flask/Django comparison.
# Flask 2+ lets you write async def views, but it is still WSGI underneath. Each async view runs on its own short-lived event loop in a worker thread. You get the syntax but not the shared-event-loop concurrency model.
# Django supports ASGI and async views, but much of its ecosystem and ORM is historically sync, so you often end up wrapping sync code.
# FastAPI is async-native from the ground up, and its libraries (httpx, async SQLAlchemy, Tortoise) are designed around it.

# The async def vs def rule (the most important one in this session).

@app.get("/a")
async def a():            # runs ON the event loop
    await asyncio.sleep(1)   # good: yields control
    # time.sleep(1)          # BAD: blocks the entire server

@app.get("/b")
def b():                  # runs in a worker THREADPOOL
    time.sleep(1)            # OK: only blocks one pool thread

    # async def endpoints run directly on the loop. A blocking call inside one (time.sleep, requests.get, a sync DB driver) freezes every other request.
# Plain def endpoints are run in a threadpool (AnyIO, 40 threads by default). That makes them safe for blocking code, but they pay thread overhead and are capped by the pool size.
# Rule of thumb: use async def when you await async libraries, and plain def when you must call blocking code. Never put blocking calls inside async def.
# This also affects shared state. An async def endpoint that never awaits mid-update can't be interleaved. A def endpoint runs in threads and can race on shared data.

# Running it.
pip install "fastapi[standard]"
fastapi dev app/main.py            # dev server with reload
# or: 
uvicorn app.main:app --reload

# 2. App structure and routing
# app/main.py
from fastapi import FastAPI
from app.routers import applications

app = FastAPI(title="Job Application Tracker", version="0.1.0")
app.include_router(applications.router)

# app/routers/applications.py
from fastapi import APIRouter
router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/")
async def list_applications(): ...

# APIRouter is the equivalent of a Flask Blueprint (or Django include() / URLconf). Use prefix and tags (the tags group endpoints in the docs).
# Decorators are per-method: @router.get, .post, .put, .patch, .delete.
# There is no app factory pattern by default. The module-level app is the norm, and configuration is done with lifespan and settings objects (more in Session 2).
# Suggested layout: app/main.py, app/routers/, app/schemas/ (Pydantic models), app/store.py (in-memory data for now).

# 3. Path parameters
@router.get("/{application_id}")
async def get_application(application_id: int): ...

# A path parameter is any function argument whose name appears in the route's {...}.
# The type hint does the validation. /applications/abc returns an automatic 422, and /applications/5 gives you an int. In Flask you'd write <int:id>, and in Django <int:pk>.
# Extra validation with Path:
from typing import Annotated
from fastapi import Path
application_id: Annotated[int, Path(gt=0, description="Application ID")]

# Route order matters. Routes match in declaration order, 
# so /applications/stats must be declared before /applications/{application_id}.
# An Enum as a path type restricts the allowed values, and the docs show a dropdown.
# {file_path:path} captures slashes too.

# 4. Query parameters
# Any function argument that is not in the path and is a scalar type is treated as a query parameter

@router.get("/")
async def list_applications(
    status: str | None = None,                              # optional
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    tags: Annotated[list[str] | None, Query()] = None,      # ?tags=a&tags=b
): ...

# No default means required. A default (including None) means optional.
# Types are coerced: ?limit=5 becomes an int, and ?active=true / 1 / yes becomes a bool.
# Query(...) adds constraints (min_length, max_length, pattern, ge, le) and docs metadata.
# A list in the query string needs an explicit Query().
# Recent FastAPI versions (0.115+) also let you group query params in a Pydantic model: filters: Annotated[AppFilters, Query()]. That is handy for filter and pagination objects.

# Resolution rules to memorize:
# | Argument                                      | Treated as   |
# | --------------------------------------------- | ------------ |
# | name appears in the path template             | path param   |
# | scalar type (`int`, `str`, `bool`, `Enum`...) | query param  |
# | Pydantic model                                | request body |

# 5. Auto-generated docs
# GET /docs serves Swagger UI, 
# GET /redoc serves ReDoc, and 
# GET /openapi.json returns the raw OpenAPI schema.

# The schema is built from your type hints, Pydantic models, status codes and response_models, so it can't drift from the code. 
# Flask needs add-ons like flask-smorest or apispec, and Spring needs springdoc.
# Enrich it with summary=, description= (or the function docstring, which is used automatically), tags=, response_description=, and responses={404: {"description": "Not found"}}.

# 6. Pydantic v2 models
from pydantic import BaseModel, Field
from datetime import date
from enum import Enum

class Status(str, Enum):
    applied = "applied"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"

class ApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    status: Status = Status.applied
    applied_on: date | None = None

# What to know:
# Type hints are the schema. The class is both the validator and the documentation source.
# Lax coercion by default. "5" becomes 5 for an int field. strict=True or Strict types disable that.
# Required vs optional: no default means required, and X | None with no default is still required but nullable. This is a common gotcha. Write X | None = None to make it optional.
# Constraints go in Field(...): min_length, max_length, ge, le, pattern, and so on.
# Nested models work as you'd expect: notes: list[NoteRead] = [].
# Mutable defaults are safe in Pydantic because the default is copied per instance.
# Custom validation:
from pydantic import field_validator, model_validator

class ApplicationBase(BaseModel):
    ...
    @field_validator("company")
    @classmethod
    def strip_company(cls, v: str) -> str:
        return v.strip()

# Useful methods:
# model_dump() gives a dict, and model_dump_json() gives a JSON string.
# model_validate(obj) builds a model from a dict or object.
# model_copy(update={...}) copies with changes, without re-validating.
# model_dump(exclude_unset=True) returns only the fields the client actually sent. It is central to PATCH, and it is the fix for the "PUT silently nulled fields" bug you hit in Flask.

# v1 vs v2 names (older tutorials use the v1 ones):
# | v1                              | v2                                                |
# | ------------------------------- | ------------------------------------------------- |
# | `.dict()` / `.json()`           | `.model_dump()` / `.model_dump_json()`            |
# | `parse_obj`                     | `model_validate`                                  |
# | `@validator`                    | `@field_validator`                                |
# | `class Config: orm_mode = True` | `model_config = ConfigDict(from_attributes=True)` |
# | `Field(regex=...)`              | `Field(pattern=...)`                              |

# Comparisons.
# zod: both are runtime validators. zod schemas infer types, while Pydantic classes are the types. Pydantic coerces by default and zod needs z.coerce.
# WTForms / Django forms: those are tied to form-encoded input and HTML rendering. Pydantic is JSON-first and has no HTML layer.
# Spring: @Valid with Bean Validation annotations is the closest analogue. Pydantic validates and parses.

# 7. Request bodies
@router.post("/", status_code=201)
async def create_application(payload: ApplicationCreate) -> ApplicationRead: ...

# One Pydantic parameter means the JSON body is that model.
# Two or more body models mean FastAPI expects a JSON object keyed by parameter name. Body(embed=True) forces that for a single model too.
# Failed validation returns 422 with a detailed error list, and your function never runs. For example:
{"detail": [{"type": "missing", "loc": ["body", "company"],
             "msg": "Field required", "input": {}}]}

# loc tells you where the error is (body, query, path) and which field.
# You can mix path, query and body together in one signature, and FastAPI sorts out which is which using the rules above.

# 8. Response models and the schema-per-purpose pattern
# Define separate schemas for separate purposes:
class ApplicationCreate(ApplicationBase): pass

class ApplicationUpdate(BaseModel):                 # for PATCH: everything optional
    company: str | None = None
    role: str | None = None
    status: Status | None = None
    applied_on: date | None = None

class ApplicationRead(ApplicationBase):
    id: int
    created_at: datetime

# Use response_model=ApplicationRead or, in modern style, the return annotation -> ApplicationRead. FastAPI validates and filters the output against it. Fields not in the model (internal flags, password hashes) are dropped, and the docs show the response schema.
# response_model_exclude_unset=True and response_model_exclude_none=True control what gets serialized.
# Set status_code=201 on create and 204 on delete. A 204 endpoint should return nothing.
# This replaces Flask's to_dict() and Django's serializer layer. In DRF terms, the model plays the part of a serializer.

# 9. Error handling
from fastapi import HTTPException
raise HTTPException(status_code=404, detail="Application not found")

# This returns {"detail": "Application not found"} with that status code. It is FastAPI's equivalent of Flask's abort(404).
# Custom handlers use @app.exception_handler(MyError), and you can override the default 422 format via RequestValidationError.
# Use raise, not return, for errors. HTTPException can be raised from anywhere, including nested helper functions.

# 10. CRUD with in-memory structures
# app/store.py
applications: dict[int, dict] = {}
_next_id = 1

# A dict keyed by integer id gives O(1) lookup, versus scanning a list.
# Generate ids with a counter. Be aware of the concurrency model here: a module-level dict is per process, so with multiple uvicorn workers each worker would have its own copy. That is fine for learning but is a reason a real DB is needed.
# Full replacement (PUT) means validate a complete model and replace the stored record.
# Partial update (PATCH) means:
changes = payload.model_dump(exclude_unset=True)   # only what the client sent
stored = applications[application_id]
stored.update(changes)

# Don't use model_copy(update=...) for this, because it skips validation. And don't use plain model_dump(), because you'd overwrite stored values with None for every field the client omitted.
# A missing id should raise 404 consistently. A small helper function get_or_404(id) avoids repeating that check in every endpoint.
# The reason to keep async def on these endpoints even though they don't await anything: it keeps one code path, and it makes the later async DB switch trivial.

# | Concern          | Flask                          | Django                      | FastAPI                                |
# | ---------------- | ------------------------------ | --------------------------- | -------------------------------------- |
# | Route grouping   | Blueprint                      | `include()` / URLconf       | `APIRouter`                            |
# | Path param       | `<int:id>`                     | `<int:pk>`                  | `id: int`                              |
# | Query params     | `request.args`                 | `request.GET`               | function args                          |
# | Input validation | manual / marshmallow / WTForms | Forms / DRF serializers     | Pydantic model param                   |
# | Output shaping   | `jsonify` / schema             | serializers                 | `response_model`                       |
# | Errors           | `abort()` / handlers           | `Http404` / handlers        | `HTTPException`                        |
# | API docs         | add-on                         | add-on                      | built in                               |
# | Concurrency      | WSGI workers/threads           | WSGI, or ASGI + async views | ASGI event loop + threadpool for `def` |

