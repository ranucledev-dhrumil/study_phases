from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

from app.users.models import User
from app.extensions import db
from app.errors import NotFoundError

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Invalid Credentials"}), 400

    user_already_exists = User.query.filter_by(email = email).first()
    if user_already_exists:
        return jsonify({"error": "Account already exists"}), 400

    hashed_password = generate_password_hash(password)
    user = User(email = email, password_hash = hashed_password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"id": user.id}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    user = User.query.filter_by(email = data.get("email")).first()

    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return jsonify({"error": "Invalid Credentials"}), 401 

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token}), 200