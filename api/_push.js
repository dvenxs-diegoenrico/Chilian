/* Push notifications to the team's phones and computers (Web Push, VAPID).
   Each device that turns notifications on in Chilian OS stores its subscription in
   push/<username>/<key>.json. notify() sends to everyone, to some usernames, or to some names.
   Environment: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…). Without them it does nothing. */
import crypto from "node:crypto";
import webpush from "web-push";
import { readPath, writePath, removePath, listPaths, listUsers, safeUser } from "./_lib.js";

const env = (k) => process.env[k] || "";
let configured = false;
export function pushReady() {
  if (!env("VAPID_PUBLIC_KEY") || !env("VAPID_PRIVATE_KEY")) return false;
  if (!configured) { webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:ventas@grupochilian.com.mx", env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY")); configured = true; }
  return true;
}
const keyOf = (endpoint) => crypto.createHash("sha256").update(String(endpoint)).digest("hex").slice(0, 20);

export async function saveSubscription(username, sub, device = "") {
  if (!sub || typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) throw Object.assign(new Error("Suscripción no válida."), { status: 400 });
  await writePath(`push/${safeUser(username)}/${keyOf(sub.endpoint)}.json`, { sub: { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh), auth: String(sub.keys.auth) } }, device: String(device).slice(0, 120), at: new Date().toISOString() });
}
export async function removeSubscription(username, endpoint) {
  await removePath(`push/${safeUser(username)}/${keyOf(endpoint)}.json`).catch(() => {});
}
export async function devicesOf(username) {
  return (await listPaths(`push/${safeUser(username)}/`)).length;
}

/* to: "all" | { users: [username] } | { names: [name] } ; except: username not to notify (who did it)
   payload: { title, body, url (OS hash like "#tareas"), tag } */
export async function notify(to, payload, { except = "" } = {}) {
  if (!pushReady()) return 0;
  let users = (await listUsers()).filter((u) => u.active !== false && u.username !== except);
  if (to && to.users) users = users.filter((u) => to.users.includes(u.username));
  if (to && to.names) { const want = to.names.filter(Boolean).map((x) => String(x).trim().toLowerCase()); users = users.filter((u) => want.includes(String(u.name || "").trim().toLowerCase()) || want.includes(u.username)); }
  const body = JSON.stringify({ title: String(payload.title || "Chilian OS").slice(0, 120), body: String(payload.body || "").slice(0, 400), url: payload.url || "#avisos", tag: payload.tag || "" });
  let sent = 0;
  await Promise.all(users.map(async (u) => {
    for (const { pathname } of await listPaths(`push/${safeUser(u.username)}/`)) {
      const rec = await readPath(pathname); if (!rec?.sub) continue;
      try { await webpush.sendNotification(rec.sub, body, { TTL: 24 * 3600, urgency: payload.urgent ? "high" : "normal", timeout: 8000 }); sent++; }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await removePath(pathname).catch(() => {}); else console.error("push", e.statusCode || e.message); }
    }
  }));
  return sent;
}
// Never let a notification break the thing that triggered it.
export const notifySafe = (...a) => notify(...a).catch((e) => { console.error("notify", e); return 0; });
