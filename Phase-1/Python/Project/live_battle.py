"""
live_battle.py

Real-time Player vs AI RPG battle.

Controls
--------
SPACE = Basic attack
F     = Special ability
Q     = Quit

Game behavior
-------------
- Difficulty selected once
- Player character selected once
- AI character selected once
- Same characters are used for every round
- Same difficulty is used for every round
- After win/loss, the same battle automatically restarts
- 2 second delay between rounds
- Player attacks/special actions can miss
- AI uses difficulty-aware decision making
- Q exits at any point

Run:
    python live_battle.py

Windows:
    pip install windows-curses
"""

import curses
import random
import time

from main import Warrior, Mage, Healer


# ============================================================
# CONSTANTS
# ============================================================

RESTART_DELAY = 2.0

# Same miss feature used by the RPG Arena battle system.
# Only the player can miss.
PLAYER_MISS_CHANCE = 0.70


# ============================================================
# SPRITES
# ============================================================

SPRITES = {

    "Warrior": [
        r"   O   ",
        r"  /|\  ",
        r"  / \  ",
        r" [###] ",
    ],

    "Mage": [
        r"   ^   ",
        r"  (o)  ",
        r"  /|\  ",
        r"  / \  ",
    ],

    "Healer": [
        r"   +   ",
        r"  (o)  ",
        r"  /|\  ",
        r"  / \  ",
    ],
}


# ============================================================
# DIFFICULTIES
# ============================================================

# These values match the AI difficulty settings from the
# RPG Arena battle.py.
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

        "hp_multiplier": 1.10,
        "attack_multiplier": 1.10,

        "ai_min_cooldown": 1.0,
        "ai_max_cooldown": 1.6,

        "fast_chance": 0.25,

        "mage_spell_chance": 0.75,

        "healer_threshold": 0.55,
    },

    "Hard": {

        "hp_multiplier": 1.25,
        "attack_multiplier": 1.20,

        "ai_min_cooldown": 0.6,
        "ai_max_cooldown": 1.1,

        "fast_chance": 0.40,

        "mage_spell_chance": 0.90,

        "healer_threshold": 0.70,
    },
}


# ============================================================
# DIFFICULTY SELECTION
# ============================================================

def choose_difficulty(stdscr):

    while True:

        stdscr.clear()

        stdscr.addstr(
            1,
            2,
            "Choose difficulty:"
        )

        stdscr.addstr(
            3,
            4,
            "[1] Easy"
        )

        stdscr.addstr(
            4,
            4,
            "[2] Normal"
        )

        stdscr.addstr(
            5,
            4,
            "[3] Hard"
        )

        stdscr.addstr(
            7,
            2,
            "Press 1, 2 or 3"
        )

        stdscr.refresh()

        key = stdscr.getch()

        if key == ord("1"):
            return "Easy"

        elif key == ord("2"):
            return "Normal"

        elif key == ord("3"):
            return "Hard"


# ============================================================
# PLAYER CHARACTER SELECTION
# ============================================================

def create_player(stdscr):

    while True:

        stdscr.clear()

        stdscr.addstr(
            1,
            2,
            "YOU — Choose your class:"
        )

        stdscr.addstr(
            3,
            4,
            "[1] Warrior"
        )

        stdscr.addstr(
            4,
            4,
            "[2] Mage"
        )

        stdscr.addstr(
            5,
            4,
            "[3] Healer"
        )

        stdscr.addstr(
            7,
            2,
            "Press 1, 2 or 3"
        )

        stdscr.refresh()

        key = stdscr.getch()

        if key == ord("1"):

            return Warrior(
                "YOU",
                110,
                15,
                10
            )

        elif key == ord("2"):

            return Mage(
                "YOU",
                100,
                18
            )

        elif key == ord("3"):

            return Healer(
                "YOU",
                120,
                10
            )


# ============================================================
# AI CHARACTER CREATION
# ============================================================

