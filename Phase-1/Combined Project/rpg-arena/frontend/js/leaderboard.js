const API_BASE = "http://127.0.0.1:5000";

document.querySelector("#logoutLink").addEventListener("click", () => {
  localStorage.clear();
});

async function loadLeaderboard() {
  const tbody = document.querySelector("#leaderboardBody");

  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    const data = await res.json();

    tbody.innerHTML = "";
    data.leaderboard.forEach((row) => {
      const tr = document.createElement("tr");

      const cells = [row.username, row.wins, row.losses, row.total_damage];
      cells.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });

      tbody.append(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">Could not load leaderboard.</td></tr>`;
  }
}

async function loadClassStats() {
  const tbody = document.querySelector("#classStatsBody");

  try {
    const res = await fetch(`${API_BASE}/leaderboard/class-stats`);
    const data = await res.json();

    tbody.innerHTML = "";
    data.class_stats.forEach((row) => {
      const tr = document.createElement("tr");

      const cells = [
        row.character_class,
        row.matches_played,
        row.wins,
        row.avg_damage,
        row.best_damage,
      ];
      cells.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });

      tbody.append(tr);
    });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">Could not load class stats.</td></tr>`;
  }
}

loadLeaderboard();
loadClassStats();