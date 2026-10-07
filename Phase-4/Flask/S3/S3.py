# 1. From Forms to JSON: Validating Raw Request Bodies
# No FlaskForm, no validate_on_submit(). You get the JSON yourself and validate it:

from flask import request, jsonify

@app.route("/api/applications", methods=["POST"])
def create_application():
    data = request.get_json(silent=True)   # None instead of raising, if body isn't valid JSON
    if data is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400

    company = data.get("company")
    if not company:
        return jsonify({"error": "company is required"}), 400

    status = data.get("status", "applied")
    # ... create it
    return jsonify({"company": company, "status": status}), 201

# request.json (property) raises a 400 automatically if the body isn't valid JSON; request.get_json(silent=True) (method) returns None instead, letting you craft your own error response — the difference is control over the error shape, which matters for a consistent API contract
# This manual-dict-checking approach doesn't scale well past a couple of fields — real projects reach for Marshmallow or Pydantic for schema validation (declare fields + rules once, get consistent errors), similar in spirit to how WTForms declared validators on a class, just JSON-shaped instead of form-shaped. We'll keep it manual for this project size, since the earlier WTForms metaphor already got the idea across.

# 2. jsonify vs Returning a Dict
# You already know Flask auto-converts a returned dict to JSON. So why does jsonify() exist?
# jsonify sets the Content-Type: application/json header explicitly and handles things like top-level lists (returning a bare list from a view used to be blocked for security reasons in old Flask, though modern Flask allows it — jsonify sidesteps the question entirely).
# jsonify is the idiomatic, explicit choice when you're also chaining .headers or want it obviously flagged as an API response, especially returning a list: jsonify([...]).
# For a dict with a status code, return {...}, 201 and return jsonify({...}), 201 behave the same — the dict-return shorthand is just newer sugar. In an API-focused project, using jsonify everywhere signals intent clearly, so we'll standardize on it from here on.

# 3. Blueprints — Why and How:
# Right now all your routes live in one routes.py registered directly on app. That doesn't scale once you have applications, notes, auth etc
# Blueprints let you group related routes, register them under a URL prefix, and plug them into the app from the factory.
# app/applications/routes.py
from flask import Blueprint, jsonify, request

applications_bp = Blueprint("applications", __name__, url_prefix="/api/applications")

@applications_bp.route("", methods=["GET"])
def list_applications():
    return jsonify({"applications": []})

@applications_bp.route("/<int:app_id>", methods=["GET"])
def get_application(app_id):
    return jsonify({"id": app_id})

# app/__init__.py
from app.applications.routes import applications_bp

def create_app(config_object="config.DevConfig"):
    app = Flask(__name__)
    app.config.from_object(config_object)

    app.register_blueprint(applications_bp)

    return app

# Notice: the blueprint's own routes are declared without the /api/applications prefix — url_prefix on the Blueprint() constructor supplies that once, centrally. 
# This is directly analogous to Express's Router() mounted with app.use('/api/applications', router), and loosely analogous to a Spring @RequestMapping("/api/applications") at the controller-class level.
# Blueprint("applications", __name__, ...) — that first string is the blueprint's name, used internally for url_for("applications.get_application", app_id=1). This namespacing is why you'll organize by resource: an applications blueprint, a notes blueprint, later an auth blueprint.

# 4. Suggested Project Structure Going Forward
# app
# ├── __init__.py          # create_app, registers all blueprints
# ├── applications/
# │   ├── __init__.py
# │   └── routes.py        # applications_bp
# ├── notes/
# │   ├── __init__.py
# │   └── routes.py        # notes_bp
# └── errors.py            # shared error handlers
# Each resource gets its own package. This mirrors Django's "apps" concept loosely, though Flask blueprints are lighter-weight — no models.py/admin.py convention forced on you, just routes (and later, whichever files you choose to add).

# 5. Centralized Error Handling
# You already used @app.errorhandler(404) in Session 1. 
# For a JSON API, you want every error — 404, 405, 500, and your own custom ones — to return consistent JSON, not Flask's default HTML error page:
# app/errors.py
from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "internal server error"}), 500

# Registered once in create_app, this guarantees no client ever gets an HTML error page from your API by accident — a subtle but real production concern.

# 6. Custom Exceptions for Domain Errors
# For things like "application not found" that you raise deliberately:
class NotFoundError(Exception):
    status_code = 404
    def __init__(self, message):
        self.message = message

@app.errorhandler(NotFoundError)
def handle_not_found(e):
    return jsonify({"error": e.message}), e.status_code
# This lets your view code say raise NotFoundError("Application not found") instead of manually building a jsonify(...), 404 at every call site — a pattern that will matter more once real DB lookups can fail in Session 4.
