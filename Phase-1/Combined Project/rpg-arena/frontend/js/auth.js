const API_BASE = "http://127.0.0.1:5000";

const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  const username = document.querySelector("#loginUsername").value.trim();
  const password = document.querySelector("#loginPassword").value;

  if (!username || !password) {
    loginError.textContent = "Enter both username and password.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || "Login failed.";
      return;
    }

    localStorage.setItem("user_id", data.user.id);
    localStorage.setItem("username", data.user.username);
    window.location.href = "arena.html";

  } catch (err) {
    loginError.textContent = "Could not reach the server.";
  }
});

const signupForm = document.querySelector("#signupForm");
const signupError = document.querySelector("#signupError");

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  signupError.textContent = "";

  const username = document.querySelector("#signupUsername").value.trim();
  const password = document.querySelector("#signupPassword").value;

  if (!username || !password) {
    signupError.textContent = "Enter both username and password.";
    return;
  }

  if (password.length < 6) {
    signupError.textContent = "Password must be at least 6 characters.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      signupError.textContent = data.error || "Signup failed.";
      return;
    }

    signupError.style.color = "var(--success)";
    signupError.textContent = "Account created! You can log in now.";

  } catch (err) {
    signupError.textContent = "Could not reach the server.";
  }
});