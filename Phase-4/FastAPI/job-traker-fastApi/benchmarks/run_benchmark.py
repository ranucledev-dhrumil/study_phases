import asyncio
import statistics
import time
import httpx

API_BASE_URL = "http://127.0.0.1:8000"
LOGIN_DATA = {"username": "testuser@example.com", "password": "password123"}


async def get_auth_headers(client: httpx.AsyncClient) -> dict:
    resp = await client.post(f"{API_BASE_URL}/auth/login", data=LOGIN_DATA)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def measure_single_request(
    client: httpx.AsyncClient, endpoint: str, headers: dict
) -> float:
    t0 = time.perf_counter()
    resp = await client.get(f"{API_BASE_URL}{endpoint}", headers=headers)
    elapsed = (time.perf_counter() - t0) * 1000  # ms
    assert resp.status_code == 200
    return elapsed


async def run_benchmark(endpoint: str, concurrency: int):
    async with httpx.AsyncClient(timeout=120) as client:
        headers = await get_auth_headers(client)

        t_start = time.perf_counter()
        tasks = [
            measure_single_request(client, endpoint, headers)
            for _ in range(concurrency)
        ]
        latencies = await asyncio.gather(*tasks)
        total_wall_time = time.perf_counter() - t_start

        latencies.sort()
        p50 = statistics.median(latencies)
        # Quantile index for p95
        p95_idx = int(0.95 * len(latencies)) - 1
        p95 = latencies[max(0, p95_idx)]
        rps = concurrency / total_wall_time

        print(
            f"Endpoint: {endpoint} | N={concurrency}\n"
            f"  Wall Time: {total_wall_time:.2f}s\n"
            f"  p50 Latency: {p50:.2f}ms\n"
            f"  p95 Latency: {p95:.2f}ms\n"
            f"  Req/sec: {rps:.2f}\n"
        )


if __name__ == "__main__":
    # Example runs for B4
    print("--- Running Benchmark Suite ---")
    for N in [1, 10, 50]:
        asyncio.run(run_benchmark("/applications/check-urls", N))
        asyncio.run(run_benchmark("/applications/check-urls-sync", N))