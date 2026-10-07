import asyncio
import time

from fastapi import APIRouter

router = APIRouter(tags=["debug"])

@router.get("/error")
async def trigger_error():
    # Intentionally raising an unhandled exception
    raise RuntimeError("Unhandled exception for testing response headers")

@router.get("/debug/async-sleep")
async def async_sleep():
    start = time.perf_counter()

    await asyncio.sleep(3)

    elapsed = time.perf_counter() - start

    return {
        "type": "async",
        "elapsed": elapsed,
    }


@router.get("/debug/blocking-sleep")
async def blocking_sleep():
    start = time.perf_counter()

    time.sleep(3)

    elapsed = time.perf_counter() - start

    return {
        "type": "blocking",
        "elapsed": elapsed,
    }


@router.get("/debug/sync-sleep")
def sync_sleep():
    start = time.perf_counter()

    time.sleep(3)

    elapsed = time.perf_counter() - start

    return {
        "type": "sync",
        "elapsed": elapsed,
    }