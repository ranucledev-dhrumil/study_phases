# Part 1: OpenAPI and Swagger
# OpenAPI is the spec; Swagger is the tooling. The spec is a JSON/YAML document describing your API. Swagger UI renders it as an interactive page with "Try it out", and ReDoc renders it as a readable reference.

# Anatomy of an OpenAPI 3.x document

# openapi: 3.0.3
# info: { title: Job Tracker API, version: 1.0.0 }
# servers: [{ url: http://localhost:5000 }]
# paths:
#   /api/applications/{id}:
#     get:
#       operationId: getApplication
#       tags: [applications]
#       summary: Get one of my applications
#       security: [{ bearerAuth: [] }]
#       parameters:
#         - { name: id, in: path, required: true, schema: { type: integer } }
#       responses:
#         "200":
#           description: OK
#           content:
#             application/json:
#               schema: { $ref: "#/components/schemas/Application" }
#         "404": { $ref: "#/components/responses/NotFound" }
# components:
#   securitySchemes:
#     bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
#   schemas:
#     Application:
#       type: object
#       required: [id, company, status]
#       properties:
#         id: { type: integer }
#         company: { type: string }
#         status: { type: string, enum: [applied, interview, offer, rejected] }
#   responses:
#     NotFound:
#       description: Not found (also returned for another user's resource)

# The key ideas are paths (operations, parameters, request bodies, responses), components (reusable schemas, security schemes and responses, referenced with $ref), and security (applied globally or per operation).

# How FastAPI generates it

# Pydantic models become JSON Schema entries under components/schemas.
# response_model, status_code, tags, summary (or the docstring) and responses={404: {...}} shape each operation.
# Field(..., examples=[...]) and model_config examples populate example values.
# The docs are served at /docs, /redoc and /openapi.json.
# A security dependency such as OAuth2PasswordBearer or HTTPBearer produces the securitySchemes entry and the Authorize button. Gotcha: OAuth2PasswordBearer's Authorize flow posts form-encoded credentials to its tokenUrl. If your login endpoint takes JSON, the button won't work against it, and HTTPBearer (paste a token) is the fix.


# Flask has no built-in docs. Options:
# | **Approach**                                         | **Style**    | **Trade-off**                                                                        |
# | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
# | Hand-written YAML/JSON                               | Design-first | Full control and can drive mocks and code generation, but it can drift from the code |
# | `apispec` + Marshmallow, `flask-smorest`, `flasgger` | Code-first   | Stays closer to the code, but adds dependencies and a schema layer                   |

# Code-first vs design-first: code-first gives you docs that stay in sync automatically. Design-first lets the contract be agreed before implementation, which helps frontend and backend teams work in parallel. Validate a hand-written spec in Swagger Editor or with openapi-spec-validator. Postman can import an OpenAPI file and generate a collection from it.

# Part 2: Postman automation
# Structure: a collection holds folders, which hold requests. Each request has a Params tab, an Auth tab, a Body tab, a Pre-request Script and a Tests tab (both are JavaScript).

# Variables:
# Scopes, narrowest wins: local → data (runner iteration) → environment → collection → global.
# Use {{base_url}} in URLs and {{access_token}} in auth headers.
# Environments (dev, staging) swap the values without touching requests.
# Each variable has an initial value (synced and shared) and a current value (local only). Keep secrets such as passwords and tokens in the current value.

pm.test("login returns 200 and a token", () => {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body).to.have.property("access_token");
  pm.environment.set("access_token", body.access_token);   // chaining
});

