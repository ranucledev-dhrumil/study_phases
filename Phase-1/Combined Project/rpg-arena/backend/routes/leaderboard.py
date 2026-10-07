from flask import Blueprint, jsonify

from db.postgres import get_connection

leaderboard_bp = Blueprint("leaderboard", __name__)


@leaderboard_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                u.username,
                COUNT(*) FILTER (WHERE m.result = 'win') AS wins,
                COUNT(*) FILTER (WHERE m.result = 'loss') AS losses,
                COUNT(*) AS total_matches,
                COALESCE(SUM(m.damage_dealt), 0) AS total_damage
            FROM users u
            JOIN matches m ON m.user_id = u.id
            GROUP BY u.username
            ORDER BY wins DESC, total_damage DESC
            LIMIT 10
            """
        )
        rows = cur.fetchall()
        return jsonify({"leaderboard": rows})

    finally:
        cur.close()
        conn.close()

@leaderboard_bp.route("/leaderboard/class-stats", methods=["GET"])
def class_stats():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                character_class,
                COUNT(*) AS matches_played,
                COUNT(*) FILTER (WHERE result = 'win') AS wins,
                ROUND(AVG(damage_dealt), 2) AS avg_damage,
                MAX(damage_dealt) AS best_damage
            FROM matches
            GROUP BY character_class
            ORDER BY avg_damage DESC
            """
        )
        rows = cur.fetchall()
        return jsonify({"class_stats": rows})

    finally:
        cur.close()
        conn.close()