def create_ai(difficulty):

    settings = DIFFICULTIES[difficulty]

    character_type = random.choice(
        [
            "Warrior",
            "Mage",
            "Healer"
        ]
    )

    hp_multiplier = settings[
        "hp_multiplier"
    ]

    attack_multiplier = settings[
        "attack_multiplier"
    ]

    # --------------------------------------------------------
    # WARRIOR
    # --------------------------------------------------------

    if character_type == "Warrior":

        health = int(
            110 * hp_multiplier
        )

        attack = int(
            15 * attack_multiplier
        )

        return Warrior(
            "AI",
            health,
            attack,
            10
        )

    # --------------------------------------------------------
    # MAGE
    # --------------------------------------------------------

    elif character_type == "Mage":

        health = int(
            100 * hp_multiplier
        )

        attack = int(
            18 * attack_multiplier
        )

        return Mage(
            "AI",
            health,
            attack
        )

    # --------------------------------------------------------
    # HEALER
    # --------------------------------------------------------

    else:

        health = int(
            120 * hp_multiplier
        )

        attack = int(
            10 * attack_multiplier
        )

        return Healer(
            "AI",
            health,
            attack
        )


# ============================================================
# RESET CHARACTER
# ============================================================

def reset_character(character):

    # Restore HP

    character.health = character.max_health

    # Restore Mage mana

    if isinstance(
        character,
        Mage
    ):

        character.mana = 50


# ============================================================
# SPRITE
# ============================================================

def sprite_for(character):

    return SPRITES[
        type(character).__name__
    ]


# ============================================================
# HEALTH BAR
# ============================================================

def health_bar(
    current,
    maximum,
    width=20
):

    current = max(
        0,
        current
    )

    ratio = (
        current / maximum
        if maximum
        else 0
    )

    filled = int(
        width * ratio
    )

    return (
        "["
        + "#" * filled
        + "." * (width - filled)
        + "] "
        + f"{int(current)}/{int(maximum)}"
    )


# ============================================================
# DRAW CHARACTER
# ============================================================

def draw_character(
    stdscr,
    y,
    x,
    character,
    flash=False
):

    height, width = (
        stdscr.getmaxyx()
    )

    art = sprite_for(
        character
    )

    # --------------------------------------------------------
    # Sprite
    # --------------------------------------------------------

    for i, line in enumerate(art):

        row = y + i

        if row >= height:
            continue

        if x >= width:
            continue

        try:

            text = line[
                :max(
                    0,
                    width - x
                )
            ]

            if flash:

                stdscr.addstr(
                    row,
                    x,
                    text,
                    curses.A_REVERSE
                )

            else:

                stdscr.addstr(
                    row,
                    x,
                    text
                )

        except curses.error:

            pass

    # --------------------------------------------------------
    # Name
    # --------------------------------------------------------

    name_row = (
        y + len(art)
    )

    if name_row < height:

        try:

            start_x = max(
                0,
                x - 4
            )

            text = (
                f"{character.name:<12}"
            )

            text = text[
                :max(
                    0,
                    width - start_x
                )
            ]

            stdscr.addstr(
                name_row,
                start_x,
                text
            )

        except curses.error:

            pass

    # --------------------------------------------------------
    # Health
    # --------------------------------------------------------

    health_row = (
        y + len(art) + 1
    )

    if health_row < height:

        try:

            start_x = max(
                0,
                x - 4
            )

            bar = health_bar(
                character.health,
                character.max_health
            )

            bar = bar[
                :max(
                    0,
                    width - start_x
                )
            ]

            stdscr.addstr(
                health_row,
                start_x,
                bar
            )

        except curses.error:

            pass


# ============================================================
# MESSAGE
# ============================================================

def draw_message(
    stdscr,
    message
):

    height, width = (
        stdscr.getmaxyx()
    )

    line = height - 3

    if line < 0:
        return

    try:

        stdscr.move(
            line,
            0
        )

        stdscr.clrtoeol()

        stdscr.addstr(
            line,
            2,
            message[
                :max(
                    0,
                    width - 4
                )
            ]
        )

    except curses.error:

        pass


# ============================================================
# HUD
# ============================================================

