from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from models import Application, Note


def create_application(
    db: Session,
    company: str,
    role: str,
    status: str = "applied",
    applied_on=None,
    url=None,
):
    application = Application(
        company=company,
        role=role,
        status=status,
        applied_on=applied_on,
        url=url,
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


def get_application(
    db: Session,
    application_id: int,
):
    stmt = (
        select(Application)
        .where(Application.id == application_id)
    )

    return db.scalar(stmt)


def get_applications(
    db: Session,
    limit: int = 20,
    skip: int = 0,
    status: str | None = None,
    q: str | None = None,
):
    conditions = []

    if status is not None:
        conditions.append(
            Application.status == status
        )

    if q is not None:
        conditions.append(
            Application.company.ilike(f"%{q}%")
            | Application.role.ilike(f"%{q}%")
        )

    stmt = (
        select(Application)
        .where(*conditions)
        .order_by(Application.id)
        .offset(skip)
        .limit(limit)
    )

    return db.scalars(stmt).all()


def get_application_detail(
    db: Session,
    application_id: int,
):
    stmt = (
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.notes))
    )

    return db.scalar(stmt)


def update_application(
    db: Session,
    application: Application,
    company: str,
    role: str,
    status: str,
    applied_on=None,
    url=None,
):
    application.company = company
    application.role = role
    application.status = status
    application.applied_on = applied_on
    application.url = url

    db.commit()
    db.refresh(application)

    return application


def delete_application(
    db: Session,
    application: Application,
):
    db.delete(application)
    db.commit()


def create_note(
    db: Session,
    application_id: int,
    body: str,
):
    note = Note(
        application_id=application_id,
        body=body,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return note


def get_notes(
    db: Session,
    application_id: int,
):
    stmt = (
        select(Note)
        .where(Note.application_id == application_id)
        .order_by(Note.id)
    )

    return db.scalars(stmt).all()


def delete_note(
    db: Session,
    application_id: int,
    note_id: int,
):
    stmt = (
        select(Note)
        .where(
            Note.application_id == application_id,
            Note.id == note_id,
        )
    )

    note = db.scalar(stmt)

    if note is None:
        return False

    db.delete(note)
    db.commit()

    return True


def get_stats(db: Session):
    stmt = (
        select(
            Application.status,
            func.count(Application.id),
        )
        .group_by(Application.status)
    )

    rows = db.execute(stmt).all()

    stats = {
        "total": 0,
        "applied": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0,
    }

    for status, count in rows:
        stats[status] = count
        stats["total"] += count

    return stats