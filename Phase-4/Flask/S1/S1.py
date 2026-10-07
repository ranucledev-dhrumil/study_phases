# 1. Flask vs Django — Philosophy

# Django is "batteries-included": ORM, admin, auth, forms, migrations, templating — all built in, with a specific project/app layout and lots of implicit "magic" (makemigrations, middleware, settings.py conventions). You buy into a way of doing things.

# Flask is a microframework: it gives you routing, request/response handling, and a Jinja templating engine — and basically nothing else. Everything you know from Django (ORM, forms, auth, admin) is not there by default — you bring in extensions (Flask-SQLAlchemy, Flask-WTF, Flask-JWT-Extended, etc.) and wire them together yourself. This is deliberate: Flask trusts you to make architectural decisions.

# Compared to Express (which you already know from MERN): Flask is Python's Express
# Same philosophy — minimal core, app.get/app.post-style routing (Flask uses @app.route with methods=[...]), middleware-like hooks (before_request, after_request ≈ Express middleware), and you assemble your own stack. If Express felt "unopinionated and modular," Flask will feel the same way in Python. Django, by contrast, felt like Spring Boot with auto-configuration — Flask is closer to bare Spring MVC where you wire beans yourself, or to Express with no opinions imposed.
# +------------------+-----------------------------+---------------------------+-------------------------+
# | Feature          | Django                      | Flask                     | Express                 |
# +------------------+-----------------------------+---------------------------+-------------------------+
# | ORM              | Built-in                    | Bring your own (SQLAlchemy)| Bring your own (Mongoose)|
# | Auth             | Built-in                    | Bring your own            | Bring your own          |
# | Admin panel      | Built-in                    | None                      | None                    |
# | Routing          | urls.py, centralized        | Decorators, distributed   | Router objects           |
# | Project structure| Enforced (apps)             | Your choice               | Your choice              |
# +------------------+-----------------------------+---------------------------+-------------------------+

# 2. WSGI, the Dev Server, and the App Object

# Flask is a WSGI application — WSGI (Web Server Gateway Interface) is Python's standard contract between web servers and Python web apps, analogous to how Express apps run on Node's HTTP server. In dev, Flask ships its own lightweight server (flask run or app.run()); in production you'd front it with Gunicorn/uWSGI behind Nginx — same story as Express behind Nginx/PM2.

# Everything starts with a Flask app instance:
from flask import Flask

app = Flask(__name__)

@app.route("/")
def index():
    return "Hello, Flask"

if __name__ == "__main__":
    app.run(debug=True)

# __name__ tells Flask where to look for templates/static files relative to. debug=True enables the interactive debugger and auto-reload — never use this in production (same caution as Express's dev-only stack traces).

# 3. The App Factory Pattern
# Instead of a single global app object built at import time (fine for tiny scripts, painful for testing/config-switching), production Flask apps use a factory function:
# app/__init__.py
from flask import Flask

def create_app(config_object="config.DevConfig"):
    app = Flask(__name__)
    app.config.from_object(config_object)
    # from_object(...) can receive a configuration object/class reference, and Flask reads the uppercase configuration attributes from it.

    # register blueprints here later

    return app

# run.py
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)

# Why this matters: you can call create_app("config.TestConfig") in tests with a different DB, avoid import-order issues with blueprints/extensions, and avoid circular imports. This is conceptually similar to how you'd structure an Express app with createApp() returning a configured app instead of mutating a module-level singleton — and loosely analogous to Spring's ApplicationContext being built from config, rather than a hardcoded object graph.

# 4. Config Objects
# config.py
class Config:
    SECRET_KEY = "change-me"
    JSON_SORT_KEYS = False

class DevConfig(Config):
    DEBUG = True

class ProdConfig(Config):
    DEBUG = False

# app.config.from_object(...) loads class attributes into app.config (a dict-like object). You'll later load DB URIs, JWT secrets, etc. this way — same role as Django's settings.py, or .env + process.env in Express, or application.properties in Spring.
# 5. Basic Routing
@app.route("/health")
def health():
    return {"status": "ok"}  # Flask auto-jsonifies plain dicts

@app.route("/applications/<int:app_id>")
def get_application(app_id):
    return {"id": app_id}

@app.route("/search")
def search():
    company = request.args.get("company")  # query param
    return {"company": company}

# <int:app_id> is a converter — Flask supports string (default), int, float, path, uuid. Unlike Django's urls.py (all routes centralized in one file with path() entries) or Express's router.get('/applications/:id', ...) (colon syntax, no built-in type coercion — you parse req.params.id yourself), Flask routes are declared right next to their view function and coerces the type for you automatically, returning a 404 if the conversion fails.

# Query params: request.args.get("company") — like Express's req.query.company.
# Route by method: @app.route("/applications", methods=["GET", "POST"]), then branch on request.method inside, or split into separate functions with the same URL — you'll clean this up with Blueprints and method-specific decorators (@app.get, @app.post, added in Flask 2.0) in Session 3.

# 6. The Request Object
# flask.request is a global-looking but thread-local proxy object representing the current request — no need to pass it as a function param (unlike Express's req which is explicit). It holds .args (query string), .form (form-encoded body), .json (parsed JSON body), .headers, .method, .cookies, etc. This implicit-context style is very different from Express (req passed explicitly to every handler) — closer to how Spring's @RequestParam/@RequestBody injection feels, but done via a proxy rather than annotations.

# 7. Response Handling
# Flask view functions can return:
# A string → 200, text/html
# A dict/list → auto-JSON-serialized (like Express's res.json(), but implicit)
# A tuple (body, status_code) or (body, status_code, headers)
# A Response object (via make_response()) for full control

@app.route("/applications", methods=["POST"])
def create_application():
    return {"id": 1, "company": "Acme"}, 201

# This tuple-return style is Flask-idiomatic and has no direct Express equivalent (Express requires explicit res.status(201).json(...)) — it's more terse, closer to how a Spring controller can return a ResponseEntity<T> but with positional convention instead of a builder.    

# pip freeze  - shows all Python packages currently installed in your active virtual environment, along with their exact versions.
# pip freeze > requirements.txt
# pip install -r requirements.txt
