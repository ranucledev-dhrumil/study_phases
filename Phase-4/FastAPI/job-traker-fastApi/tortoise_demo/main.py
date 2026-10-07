from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException

from tortoise_demo.db import get_tortoise

from app.schemas.applications import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatus,
    ApplicationDetail,
)
from app.schemas.notes import (
    NoteCreate,
    NoteRead,
)
from tortoise_demo.crud import (
    create_application,
    get_applications as crud_get_applications,
    get_application as crud_get_application,
    get_application_detail as crud_get_application_detail,
    delete_application as crud_delete_application,
    create_note,
    get_notes as crud_get_notes,
    delete_note as crud_delete_note,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with get_tortoise():
        yield


app = FastAPI(
    title="Tortoise Job Tracker",
    version="0.1.0",
    lifespan=lifespan,
)


# Here are the routes:
# ---------------------------------------------------------
# APPLICATIONS
# ---------------------------------------------------------

@app.post(
    "/applications",
    response_model=ApplicationRead,
    status_code=201,
)
async def post_application(payload: ApplicationCreate):
    application = await create_application(payload)

    return ApplicationRead(
        id=application.id,
        company=application.company,
        role=application.role,
        status=application.status,
        applied_on=application.applied_on,
        url=application.url,
        created_at=application.created_at,
    )

@app.get(    "/applications", 
                response_model=list[ApplicationRead],
                summary="List applications"
            )
async def get_applications(
    status: ApplicationStatus | None = None,
    q: str | None = Query(None, min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    items = await crud_get_applications( limit, skip, status, q)
    return [
    ApplicationRead(
        id=application.id,
        company=application.company,
        role=application.role,
        status=application.status,
        applied_on=application.applied_on,
        url=application.url,
        created_at=application.created_at,
    )
    for application in items
]

@app.get(
    "/applications/{application_id}",
    response_model=ApplicationRead,
    summary="Get an application",
)
async def get_application(application_id: int):
    application = await crud_get_application(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    return ApplicationRead(
        id=application.id,
        company=application.company,
        role=application.role,
        status=application.status,
        applied_on=application.applied_on,
        url=application.url,
        created_at=application.created_at,
    )


@app.get(
    "/applications/{application_id}/detail",
    response_model=ApplicationDetail,
    summary="Get application details with notes",
)
async def get_application_detail(application_id: int):
    application = await crud_get_application_detail(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    return ApplicationDetail(
        id=application.id,
        company=application.company,
        role=application.role,
        status=application.status,
        applied_on=application.applied_on,
        url=application.url,
        created_at=application.created_at,
        notes=[
            NoteRead(
                id=note.id,
                application_id=note.application_id,
                body=note.body,
                created_at=note.created_at,
            )
            for note in application.notes
        ],
    )


@app.delete(
    "/applications/{application_id}",
    status_code=204,
    summary="Delete an application and its notes",
)
async def delete_application(application_id: int):
    deleted = await crud_delete_application(application_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )


# ---------------------------------------------------------
# NOTES
# ---------------------------------------------------------


@app.post(
    "/applications/{application_id}/notes",
    response_model=NoteRead,
    status_code=201,
    summary="Create a note",
)
async def post_note(
    application_id: int,
    payload: NoteCreate,
):
    application = await crud_get_application(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    note = await create_note(
        application_id,
        payload,
    )

    return NoteRead(
        id=note.id,
        application_id=note.application_id,
        body=note.body,
        created_at=note.created_at,
    )


@app.get(
    "/applications/{application_id}/notes",
    response_model=list[NoteRead],
    summary="List application notes",
)
async def get_notes(
    application_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    application = await crud_get_application(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    notes = await crud_get_notes(application_id)

    notes = notes[skip:skip + limit]

    return [
        NoteRead(
            id=note.id,
            application_id=note.application_id,
            body=note.body,
            created_at=note.created_at,
        )
        for note in notes
    ]


@app.delete(
    "/applications/{application_id}/notes/{note_id}",
    status_code=204,
    summary="Delete a note",
)
async def delete_note(
    application_id: int,
    note_id: int,
):
    application = await crud_get_application(application_id)

    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application {application_id} not found",
        )

    deleted = await crud_delete_note(
        application_id,
        note_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Note {note_id} not found",
        )