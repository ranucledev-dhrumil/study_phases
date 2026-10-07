import asyncio
import time
import httpx


async def make_request(client, url):
    response = await client.get(url)
    return response.json()


async def main():
    base_url = "http://127.0.0.1:8000"

    timeout = httpx.Timeout(20.0)

    async with httpx.AsyncClient(timeout=timeout) as client:

        start = time.perf_counter()

        results = await asyncio.gather(
            *[
                make_request(client, f"{base_url}/debug/blocking-sleep")
                for _ in range(5)
            ]
        )

        elapsed = time.perf_counter() - start

    print("Results:", results)
    print("Total wall time:", elapsed)


asyncio.run(main())