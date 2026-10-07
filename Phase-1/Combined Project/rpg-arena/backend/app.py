from flask import Flask, jsonify
from flask_cors import CORS

from routes.battle import battle_bp
from routes.auth import auth_bp
from routes.leaderboard import leaderboard_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(battle_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(leaderboard_bp)


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)