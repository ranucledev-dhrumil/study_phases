import random
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request

from models.character import Warrior, Mage, Healer
from db.postgres import get_connection
from db.mongo import get_db

battle_bp = Blueprint("battle", __name__)

battles = {}

CLASS_MAP = {"warrior": Warrior, "mage": Mage, "healer": Healer}

PLAYER_MISS_CHANCE = 0.50  # only the player can miss

DIFFICULTIES = {
    "Easy": {
        "hp_multiplier": 1.00,
        "attack_multiplier": 1.00,
        "ai_min_cooldown": 1.4,
        "ai_max_cooldown": 2.2,
        "fast_chance": 0.10,
        "mage_spell_chance": 0.60,
        "healer_threshold": 0.40,
    },
    "Normal": {
        "hp_multiplier": 1.25,
        "attack_multiplier": 1.10,
        "ai_min_cooldown": 1.0,
        "ai_max_cooldown": 1.6,
        "fast_chance": 0.25,
        "mage_spell_chance": 0.75,
        "healer_threshold": 0.55,
    },
    "Hard": {
        "hp_multiplier": 1.75,
        "attack_multiplier": 1.20,
        "ai_min_cooldown": 0.5,
        "ai_max_cooldown": 0.9,
        "fast_chance": 0.40,
        "mage_spell_chance": 0.90,
        "healer_threshold": 0.70,
    },
}


def create_character(class_name, name):
    cls = CLASS_MAP.get(class_name.lower())
    if cls is None:
        return None
    if cls is Warrior:
        return Warrior(name, 110, 15, 10)
    elif cls is Mage:
        return Mage(name, 100, 18)
    else:
        return Healer(name, 120, 10)

def create_ai(difficulty, exclude_type=None):
    settings = DIFFICULTIES[difficulty]

    available_types = ["Warrior", "Mage", "Healer"]

    if exclude_type:
        available_types = [
            character_type
            for character_type in available_types
            if character_type.lower() != exclude_type.lower()
        ]

    character_type = random.choice(available_types)

    hp_mult = settings["hp_multiplier"]
    atk_mult = settings["attack_multiplier"]

    if character_type == "Warrior":
        return Warrior(
            "AI",
            int(110 * hp_mult),
            int(15 * atk_mult),
            10
        )

    elif character_type == "Mage":
        return Mage(
            "AI",
            int(100 * hp_mult),
            int(18 * atk_mult)
        )

    else:
        return Healer(
            "AI",
            int(120 * hp_mult),
            int(10 * atk_mult)
        )

    
