# Phase 4 — Python Web Frameworks

A study phase covering three Python web frameworks across four sessions each.  
All three frameworks were used to build a **Job Application Tracker** API.

---

## 📁 Structure

```
Phase-4/
├── Django/                  ← S1–S4 notes + JobTrackerFolder project
├── Flask/                   ← S1–S4 notes + job-tracker-flask project
├── FastAPI/                 ← S1–S4 notes + job-traker-fastApi project
├── Integration and Advanced Topics/  ← comparison notes
└── README.md                ← this file
```

---

## ⚡ Quick Start (TL;DR)

| Framework | Navigate to | Activate venv | DB setup | Run |
|-----------|-------------|---------------|----------|-----|
| **Django** | `Django/JobTrackerFolder` | `venv\Scripts\activate` | `python manage.py migrate` | `python manage.py runserver` |
| **Flask** | `Flask/job-tracker-flask` | `venv\Scripts\activate` | `flask db upgrade` | `python run.py` |
| **FastAPI** | `FastAPI/job-traker-fastApi` | `venv\Scripts\activate` | `alembic upgrade head` | `uvicorn app.main:app --reload` |

---

## 🗂️ Framework READMEs

- [Django README](Django/README.md)
- [Flask README](Flask/README.md)
- [FastAPI README](FastAPI/README.md)

---

## 📚 What Each Session Covered

### Django (4 sessions)
| Session | Topic |
|---------|-------|
| S1 | MTV pattern, venv setup, project vs app structure, `INSTALLED_APPS` |
| S2 | Models, migrations (`makemigrations` / `migrate`), ORM CRUD, Admin panel |
| S3 | Function-based vs Class-based views, URL routing, templates (DTL) |
| S4 | Django Forms & ModelForms, CSRF, built-in auth (login/logout/register), sessions & flash messages |

### Flask (4 sessions)
| Session | Topic |
|---------|-------|
| S1 | Flask vs Django philosophy, WSGI, app factory pattern, config objects, routing, request/response |
| S2 | Jinja2 templates, Flask-WTF forms, CSRF, handling POST with forms |
| S3 | JSON APIs (no forms), Blueprints, centralized error handling, custom exceptions |
| S4 | Flask-SQLAlchemy, models, Flask-Migrate (Alembic), DB CRUD in routes, JWT auth, CORS |

### FastAPI (4 sessions)
| Session | Topic |
|---------|-------|
| S1 | ASGI vs WSGI, async model (`async def` vs `def`), APIRouter, path/query params, Pydantic v2, response models |
| S2 | Async SQLAlchemy 2.0, `AsyncSession`, lifespan hook, Alembic migrations, lazy-load pitfalls |
| S3 | Dependency injection, password hashing (pwdlib/argon2), JWT with PyJWT, `get_current_user` dependency, per-user scoped CRUD |
| S4 | Middleware (timing, request IDs), CORS config, BackgroundTasks, concurrent I/O with `httpx` + `asyncio.gather`, testing |

---

## 🔑 Key Concept Comparison

| Concept | Django | Flask | FastAPI |
|---------|--------|-------|---------|
| ORM | Built-in | Flask-SQLAlchemy | SQLAlchemy 2.0 (async) |
| Migrations | `makemigrations` / `migrate` | Flask-Migrate (`flask db upgrade`) | Alembic (`alembic upgrade head`) |
| Auth | Built-in session auth | Flask-JWT-Extended | PyJWT + `OAuth2PasswordBearer` |
| Route grouping | `include()` / `urls.py` | Blueprint | APIRouter |
| Input validation | ModelForm / Forms | Manual / WTForms | Pydantic model (automatic) |
| API docs | Add-on (DRF) | Add-on | Built-in at `/docs` |
| Concurrency | WSGI workers | WSGI workers | ASGI event loop |

---

## 🧠 The One Mental Model

```
Django  = batteries-included (like Spring Boot)
Flask   = Python's Express — bring your own everything
FastAPI = async-native, type-hint driven, auto-docs
```
