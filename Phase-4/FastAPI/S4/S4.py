# 1. Middleware
# What it is
# Middleware wraps the whole app. 
# Each request passes through every layer on the way in, reaches your route, and the response passes back out through the layers in reverse. 
# It sees every request, including 404s, /docs, and requests that fail validation.

import time
from fastapi import Request

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)          # runs the rest of the stack + your route
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
    return response

# Code before await call_next(request) runs on the way in, and code after it runs on the way out.
# Use time.perf_counter() for durations, not time.time(), because it's monotonic and higher resolution.
# Middleware must be async and must not block, because it runs on the event loop for every request. A blocking call in middleware slows every endpoint.

# Three ways to write it
# +----------------------------------------------------------+----------------------------------------------+
# | Style                                                    | Use for                                      |
# +----------------------------------------------------------+----------------------------------------------+
# | @app.middleware("http") function                         | Quick, simple cross-cutting code             |
# | BaseHTTPMiddleware subclass                              | Same, but as a reusable class                |
# | Pure ASGI middleware                                     | Performance-critical or streaming-sensitive  |
# | (__call__(scope, receive, send))                         | code                                         |
# +----------------------------------------------------------+----------------------------------------------+

# @app.middleware("http") and BaseHTTPMiddleware have known limits. They add overhead, interact awkwardly with streaming responses, and reading await request.body() inside them can consume the body unless you handle it carefully. For a request-timer or a request-id header they're perfectly fine.

# Ordering
app.add_middleware(A)
app.add_middleware(B)

# The last one added is the outermost, so B sees the request first and the response last. The @app.middleware decorator follows the same rule. This is the same "order of app.use matters" idea as in Express, except that the stack is built inside-out.

# Errors and middleware
# An HTTPException, or a validation error, is turned into a response inside the stack, so your middleware sees a normal response with a 4xx status.
# An unhandled exception propagates out through your middleware as an exception (call_next raises) and only becomes a 500 at the outermost layer, which sits outside all your middleware. This matters for CORS (below). 

# Built-in middleware
# CORSMiddleware, GZipMiddleware (compress large responses), TrustedHostMiddleware (reject unexpected Host headers), HTTPSRedirectMiddleware.

# Middleware vs dependencies
# +---------------------------------------+--------------------------------------------------+------------------------------------------------+
# |                                       | Middleware                                       | Dependency                                     |
# +---------------------------------------+--------------------------------------------------+------------------------------------------------+
# | Scope                                 | Every request                                    | Only the routes that use it                    |
# |                                       |                                                  |                                                |
# | Sees path params and parsed body      | No                                               | Yes                                            |
# |                                       |                                                  |                                                |
# | Typed, injectable, overridable in     | No                                               | Yes                                            |
# | tests                                 |                                                  |                                                |
# |                                       |                                                  |                                                |
# | Right for                             | Timing, request IDs, CORS, compression, logging  | Auth, DB sessions, ownership lookups,          |
# |                                       |                                                  | pagination                                     |
# +---------------------------------------+--------------------------------------------------+------------------------------------------------+


# Rule of thumb: infrastructure that applies to everything goes in middleware, and logic that belongs to particular routes goes in dependencies.
# Comparisons: Flask has before_request/after_request (WSGI hooks). Django has middleware classes with __call__, which is the closest match. Express has app.use. Spring has servlet filters and interceptors.

# 2. CORS
# Why it exists
# Browsers block JavaScript on https://app.example.com from reading responses from https://api.example.com unless the API opts in. The browser enforces this, and curl and server-side clients ignore it. CORS is therefore not a security control for your API. It only decides which browser origins may call it. Auth is what protects the data.
# Preflight: for requests that aren't "simple" (JSON bodies, PUT/PATCH/DELETE, an Authorization header), the browser first sends OPTIONS with Origin, Access-Control-Request-Method and Access-Control-Request-Headers. The server's reply says what's allowed. Only then does the browser send the real request.

# Configuring it
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://app.example.com"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
    max_age=600,
)
# Rules and gotchas:

# List explicit origins. ["*"] allows any origin, and browsers reject a wildcard when credentials are included.
# allow_credentials=True is about cookies, not the Authorization header. A Bearer token you attach in JavaScript doesn't need it, but it does need Authorization in allow_headers, because it triggers a preflight.
# The scheme, host and port must all match, including http vs https and :3000 vs :5173.

