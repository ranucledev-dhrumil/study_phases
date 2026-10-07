const API_BASE = "http://127.0.0.1:5000";

const userId = localStorage.getItem("user_id");
if (!userId) window.location.href = "index.html";

document.querySelector("#logoutLink").addEventListener("click", () => localStorage.clear());

let battleId = null;
let playerState = null;
let aiState = null;
let battleStatus = "ongoing";
let aiPollTimer = null;
let battleCountdown = 0;
let battleCountdownActive = false;
let battleStarted = false;

// -------- Visual effect state (read by the render loop) --------
let playerFlash = 0;
let aiFlash = 0;
let floatingTexts = []; // { x, y, text, life, color }

const setupCard = document.querySelector("#setupCard");
const battleCard = document.querySelector("#battleCard");
const setupError = document.querySelector("#setupError");

const attackBtn = document.querySelector("#attackBtn");
const spellBtn = document.querySelector("#spellBtn");
const healBtn = document.querySelector("#healBtn");

const canvas = document.querySelector("#arenaCanvas");
const ctx = canvas.getContext("2d");

const arenaWrapper = document.querySelector("#arenaWrapper");
const fullscreenBtn = document.querySelector("#fullscreenBtn");

const quitBattleBtn = document.querySelector("#quitBattleBtn");
const rematchBtn = document.querySelector("#rematchBtn");
const endBattleBtn = document.querySelector("#endBattleBtn");
const battleEndControls = document.querySelector("#battleEndControls");

const battleEndModal = document.querySelector("#battleEndModal");
const battleEndTitle = document.querySelector("#battleEndTitle");
const battleEndMessage = document.querySelector("#battleEndMessage");
const rematchModalBtn = document.querySelector("#rematchModalBtn");
const quitModalBtn = document.querySelector("#quitModalBtn");

function startBattleCountdown() {
    battleCountdownActive = true;
    battleStarted = false;
    battleCountdown = 3;

    const countdownStart = performance.now();

    function countdownFrame(now) {
        const elapsed = (now - countdownStart) / 1000;

        if (elapsed < 1) {
            battleCountdown = 3;

        } else if (elapsed < 2) {
            battleCountdown = 2;

        } else if (elapsed < 3) {
            battleCountdown = 1;

        } else if (elapsed < 3.5) {
            battleCountdown = "FIGHT!";

        } else {
            battleCountdownActive = false;
            battleStarted = true;

            updateActionAvailability();

            // NOW the battle actually begins
            startAiPolling();

            return;
        }

        requestAnimationFrame(countdownFrame);
    }

    requestAnimationFrame(countdownFrame);
}

function blurActiveButton() {
    if (document.activeElement && document.activeElement.tagName === "BUTTON") {
        document.activeElement.blur();
    }
}
// ============================================================
// FULLSCREEN
// ============================================================

fullscreenBtn.addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            await arenaWrapper.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (err) {
        console.error("Fullscreen error:", err);
    }

    blurActiveButton();
});


function resizeCanvas() {
    if (document.fullscreenElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 680;
        canvas.height = 320;
    }
}


document.addEventListener("fullscreenchange", () => {
    resizeCanvas();

    fullscreenBtn.textContent =
        document.fullscreenElement
            ? "Exit Fullscreen"
            : "Fullscreen";

    blurActiveButton();
});


window.addEventListener("resize", () => {
    if (document.fullscreenElement) {
        resizeCanvas();
    }
});

resizeCanvas();

// ============================================================
// START BATTLE
// ============================================================

// ============================================================
// START / REMATCH BATTLE
// ============================================================

