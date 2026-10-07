import bcrypt
from flask import Blueprint, jsonify, request

from db.postgres import get_connection

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id FROM users WHERE username = %s",
            (username,)
        )
        if cur.fetchone():
            return jsonify({"error": "username already taken"}), 409

        cur.execute(
            """
            INSERT INTO users (username, password_hash)
            VALUES (%s, %s)
            RETURNING id, username, created_at
            """,
            (username, password_hash.decode("utf-8"))
        )
        new_user = cur.fetchone()
        conn.commit()

        return jsonify({"user": new_user}), 201

    finally:
        cur.close()
        conn.close()


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id, username, password_hash FROM users WHERE username = %s",
            (username,)
        )
        user = cur.fetchone()

        if not user:
            return jsonify({"error": "invalid username or password"}), 401

        stored_hash = user["password_hash"].encode("utf-8")
        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
            return jsonify({"error": "invalid username or password"}), 401

        return jsonify({"user": {"id": user["id"], "username": user["username"]}})

    finally:
        cur.close()
        conn.close() 