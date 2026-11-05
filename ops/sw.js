/* Chilian OS service worker: shows push notifications and opens the right screen. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Chilian OS", {
    body: d.body || "", tag: d.tag || undefined, renotify: !!d.tag, icon: "/ops/icon-192.png", badge: "/favicon.png", data: { url: "/ops/" + (d.url || "#avisos") }
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/ops/#avisos";
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = all.find((c) => new URL(c.url).pathname.startsWith("/ops"));
    if (open) { await open.focus(); return open.navigate(url).catch(() => open.postMessage({ go: url })); }
    return self.clients.openWindow(url);
  })());
});