async function startBattle({
    playerClass,
    difficulty,
    excludeAiClass = null
}) {
    blurActiveButton();

    setupError.textContent = "";

    try {
        const body = {
            user_id: Number(userId),
            player_class: playerClass,
            player_name: localStorage.getItem("username"),
            difficulty: difficulty,
        };

        // Rematch can tell the backend which AI class
        // should NOT be selected again.
        if (excludeAiClass) {
            body.exclude_ai_class = excludeAiClass;
        }

        const res = await fetch(`${API_BASE}/battle/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            setupError.textContent =
                data.error || "Could not start battle.";
            return false;
        }

        battleId = data.battle_id;
        playerState = data.player;
        aiState = data.ai;
        battleStatus = "ongoing";

        floatingTexts = [];
        playerFlash = 0;
        aiFlash = 0;

        setupCard.style.display = "none";
        battleCard.style.display = "block";

        document.querySelector("#battleLog").innerHTML = "";

        battleEndControls.style.display = "none";

        updateActionAvailability();

        stopAiPolling();

        resizeCanvas();
        requestAnimationFrame(renderLoop);

        startBattleCountdown();

        return true;
        return true;

    } catch (err) {
        console.error(err);
        setupError.textContent = "Could not reach the server.";
        return false;
    }
}


document.querySelector("#startBattleBtn").addEventListener("click", async () => {
    const playerClass =
        document.querySelector("#classSelect").value;

    const difficulty =
        document.querySelector("#difficultySelect").value;

    await startBattle({
        playerClass,
        difficulty
    });
});

// ============================================================
// PLAYER ACTIONS
// ============================================================

async function sendPlayerAction(action) {
    if (
        !battleId ||
        battleStatus !== "ongoing" ||
        battleCountdownActive ||
        !battleStarted
    ) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/battle/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ battle_id: battleId, action }),
        });

        const data = await res.json();
        if (!res.ok) {
            addLogLine(data.error || "Something went wrong.");
            return;
        }

        playerState = data.player;
        aiState = data.ai;
        addLogLine(data.message);

        if (data.damage > 0) {
            spawnFloatingText(aiX(), aiY() - 60, `-${Math.round(data.damage)}`, "#e74c3c");
            aiFlash = 8;
        } else if (action === "heal") {
            spawnFloatingText(playerX(), playerY() - 60, "+15", "#2ecc71");
            playerFlash = 8;
        }

        battleStatus = data.status;
        updateActionAvailability();

        if (battleStatus !== "ongoing") {
            handleBattleEnd();
        }

    } catch (err) {
        addLogLine("Could not reach the server.");
    }
}

attackBtn.addEventListener("click", () => { sendPlayerAction("attack"); blurActiveButton(); });
spellBtn.addEventListener("click", () => { sendPlayerAction("spell"); blurActiveButton(); });
healBtn.addEventListener("click", () => { sendPlayerAction("heal"); blurActiveButton(); });

// ---- Keyboard controls: always prevent default so Space/F never trigger a focused button ----
document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.key.toLowerCase() === "f") {
        event.preventDefault();
        event.stopPropagation();
        blurActiveButton();
    }

    if (
        !battleId ||
        battleStatus !== "ongoing" ||
        battleCountdownActive ||
        !battleStarted
    ) {
        return;
    }

    if (event.code === "Space") {
        sendPlayerAction("attack");
    } else if (event.key.toLowerCase() === "f") {
        const type = playerState?.type;
        if (type === "Mage") sendPlayerAction("spell");
        else if (type === "Healer") sendPlayerAction("heal");
    }
});

// Space can also trigger scroll on keyup in some browsers — block that too
document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
    }
});

function updateActionAvailability() {
    const inactive = battleStatus !== "ongoing";
    attackBtn.disabled = inactive;
    spellBtn.disabled = inactive || playerState.type !== "Mage";
    healBtn.disabled = inactive || playerState.type !== "Healer";
}

// ============================================================
// AI POLLING (real-time — independent of player actions)
// ============================================================

function startAiPolling() {
    aiPollTimer = setInterval(async () => {
        if (!battleId || battleStatus !== "ongoing") return;

        try {
            const res = await fetch(`${API_BASE}/battle/ai-turn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ battle_id: battleId }),
            });
            const data = await res.json();
            if (!res.ok) return;

            if (data.acted) {
                playerState = data.player;
                aiState = data.ai;
                addLogLine(data.message);
                spawnFloatingText(playerX(), playerY() - 60, data.message.includes("heals") ? "+15" : "hit!", "#e74c3c");
                playerFlash = 8;
                updateActionAvailability();
            }

            battleStatus = data.status;

            if (battleStatus !== "ongoing") {
                handleBattleEnd();
            }
        } catch (err) {
            // silent — will retry on next tick
        }
    }, 400);
}

