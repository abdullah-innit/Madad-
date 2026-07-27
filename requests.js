import { apiGet, apiPost, getCurrentUser, setCurrentUser, clearCurrentUser } from "./api.js";

const currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = "index.html";
}

let chosenLat = null;
let chosenLng = null;

document.getElementById("dashUserName").textContent = currentUser.name;
document.getElementById("dashUserPoints").textContent = `${currentUser.socialPoints} pts`;
document.getElementById("dashProfileLink").innerHTML =
  `<a href="profile.html?uid=${currentUser.uid}" class="btn-text">My profile</a>`;

// The localStorage copy is only accurate as of login time — refresh it from the
// server so points earned since then actually show up.
apiGet({ action: "getUser", uid: currentUser.uid }).then((fresh) => {
  if (fresh.error) return;
  currentUser.socialPoints = fresh.socialPoints;
  currentUser.requestsHelped = fresh.requestsHelped;
  setCurrentUser(currentUser);
  document.getElementById("dashUserPoints").textContent = `${fresh.socialPoints} pts`;
});

document.getElementById("dashLogoutBtn").addEventListener("click", () => {
  clearCurrentUser();
  window.location.href = "index.html";
});

// ---------- Map setup ----------
const map = L.map("map").setView([33.6844, 73.0479], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);
let markers = [];
let busy = false; // true while a click's request is still in flight — pauses auto-refresh

// ---------- Geolocation ----------
document.getElementById("getLocationBtn").addEventListener("click", () => {
  const status = document.getElementById("locationStatus");
  status.textContent = "Getting your location...";
  if (!navigator.geolocation) {
    status.textContent = "Your browser doesn't support location.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      chosenLat = position.coords.latitude;
      chosenLng = position.coords.longitude;
      status.textContent = `Location captured (accuracy ~${Math.round(position.coords.accuracy)}m)`;
    },
    () => { status.textContent = "Couldn't get location — check browser permissions."; }
  );
});

// ---------- Post a request ----------
document.getElementById("postRequestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("postError");
  errorEl.textContent = "";

  if (chosenLat === null || chosenLng === null) {
    errorEl.textContent = 'Click "Use my current location" first.';
    return;
  }

  const payload = {
    action: "postRequest",
    title: document.getElementById("reqTitle").value.trim(),
    description: document.getElementById("reqDesc").value.trim(),
    peopleNeeded: parseInt(document.getElementById("reqPeopleNeeded").value, 10),
    pointsPerVolunteer: parseInt(document.getElementById("reqPoints").value, 10),
    lat: chosenLat,
    lng: chosenLng,
    createdBy: currentUser.uid,
    createdByName: currentUser.name
  };

  const submitBtn = document.querySelector("#postRequestForm button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Posting...";
  busy = true;

  const result = await apiPost(payload);

  submitBtn.disabled = false;
  submitBtn.textContent = "Post request";

  if (result.error) {
    errorEl.textContent = result.error;
    busy = false;
    return;
  }
  document.getElementById("postRequestForm").reset();
  chosenLat = null;
  chosenLng = null;
  document.getElementById("locationStatus").textContent = "";
  errorEl.style.color = "var(--forest-light)";
  errorEl.textContent = "✓ Request posted!";
  await loadRequests();
  busy = false;
  setTimeout(() => { errorEl.textContent = ""; errorEl.style.color = ""; }, 3000);
});

// ---------- Browse: fetch + render, with polling since there's no live listener ----------
async function loadRequests() {
  const requests = await apiGet({ action: "getRequests" });
  if (requests.error) {
    console.error(requests.error);
    return;
  }

  const listEl = document.getElementById("requestsList");
  listEl.innerHTML = "";
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  requests.forEach((req) => {
    const joinedCount = req.volunteerDetails ? req.volunteerDetails.length : 0;
    const isFull = joinedCount >= req.peopleNeeded;
    const alreadyJoined = req.volunteerDetails && req.volunteerDetails.some((v) => v.volUid === currentUser.uid);
    const isOwnRequest = req.createdBy === currentUser.uid;

    const item = document.createElement("div");
    item.className = "req-item";
    item.innerHTML = `
      <div class="req-item-top">
        <h3>${escapeHtml(req.title)}</h3>
        <span class="req-points">+${req.pointsPerVolunteer} pts</span>
      </div>
      <p>${escapeHtml(req.description)}</p>
      <div class="req-item-bottom">
        <span class="req-meta">${joinedCount} / ${req.peopleNeeded} volunteers &middot; posted by ${escapeHtml(req.createdByName)}</span>
        ${
          isOwnRequest
            ? `<span class="req-meta">Your request</span>`
            : `<button class="btn-join" data-id="${req.requestId}" ${isFull || alreadyJoined || req.status === "closed" ? "disabled" : ""}>
                ${alreadyJoined ? "You're in" : req.status === "closed" ? "Closed" : isFull ? "Full" : "I'll help"}
              </button>`
        }
      </div>
    `;
    listEl.appendChild(item);

    if (req.lat && req.lng) {
      const marker = L.marker([req.lat, req.lng]).addTo(map);
      marker.bindPopup(`<strong>${escapeHtml(req.title)}</strong><br>${joinedCount}/${req.peopleNeeded} volunteers`);
      markers.push(marker);
    }
  });

  listEl.querySelectorAll(".btn-join").forEach((btn) => {
    btn.addEventListener("click", () => joinRequest(btn.dataset.id, btn));
  });
}

async function joinRequest(requestId, btn) {
  if (busy) return; // already mid-action, ignore extra clicks
  busy = true;
  btn.disabled = true;
  btn.textContent = "Joining...";
  await apiPost({ action: "joinRequest", requestId, volUid: currentUser.uid, volName: currentUser.name });
  await loadRequests();
  busy = false;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadRequests();
setInterval(() => { if (!busy) loadRequests(); }, 6000); // simple polling since Sheets has no real-time listener like Firestore did
