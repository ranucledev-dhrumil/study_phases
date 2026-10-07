from fastapi import APIRouter, Query
from sqlalchemy import select
from app.db import DbSession
from app.deps import CurrentUser
from app.models import AuditLog

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/")
async def get_user_audit_logs(
    db: DbSession,
    current_user: CurrentUser,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Fetch current user's audit logs, newest first, paginated in SQL."""
    stmt = (
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.scalars(stmt)
    return result.all()