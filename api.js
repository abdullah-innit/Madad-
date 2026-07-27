import { API_URL } from "./api-config.js";

// GET is for reading data — params go in the URL, e.g. ?action=getRequests
export async function apiGet(params) {
  const url = new URL(API_URL);
  Object.keys(params).forEach((key) => url.searchParams.set(key, params[key]));
  const res = await fetch(url);
  return res.json();
}

// POST is for anything that changes data (signup, posting a request, joining, etc).
// Content-Type: text/plain is deliberate — it avoids the browser's CORS "preflight"
// check, which Apps Script's free web apps don't handle well with application/json.
export async function apiPost(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Reads the logged-in user from localStorage — our replacement for Firebase's
// onAuthStateChanged, since there's no backend session to check against.
export function getCurrentUser() {
  const raw = localStorage.getItem("madadUser");
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem("madadUser", JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem("madadUser");
}
