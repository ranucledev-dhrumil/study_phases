from flask import Flask, jsonify

from .routes import register_routes

from app.applications.routes import applications_bp
from app.auth.routes import auth_bp
from app.applications.models import Application
from app.users.models import User
from app.errors import NotFoundError
from app.extensions import db, jwt, migrate

def create_app(config_object="config.DevConfig"):
    app = Flask(__name__, template_folder="../templates") # app = Flask(__name__) creates an instance of the Flask class
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    register_routes(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(applications_bp)

    @app.errorhandler(NotFoundError)
    def not_found_error(e):
        return jsonify({"error": e.message}), e.status_code
    
    return app