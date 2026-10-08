from fastapi import APIRouter, Query
from sqlalchemy import select

from app.db import DbSession
from app.deps import CurrentUser
from app.models import AuditLog
from app.schemas.audit import AuditRead

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditRead], summary="List my audit log")
async def get_user_audit_logs(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())   # id breaks ties
        .offset(skip).limit(limit)
    )
    return (await db.scalars(stmt)).all()