# Unhandled 500s can show up as CORS errors. The 500 response is produced outside CORSMiddleware, so it carries no CORS headers, and the browser reports a CORS failure instead of the real error. When debugging a "CORS error", check the server logs for a crash first.
# Put the allowed origins in settings (the pydantic-settings class from Session 3), not in code.

# Test a preflight manually:
curl -i -X OPTIONS http://localhost:8000/applications \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"

# Comparisons: cors in Express, Flask-CORS, django-cors-headers, and @CrossOrigin/CorsConfiguration in Spring. It's the same concept everywhere.

# 3. Background tasks
from fastapi import BackgroundTasks

@router.post("", status_code=201)
async def create(payload: ApplicationCreate, user: CurrentUser, db: DbSession,
                 background: BackgroundTasks):
    application = await crud.create_application(db, payload, user.id)
    background.add_task(write_audit_log, application.id, user.id)
    return application

# The task runs after the response has been sent, in the same process.
# An async def task runs on the event loop and a plain def task runs in the threadpool. The same rule applies again: don't block in an async task.
# Limits: no retries, nothing survives a crash or restart, and there's no queue or status. For work that must not be lost (emails, payments, heavy processing), use a real job queue such as Celery, RQ or ARQ.

# Don't reuse the request's DB session inside a background task. The session is closed when the request's dependency cleanup runs. Open a fresh one with async with SessionLocal() as db: inside the task.
# Don't use bare asyncio.create_task as fire-and-forget without keeping a reference. The task can be garbage-collected, and its exceptions disappear silently.

# Candidate for your tracker: a "follow-up reminder" or an audit log entry written after a status change.

# 4. Concurrency patterns, where async pays off
# This is the core of the "not just Flask with type hints" goal.
# The shape: concurrent independent I/O
import asyncio, httpx

async def check_url(client: httpx.AsyncClient, url: str):
    try:
        r = await client.head(url, follow_redirects=True)
        return url, r.status_code
    except httpx.HTTPError as exc:
        return url, f"error: {type(exc).__name__}"

async def check_all(urls: list[str]):
    async with httpx.AsyncClient(timeout=5.0) as client:
        return await asyncio.gather(*(check_url(client, u) for u in urls))

# Ten URLs that each take about a second finish in about a second total, instead of ten. A sync handler using requests would take ten seconds, or would have to use threads.
# Rules that matter
# Reuse one AsyncClient. Creating one per request throws away connection pooling. Create it in lifespan, store it on app.state.http, expose it through a dependency, and aclose() it on shutdown. It's the same pattern as the DB engine in Session 2.
# Always set timeouts (httpx.Timeout(5.0) or timeout=5). The default is generous, and an unresponsive upstream would hold a connection open.
# asyncio.gather(..., return_exceptions=True) returns exceptions as values instead of cancelling the whole batch on the first error. Decide on purpose which behaviour you want.
# Limit fan-out with asyncio.Semaphore(n), so a list of 500 URLs doesn't open 500 sockets at once.
# Structured concurrency: asyncio.TaskGroup (Python 3.11+) cancels sibling tasks if one fails. asyncio.timeout(...) (3.11+) wraps a block with a deadline, and asyncio.wait_for does it for one awaitable.
# Blocking or CPU-bound work goes out of the loop: await asyncio.to_thread(fn, ...) or run_in_threadpool. Heavy CPU work needs a process pool or a separate worker, because threads don't help with the GIL.
# DB sessions and gather: each concurrent task gets its own AsyncSession, as covered in Session 2. Sharing one corrupts state.
# Don't await in a loop when the calls are independent: for u in urls: await fetch(u) runs them one at a time.

# Sync vs async, and how to benchmark honestly
# Async wins when there are many concurrent requests that mostly wait on I/O. It doesn't help CPU-bound work. A sync def endpoint in the threadpool is competitive at low concurrency, up to the thread limit (40 by default), and the gap opens as concurrency exceeds the pool.
# For a fair comparison:

# Same machine, same data, same DB, and echo off.
# Run the server without --reload, and use the same number of workers for both.
# Warm up first, then measure. Report total wall time, p50/p95 latency and requests/second, not a single request.
# Use a load tool (hey, wrk, locust) or a script with httpx.AsyncClient plus asyncio.gather.
# Test at several concurrency levels, such as 1, 10, 50 and 200. The interesting result is the curve, not one number.
# Include a workload with real I/O wait, for example an upstream call or asyncio.sleep. Pure in-process work hides the async advantage.

# Workers

