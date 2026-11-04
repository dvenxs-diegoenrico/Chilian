/* Instagram Direct → Chilian OS.
   Meta calls this webhook for every DM to the Chilian Instagram account (Instagram API with
   Instagram Login, webhook field "messages"). Each conversation becomes one request in
   «Solicitudes» (canal instagram); later messages join the same thread.

   GET  ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…   Meta verifies the webhook
   GET  ?estado=1                       (admin)  -> what is configured, for the setup panel
   POST (from Meta, signed X-Hub-Signature-256)  -> new messages
   POST { accion: "responder", id, texto }  (signed in)  -> replies from the OS (24 h window)

   Environment (Vercel): IG_VERIFY_TOKEN (any secret string, pasted in Meta),
   IG_APP_SECRET (the Meta app's secret, to check signatures), IG_ACCESS_TOKEN (long-lived token
   of the Instagram professional account, to read usernames and to reply). */
import crypto from "node:crypto";
import { sessionOf, getDoc, saveDoc, getIndex, setIndex, json, fail } from "./_lib.js";

const GRAPH = process.env.IG_GRAPH_URL || "https://graph.instagram.com/v21.0";
const env = (k) => process.env[k] || "";
const clip = (t, n) => String(t ?? "").slice(0, n);

function signed(raw, header) {
  const secret = env("IG_APP_SECRET");
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const want = crypto.createHmac("sha256", secret).update(raw).digest("hex"), got = header.slice(7);
  return want.length === got.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(got));
}
async function profile(igsid) {
  if (!env("IG_ACCESS_TOKEN")) return {};
  try {
    const r = await fetch(`${GRAPH}/${encodeURIComponent(igsid)}?fields=name,username`, { headers: { authorization: "Bearer " + env("IG_ACCESS_TOKEN") } });
    return r.ok ? await r.json() : {};
  } catch { return {}; }
}
const textOf = (m) => m.text || (m.attachments || []).map((a) => `[${a.type === "image" ? "imagen" : a.type || "archivo"}] ${a.payload?.url || ""}`.trim()).join(" ") || (m.is_deleted ? "[mensaje borrado]" : "[mensaje]");

// One message into its conversation's request.
async function intake(ev, ownId) {
  const m = ev.message; if (!m) return;
  const echo = !!m.is_echo || ev.sender?.id === ownId;
  const person = echo ? ev.recipient?.id : ev.sender?.id; if (!person) return;
  const idx = await getIndex("ig", person);
  let doc = idx ? await getDoc("solicitudes", idx.id) : null;
  if (doc && (doc.mensajes || []).some((x) => x.mid && x.mid === m.mid)) return;   // already recorded (our own reply's echo)
  const msg = { mid: clip(m.mid, 200), de: echo ? "chilian" : "cliente", por: echo ? "Instagram (Chilian)" : "", texto: clip(textOf(m), 2000), fecha: new Date(ev.timestamp || Date.now()).toISOString() };
  if (!doc) {
    if (echo) return;   // a conversation we started from the app, with no request yet: nothing to file
    const p = await profile(person), user = p.username ? "@" + p.username : "";
    doc = { estado: "nueva", canal: "instagram", fuente: "instagram", herramientas: [], especifica: false, modelos: [],
      tipo: "", tipoNombre: "Instagram Direct", nombre: p.name || user || "Instagram " + person.slice(-4), empresa: "", contacto: user || "Instagram " + person.slice(-6),
      igId: person, igUser: p.username || "", notas: msg.texto, mensajes: [msg], nuevoMensaje: true, recibida: msg.fecha };
    const saved = await saveDoc("solicitudes", doc, "Instagram");
    await setIndex("ig", person, { id: saved.id });
    return;
  }
  doc.mensajes = [...(doc.mensajes || []), msg].slice(-200);
  if (!echo) { doc.nuevoMensaje = true; doc.ultimoMensaje = msg.fecha; if (doc.estado === "descartada") doc.estado = "nueva"; }
  await saveDoc("solicitudes", doc, "Instagram");
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    if (q.get("hub.mode") === "subscribe") {
      const ok = env("IG_VERIFY_TOKEN") && q.get("hub.verify_token") === env("IG_VERIFY_TOKEN");
      return new Response(ok ? q.get("hub.challenge") || "" : "Token no válido", { status: ok ? 200 : 403 });
    }
    const s = await sessionOf(req);
    if (!s || s.role !== "admin") return json({ error: "Solo la cuenta principal." }, 403);
    return json({ webhook: new URL("/api/instagram", req.url).href, verifyToken: env("IG_VERIFY_TOKEN"), verify: !!env("IG_VERIFY_TOKEN"), secret: !!env("IG_APP_SECRET"), token: !!env("IG_ACCESS_TOKEN") });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const raw = await req.text();
    if (raw.length > 200_000) return json({ error: "Demasiado grande" }, 413);
    let d = {}; try { d = JSON.parse(raw || "{}"); } catch { return json({ error: "JSON no válido" }, 400); }

    if (d.accion === "responder") {
      const s = await sessionOf(req);
      if (!s) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
      if (!env("IG_ACCESS_TOKEN")) return json({ error: "Instagram aún no está conectado (falta IG_ACCESS_TOKEN en Vercel). Responde desde la app de Instagram." }, 400);
      const doc = await getDoc("solicitudes", d.id);
      if (!doc || !doc.igId) return json({ error: "Esta solicitud no viene de Instagram." }, 400);
      const texto = clip(d.texto, 1000).trim(); if (!texto) return json({ error: "Escribe el mensaje." }, 400);
      const r = await fetch(`${GRAPH}/me/messages`, { method: "POST", headers: { authorization: "Bearer " + env("IG_ACCESS_TOKEN"), "content-type": "application/json" }, body: JSON.stringify({ recipient: { id: doc.igId }, message: { text: texto } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return json({ error: "Instagram no aceptó el mensaje: " + (j.error?.message || r.status) + ". Fuera de las 24 h desde el último mensaje del cliente solo se puede responder desde la app." }, 502);
      doc.mensajes = [...(doc.mensajes || []), { mid: clip(j.message_id, 200), de: "chilian", por: s.name, texto, fecha: new Date().toISOString() }].slice(-200);
      doc.nuevoMensaje = false;
      return json({ doc: await saveDoc("solicitudes", doc, s.name) });
    }

    // Webhook from Meta: only signed deliveries are accepted.
    if (!signed(raw, req.headers.get("x-hub-signature-256"))) return new Response("Firma no válida", { status: 401 });
    if (d.object !== "instagram") return new Response("OK");
    for (const entry of d.entry || []) for (const ev of entry.messaging || []) {
      try { await intake(ev, entry.id); } catch (e) { console.error("instagram intake", e); }
    }
    return new Response("EVENT_RECEIVED");
  } catch (e) { return fail(e); }
}