function stopAiPolling() {
    clearInterval(aiPollTimer);
    aiPollTimer = null;
}

function handleBattleEnd() {
    stopAiPolling();

    const won = battleStatus === "win";

    addLogLine(
        won
            ? "🏆 You won the battle!"
            : "💀 You were defeated."
    );

    updateActionAvailability();

    // Show the normal battle-end controls only when
    // we are NOT in fullscreen.
    if (document.fullscreenElement) {
        battleEndControls.style.display = "none";
    } else {
        battleEndControls.style.display = "flex";
    }

    // Configure the modal.
    battleEndTitle.textContent = won
        ? "🏆 You Won!"
        : "💀 You Were Defeated";

    battleEndMessage.textContent = won
        ? "The enemy has been defeated. What do you want to do?"
        : "The battle is over. What do you want to do?";

    // Show modal.
    battleEndModal.classList.add("show");
}

async function startRematch() {
    if (!playerState || !aiState) {
        return;
    }

    blurActiveButton();

    const playerClass = playerState.type.toLowerCase();
    const previousAiClass = aiState.type;

    const difficulty =
        document.querySelector("#difficultySelect").value;

    closeBattleEndModal();

    await startBattle({
        playerClass,
        difficulty,
        excludeAiClass: previousAiClass
    });
}

rematchBtn.addEventListener("click", async () => {
    await startRematch();
});

rematchModalBtn.addEventListener("click", async () => {
    await startRematch();
});

quitModalBtn.addEventListener("click", () => {
    blurActiveButton();
    closeBattleEndModal();
    quitBattle();
});

quitModalBtn.addEventListener("click", () => {
    blurActiveButton();
    closeBattleEndModal();
    quitBattle();
});

quitBattleBtn.addEventListener("click", () => {
    blurActiveButton();
    quitBattle();
});

endBattleBtn.addEventListener("click", () => {
    blurActiveButton();
    quitBattle();
});

function closeBattleEndModal() {
    battleEndModal.classList.remove("show");
}

function quitBattle() {
    closeBattleEndModal();

    stopAiPolling();

    battleId = null;
    battleStatus = "quit";

    playerState = null;
    aiState = null;

    floatingTexts = [];
    playerFlash = 0;
    aiFlash = 0;

    battleEndControls.style.display = "none";

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }

    battleCard.style.display = "none";
    setupCard.style.display = "block";

    setupError.textContent = "";
}
function resetToSetup() {
    stopAiPolling();

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }

    battleCard.style.display = "none";
    setupCard.style.display = "block";

    battleEndControls.style.display = "none";

    battleId = null;
    playerState = null;
    aiState = null;
    battleStatus = "ongoing";

    floatingTexts = [];
    playerFlash = 0;
    aiFlash = 0;
}

function addLogLine(text) {
    const li = document.createElement("li");
    li.textContent = text;
    document.querySelector("#battleLog").prepend(li);
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.0 });
}

// ============================================================
// CANVAS RENDERING
// ============================================================

function playerX() { return canvas.width * 0.28; }
function playerY() { return canvas.height * 0.62; }
function aiX() { return canvas.width * 0.72; }
function aiY() { return canvas.height * 0.62; }

function characterSize() {
    const h = Math.min(canvas.height * 0.32, 220);
    const w = h * 0.72;
    return { w, h };
}

const SPRITE_PATHS = {
    Warrior: "assets/warrior.svg",
    Mage: "assets/mage.svg",
    Healer: "assets/healer.svg",
};