# uvicorn app.main:app --workers 4 (or the fastapi CLI, or gunicorn with uvicorn workers) starts several processes. 
# Each has its own event loop and own memory, so nothing in module-level state is shared, which is the reason the in-memory store broke in Session 1. 
# A DB-backed app is fine, but SQLite writers can contend under heavy load, which is one reason production uses Postgres.

# 5. Testing
# Two clients
# sync
from fastapi.testclient import TestClient
with TestClient(app) as client:         # `with` runs lifespan (startup/shutdown)
    r = client.get("/health")

# async
import httpx
transport = httpx.ASGITransport(app=app)
async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
    r = await client.get("/health")

# +----------------+----------------------+---------------------------------------------------------------+
# |                | TestClient            | httpx.AsyncClient + ASGITransport                            |
# +----------------+----------------------+---------------------------------------------------------------+
# | Test functions | plain def            | async def (needs pytest-asyncio or the anyio plugin)          |
# | Runs lifespan  | yes, inside `with`   | No; use a fixture or `asgi-lifespan`                          |
# | Best for       | Most endpoint tests  | Tests that must `await` (query the DB directly, fire          |
# |                |                      | concurrent requests)                                          |
# +----------------+----------------------+---------------------------------------------------------------+

# You may see a deprecation warning that TestClient with httpx is being replaced. Check the current FastAPI testing docs for which package they recommend for the version you install.

# Test database isolation
# The pattern: a fixture builds a separate engine, creates the tables, overrides get_db, and tears everything down afterwards.
@pytest.fixture
def client(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/test.db")
    TestSession = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

# Points to keep in mind:
# Tables: create them in the fixture (run_sync(Base.metadata.create_all)) and drop them or discard the temp file afterwards. A fresh tmp_path per test gives complete isolation.
# In-memory SQLite gives each connection its own database, which surprises people. Use a file, or a StaticPool.
# dependency_overrides is the big advantage over Flask: any dependency can be replaced, including get_current_user to skip auth in tests that aren't about auth. Always clear() it afterwards, or overrides leak between tests.
# Event-loop errors: an async engine created at import time can end up attached to a different loop than your async tests, giving "attached to a different loop" errors. Create engines inside fixtures. NullPool also avoids the problem.
# pytest-asyncio: set asyncio_mode = auto in pytest.ini so you don't mark every test.

# What to test for this tracker
# Statuses and shapes for every endpoint, and validation errors (check the loc in 422 bodies).
# PATCH null is rejected, and a failed PATCH leaves the record unchanged.
# Cascade delete removes notes.
# Pagination and filters, including limit=0 → 422.
# Auth: no token → 401, malformed token → 401, expired token → 401 (mint one with a negative lifetime), wrong password → 401, and duplicate registration → 409.
# Scoping: register two users. User B requests user A's application, its notes, its stats and its list, and must get 404 or empty results. This is the most valuable test in the suite.
# Middleware and CORS: assert the X-Process-Time header exists, and send an OPTIONS preflight with an allowed and a disallowed origin.
# Use @pytest.mark.parametrize for tables of invalid payloads.

# Comparisons:

# Flask: app.test_client() plus a config object per test. Dependency overrides replace the config-patching you did.
# Django: TestCase wraps each test in a transaction that is rolled back.
# Spring: @SpringBootTest or MockMvc with @MockBean.


# +----------------------------+------------------------------------+----------------------+----------------------+----------------------------------------------+
# | Concern                   | Flask                             | Django              | Spring              | FastAPI                                     |
# +----------------------------+------------------------------------+----------------------+----------------------+----------------------------------------------+
# | Per-request hook          | before_request / after_request    | middleware class    | filter / interceptor| @app.middleware("http") / ASGI middleware   |
# | CORS                      | Flask-CORS                        | django-cors-headers | @CrossOrigin        | CORSMiddleware                              |
# | After-response work       | thread / Celery                   | Celery              | @Async              | BackgroundTasks (small) / queue (real)      |
# | Concurrent outbound I/O   | threads                           | threads / async     | CompletableFuture   | httpx.AsyncClient + asyncio.gather          |
# |                            |                                   | views               |                      |                                              |
# | Test client               | app.test_client()                 | Client / TestCase   | MockMvc             | TestClient / AsyncClient                    |
# | Swap a dependency in      | patch / mocks                     | override settings   | @MockBean           | dependency_overrides                        |
# | tests                     |                                   |                     |                      |                                              |
# +----------------------------+------------------------------------+----------------------+----------------------+----------------------------------------------+