def draw_hud(
    stdscr,
    player,
    difficulty
):

    height, width = (
        stdscr.getmaxyx()
    )

    if isinstance(
        player,
        Mage
    ):

        special = (
            f"F = Spell "
            f"(Mana {player.mana}/50)"
        )

    elif isinstance(
        player,
        Healer
    ):

        special = "F = Heal"

    else:

        special = "F = Heavy Attack"

    text = (
        f"DIFFICULTY: {difficulty}   "
        f"SPACE = Attack   "
        f"{special}   "
        f"Q = Quit"
    )

    try:

        stdscr.addstr(
            0,
            2,
            text[
                :max(
                    0,
                    width - 4
                )
            ]
        )

    except curses.error:

        pass


# ============================================================
# PLAYER MISS
# ============================================================

def player_missed():

    return (
        random.random()
        < PLAYER_MISS_CHANCE
    )


# ============================================================
# PLAYER ACTION
# ============================================================

def player_action(
    player,
    enemy,
    action
):

    # --------------------------------------------------------
    # Player cannot act if already defeated
    # --------------------------------------------------------

    if not player.is_alive():

        return (
            "YOU are defeated and "
            "cannot act!",
            False
        )

    # --------------------------------------------------------
    # MISS SYSTEM
    #
    # Same behavior as the RPG Arena battle.py:
    # only the player can miss.
    # --------------------------------------------------------

    if player_missed():

        if action == "attack":

            return (
                "YOU swing and miss!",
                False
            )

        elif action == "spell":

            return (
                "YOU cast a spell "
                "but miss!",
                False
            )

        elif action == "heal":

            return (
                "YOU try to heal "
                "but miss!",
                False
            )

    # --------------------------------------------------------
    # BASIC ATTACK
    # --------------------------------------------------------

    if action == "attack":

        player.attack(
            enemy
        )

        return (
            "YOU attack AI!",
            True
        )

    # --------------------------------------------------------
    # MAGE SPELL
    # --------------------------------------------------------

    elif action == "spell":

        if not isinstance(
            player,
            Mage
        ):

            return (
                "YOU cannot cast spells!",
                False
            )

        if player.mana < 20:

            return (
                "Not enough mana!",
                False
            )

        player.cast_spell(
            enemy
        )

        return (
            "YOU cast a spell!",
            True
        )

    # --------------------------------------------------------
    # HEALER
    # --------------------------------------------------------

    elif action == "heal":

        if not isinstance(
            player,
            Healer
        ):

            return (
                "YOU cannot heal!",
                False
            )

        if player.health >= player.max_health:

            return (
                "Already at full health!",
                False
            )

        player.heal(
            15
        )

        return (
            "YOU heal yourself!",
            True
        )

    return (
        "Unknown action!",
        False
    )


# ============================================================
# AI ACTION
# ============================================================

def ai_action(
    enemy,
    player,
    difficulty
):

    settings = DIFFICULTIES[
        difficulty
    ]

    # ========================================================
    # MAGE
    # ========================================================

    if isinstance(
        enemy,
        Mage
    ):

        # ----------------------------------------------------
        # FINISH PLAYER IF POSSIBLE
        # ----------------------------------------------------

        if (
            enemy.mana >= 20
            and player.health
            <= enemy.attack_power * 2
        ):

            enemy.cast_spell(
                player
            )

            return (
                "AI casts a "
                "finishing spell!"
            )

        # ----------------------------------------------------
        # AGGRESSIVE SPELL USAGE
        # ----------------------------------------------------

        if enemy.mana >= 20:

            if random.random() < settings[
                "mage_spell_chance"
            ]:

                enemy.cast_spell(
                    player
                )

                return (
                    "AI casts a spell!"
                )

        # ----------------------------------------------------
        # NORMAL ATTACK
        # ----------------------------------------------------

        enemy.attack(
            player
        )

        return (
            "AI attacks you!"
        )

    # ========================================================
    # HEALER
    # ========================================================

    elif isinstance(
        enemy,
        Healer
    ):

        threshold = settings[
            "healer_threshold"
        ]

        # ----------------------------------------------------
        # HEAL WHEN BELOW DIFFICULTY THRESHOLD
        # ----------------------------------------------------

        if (
            enemy.health
            <= enemy.max_health * threshold
        ):

            enemy.heal(
                15
            )

            return (
                "AI heals itself!"
            )

        # ----------------------------------------------------
        # OTHERWISE ATTACK
        # ----------------------------------------------------

        enemy.attack(
            player
        )

        return (
            "AI attacks you!"
        )

    # ========================================================
    # WARRIOR
    # ========================================================

    elif isinstance(
        enemy,
        Warrior
    ):

        enemy.attack(
            player
        )

        return (
            "AI lands a heavy attack!"
        )

    # ========================================================
    # FALLBACK
    # ========================================================

    enemy.attack(
        player
    )

    return (
        "AI attacks you!"
    )


