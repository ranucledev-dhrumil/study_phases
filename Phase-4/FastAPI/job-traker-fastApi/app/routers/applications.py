from fastapi import APIRouter, Query, Depends, BackgroundTasks
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.deps import get_owned_application_detail
from app.crud import create_audit_log_task
from app.models import Application
from app.schemas.applications import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStats,
    ApplicationStatus,
    ApplicationUpdate,
    ApplicationDetail,
)
from app.crud import get_application, get_applications as crud_get_applications, get_application_detail as crud_get_application_detail, create_application, update_application, delete_application, get_stats as crud_get_stats

from app.db import DbSession

from app.deps import CurrentUser, get_owned_application

router = APIRouter(prefix="/applications", tags=["applications"])

NOT_FOUND = {404: {"description": "Application not found"}}

WRITABLE_FIELDS = ("company", "role", "status", "applied_on", "url")



@router.post(   "", 
                response_model=ApplicationRead, 
                status_code=201,
                summary="Create an application"
            )
async def post_application(db: DbSession, current_user: CurrentUser, payload: ApplicationCreate, background_tasks: BackgroundTasks,):
    response = await create_application(db, payload, owner_id=current_user.id)
    background_tasks.add_task(
        create_audit_log_task,
        user_id=current_user.id,
        action="application_created",
        application_id=response.id,
    )
    return response


@router.get(    "", 
                response_model=list[ApplicationRead],
                summary="List applications"
            )
async def get_applications(
    db: DbSession,
    current_user: CurrentUser,
    status: ApplicationStatus | None = None,
    q: str | None = Query(None, min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    items = await crud_get_applications(db,current_user.id, limit, skip, status, q)
    return items


# Must be declared BEFORE "/{application_id}", or "stats" is parsed as an id.
@router.get("/stats", response_model=ApplicationStats,
            summary="Get application statistics")
async def get_stats(db: DbSession, current_user: CurrentUser):
    response = await crud_get_stats(db, current_user.id)
    return response


@router.get("/{application_id}", response_model=ApplicationDetail,
            summary="Get an application with its notes", responses=NOT_FOUND)
async def get_application(application: Application = Depends(get_owned_application_detail)):
    return application


@router.put("/{application_id}", response_model=ApplicationRead,
            summary="Replace an application", responses=NOT_FOUND)
async def put_application(  db: DbSession, background_tasks: BackgroundTasks, payload: ApplicationCreate, application: Application = Depends(get_owned_application)):
    response = await update_application(db, application, payload)
    background_tasks.add_task(
        create_audit_log_task,
        user_id=application.owner_id,
        action="application_updated",
        application_id=response.id,
    )
    return response


@router.patch("/{application_id}", response_model=ApplicationRead,
              summary="Partially update an application", responses=NOT_FOUND)
async def patch_application(db: DbSession, background_tasks: BackgroundTasks, payload: ApplicationUpdate, application: Application = Depends(get_owned_application)):
    existing = application

    # Only the fields the client actually sent
    changes = payload.model_dump(exclude_unset=True)

    # Merge onto the writable fields of the stored record (not id/created_at)
    current = {field: getattr(existing, field) for field in WRITABLE_FIELDS}
    merged = {**current, **changes}

    # Validate the COMPLETE result BEFORE writing anything to the store.
    # A ValidationError raised inside an endpoint is NOT turned into a 422
    # automatically, so convert it ourselves.
    try:
        validated = ApplicationCreate.model_validate(merged)
    except ValidationError as exc:
        raise RequestValidationError(exc.errors())

    response = await update_application(db, existing, validated)
    background_tasks.add_task(
        create_audit_log_task,
        user_id=application.owner_id,
        action="application_updated",
        application_id=response.id,
    )
    return response


@router.delete("/{application_id}", status_code=204,
               summary="Delete an application and its notes",
               responses=NOT_FOUND)
async def delete_application_endpoint(db: DbSession, background_tasks: BackgroundTasks,application: Application = Depends(get_owned_application)):
    response = await delete_application(db, application)
    background_tasks.add_task(
        create_audit_log_task,
        user_id=application.owner_id,
        action="application_deleted",
        application_id=application.id,
    )