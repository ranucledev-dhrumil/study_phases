from datetime import datetime, timezone


next_application_id = 1
next_note_id = 1

applications = {}
notes = {}


def one_application(application_id):
    return applications.get(application_id)


def create_application(application):
    global next_application_id

    application_id = next_application_id
    next_application_id += 1

    applications[application_id] = {
        "id": application_id,
        "company": application.company,
        "role": application.role,
        "status": application.status,
        "applied_on": application.applied_on,
        "url": application.url,
        "created_at": datetime.now(timezone.utc),
    }

    return applications[application_id]


def update_application(application_id, new_application):
    existing_application = applications.get(application_id)

    if existing_application is None:
        return None

    applications[application_id] = {
        "id": application_id,
        "company": new_application.company,
        "role": new_application.role,
        "status": new_application.status,
        "applied_on": new_application.applied_on,
        "url": new_application.url,
        "created_at": existing_application["created_at"],
    }

    return applications[application_id]


def delete_application(application_id):
    existing_application = applications.get(application_id)

    if existing_application is None:
        return False

    applications.pop(application_id)

    note_ids_to_delete = []

    for note_id, note in notes.items():
        if note["application_id"] == application_id:
            note_ids_to_delete.append(note_id)

    for note_id in note_ids_to_delete:
        notes.pop(note_id)

    return True


def all_applications():
    return list(applications.values())


def stats_all_applications():
    total = len(applications)

    counts = {
        "applied": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0,
    }

    for record in applications.values():
        status = record["status"]
        counts[status.value] += 1

    return {
        "total": total,
        "applied": counts["applied"],
        "interview": counts["interview"],
        "offer": counts["offer"],
        "rejected": counts["rejected"],
    }


def create_note(application_id, note):
    if application_id not in applications:
        return None

    global next_note_id

    note_id = next_note_id
    next_note_id += 1

    record = {
        "id": note_id,
        "body": note.body,
        "application_id": application_id,
        "created_at": datetime.now(timezone.utc),
    }

    notes[note_id] = record

    return record


def delete_note(note_id):
    if note_id not in notes:
        return False

    notes.pop(note_id)

    return True


def get_notes_for_application(application_id):
    return [
        note
        for note in notes.values()
        if note["application_id"] == application_id
    ]