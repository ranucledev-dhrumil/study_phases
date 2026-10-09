# Flask — Phase 4

**Project:** Job Application Tracker (`job-tracker-flask`)  
**Flask version:** 3.1.3 · **Python:** 3.12 · **DB:** SQLite (via SQLAlchemy)

---

## 📁 Project Structure

```
job-tracker-flask/
├── run.py                  ← entry point — `python run.py`
├── config.py               ← DevConfig / TestConfig / ProdConfig classes
├── requirements.txt
├── app/
│   ├── __init__.py         ← create_app() factory
│   ├── extensions.py       ← db, jwt, migrate objects (avoid circular imports)
│   ├── routes.py           ← register_routes() helper
│   ├── errors.py           ← centralized JSON error handlers
│   ├── forms.py
│   ├── applications/
│   │   ├── models.py       ← Application model
│   │   └── routes.py       ← applications_bp Blueprint
│   ├── auth/
│   │   └── routes.py       ← auth_bp Blueprint (register/login)
│   └── users/
│       └── models.py       ← User model
├── migrations/             ← Alembic migration files (managed by Flask-Migrate)
├── instance/
│   └── job_tracker.db      ← SQLite DB (auto-created after upgrade)
├── templates/              ← Jinja2 HTML templates
└── tests/
    ├── test_routes.py
    ├── test_applications.py
    └── test_auth_and_applications.py
```

**Session notes (not runnable — reference files):**  
`S1/S1.py` · `S2/S2.py` · `S3/S3.py` · `S4/S4.py`

---

## 🚀 How to Run

### 1 — Activate the virtual environment

```powershell
cd Flask\job-tracker-flask
venv\Scripts\activate
```

> You should see `(venv)` in your prompt. If not, create one first:
> ```powershell
> python -m venv venv
> venv\Scripts\activate
> pip install -r requirements.txt
> ```

### 2 — Apply database migrations

```powershell
flask db upgrade
```

This runs all Alembic migration scripts and creates `instance/job_tracker.db`.

> **If you get `Error: No such command 'db'`** — Flask-Migrate isn't initialized yet:
> ```powershell
> flask db init       # only once, creates the migrations/ folder
> flask db migrate -m "initial"
> flask db upgrade
> ```

### 3 — Run the app

```powershell
python run.py
```

