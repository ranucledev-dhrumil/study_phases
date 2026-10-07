from app.schemas.applications import ApplicationCreate, ApplicationRead, ApplicationStatus
from app.schemas.applications import ApplicationDetail
from app.schemas.notes import NoteCreate
from tortoise_demo.models import Application, Note
from tortoise.queryset import Q

async def create_application(payload: ApplicationCreate):
    application  = await Application.create(        
        company=payload.company,
        role=payload.role,
        status=payload.status,
        applied_on=payload.applied_on,
        url=str(payload.url) if payload.url is not None else None,
    )

    return application

async def get_applications(limit: int, skip: int, status: ApplicationStatus | None=None, q: str | None=None):

    query = Application.all()

    if status is not None:
        query = query.filter(status=status)

    if q is not None:
        query = query.filter(
            Q(company__icontains=q) | Q(role__icontains=q)
        )
    
    return await query.order_by("id").offset(skip).limit(limit)

async def get_application(application_id: int):
    return await Application.get_or_none(id=application_id)

async def get_application_detail(application_id: int):
    application = await Application.get_or_none(id=application_id)

    if application is None:
        return None

    await application.fetch_related("notes")

    return application

async def delete_application(application_id: int):
    application = await Application.get_or_none(id=application_id)

    if application is None:
        return False

    await application.delete()

    return True


async def create_note(application_id: int, payload: NoteCreate):
    note = await Note.create(
        application_id=application_id,
        body=payload.body,
    )

    return note


async def get_notes(application_id: int):
    return await Note.filter(
        application_id=application_id
    ).order_by("id")


async def delete_note(application_id: int, note_id: int):
    note = await Note.get_or_none(
        id=note_id,
        application_id=application_id,
    )

    if note is None:
        return False

    await note.delete()

    return True

