import { API_URL } from "./api-config.js";

export async function apiGet(params) {
  const url = new URL(API_URL);
  Object.keys(params).forEach((key) => url.searchParams.set(key, params[key]));
  const res = await fetch(url);
  return res.json();
}

export async function apiPost(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data)
  });
  return res.json();
}


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
