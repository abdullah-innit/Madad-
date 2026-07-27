import { apiGet, getCurrentUser, clearCurrentUser } from "./api.js";

// The nav here should reflect the PERSON VIEWING the page, not the profile being shown —
// those are two different uids whenever you're looking at someone else's profile.
const viewer = getCurrentUser();
if (viewer) {
  document.getElementById("navProfileLink").innerHTML =
    `<a href="profile.html?uid=${viewer.uid}" class="btn-text">My profile</a>`;
  document.getElementById("navUserName").textContent = viewer.name;
  document.getElementById("navUserPoints").textContent = `${viewer.socialPoints} pts`;
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.style.display = "inline";
  logoutBtn.addEventListener("click", () => {
    clearCurrentUser();
    window.location.href = "index.html";
  });
}

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");
const container = document.getElementById("profileContent");

if (!uid) {
  container.innerHTML = `<p class="no-comments">No profile specified.</p>`;
} else {
  loadProfile(uid);
}

async function loadProfile(uid) {
  // All three of these are independent — no reason to wait for one before starting the next.
  const [user, comments, trust] = await Promise.all([
    apiGet({ action: "getUser", uid }),
    apiGet({ action: "getComments", uid }),
    apiGet({ action: "getDistinctRequesters", uid })
  ]);

  if (user.error) {
    container.innerHTML = `<p class="no-comments">This profile doesn't exist.</p>`;
    return;
  }

  let commentsHtml = "";
  if (!comments.length) {
    commentsHtml = `<p class="no-comments">No comments yet — they show up here once someone confirms and reviews this person's volunteer work.</p>`;
  } else {
    comments.forEach((c) => {
      commentsHtml += `
        <div class="comment-card">
          <p>"${escapeHtml(c.text)}"</p>
          <div class="comment-meta">— ${escapeHtml(c.requesterName)}, on "${escapeHtml(c.requestTitle)}"</div>
        </div>
      `;
    });
  }

  container.innerHTML = `
    <div class="profile-header">
      <h1>${escapeHtml(user.name)}</h1>
      <p class="profile-locality">${escapeHtml(user.locality || "")}</p>
      <div class="profile-stats">
        <div>
          <div class="stat-value">${user.socialPoints || 0}</div>
          <div class="stat-label">Social points</div>
        </div>
        <div>
          <div class="stat-value">${user.requestsHelped || 0}</div>
          <div class="stat-label">Requests helped</div>
        </div>
        <div>
          <div class="stat-value">${trust.distinctRequesters || 0}</div>
          <div class="stat-label">Different people vouched</div>
        </div>
      </div>
    </div>
    <div class="profile-section">
      <h2>What people say</h2>
      ${commentsHtml}
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
