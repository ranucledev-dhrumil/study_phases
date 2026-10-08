from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    application_id: int | None
    created_at: datetime