pm.test("response time under 500ms", () => {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

# Chaining pattern: register → login (the script stores the token) → create application (the script stores app_id) → get, update, delete using {{app_id}}. Set auth once at collection level as Bearer {{access_token}} and let requests inherit it.

# What a good collection also tests:
# no token → 401
# a malformed body → 400 (Flask) or 422 (FastAPI)
# a second user's token on the first user's resource → 404, which is the cross-user case
# the list excluding other users' records

# Runner and Newman
# The Collection Runner executes requests in order, and data files (CSV or JSON) drive multiple iterations.
# Newman is the CLI runner, installed with npm install -g newman. Run it with newman run collection.json -e env.json --reporters cli,junit. It exits non-zero when tests fail, which is what makes it usable in CI. You already know npm from the MERN phase.

# Part 3: Testing with pytest and unittest
# What an API test should assert: status code, response shape, persistence side effects, auth (401), ownership (404 cross-user) and validation errors. Test the contract, not the implementation.
# pytest essentials
import pytest

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.mark.parametrize("status", ["applied", "interview", "offer"])
def test_create_with_valid_status(client, auth_headers, status):
    r = client.post("/api/applications", json={"company": "X", "status": status},
                    headers=auth_headers)
    assert r.status_code == 201

# Plain assert with rich failure output.
# Fixtures support scopes (function is the default; also module and session) and use yield for teardown. They live in conftest.py and are shared automatically.
# parametrize runs one test over many inputs. Markers include skip, xfail and custom ones.
# monkeypatch swaps attributes or env vars for one test.
# Useful flags: -x (stop on first failure), -k expr (select by name), --lf (rerun last failures), -q.

# unittest essentials
import unittest
from unittest.mock import patch

class AppTests(unittest.TestCase):
    def setUp(self):            # runs before each test
        ...
    def test_something(self):
        self.assertEqual(1 + 1, 2)
        with self.assertRaises(ValueError):
            int("x")
        with self.subTest(status="applied"):   # loop-style cases
            ...
# setUp/tearDown (and setUpClass) replace fixtures, assert* methods replace plain assert, and subTest is the loose analogue of parametrize. unittest.mock.patch and MagicMock handle mocking. pytest can run unittest-style tests, so the two coexist.

# | **Aspect**      | **pytest**                 | **unittest**                          |
# | --------------- | -------------------------- | ------------------------------------- |
# | **Assertions**  | Plain `assert`             | `self.assertX()` methods              |
# | **Setup**       | Fixtures, composable       | `setUp()` / `tearDown()`, class-bound |
# | **Many inputs** | `@pytest.mark.parametrize` | `subTest()`                           |
# | **Boilerplate** | Low                        | Class required                        |
# | **Install**     | Third-party                | Standard library                      |

# Django

# django.test.TestCase is unittest-based. It creates a separate test database and wraps each test in a transaction that rolls back, so tests stay isolated.
# self.client is a test client. For session auth use self.client.force_login(user), or login(username=..., password=...) to exercise the real flow.
# Useful asserts: assertContains, assertRedirects, assertTemplateUsed and assertNumQueries(n). The last one connects directly to N+1: it fails if a view issues more queries than expected.
# pytest-django: configure DJANGO_SETTINGS_MODULE in pytest.ini. Mark DB tests with @pytest.mark.django_db, and use the client and django_user_model fixtures.
# Cross-user test shape: create users A and B and A's application, log in as B, request A's URL, and expect 404 (the get_object_or_404 with an owner filter).

# FastAPI

# TestClient is sync and wraps httpx.
# app.dependency_overrides[get_db] = override_get_db swaps the real DB dependency for a test one. Use a test database with its tables created and dropped per test or per module. An in-memory SQLite engine needs StaticPool to share one connection.
# For async tests, use httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test") with pytest-asyncio (mark tests or configure asyncio_mode). Note that this transport does not run lifespan or startup events.
# Override auth vs real tokens: for unit tests of other logic, overriding the current-user dependency is fine. For auth tests, go through the real register and login flow so the token path is actually exercised.
# Flask is the pattern you already know: an app-factory fixture plus app.test_client().

# The cross-user pattern, for any framework

# Arrange: create user A, user B, and a resource owned by A.
# Act: authenticate as B and try to read, update and delete A's resource.
# Assert: each returns 404, A's data is unchanged, and B's list endpoint doesn't contain it.

# Coverage: pytest-cov shows which lines ran. It does not show whether the assertions are meaningful. 100% coverage with weak asserts proves little, so treat it as a way to find untested branches, not as a goal.