const spriteImages = {};
Object.entries(SPRITE_PATHS).forEach(([type, path]) => {
    const img = new Image();
    img.src = path;
    spriteImages[type] = img;
});

function drawCharacter(x, y, character, flashAmount, facingLeft) {
    if (!character) return;

    const img = spriteImages[character.type];
    const alive = character.alive;
    const { w, h } = characterSize();

    if (flashAmount > 0) {
        ctx.save();
        ctx.globalAlpha = (flashAmount / 8) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = "#ff4d4d";
        ctx.ellipse(x, y - h * 0.35, w * 0.75, h * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alive ? 1 : 0.3;

    const punch = flashAmount > 0 ? 1 + (flashAmount / 8) * 0.08 : 1;

    ctx.translate(x, y);
    ctx.scale((facingLeft ? -1 : 1) * punch, punch);
    if (img.complete) {
        ctx.drawImage(img, -w / 2, -h + h * 0.15, w, h);
    }
    ctx.restore();

    const barWidth = Math.max(70, w * 0.9);
    const labelY = y - h + h * 0.05;

    ctx.fillStyle = "#f0f0f0";
    ctx.font = `${Math.max(12, w * 0.13)}px system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(`${character.name} (${character.type})`, x, labelY);

    const pct = Math.max(0, character.health / character.max_health);
    ctx.fillStyle = "#3a3a44";
    ctx.fillRect(x - barWidth / 2, labelY + 8, barWidth, 8);
    ctx.fillStyle = pct < 0.3 ? "#e74c3c" : "#2ecc71";
    ctx.fillRect(x - barWidth / 2, labelY + 8, barWidth * pct, 8);

    ctx.fillStyle = "#ccc";
    ctx.font = `${Math.max(10, w * 0.11)}px system-ui`;
    ctx.fillText(`${Math.max(0, Math.round(character.health))}/${character.max_health}`, x, labelY + 30);
}

function drawEnvironment() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const groundY = canvas.height * 0.72;
    const groundH = canvas.height * 0.28;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, "#2b2540");
    skyGrad.addColorStop(1, "#463a5e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, groundY);

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGrad.addColorStop(0, "#5a4d70");
    groundGrad.addColorStop(1, "#241f33");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvas.width, groundH);

    [canvas.width * 0.08, canvas.width * 0.92].forEach((x) => {
        const poleTop = groundY - canvas.height * 0.28;
        ctx.fillStyle = "#5a4a6a";
        ctx.fillRect(x - 4, poleTop, 8, groundY - poleTop);
        ctx.beginPath();
        ctx.fillStyle = "#f2a623";
        ctx.arc(x, poleTop - 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.fillStyle = "#f2a623";
        ctx.arc(x, poleTop - 6, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
}

function drawBattleCountdown() {
    if (!battleCountdownActive) {
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();

    // Dark overlay over the entire canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (battleCountdown === "FIGHT!") {
        ctx.font = "900 90px Arial";
    } else {
        ctx.font = "900 140px Arial";
    }

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
        String(battleCountdown),
        centerX,
        centerY
    );

    ctx.restore();
}

function renderLoop() {
    drawEnvironment();
    drawCharacter(playerX(), playerY(), playerState, playerFlash, false);
    drawCharacter(aiX(), aiY(), aiState, aiFlash, true);

    if (playerFlash > 0) playerFlash--;
    if (aiFlash > 0) aiFlash--;

    floatingTexts = floatingTexts.filter((t) => t.life > 0);

    floatingTexts.forEach((t) => {
        ctx.save();
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${Math.max(16, canvas.height * 0.05)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(
            t.text,
            t.x,
            t.y - (1 - t.life) * 40
        );
        ctx.restore();

        t.life -= 0.02;
    });

    // Draw the countdown ON TOP of the entire arena
    if (battleCountdownActive) {
        drawBattleCountdown();
    }

    if (battleId) {
        requestAnimationFrame(renderLoop);
    }
}