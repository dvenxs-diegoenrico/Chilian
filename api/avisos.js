/* Team notifications.
   GET  ?clave=1                         (signed in) -> { publicKey, ready, devices }
   GET  ?resumen=1  (Vercel Cron, Authorization: Bearer CRON_SECRET) -> morning summary to each person
   POST { accion: "suscribir", sub, device } | { accion: "quitar", endpoint } | { accion: "probar" }  (signed in) */
import "../ops/alerts.js";   // defines globalThis.chilianAlerts / chilianDigest (same rules as the app)
import { sessionOf, listDocs, listUsers, json, fail, body } from "./_lib.js";
import { pushReady, saveSubscription, removeSubscription, devicesOf, notify } from "./_push.js";

const env = (k) => process.env[k] || "";
const mxToday = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);   // Mexico City (UTC-6, no DST)

async function morning() {
  const D = {};
  for (const col of ["solicitudes", "cuentas", "oportunidades", "tareas", "cotizaciones", "ots"]) D[col] = await listDocs(col);
  let sent = 0;
  for (const u of (await listUsers()).filter((x) => x.active !== false)) {
    const list = globalThis.chilianAlerts(D, { name: u.name, admin: u.role === "admin" }, { today: mxToday(), scope: "mine" });
    if (!list.length) continue;
    const dg = globalThis.chilianDigest(list);
    sent += await notify({ users: [u.username] }, {
      title: `Buenos días, ${String(u.name || u.username).split(" ")[0]}: ${dg.total} pendiente${dg.total > 1 ? "s" : ""}${dg.urgent ? ` (${dg.urgent} urgente${dg.urgent > 1 ? "s" : ""})` : ""}`,
      body: dg.text, url: "#avisos", tag: "resumen-" + mxToday() });
  }
  return sent;
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    if (q.get("resumen")) {
      if (!env("CRON_SECRET") || req.headers.get("authorization") !== `Bearer ${env("CRON_SECRET")}`) return json({ error: "No autorizado" }, 401);
      return json({ ok: true, sent: await morning() });
    }
    const s = await sessionOf(req);
    if (!s) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
    return json({ publicKey: env("VAPID_PUBLIC_KEY"), ready: pushReady(), devices: await devicesOf(s.u) });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const s = await sessionOf(req);
    if (!s) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
    const d = await body(req, 20_000);
    if (d.accion === "suscribir") { await saveSubscription(s.u, d.sub, d.device); return json({ ok: true, devices: await devicesOf(s.u) }); }
    if (d.accion === "quitar") { await removeSubscription(s.u, d.endpoint); return json({ ok: true, devices: await devicesOf(s.u) }); }
    if (d.accion === "probar") {
      if (!pushReady()) return json({ error: "Faltan las llaves VAPID en Vercel (ver el tutorial)." }, 400);
      const sent = await notify({ users: [s.u] }, { title: "Chilian OS: avisos activados", body: "Así te llegarán las tareas, prospectos y pendientes del equipo.", url: "#avisos", tag: "prueba" });
      return json({ ok: true, sent });
    }
    if (d.accion === "resumen" && s.role === "admin") return json({ ok: true, sent: await morning() });
    return json({ error: "Acción no válida." }, 400);
  } catch (e) { return fail(e); }
}