def save_match_result(user_id, character_class, result, damage_dealt):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO matches (user_id, character_class, result, damage_dealt)
               VALUES (%s, %s, %s, %s)""",
            (user_id, character_class, result, damage_dealt)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()


def log_event(battle_id, actor_name, action, message, damage):
    db = get_db()
    db.battle_logs.update_one(
        {"battle_id": battle_id},
        {"$push": {"events": {
            "actor": actor_name, "action": action, "message": message,
            "damage": damage, "timestamp": datetime.utcnow(),
        }}}
    )


def close_battle_log(battle_id, result):
    db = get_db()
    db.battle_logs.update_one(
        {"battle_id": battle_id},
        {"$set": {"result": result, "ended_at": datetime.utcnow()}}
    )


@battle_bp.route("/battle/start", methods=["POST"])
def start_battle():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    player_class = data.get("player_class")
    player_name = data.get("player_name", "YOU")
    difficulty = data.get("difficulty", "Normal")
    exclude_ai_class = data.get("exclude_ai_class")

    if difficulty not in DIFFICULTIES:
        difficulty = "Normal"

    if not user_id or not player_class:
        return jsonify({"error": "user_id and player_class are required"}), 400

    player = create_character(player_class, player_name)
    if player is None:
        return jsonify({"error": f"invalid player_class: {player_class}"}), 400

    ai = create_ai(difficulty, exclude_ai_class)
    battle_id = str(uuid.uuid4())
    settings = DIFFICULTIES[difficulty]

    battles[battle_id] = {
        "player": player,
        "ai": ai,
        "user_id": user_id,
        "class": player_class,
        "difficulty": difficulty,
        "damage_dealt": 0,
        "status": "ongoing",
        "next_ai_action_at": datetime.utcnow().timestamp() + random.uniform(
            settings["ai_min_cooldown"], settings["ai_max_cooldown"]
        ),
    }

    db = get_db()
    db.battle_logs.insert_one({
        "battle_id": battle_id, "user_id": user_id, "player_name": player.name,
        "player_class": player_class, "ai_class": type(ai).__name__,
        "difficulty": difficulty,
        "started_at": datetime.utcnow(), "result": None, "events": [],
    })

    return jsonify({
        "battle_id": battle_id,
        "player": player.to_dict(),
        "ai": ai.to_dict(),
        "status": "ongoing",
        "difficulty": difficulty,
    })


def perform_action(actor, target, action, is_player=False):
    if not actor.is_alive():
        return f"{actor.name} is defeated and cannot act.", 0

    if is_player and random.random() < PLAYER_MISS_CHANCE:
        return f"{actor.name} swings and misses!", 0

    if action == "attack":
        before = target.health
        actor.attack(target)
        return f"{actor.name} attacks {target.name}!", before - target.health

    elif action == "spell":
        if not isinstance(actor, Mage):
            return f"{actor.name} cannot cast spells.", 0
        before = target.health
        damage = actor.cast_spell(target)
        if damage is None:
            return f"{actor.name} doesn't have enough mana!", 0
        return f"{actor.name} casts a spell on {target.name}!", before - target.health

    elif action == "heal":
        if not isinstance(actor, Healer):
            return f"{actor.name} cannot heal.", 0
        actor.heal(15)
        return f"{actor.name} heals themselves!", 0

    return f"Unknown action: {action}", 0


def finish_battle(battle_id, battle, result):
    battle["status"] = result
    save_match_result(battle["user_id"], battle["class"], result, battle["damage_dealt"])
    close_battle_log(battle_id, result)


@battle_bp.route("/battle/action", methods=["POST"])
def player_action():
    data = request.get_json(silent=True) or {}
    battle_id = data.get("battle_id")
    action = data.get("action")

    if not battle_id or battle_id not in battles:
        return jsonify({"error": "invalid or missing battle_id"}), 400

    battle = battles[battle_id]
    if battle["status"] != "ongoing":
        return jsonify({"error": "battle already finished"}), 400

    player, ai = battle["player"], battle["ai"]

    message, damage = perform_action(player, ai, action, is_player=True)
    battle["damage_dealt"] += damage
    log_event(battle_id, player.name, action, message, damage)

    if not ai.is_alive():
        finish_battle(battle_id, battle, "win")

    return jsonify({
        "player": player.to_dict(),
        "ai": ai.to_dict(),
        "message": message,
        "damage": damage,
        "status": battle["status"],
    })


def ai_decide_action(ai, player, difficulty):
    """Mirrors ai_action() from live_battle.py — smart, difficulty-aware AI."""
    settings = DIFFICULTIES[difficulty]

    if isinstance(ai, Mage):
        # Go for the kill if possible
        if ai.mana >= 20 and player.health <= ai.attack_power * 2:
            ai.cast_spell(player)
            return "AI casts a finishing spell!"

        if ai.mana >= 20 and random.random() < settings["mage_spell_chance"]:
            ai.cast_spell(player)
            return "AI casts a spell!"

        ai.attack(player)
        return "AI attacks you!"

    elif isinstance(ai, Healer):
        if ai.health <= ai.max_health * settings["healer_threshold"]:
            ai.heal(15)
            return "AI heals itself!"

        ai.attack(player)
        return "AI attacks you!"

    elif isinstance(ai, Warrior):
        ai.attack(player)
        return "AI lands a heavy attack!"

    ai.attack(player)
    return "AI attacks you!"


@battle_bp.route("/battle/ai-turn", methods=["POST"])
def ai_turn():
    data = request.get_json(silent=True) or {}
    battle_id = data.get("battle_id")

    if not battle_id or battle_id not in battles:
        return jsonify({"error": "invalid or missing battle_id"}), 400

    battle = battles[battle_id]
    if battle["status"] != "ongoing":
        return jsonify({"acted": False, "status": battle["status"]})

    now = datetime.utcnow().timestamp()
    if now < battle["next_ai_action_at"]:
        return jsonify({"acted": False, "status": "ongoing"})

    player, ai = battle["player"], battle["ai"]
    difficulty = battle["difficulty"]
    settings = DIFFICULTIES[difficulty]

    message = ai_decide_action(ai, player, difficulty)
    log_event(battle_id, ai.name, "ai_turn", message, 0)

    # Difficulty-scaled cooldown, with a chance of an extra-fast follow-up (like fast_chance)
    if random.random() < settings["fast_chance"]:
        next_delay = random.uniform(
            settings["ai_min_cooldown"] * 0.65,
            settings["ai_max_cooldown"] * 0.75,
        )
    else:
        next_delay = random.uniform(
            settings["ai_min_cooldown"], settings["ai_max_cooldown"]
        )
    battle["next_ai_action_at"] = now + next_delay

    if not player.is_alive():
        finish_battle(battle_id, battle, "loss")

    return jsonify({
        "acted": True,
        "player": player.to_dict(),
        "ai": ai.to_dict(),
        "message": message,
        "status": battle["status"],
    })


@battle_bp.route("/battle/<battle_id>/state", methods=["GET"])
def get_state(battle_id):
    if battle_id not in battles:
        return jsonify({"error": "battle not found"}), 404
    battle = battles[battle_id]
    return jsonify({
        "player": battle["player"].to_dict(),
        "ai": battle["ai"].to_dict(),
        "status": battle["status"],
    })


def serialize_log(doc):
    doc["_id"] = str(doc["_id"])
    doc["started_at"] = doc["started_at"].isoformat() if doc.get("started_at") else None
    doc["ended_at"] = doc["ended_at"].isoformat() if doc.get("ended_at") else None
    for event in doc.get("events", []):
        event["timestamp"] = event["timestamp"].isoformat()
    return doc


@battle_bp.route("/battle/<battle_id>/log", methods=["GET"])
def get_battle_log(battle_id):
    db = get_db()
    doc = db.battle_logs.find_one({"battle_id": battle_id})
    if not doc:
        return jsonify({"error": "battle log not found"}), 404
    return jsonify(serialize_log(doc))


@battle_bp.route("/battle/logs/high-damage", methods=["GET"])
def high_damage_logs():
    min_damage = int(request.args.get("min_damage", 20))
    db = get_db()
    cursor = db.battle_logs.find({"events.damage": {"$gt": min_damage}}).limit(20)
    results = [serialize_log(doc) for doc in cursor]
    return jsonify({"count": len(results), "logs": results})