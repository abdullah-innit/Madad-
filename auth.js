import { apiGet, apiPost, getCurrentUser, setCurrentUser, clearCurrentUser } from "./api.js";


const overlay = document.getElementById("authOverlay");
const openModal = () => overlay.classList.add("open");
const closeModal = () => overlay.classList.remove("open");

document.getElementById("navLoginBtn").addEventListener("click", () => { showTab("login"); openModal(); });
document.getElementById("navSignupBtn").addEventListener("click", () => { showTab("signup"); openModal(); });
document.getElementById("heroPostBtn").addEventListener("click", () => { showTab("signup"); openModal(); });
document.getElementById("heroBrowseBtn").addEventListener("click", () => { showTab("signup"); openModal(); });
document.getElementById("modalClose").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });


const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function showTab(which) {
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabSignup.classList.toggle("active", !isLogin);
  loginForm.style.display = isLogin ? "block" : "none";
  signupForm.style.display = isLogin ? "none" : "block";
}
tabLogin.addEventListener("click", () => showTab("login"));
tabSignup.addEventListener("click", () => showTab("signup"));

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("signupError");
  errorEl.textContent = "";

  const payload = {
    action: "signup",
    name: document.getElementById("signupName").value.trim(),
    email: document.getElementById("signupEmail").value.trim(),
    password: document.getElementById("signupPassword").value,
    locality: document.getElementById("signupLocality").value.trim()
  };

  const submitBtn = signupForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  const result = await apiPost(payload);

  submitBtn.disabled = false;
  submitBtn.textContent = "Create account";

  if (result.error) {
    errorEl.textContent = result.error;
    return;
  }
  setCurrentUser(result);
  window.location.href = "dashboard.html";
});


loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";

  const payload = {
    action: "login",
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  };

  const submitBtn = loginForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  const result = await apiPost(payload);

  submitBtn.disabled = false;
  submitBtn.textContent = "Log in";

  if (result.error) {
    errorEl.textContent = result.error;
    return;
  }
  setCurrentUser(result);
  window.location.href = "dashboard.html";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearCurrentUser();
  window.location.reload();
});

async function loadHeroRequest() {
  const requests = await apiGet({ action: "getRequests" });
  if (requests.error) return;


  const candidates = requests.filter(
    (r) => r.status === "open" && r.title.trim().length >= 8 && r.description.trim().length >= 15
  );

  if (candidates.length === 0) {
    document.getElementById("heroEmptyCard").style.display = "block";
    return;
  }


  candidates.sort((a, b) => {
    const aVol = a.volunteerDetails ? a.volunteerDetails.length : 0;
    const bVol = b.volunteerDetails ? b.volunteerDetails.length : 0;
    if (bVol !== aVol) return bVol - aVol;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const req = candidates[0];
  const joinedCount = req.volunteerDetails ? req.volunteerDetails.length : 0;
  const pct = Math.min(100, Math.round((joinedCount / req.peopleNeeded) * 100));

  document.getElementById("heroReqMeta").textContent = `📍 ${escapeHtml(req.createdByName)}'s request &middot; ${relativeTime(req.createdAt)}`.replace("&middot;", "·");
  document.getElementById("heroReqPoints").textContent = `+${req.pointsPerVolunteer} pts`;
  document.getElementById("heroReqTitle").textContent = req.title;
  document.getElementById("heroReqDesc").textContent = req.description;
  document.getElementById("heroReqCount").textContent = `${joinedCount} / ${req.peopleNeeded} volunteers`;
  document.getElementById("heroReqFill").style.width = `${pct}%`;
  document.getElementById("heroRequestCard").style.display = "block";
}

function relativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadHeroRequest();
const user = getCurrentUser();
if (user) {
  document.getElementById("signedInName").textContent = user.name;
  document.getElementById("signedInPoints").textContent = user.socialPoints;
  document.getElementById("signedInBanner").style.display = "flex";
}
