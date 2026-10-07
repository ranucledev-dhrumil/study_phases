from db import Base, SessionLocal, engine
from crud import (
    create_application,
    get_application,
    get_applications,
    get_application_detail,
    update_application,
    delete_application,
    create_note,
    get_notes,
    delete_note,
    get_stats,
)


Base.metadata.create_all(engine)


with SessionLocal() as db:

    # CREATE
    application = create_application(
        db,
        company="Sync Company",
        role="Backend Developer",
    )

    print("Created:")
    print(application.id, application.company)

    # CREATE NOTE
    note = create_note(
        db,
        application.id,
        "Follow up next week",
    )

    print("Created note:")
    print(note.id, note.body)

    # GET ONE
    application = get_application(
        db,
        application.id,
    )

    print("Single application:")
    print(application.company)

    # LIST
    applications = get_applications(
        db,
        limit=20,
        skip=0,
    )

    print("Applications:")
    for item in applications:
        print(item.id, item.company)

    # DETAIL + NOTES
    detail = get_application_detail(
        db,
        application.id,
    )

    print("Detail:")
    print(detail.company)

    for note in detail.notes:
        print("NOTE:", note.body)

    # UPDATE
    update_application(
        db,
        application,
        company="Updated Sync Company",
        role="Senior Backend Developer",
        status="interview",
    )

    print("Updated:")
    print(application.company, application.status)

    # STATS
    print("Stats:")
    print(get_stats(db))

    # DELETE NOTE
    delete_note(
        db,
        application.id,
        note.id,
    )

    # DELETE APPLICATION
    delete_application(
        db,
        application,
    )

    print("Application deleted")