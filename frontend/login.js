const CUSTOMER_SESSION_KEY = "novacart_customer_session_v1";
const CONFIG = window.NOVACART_CONFIG || {};
const API_BASE_URL = (CONFIG.API_BASE_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function getSession() {
  return JSON.parse(localStorage.getItem(CUSTOMER_SESSION_KEY) || "null");
}

function saveSession(user) {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

function setMessage(message, isError = false) {
  const status = document.getElementById("authMessage");
  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

function showMode(mode) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showLoginButton = document.getElementById("showLoginButton");
  const showRegisterButton = document.getElementById("showRegisterButton");

  const loginActive = mode === "login";
  loginForm.classList.toggle("hidden", !loginActive);
  registerForm.classList.toggle("hidden", loginActive);
  showLoginButton.classList.toggle("active", loginActive);
  showRegisterButton.classList.toggle("active", !loginActive);
  setMessage("");
}

function renderSession() {
  const session = getSession();
  document.getElementById("guestState").classList.toggle("hidden", Boolean(session));
  document.getElementById("signedInState").classList.toggle("hidden", !session);

  if (!session) {
    return;
  }

  document.getElementById("sessionName").textContent = session.name || "-";
  document.getElementById("sessionEmail").textContent = session.email || "-";
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    setMessage("Signing you in...");
    const response = await fetch(apiUrl("/api/users/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.user) {
      throw new Error(data.message || "Could not sign in");
    }

    saveSession(data.user);
    renderSession();
    document.getElementById("loginForm").reset();
    setMessage("Signed in successfully.");
  } catch (error) {
    setMessage(error.message || "Could not sign in", true);
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  try {
    setMessage("Creating your account...");
    const response = await fetch(apiUrl("/api/users/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.user) {
      throw new Error(data.message || "Could not create account");
    }

    saveSession(data.user);
    renderSession();
    document.getElementById("registerForm").reset();
    showMode("login");
    setMessage("Account created and signed in.");
  } catch (error) {
    setMessage(error.message || "Could not create account", true);
  }
}

function logout() {
  clearSession();
  renderSession();
  setMessage("Logged out.");
}

function init() {
  document.getElementById("showLoginButton").addEventListener("click", () => showMode("login"));
  document.getElementById("showRegisterButton").addEventListener("click", () => showMode("register"));
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
  document.getElementById("logoutUserButton").addEventListener("click", logout);
  renderSession();
}

init();
