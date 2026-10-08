from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from app.db import engine, Base
from app.routers.applications import router as applications_router
from app.routers.notes import router as notes_router
from app.routers.debug import router as debug_router
from app.routers.auth import router as auth_router
from app.routers.audit import router as audit_router
from app.config import settings
import httpx
from app.routers.checks import router as checks_router

import logging
import time
import uuid
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.state.http = httpx.AsyncClient(timeout=settings.url_check_timeout)  # one shared client
    yield
    await app.state.http.aclose()
    await engine.dispose()

class ProcessTimeMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = time.perf_counter() - start_time

        # Attach process time header
        response.headers["X-Process-Time"] = f"{process_time:.6f}"

        # Retrieve request ID attached by the outer middleware
        request_id = getattr(request.state, "request_id", "N/A")

        # Log one line per request
        logger.info(
            "%s %s %s %.6fs %s",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
            request_id,
        )
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        # Reuse incoming header if present, otherwise generate a UUID
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app = FastAPI(title="Job Application Tracker", version="0.1.0", lifespan=lifespan)

logger = logging.getLogger("app.request")
logger.setLevel(logging.INFO)
if not logger.handlers:                 # without a handler, INFO is silently dropped
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
    logger.addHandler(_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin,  # Reads from settings (e.g. ["http://localhost:3000"])
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=False,
)
app.add_middleware(ProcessTimeMiddleware)
app.add_middleware(RequestIDMiddleware)

app.include_router(auth_router)
app.include_router(checks_router)
app.include_router(applications_router)
app.include_router(audit_router)
app.include_router(notes_router)
app.include_router(debug_router)

@app.get("/health", summary="Health check")
async def health():
    return {"status": "ok"}