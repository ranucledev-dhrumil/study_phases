# 1. Flask-SQLAlchemy Setup
# Flask-SQLAlchemy wraps SQLAlchemy (the ORM) with Flask-specific config and lifecycle glue. 
# Same role as Django's ORM, but declared differently — SQLAlchemy models look closer to what you'd hand-roll, and app/db wiring is explicit rather than assumed.

# app/extensions.py
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
# Extensions live in their own module (not inside create_app) specifically to avoid circular imports — models need to import db, and create_app needs to import models' blueprints, so db itself can't live inside __init__.py or you'd get an import loop. This is a very Flask-specific pattern with no direct Django/Express equivalent, since Django's ORM has no separate "extension object" to instantiate.

# app/__init__.py
from app.extensions import db

def create_app(config_object="config.DevConfig"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)

    return app

# db.init_app(app) is the two-step "create, then bind" pattern common to Flask extensions — construct the extension object once at import time, bind it to a specific app instance inside the factory. You'll see this exact shape repeated for JWT and CORS below.

# Config needs the DB URI:
SQLALCHEMY_DATABASE_URI = "sqlite:///job_tracker.db"
SQLALCHEMY_TRACK_MODIFICATIONS = False  # disables a signal system you don't need; silences a warning

# 2. Models
# app/applications/models.py
from app.extensions import db
from datetime import datetime, timezone

class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="applied")
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    notes = db.relationship("Note", backref="application", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "company": self.company,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }

# db.relationship(..., cascade="all, delete-orphan") — deleting an Application deletes its Notes too. Same concept as Mongoose's ref + manual cleanup, or Django's on_delete=CASCADE, just declared on the parent side here instead of the child's foreign key.
# to_dict() — a small but important habit: never jsonify(some_model_instance) directly (SQLAlchemy objects aren't JSON-serializable). Writing a to_dict() method per model is the idiomatic Flask way to control exactly what's exposed — this is where you'd also exclude a hashed password field, for instance.

# 3. Migrations with Flask-Migrate
# app/__init__.py
from flask_migrate import Migrate
migrate = Migrate()
# in create_app: migrate.init_app(app, db)

# Then from the CLI: 
# flask db init, 
# flask db migrate -m "create applications table", 
# flask db upgrade

# Same job as Django's makemigrations/migrate, but Flask doesn't generate them from a magic diff of your whole app automatically — Alembic (what Flask-Migrate wraps) inspects your models vs. the current DB schema and generates a migration script you should always read before applying, since autogeneration misses some changes (e.g. column renames look like drop+add).

# 4. Using the DB in Routes
from app.extensions import db
from app.applications.models import Application

@applications_bp.route("", methods=["POST"])
def create_application():
    data = request.get_json(silent=True)
    if not data or not data.get("company"):
        return jsonify({"error": "company is required"}), 400

    app_obj = Application(company=data["company"], status=data.get("status", "applied"), user_id=1)
    db.session.add(app_obj)
    db.session.commit()

    return jsonify(app_obj.to_dict()), 201

# db.session is a unit of work — you add() staged changes and commit() them together, unlike Mongoose where each .save() hits the DB immediately.
 
# Application.query.get_or_404(app_id) is Flask-SQLAlchemy's built-in shortcut that raises a 404 automatically — though since you already built NotFoundError, you'll likely prefer Application.query.get(app_id) and raise NotFoundError(...) yourself for a consistent JSON error shape, rather than relying on Flask's default 404 page which you already overrode for the route-not-found case but not this model-not-found case.

# 5. JWT Authentication with Flask-JWT-Extended
# # app/extensions.py
from flask_jwt_extended import JWTManager
jwt = JWTManager()
# in create_app: jwt.init_app(app), and JWT_SECRET_KEY in config

from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    hashed = generate_password_hash(data["password"])
    user = User(email=data["email"], password_hash=hashed)
    db.session.add(user)
    db.session.commit()
    return jsonify({"id": user.id}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token}), 200

# werkzeug.security (ships with Flask, no extra install) handles password hashing — never store or compare raw passwords. create_access_token(identity=...) bakes the user id into a signed JWT, same shape as what you did manually with jsonwebtoken in Express, or what Spring Security's JwtEncoder does.

# Protecting a route:
@applications_bp.route("", methods=["GET"])
@jwt_required()
def list_applications():
    user_id = get_jwt_identity()
    apps = Application.query.filter_by(user_id=user_id).all()
    return jsonify([a.to_dict() for a in apps]), 200


# @jwt_required() is a decorator that runs before your view — it checks the Authorization: Bearer <token> header, validates the signature, and makes get_jwt_identity() available. If the header's missing or invalid, it short-circuits with a 401 before your function body even runs.
# Per-user scoping (filter_by(user_id=user_id)) is exactly what your Django version already enforces — same requirement, different syntax.

# 6. CORS
from flask_cors import CORS
# in create_app: 
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
# Scoping CORS to /api/* only (not your Jinja-rendered routes) is deliberate — those aren't meant to be called cross-origin from a JS frontend. Same idea as configuring cors() middleware only on API routers in Express.

# 7. Error Handling Pulled Together
# By this point your errors.py should handle: 404/405/500 (Session 3), NotFoundError (Session 3), and now you'll want a handler for JWT-specific failures — Flask-JWT-Extended has its own error callbacks (@jwt.unauthorized_loader, @jwt.invalid_token_loader) for cases where the built-in 401 body isn't in your API's JSON error shape.