# ============================================================
# BATTLE END SCREEN
# ============================================================

def battle_finished_screen(
    stdscr,
    message
):

    start_time = time.time()

    while (
        time.time() - start_time
        < RESTART_DELAY
    ):

        stdscr.erase()

        height, width = (
            stdscr.getmaxyx()
        )

        elapsed = (
            time.time()
            - start_time
        )

        remaining = max(
            0,
            int(
                RESTART_DELAY
                - elapsed
            ) + 1
        )

        try:

            title_x = max(
                2,
                width // 2
                - len(message) // 2
            )

            stdscr.addstr(
                max(
                    1,
                    height // 2 - 2
                ),
                title_x,
                message
            )

            text = (
                f"Next round in "
                f"{remaining}..."
            )

            text_x = max(
                2,
                width // 2
                - len(text) // 2
            )

            stdscr.addstr(
                max(
                    2,
                    height // 2
                ),
                text_x,
                text
            )

            stdscr.addstr(
                max(
                    3,
                    height // 2 + 2
                ),
                2,
                "Q = Quit"
            )

        except curses.error:

            pass

        stdscr.refresh()

        key = stdscr.getch()

        if key in (
            ord("q"),
            ord("Q")
        ):

            return "quit"

        time.sleep(
            0.05
        )

    return "restart"


# ============================================================
# SINGLE BATTLE
# ============================================================

def run_battle(
    stdscr,
    player,
    enemy,
    difficulty
):

    settings = DIFFICULTIES[
        difficulty
    ]

    last_ai_action = time.time()

    ai_cooldown = random.uniform(
        settings[
            "ai_min_cooldown"
        ],
        settings[
            "ai_max_cooldown"
        ]
    )

    message = (
        f"Battle start! "
        f"AI is a "
        f"{type(enemy).__name__}."
    )

    player_flash = 0
    enemy_flash = 0

    while True:

        stdscr.erase()

        height, width = (
            stdscr.getmaxyx()
        )

        # ----------------------------------------------------
        # HUD
        # ----------------------------------------------------

        draw_hud(
            stdscr,
            player,
            difficulty
        )

        # ----------------------------------------------------
        # PLAYER
        # ----------------------------------------------------

        draw_character(
            stdscr,
            4,
            max(
                4,
                width // 4 - 4
            ),
            player,
            flash=(
                player_flash > 0
            )
        )

        # ----------------------------------------------------
        # AI
        # ----------------------------------------------------

        draw_character(
            stdscr,
            4,
            max(
                4,
                3 * width // 4 - 4
            ),
            enemy,
            flash=(
                enemy_flash > 0
            )
        )

        # ----------------------------------------------------
        # MESSAGE
        # ----------------------------------------------------

        draw_message(
            stdscr,
            message
        )

        # ----------------------------------------------------
        # FLASH
        # ----------------------------------------------------

        if player_flash > 0:
            player_flash -= 1

        if enemy_flash > 0:
            enemy_flash -= 1

        # ====================================================
        # DEATH CHECK
        # ====================================================

        if not player.is_alive():

            return battle_finished_screen(
                stdscr,
                "YOU LOST!"
            )

        if not enemy.is_alive():

            return battle_finished_screen(
                stdscr,
                "YOU WIN!"
            )

        # ====================================================
        # PLAYER INPUT
        # ====================================================

        key = stdscr.getch()

        # ----------------------------------------------------
        # QUIT
        # ----------------------------------------------------

        if key in (
            ord("q"),
            ord("Q")
        ):

            return "quit"

        # ----------------------------------------------------
        # BASIC ATTACK
        # ----------------------------------------------------

        elif key == ord(" "):

            message, successful = player_action(
                player,
                enemy,
                "attack"
            )

            if successful:
                enemy_flash = 3

        # ----------------------------------------------------
        # SPECIAL
        # ----------------------------------------------------

        elif key in (
            ord("f"),
            ord("F")
        ):

            # ------------------------------------------------
            # Mage
            # ------------------------------------------------

            if isinstance(
                player,
                Mage
            ):

                message, successful = player_action(
                    player,
                    enemy,
                    "spell"
                )

                if successful:
                    enemy_flash = 3

            # ------------------------------------------------
            # Healer
            # ------------------------------------------------

            elif isinstance(
                player,
                Healer
            ):

                message, successful = player_action(
                    player,
                    enemy,
                    "heal"
                )

                if successful:
                    player_flash = 3

            # ------------------------------------------------
            # Warrior
            # ------------------------------------------------

            elif isinstance(
                player,
                Warrior
            ):

                message, successful = player_action(
                    player,
                    enemy,
                    "attack"
                )

                if successful:
                    enemy_flash = 3

        # ====================================================
        # AI TIMER
        # ====================================================

        now = time.time()

        if (
            now - last_ai_action
            >= ai_cooldown
            and enemy.is_alive()
            and player.is_alive()
        ):

            message = ai_action(
                enemy,
                player,
                difficulty
            )

            player_flash = 3

            last_ai_action = now

            # ------------------------------------------------
            # Faster attacks at higher difficulties
            # ------------------------------------------------

            if random.random() < settings[
                "fast_chance"
            ]:

                ai_cooldown = random.uniform(
                    settings[
                        "ai_min_cooldown"
                    ] * 0.65,

                    settings[
                        "ai_max_cooldown"
                    ] * 0.75
                )

            else:

                ai_cooldown = random.uniform(
                    settings[
                        "ai_min_cooldown"
                    ],
                    settings[
                        "ai_max_cooldown"
                    ]
                )

        stdscr.refresh()


