from app import create_app

app = create_app(config_object="config.TestConfig")

client = app.test_client()

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}

def test_info():
    resp = client.get("/info")
    assert resp.status_code == 200
    assert resp.get_json() == {"app": "Job Tracker", "env": "test"}

def test_post_application():
    resp = client.post("/applications")
    assert resp.status_code == 201
    assert resp.headers["X-App"] == "job-tracker"
    assert resp.get_json() == {"message": "created"}

def test_abc():
    resp = client.get("/applications/app")
    assert resp.status_code == 404

def test_post_app_not_allowed():
    resp = client.post("/applications/1")
    assert resp.status_code == 405

def test_search():
    resp = client.get("/search")
    assert resp.get_json() == {"company":None, "status":"any"}

def test_search_status():
    resp = client.get("/search?status=")
    assert resp.get_json() == {"company":None, "status":""}