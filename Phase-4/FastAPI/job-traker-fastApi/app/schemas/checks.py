from pydantic import BaseModel


class UrlCheckResult(BaseModel):
    application_id: int
    url: str
    status_code: int | None = None
    error: str | None = None
    elapsed_ms: float


class UrlCheckReport(BaseModel):
    total_elapsed_ms: float
    results: list[UrlCheckResult]