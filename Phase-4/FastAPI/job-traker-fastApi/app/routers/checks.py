import asyncio
import time
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.config import settings
from app.db import DbSession
from app.deps import CurrentUser, get_http_client
from app.models import Application
from app.schemas.checks import UrlCheckReport, UrlCheckResult

router = APIRouter(prefix="/applications", tags=["url-checks"])


async def get_user_urls(db: DbSession, current_user: CurrentUser) -> list[tuple[int, str]]:
    stmt = select(Application.id, Application.url).where(
        Application.owner_id == current_user.id,
        Application.url.is_not(None),
    ).order_by(Application.id)
    rows = [(row.id, row.url) for row in (await db.execute(stmt)).all()]
    # End the transaction NOW: otherwise the request-scoped session keeps its
    # pooled connection checked out during the slow upstream calls, and 15+
    # concurrent requests exhaust the pool.
    await db.commit()
    return rows


UserUrls = Annotated[list[tuple[int, str]], Depends(get_user_urls)]


async def _check_one(client, sem, application_id: int, url: str) -> UrlCheckResult:
    async with sem:
        start = time.perf_counter()
        try:
            response = await client.get(url, follow_redirects=True)
            status_code, error = response.status_code, None
        except httpx.HTTPError as exc:
            status_code, error = None, type(exc).__name__
        return UrlCheckResult(
            application_id=application_id, url=url, status_code=status_code,
            error=error, elapsed_ms=round((time.perf_counter() - start) * 1000, 1),
        )


@router.get("/check-urls", response_model=UrlCheckReport)
async def check_urls(urls: UserUrls,
                     client: Annotated[httpx.AsyncClient, Depends(get_http_client)]):
    start = time.perf_counter()
    sem = asyncio.Semaphore(settings.url_check_concurrency)
    results = await asyncio.gather(*(_check_one(client, sem, i, u) for i, u in urls))
    return UrlCheckReport(
        total_elapsed_ms=round((time.perf_counter() - start) * 1000, 1),
        results=list(results),
    )


@router.get("/check-urls-sync", response_model=UrlCheckReport)
def check_urls_sync(urls: UserUrls):          # plain def: runs in the threadpool
    start = time.perf_counter()
    results = []
    with httpx.Client(timeout=settings.url_check_timeout) as client:
        for application_id, url in urls:
            t0 = time.perf_counter()
            try:
                response = client.get(url, follow_redirects=True)
                status_code, error = response.status_code, None
            except httpx.HTTPError as exc:
                status_code, error = None, type(exc).__name__
            results.append(UrlCheckResult(
                application_id=application_id, url=url, status_code=status_code,
                error=error, elapsed_ms=round((time.perf_counter() - t0) * 1000, 1),
            ))
    return UrlCheckReport(
        total_elapsed_ms=round((time.perf_counter() - start) * 1000, 1),
        results=results,
    )