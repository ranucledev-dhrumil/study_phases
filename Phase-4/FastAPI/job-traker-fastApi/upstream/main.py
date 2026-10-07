import asyncio
from fastapi import FastAPI

app = FastAPI(title="Upstream Service")


@app.get("/slow/{seconds}")
async def slow_endpoint(seconds: float):
    await asyncio.sleep(seconds)
    return {"status": "ok", "waited": seconds}