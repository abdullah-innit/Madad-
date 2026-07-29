import { apiGet, apiPost, getCurrentUser, clearCurrentUser } from "./api.js";

const currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = "index.html";
}

document.getElementById("navProfileLink").innerHTML =
  `<a href="profile.html?uid=${currentUser.uid}" class="btn-text">My profile</a>`;
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearCurrentUser();
  window.location.href = "index.html";
});

let busy = false; 

async function loadMyRequests() {
  if (busy) return; // don't rebuild the list while an action is mid-flight
  const listEl = document.getElementById("myRequestsList");


  const preservedValues = {};
  let focusedId = null;
  listEl.querySelectorAll(".comment-box input").forEach((inp) => {
    if (inp.value.trim() !== "") preservedValues[inp.id] = inp.value;
    if (document.activeElement === inp) focusedId = inp.id;
  });

  const requests = await apiGet({ action: "getMyRequests", uid: currentUser.uid });

  if (!requests.length) {
    listEl.innerHTML = `<p class="no-volunteers">You haven't posted any requests yet — go do that from the Dashboard.</p>`;
    return;
  }

  listEl.innerHTML = "";
  requests.forEach((req) => {
    const card = document.createElement("div");
    card.className = "owned-request";

    let volunteersHtml = "";
    if (!req.volunteerDetails || req.volunteerDetails.length === 0) {
      volunteersHtml = `<p class="no-volunteers">No volunteers yet.</p>`;
    } else {
      req.volunteerDetails.forEach((vol) => {
        volunteersHtml += `
          <div class="volunteer-row">
            <div class="volunteer-info">
              ${escapeHtml(vol.name)}
              <small>joined ${new Date(vol.joinedAt).toLocaleDateString()}</small>
            </div>
            <div class="volunteer-actions">
              ${
                vol.confirmed
                  ? `<span class="confirmed-tag">✓ Confirmed — points awarded</span>`
                  : `<button class="btn-confirm" data-req="${req.requestId}" data-vol="${vol.volUid}" data-points="${req.pointsPerVolunteer}">Mark attended</button>`
              }
            </div>
            <div class="comment-box">
              <input type="text" placeholder="Leave a comment about their work (optional)" id="comment-${req.requestId}-${vol.volUid}">
              <button data-req="${req.requestId}" data-vol="${vol.volUid}" data-volname="${escapeHtml(vol.name)}" data-title="${escapeHtml(req.title)}" class="btn-save-comment">Save</button>
            </div>
          </div>
        `;
      });
    }

    card.innerHTML = `
      <div class="owned-request-top">
        <h2>${escapeHtml(req.title)}</h2>
        <span class="status-pill ${req.status === "closed" ? "closed" : ""}">${req.status}</span>
      </div>
      <p style="color:var(--gray);font-size:0.9rem;margin-top:0.3rem">${escapeHtml(req.description)}</p>
      <div style="margin-top:0.75rem">${volunteersHtml}</div>
      ${req.status !== "closed" ? `<button class="btn-close-request" data-id="${req.requestId}" style="margin-top:1rem">Close this request</button>` : ""}
    `;
    listEl.appendChild(card);
  });

  listEl.querySelectorAll(".btn-confirm").forEach((btn) => {
    btn.addEventListener("click", () => confirmAttendance(btn.dataset.req, btn.dataset.vol, parseInt(btn.dataset.points, 10), btn));
  });
  listEl.querySelectorAll(".btn-save-comment").forEach((btn) => {
    btn.addEventListener("click", () => saveComment(btn.dataset.req, btn.dataset.vol, btn.dataset.volname, btn.dataset.title, btn));
  });
  listEl.querySelectorAll(".btn-close-request").forEach((btn) => {
    btn.addEventListener("click", () => closeRequest(btn.dataset.id, btn));
  });

  // Put back anything the user was mid-typing, and restore focus + cursor position.
  Object.keys(preservedValues).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = preservedValues[id];
  });
  if (focusedId) {
    const el = document.getElementById(focusedId);
    if (el) {
      el.focus();
      const v = el.value;
      el.value = "";
      el.value = v; // moves cursor to the end instead of jumping to the start
    }
  }
}

async function confirmAttendance(requestId, volUid, points, btn) {
  if (busy) return;
  busy = true;
  btn.disabled = true;
  btn.textContent = "Confirming...";
  await apiPost({ action: "confirmAttendance", requestId, volUid, points });
  busy = false;
  loadMyRequests();
}

async function saveComment(requestId, volUid, volName, requestTitle, btn) {
  const input = document.getElementById(`comment-${requestId}-${volUid}`);
  const text = input.value.trim();
  if (!text) return;

  busy = true;
  btn.disabled = true;
  btn.textContent = "Saving...";

  await apiPost({
    action: "saveComment",
    requestId,
    requesterUid: currentUser.uid,
    requesterName: currentUser.name,
    volunteerUid: volUid,
    volunteerName: volName,
    requestTitle,
    text
  });

  input.value = "";
  input.placeholder = "Comment saved!";
  btn.textContent = "Saved";
  busy = false;
}

async function closeRequest(requestId, btn) {
  if (busy) return;
  busy = true;
  if (btn) { btn.disabled = true; btn.textContent = "Closing..."; }
  await apiPost({ action: "closeRequest", requestId });
  busy = false;
  loadMyRequests();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadMyRequests();
setInterval(loadMyRequests, 6000);
