from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import logging

from app.db import SessionLocal
from app.models import AuditLog
from app.models import Application, ApplicationStatus
from app.models import Note
from app.schemas.applications import ApplicationCreate
from app.schemas.notes import NoteCreate

logger = logging.getLogger(__name__)

def _like_pattern(q: str) -> str:
    escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"

async def get_application(db: AsyncSession, application_id: int):
    stmt = (
        select(Application)
        .where(Application.id == application_id)
    )

# await db.execute(stmt) → gives you a Result
# await db.scalars(stmt) → gives you a ScalarResult
# await db.scalar(stmt)  → gives you the first scalar directly

# For this particular function, scalar() is the simplest.
    return await db.scalar(stmt)

async def get_applications(db: AsyncSession, owner_id: int, limit: int, skip: int, status: ApplicationStatus | None=None, q: str | None=None):

    conditions = []

    conditions.append(Application.owner_id == owner_id)

    if status is not None:
        conditions.append(Application.status == status)

    if q is not None:
        pattern = _like_pattern(q)
        conditions.append(
            Application.company.ilike(pattern, escape="\\")
            | Application.role.ilike(pattern, escape="\\")
        )
    
    stmt = (
        select(Application)
        .where( *conditions )
        .order_by(Application.id)
        .offset(skip).limit(limit)
    )

    return (await db.scalars(stmt)).all()

async def get_stats(db: AsyncSession, owner_id: int):
    stmt = (
            select(Application.status, func.count(Application.id))
            .where(Application.owner_id == owner_id)
            .group_by(Application.status)
        )

    result = await db.execute(stmt)

    rows =  result.all()

    stats = {
        "total": 0,
        "applied": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0,
    }

    for status, count in rows:
        stats[status.value] = count
        stats["total"] += count

    return stats

async def get_application_detail(db: AsyncSession, application_id: int):
    stmt = (
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.notes))
    )

    return await db.scalar(stmt)

async def create_application(db: AsyncSession, applicationReceived: ApplicationCreate, owner_id: int):
    application = Application(
        owner_id=owner_id,
        company=applicationReceived.company,
        role=applicationReceived.role,
        status=applicationReceived.status,
        applied_on=applicationReceived.applied_on,
        url=str(applicationReceived.url) if applicationReceived.url is not None else None,
    )

    db.add(application)

    await db.commit()
    await db.refresh(application)

    return application

async def update_application(db: AsyncSession, application: Application, applicationReceived: ApplicationCreate):
    application.company=applicationReceived.company
    application.role=applicationReceived.role
    application.status=applicationReceived.status
    application.applied_on=applicationReceived.applied_on
    application.url=str(applicationReceived.url) if applicationReceived.url is not None else None

    await db.commit()
    await db.refresh(application)

    return application

async def delete_application(db: AsyncSession, application: Application):
    await db.delete(application)
    await db.commit()
    
async def create_note(db: AsyncSession, application_id: int, note_received: NoteCreate):
    note = Note(
        application_id=application_id, 
        body=note_received.body
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

async def get_notes(db: AsyncSession, application_id: int, skip: int = 0, limit: int = 20):
    stmt = (
        select(Note)
        .where(Note.application_id == application_id)
        .order_by(Note.id)
        .offset(skip).limit(limit)
    )
    return (await db.scalars(stmt)).all()

async def delete_note(db: AsyncSession, application_id: int, note_id: int):
    conditions = [
        Note.application_id == application_id,
        Note.id == note_id,
    ]
    stmt = (
        select(Note)
        .where(*conditions)
    )
    note = await db.scalar(stmt)

    if not note: 
        return None
    
    await db.delete(note)
    await db.commit()
    return True

def create_audit_log_task(
    user_id: int, action: str, application_id: int | None = None
):
    """Executes after HTTP response is sent.

    Opens its own isolated DB session.
    """
    # 1. Open an independent DB session (never reuse request session)
    db = SessionLocal()
    try:
        # 2. Construct and save audit record
        log_entry = AuditLog(
            user_id=user_id, action=action, application_id=application_id
        )
        db.add(log_entry)
        db.commit()
    except Exception as exc:
        # 3. Log exception without failing or bubbling up
        db.rollback()
        logger.exception("Failed to write audit log entry: %s", exc)
    finally:
        # 4. Always close the background session
        db.close()

