import asyncio
import time
import httpx

API_BASE_URL = "http://127.0.0.1:8000"


async def fire_login(client: httpx.AsyncClient):
    await client.post(
        f"{API_BASE_URL}/auth/login",
        data={"username": "testuser@example.com", "password": "password123"},
    )


async def measure_health(client: httpx.AsyncClient):
    # Short delay to ensure logins are in flight
    await asyncio.sleep(0.05)
    t0 = time.perf_counter()
    resp = await client.get(f"{API_BASE_URL}/health")
    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"GET /health Latency during login load: {elapsed_ms:.2f} ms")


async def main():
    async with httpx.AsyncClient() as client:
        logins = [fire_login(client) for _ in range(20)]
        health_check = measure_health(client)

        await asyncio.gather(*logins, health_check)


if __name__ == "__main__":
    asyncio.run(main())