# ============================================================
# MAIN GAME
# ============================================================

def run(stdscr):

    curses.curs_set(0)

    # ========================================================
    # SELECT DIFFICULTY ONLY ONCE
    # ========================================================

    difficulty = choose_difficulty(
        stdscr
    )

    # ========================================================
    # SELECT PLAYER ONLY ONCE
    # ========================================================

    player = create_player(
        stdscr
    )

    # ========================================================
    # AI SELECTS CHARACTER ONLY ONCE
    # ========================================================

    stdscr.clear()

    try:

        stdscr.addstr(
            2,
            2,
            "AI is choosing a character..."
        )

    except curses.error:

        pass

    stdscr.refresh()

    time.sleep(
        0.7
    )

    enemy = create_ai(
        difficulty
    )

    # ========================================================
    # SHOW MATCHUP
    # ========================================================

    stdscr.clear()

    try:

        player_type = type(
            player
        ).__name__

        enemy_type = type(
            enemy
        ).__name__

        stdscr.addstr(
            2,
            2,
            f"YOU: {player_type}"
        )

        stdscr.addstr(
            3,
            2,
            f"AI:  {enemy_type}"
        )

        stdscr.addstr(
            5,
            2,
            f"Difficulty: {difficulty}"
        )

        stdscr.addstr(
            7,
            2,
            "Starting battle..."
        )

    except curses.error:

        pass

    stdscr.refresh()

    time.sleep(
        1
    )

    # ========================================================
    # CONTINUOUS ROUNDS
    # ========================================================

    while True:

        # ----------------------------------------------------
        # Reset BOTH characters
        #
        # Same character
        # Same difficulty
        # New round
        # ----------------------------------------------------

        reset_character(
            player
        )

        reset_character(
            enemy
        )

        # ----------------------------------------------------
        # Real-time input
        # ----------------------------------------------------

        stdscr.nodelay(
            True
        )

        stdscr.timeout(
            100
        )

        # ----------------------------------------------------
        # Run one battle
        # ----------------------------------------------------

        result = run_battle(
            stdscr,
            player,
            enemy,
            difficulty
        )

        # ----------------------------------------------------
        # Quit completely
        # ----------------------------------------------------

        if result == "quit":

            break

        # ----------------------------------------------------
        # Otherwise loop automatically
        # after the 2-second delay.
        # ----------------------------------------------------


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    curses.wrapper(
        run
    )   