- API base: [http://127.0.0.1:5000](http://127.0.0.1:5000)

### Running with `flask run` instead

```powershell
# Set the app entry point (PowerShell)
$env:FLASK_APP = "run.py"
$env:FLASK_DEBUG = "1"
flask run
```

---

## 🧪 Running Tests

```powershell
pytest tests/
```

Tests use an in-memory SQLite DB (`TestConfig`) — no setup needed. A single test file:

```powershell
pytest tests/test_routes.py -v
```

---

## 📚 Session Notes Reference

| File | What it explains |
|------|-----------------|
| `S1/S1.py` | Flask vs Django philosophy, WSGI, `Flask(__name__)`, app factory pattern, routing, request object, response tuple |
| `S2/S2.py` | Jinja2 templates, Flask-WTF forms, `validate_on_submit()`, CSRF token, flash messages |
| `S3/S3.py` | JSON APIs, `request.get_json()`, `jsonify()`, Blueprints, centralized error handlers, custom exceptions |
| `S4/S4.py` | Flask-SQLAlchemy setup, models, `db.session.add/commit`, Flask-Migrate, JWT with Flask-JWT-Extended, CORS |

---

## 🔧 Troubleshooting

### Quick fixes

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'flask'` | venv not activated — `venv\Scripts\activate` |
| `Error: No such command 'db'` | Flask-Migrate not initialized — see step 2 above |
| `sqlalchemy.exc.OperationalError: no such table` | Run `flask db upgrade` |
| Port 5000 in use | `python run.py` uses port 5000 by default; edit `app.run(port=5001)` in `run.py` |
| `RuntimeError: Working outside of application context` | You called `db.session` or `current_app` outside of a request or `with app.app_context()` |
| `401 Unauthorized` on protected routes | Pass `Authorization: Bearer <token>` header — get a token from `POST /auth/login` first |

### Framework-specific gotchas

**Circular import — the most common Flask headache**  
Flask extensions (`db`, `jwt`, `migrate`) must live in `extensions.py`, **not** inside `__init__.py` or the factory itself. Models import `db`, and the factory imports models/blueprints — if `db` is inside `__init__.py`, you get a circular import.

```python
# extensions.py  ← correct place
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# app/__init__.py  ← import and bind
from app.extensions import db
def create_app():
    app = Flask(__name__)
    db.init_app(app)      # two-step: create once, bind inside factory
    ...
```

**`db.session` is a unit of work — commit explicitly**  
Unlike Mongoose's `.save()` which hits the DB immediately, SQLAlchemy queues changes in the session. Nothing is written until you call `db.session.commit()`.

```python
obj = Application(company="Acme", status="applied", user_id=1)
db.session.add(obj)   # staged — not yet in DB
db.session.commit()   # NOW it's written
```

**JWT missing `JWT_SECRET_KEY`**  
Flask-JWT-Extended needs `JWT_SECRET_KEY` in your config. It's already set in `config.py` for this project, but if you create a new project and forget it you'll get a `RuntimeError` at startup.

**`request.get_json(silent=True)` vs `request.json`**  
- `request.json` — raises a `400` automatically if the body isn't valid JSON  
- `request.get_json(silent=True)` — returns `None` instead, letting you return your own shaped error  

Use `silent=True` in APIs so all errors look consistent.

**`to_dict()` — SQLAlchemy models are not JSON-serializable**  
You cannot `jsonify(some_model_instance)` directly. Always use the model's `.to_dict()` method (or write a manual dict). This is unlike Django's DRF serializers or FastAPI's Pydantic response models.

**`flask db migrate` misses some changes**  
Alembic's autogeneration misses: column renames (treated as drop + add), some constraint changes, and data migrations. Always **read** the generated migration file before running `flask db upgrade`.

---

## 📖 CRUD Recipe — Flask

> **Entity used:** `Book` (title, author, published_date)

### Step 1 — Define the model

```python
# app/books/models.py
from app.extensions import db
from datetime import datetime, timezone

class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    published_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "published_date": self.published_date.isoformat() if self.published_date else None,
            "created_at": self.created_at.isoformat(),
        }
```

### Step 2 — Run a migration

```powershell
flask db migrate -m "create books table"
flask db upgrade
```

### Step 3 — Create a Blueprint with CRUD routes

```python
# app/books/routes.py
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.books.models import Book

books_bp = Blueprint("books", __name__, url_prefix="/api/books")

# READ — list all
@books_bp.route("", methods=["GET"])
def list_books():
    books = Book.query.order_by(Book.created_at.desc()).all()
    return jsonify([b.to_dict() for b in books]), 200

# READ — single
@books_bp.route("/<int:book_id>", methods=["GET"])
def get_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    return jsonify(book.to_dict()), 200

# CREATE
@books_bp.route("", methods=["POST"])
def create_book():
    data = request.get_json(silent=True)
    if not data or not data.get("title"):
        return jsonify({"error": "title is required"}), 400
    book = Book(title=data["title"], author=data.get("author", "Unknown"))
    db.session.add(book)
    db.session.commit()
    return jsonify(book.to_dict()), 201

# UPDATE
@books_bp.route("/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    data = request.get_json(silent=True) or {}
    book.title = data.get("title", book.title)
    book.author = data.get("author", book.author)
    db.session.commit()
    return jsonify(book.to_dict()), 200

# DELETE
@books_bp.route("/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    book = Book.query.get(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    db.session.delete(book)
    db.session.commit()
    return "", 204
```

### Step 4 — Register the Blueprint in `create_app()`

```python
# app/__init__.py
from app.books.routes import books_bp

def create_app(config_object="config.DevConfig"):
    app = Flask(__name__)
    app.config.from_object(config_object)
    db.init_app(app)
    migrate.init_app(app, db)
    app.register_blueprint(books_bp)   # ← add this
    return app
```

### Step 5 — Test with curl / Postman

```bash
# Create
curl -X POST http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title": "Clean Code", "author": "Martin"}'

# List
curl http://localhost:5000/api/books

# Get one
curl http://localhost:5000/api/books/1

# Update
curl -X PUT http://localhost:5000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Clean Code (2nd Ed)"}'

# Delete
curl -X DELETE http://localhost:5000/api/books/1
```
