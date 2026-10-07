# import pytest

# from app import create_app
# from app.applications import routes

# app = create_app(config_object="config.TestConfig")
# client = app.test_client()

# @pytest.fixture(autouse=True)
# def reset_store():
#     routes._applications.clear()
#     routes._next_id = 1

# def test_create_application():
#     resp = client.post(
#         "/api/applications",
#         json={"company": "Google", "status": "interview"}
#     )

#     assert resp.status_code == 201

#     data = resp.get_json()

#     assert "id" in data
#     assert data["company"] == "Google"
#     assert data["status"] == "interview"

# def test_create_application_missing_company():
#     resp = client.post(
#         "/api/applications",
#         json={"status": "applied"}
#     )

#     assert resp.status_code == 400

#     data = resp.get_json()

#     assert "error" in data

# def test_get_all_applications():
#     client.post(
#         "/api/applications",
#         json={"company": "Google", "status": "applied"}
#     )

#     client.post(
#         "/api/applications",
#         json={"company": "Microsoft", "status": "interview"}
#     )

#     resp = client.get("/api/applications")

#     assert resp.status_code == 200

#     data = resp.get_json()

#     assert len(data) == 2
#     assert data[0]["company"] == "Google"
#     assert data[1]["company"] == "Microsoft"

# def test_get_nonexistent_application():
#     resp = client.get("/api/applications/999")

#     assert resp.status_code == 404
#     assert resp.get_json() == {"error": "Application not found"}

# def test_update_application():
#     create_resp = client.post(
#         "/api/applications",
#         json={"company": "Google", "status": "applied"}
#     )

#     application_id = create_resp.get_json()["id"]

#     resp = client.put(
#         f"/api/applications/{application_id}",
#         json={"company": "Microsoft", "status": "interview"}
#     )

#     assert resp.status_code == 200

#     data = resp.get_json()

#     assert data["id"] == application_id
#     assert data["company"] == "Microsoft"
#     assert data["status"] == "interview"

# def test_update_nonexistent_application():
#     resp = client.put(
#         "/api/applications/999",
#         json={"company": "Microsoft", "status": "interview"}
#     )

#     assert resp.status_code == 404
#     assert resp.get_json() == {"error": "Application not found"}

# def test_delete_application():
#     create_resp = client.post(
#         "/api/applications",
#         json={"company": "Google", "status": "applied"}
#     )

#     application_id = create_resp.get_json()["id"]

#     delete_resp = client.delete(
#         f"/api/applications/{application_id}"
#     )

#     assert delete_resp.status_code == 204
#     assert delete_resp.get_data() == b""

#     get_resp = client.get(
#         f"/api/applications/{application_id}"
#     )

#     assert get_resp.status_code == 404
#     assert get_resp.get_json() == {"error": "Application not found"}