import pytest

from app import create_app
from app.extensions import db

app = create_app(config_object="config.TestConfig")
client = app.test_client()

@pytest.fixture(autouse=True)
def setup_database():
    with app.app_context():
        db.drop_all()
        db.create_all()

    yield

    with app.app_context():
        db.session.remove()

def test_register():
    resp = client.post("/api/auth/register", 
        json={"email": "alice@example.com", "password": "secret12asdasda3"}
        )
    assert resp.status_code == 201
    data = resp.get_json()
    assert "id" in data

def test_register_duplicate_email(): 
    resp = client.post("/api/auth/register", 
        json={"email": "alice@example.com", "password": "secret12asdasda3"}
    )
    assert resp.status_code == 201
    resp = client.post("/api/auth/register", 
            json={"email": "alice@example.com", "password": "secret12asdasda3"}
        )
    assert resp.status_code == 400

def test_login():
    resp = client.post("/api/auth/register", 
        json={"email": "alice@example.com", "password": "secret12asdasda3"}
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert "id" in data

    resp = client.post("/api/auth/login", 
        json={"email": "alice@example.com", "password": "secret12asdasda3"}
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "access_token" in data

def test_login_with_wrong_pass():
    resp = client.post("/api/auth/register", 
        json={"email": "alice@example.com", "password": "secret12asdasda3"}
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert "id" in data

    resp = client.post("/api/auth/login", 
        json={"email": "alice@example.com", "password": "secret123"}
    )
    assert resp.status_code == 401

def test_get_application():
    resp = client.get("/api/applications")
    assert resp.status_code == 401

def test_user_cannot_access_other_users_application():
    # Register User A
    client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "password": "secret123"
        }
    )

    # Login User A
    login_a = client.post(
        "/api/auth/login",
        json={
            "email": "alice@example.com",
            "password": "secret123"
        }
    )

    token_a = login_a.get_json()["access_token"]

    # Create application as User A
    create_response = client.post(
        "/api/applications",
        json={
            "company": "Google",
            "status": "applied"
        },
        headers={
            "Authorization": f"Bearer {token_a}"
        }
    )

    application_id = create_response.get_json()["id"]

    # Register User B
    client.post(
        "/api/auth/register",
        json={
            "email": "bob@example.com",
            "password": "secret456"
        }
    )

    # Login User B
    login_b = client.post(
        "/api/auth/login",
        json={
            "email": "bob@example.com",
            "password": "secret456"
        }
    )

    token_b = login_b.get_json()["access_token"]

    # User B tries to access User A's application
    response = client.get(
        f"/api/applications/{application_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        }
    )

    assert response.status_code == 404
    assert response.get_json() == {"error": "Application not found"}


def test_put_status_does_not_wipe_company():
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "password": "secret123"
        }
    )

    # Login
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "alice@example.com",
            "password": "secret123"
        }
    )

    token = login_response.get_json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create application
    create_response = client.post(
        "/api/applications",
        json={
            "company": "Google",
            "status": "applied"
        },
        headers=headers
    )

    application_id = create_response.get_json()["id"]

    # Update only status
    response = client.put(
        f"/api/applications/{application_id}",
        json={
            "status": "interview"
        },
        headers=headers
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["company"] == "Google"
    assert data["status"] == "interview"