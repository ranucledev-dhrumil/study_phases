import time
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def register(client, email, password="Password123!"):
    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def login(client, email, password="Password123!"):
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def create_application(client, token, company, role):
    response = client.post(
        "/applications",
        headers=auth(token),
        json={
            "company": company,
            "role": role,
            "status": "applied",
            "applied_on": "2026-10-07",
            "url": "https://example.com/job",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_session3_full_flow(client):
    timestamp = int(time.time())

    user_a_email = f"session3_a_{timestamp}@example.com"
    user_b_email = f"session3_b_{timestamp}@example.com"
    password = "Password123!"

    # ---------------------------------------------------------
    # 1. Registration
    # ---------------------------------------------------------

    user_a = register(client, user_a_email, password)
    user_b = register(client, user_b_email, password)

    assert user_a["email"] == user_a_email.lower()
    assert user_b["email"] == user_b_email.lower()

    # Password must never be returned.
    assert "password" not in user_a
    assert "hashed_password" not in user_a

    # ---------------------------------------------------------
    # 2. Duplicate registration
    # ---------------------------------------------------------

    duplicate = client.post(
        "/auth/register",
        json={
            "email": user_a_email,
            "password": password,
        },
    )

    assert duplicate.status_code == 409

    # ---------------------------------------------------------
    # 3. Login
    # ---------------------------------------------------------

    token_a = login(client, user_a_email, password)
    token_b = login(client, user_b_email, password)

    assert token_a
    assert token_b

    # ---------------------------------------------------------
    # 4. /auth/me
    # ---------------------------------------------------------

    me_a = client.get("/auth/me", headers=auth(token_a))

    assert me_a.status_code == 200
    assert me_a.json()["email"] == user_a_email

    no_token_me = client.get("/auth/me")

    assert no_token_me.status_code == 401
    assert no_token_me.json()["detail"] == "Not authenticated"

    # ---------------------------------------------------------
    # 5. Wrong password and unknown email
    # ---------------------------------------------------------

    wrong_password = client.post(
        "/auth/login",
        data={
            "username": user_a_email,
            "password": "DefinitelyWrongPassword!",
        },
    )

    unknown_email = client.post(
        "/auth/login",
        data={
            "username": f"does_not_exist_{timestamp}@example.com",
            "password": password,
        },
    )

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401

    assert wrong_password.json()["detail"] == "Could not validate credentials"
    assert unknown_email.json()["detail"] == "Could not validate credentials"

    assert wrong_password.headers["www-authenticate"] == "Bearer"
    assert unknown_email.headers["www-authenticate"] == "Bearer"

    # ---------------------------------------------------------
    # 6. Invalid JWT
    # ---------------------------------------------------------

    invalid_token = client.get(
        "/auth/me",
        headers=auth("this.is.not.a.valid.jwt"),
    )

    assert invalid_token.status_code == 401
    assert invalid_token.json()["detail"] == "Could not validate credentials"
    assert invalid_token.headers["www-authenticate"] == "Bearer"

    # ---------------------------------------------------------
    # 7. Bad-signature JWT
    # ---------------------------------------------------------

    bad_signature_token = jwt.encode(
        {
            "sub": str(user_a["id"]),
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        },
        "WRONG_SECRET",
        algorithm="HS256",
    )

    bad_signature = client.get(
        "/auth/me",
        headers=auth(bad_signature_token),
    )

    assert bad_signature.status_code == 401
    assert bad_signature.json()["detail"] == "Could not validate credentials"
    assert bad_signature.headers["www-authenticate"] == "Bearer"

    # ---------------------------------------------------------
    # 8. Expired JWT
    # ---------------------------------------------------------

    expired_token = jwt.encode(
        {
            "sub": str(user_a["id"]),
            "iat": datetime.now(timezone.utc) - timedelta(minutes=10),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
        },
        settings.secret_key,
        algorithm="HS256",
    )

    expired = client.get(
        "/auth/me",
        headers=auth(expired_token),
    )

    assert expired.status_code == 401
    assert expired.json()["detail"] == "Could not validate credentials"
    assert expired.headers["www-authenticate"] == "Bearer"

    # ---------------------------------------------------------
    # 9. Non-numeric JWT sub
    # ---------------------------------------------------------

    bad_sub_token = jwt.encode(
        {
            "sub": "not-a-number",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        },
        settings.secret_key,
        algorithm="HS256",
    )

    bad_sub = client.get(
        "/auth/me",
        headers=auth(bad_sub_token),
    )

    assert bad_sub.status_code == 401
    assert bad_sub.json()["detail"] == "Could not validate credentials"

    # ---------------------------------------------------------
    # 10. Create applications
    # ---------------------------------------------------------

    application_a = create_application(
        client,
        token_a,
        "Company A",
        "Backend Engineer",
    )

    application_b = create_application(
        client,
        token_b,
        "Company B",
        "Frontend Engineer",
    )

    application_a_id = application_a["id"]
    application_b_id = application_b["id"]

    # Owner ID must be present in response if ApplicationRead exposes it.
    if "owner_id" in application_a:
        assert application_a["owner_id"] == user_a["id"]

    # ---------------------------------------------------------
    # 11. List applications is user-scoped
    # ---------------------------------------------------------

    list_a = client.get(
        "/applications",
        headers=auth(token_a),
    )

    assert list_a.status_code == 200

    ids_a = {item["id"] for item in list_a.json()}

    assert application_a_id in ids_a
    assert application_b_id not in ids_a

    list_b = client.get(
        "/applications",
        headers=auth(token_b),
    )

    assert list_b.status_code == 200

    ids_b = {item["id"] for item in list_b.json()}

    assert application_b_id in ids_b
    assert application_a_id not in ids_b

    # ---------------------------------------------------------
    # 12. Unauthenticated applications request
    # ---------------------------------------------------------

    unauthenticated_list = client.get("/applications")

    assert unauthenticated_list.status_code == 401

    # ---------------------------------------------------------
    # 13. Get own application
    # ---------------------------------------------------------

    own_application = client.get(
        f"/applications/{application_a_id}",
        headers=auth(token_a),
    )

    assert own_application.status_code == 200
    assert own_application.json()["id"] == application_a_id

    # ---------------------------------------------------------
    # 14. Cannot access another user's application
    # ---------------------------------------------------------

    foreign_application = client.get(
        f"/applications/{application_b_id}",
        headers=auth(token_a),
    )

    assert foreign_application.status_code == 404
    assert foreign_application.json()["detail"] == (
        f"Application {application_b_id} not found"
    )

    # ---------------------------------------------------------
    # 15. Stats are user-scoped
    # ---------------------------------------------------------

    stats_a = client.get(
        "/applications/stats",
        headers=auth(token_a),
    )

    stats_b = client.get(
        "/applications/stats",
        headers=auth(token_b),
    )

    assert stats_a.status_code == 200
    assert stats_b.status_code == 200

    assert stats_a.json()["total"] == 1
    assert stats_b.json()["total"] == 1

    # ---------------------------------------------------------
    # 16. Create note on own application
    # ---------------------------------------------------------

    note = client.post(
        f"/applications/{application_a_id}/notes",
        headers=auth(token_a),
        json={
            "body": "First test note",
        },
    )

    assert note.status_code == 201, note.text

    note_id = note.json()["id"]

    # ---------------------------------------------------------
    # 17. List own notes
    # ---------------------------------------------------------

    notes = client.get(
        f"/applications/{application_a_id}/notes",
        headers=auth(token_a),
    )

    assert notes.status_code == 200

    note_ids = {item["id"] for item in notes.json()}

    assert note_id in note_ids

    # ---------------------------------------------------------
    # 18. Cannot access another user's notes
    # ---------------------------------------------------------

    foreign_notes = client.get(
        f"/applications/{application_b_id}/notes",
        headers=auth(token_a),
    )

    assert foreign_notes.status_code == 404

    # ---------------------------------------------------------
    # 19. Cannot create note on another user's application
    # ---------------------------------------------------------

    foreign_note_create = client.post(
        f"/applications/{application_b_id}/notes",
        headers=auth(token_a),
        json={
            "body": "This must fail",
        },
    )

    assert foreign_note_create.status_code == 404

    # ---------------------------------------------------------
    # 20. PATCH own application
    # ---------------------------------------------------------

    patch = client.patch(
        f"/applications/{application_a_id}",
        headers=auth(token_a),
        json={
            "company": "Company A Updated",
        },
    )

    assert patch.status_code == 200, patch.text
    assert patch.json()["company"] == "Company A Updated"

    # ---------------------------------------------------------
    # 21. PUT own application
    # ---------------------------------------------------------

    put = client.put(
        f"/applications/{application_a_id}",
        headers=auth(token_a),
        json={
            "company": "Company A Replaced",
            "role": "Senior Backend Engineer",
            "status": "interview",
            "applied_on": "2026-10-07",
            "url": "https://example.com/replaced",
        },
    )

    assert put.status_code == 200, put.text
    assert put.json()["company"] == "Company A Replaced"
    assert put.json()["status"] == "interview"

    # ---------------------------------------------------------
    # 22. Cannot modify another user's application
    # ---------------------------------------------------------

    foreign_patch = client.patch(
        f"/applications/{application_b_id}",
        headers=auth(token_a),
        json={
            "company": "HACKED",
        },
    )

    assert foreign_patch.status_code == 404

    foreign_put = client.put(
        f"/applications/{application_b_id}",
        headers=auth(token_a),
        json={
            "company": "HACKED",
            "role": "HACKED",
            "status": "applied",
            "applied_on": "2026-10-07",
            "url": "https://example.com",
        },
    )

    assert foreign_put.status_code == 404

    # ---------------------------------------------------------
    # 23. Delete own note
    # ---------------------------------------------------------

    delete_note = client.delete(
        f"/applications/{application_a_id}/notes/{note_id}",
        headers=auth(token_a),
    )

    assert delete_note.status_code == 204

    # ---------------------------------------------------------
    # 24. Delete own application
    # ---------------------------------------------------------

    delete_application = client.delete(
        f"/applications/{application_a_id}",
        headers=auth(token_a),
    )

    assert delete_application.status_code == 204

    deleted_application = client.get(
        f"/applications/{application_a_id}",
        headers=auth(token_a),
    )

    assert deleted_application.status_code == 404

    # ---------------------------------------------------------
    # 25. User B's application still exists
    # ---------------------------------------------------------

    application_b_still_exists = client.get(
        f"/applications/{application_b_id}",
        headers=auth(token_b),
    )

    assert application_b_still_exists.status_code == 200

    # ---------------------------------------------------------
    # 26. User B cannot delete User A's already deleted app
    # ---------------------------------------------------------

    foreign_delete = client.delete(
        f"/applications/{application_a_id}",
        headers=auth(token_b),
    )

    assert foreign_delete.status_code == 404