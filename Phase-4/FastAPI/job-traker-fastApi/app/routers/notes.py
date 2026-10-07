from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks

from app.deps import get_application_or_404, get_owned_application
from app.models import Application
from app.schemas.notes import NoteCreate, NoteRead
from app.db import DbSession
from app.crud import get_notes as crud_get_notes, create_note, delete_note as crud_delete_note
from app.crud import create_audit_log_task

router = APIRouter(
    prefix="/applications/{application_id}/notes",
    tags=["notes"],
)


@router.post(
    "",
    response_model=NoteRead,
    status_code=201,
    summary="Create a note",
    responses={404: {"description": "Application not found"}},
)
async def post_note(
    db: DbSession,
    background_tasks: BackgroundTasks,
    application: Application = Depends(get_owned_application),
    payload: NoteCreate = None,
):
    response = await create_note(db, application.id, payload)
    background_tasks.add_task(
        create_audit_log_task,
        user_id=application.owner_id,
        action="note_added",
        application_id=application.id,
    )
    return response


@router.get(
    "",
    response_model=list[NoteRead],
    summary="List an application's notes",
    responses={404: {"description": "Application not found"}},
)
async def get_notes(
    db: DbSession,
    application: Application = Depends(get_owned_application),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return await crud_get_notes(db, application.id, skip, limit)


@router.delete(
    "/{note_id}",
    status_code=204,
    summary="Delete a note",
    responses={404: {"description": "Application or note not found"}},
)
async def remove_note(
    db: DbSession,
    note_id: int,
    application: Application = Depends(get_owned_application),
):
    result = await crud_delete_note(db, application.id, note_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Note {note_id} not found",
        )