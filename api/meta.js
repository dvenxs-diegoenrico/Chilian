/* Meta → Chilian OS: WhatsApp (all the Chilian numbers), Instagram Direct and Facebook Messenger.
   One webhook for the three. Each conversation becomes one request in «Solicitudes»
   (canal whatsapp | instagram | messenger); later messages join the same thread, and the team
   is notified on their phones (Web Push) when a new conversation or an unanswered message arrives.

   GET  ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…   Meta verifies the webhook
   GET  ?estado=1                       (main account) -> what is configured, for Ajustes
   POST (from Meta, signed X-Hub-Signature-256)          -> messages
   POST { accion: "responder", id, texto }  (signed in)  -> reply from the OS (Meta's 24 h window; website chat: stored, the page reads it)
   POST { accion: "asistente", id, activo }  (signed in) -> pause or resume the sales assistant on that conversation

   Environment (Vercel):
     META_VERIFY_TOKEN (or IG_VERIFY_TOKEN)   any secret string, pasted in Meta as "Verify token"
     META_APP_SECRET   (or IG_APP_SECRET)     the Meta app's secret; several apps: separate them with commas
     WA_ACCESS_TOKEN                          system-user token with whatsapp_business_messaging (reply + media)
     IG_ACCESS_TOKEN                          Instagram professional account token (usernames + replies)
     META_PAGE_TOKEN                          Facebook Page token with pages_messaging (Messenger names + replies) */
import crypto from "node:crypto";
import { sessionOf, getDoc, saveDoc, getIndex, setIndex, json, fail } from "./_lib.js";
import { botSettings } from "./_bot.js";
import { assistantTurn } from "./venta.js";

const IG_GRAPH = process.env.IG_GRAPH_URL || "https://graph.instagram.com/v21.0";
const FB_GRAPH = process.env.FB_GRAPH_URL || "https://graph.facebook.com/v21.0";
const env = (k) => process.env[k] || "";
const clip = (t, n) => String(t ?? "").slice(0, n);
const verifyToken = () => env("META_VERIFY_TOKEN") || env("IG_VERIFY_TOKEN");
const secrets = () => [env("META_APP_SECRET"), env("IG_APP_SECRET"), env("WA_APP_SECRET")].join(",").split(",").map((x) => x.trim()).filter(Boolean);

function signed(raw, header) {
  if (!header || !header.startsWith("sha256=")) return false;
  const got = Buffer.from(header.slice(7));
  return secrets().some((secret) => {
    const want = Buffer.from(crypto.createHmac("sha256", secret).update(raw).digest("hex"));
    return want.length === got.length && crypto.timingSafeEqual(want, got);
  });
}
async function getJSON(url, token) {
  try { const r = await fetch(url, { headers: { authorization: "Bearer " + token } }); return r.ok ? await r.json() : {}; } catch { return {}; }
}
const digits = (s) => String(s || "").replace(/\D/g, "");
const fmtPhone = (s) => { const d = digits(s).slice(-10); return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : s; };

/* ---------- one message into its conversation's request ---------- */
// m: { canal, person, mid, text, fecha, echo, name, user, line: { id, numero, linea } }
// The sales assistant answers when it is on for this channel and nobody took the conversation.
// Returns true when it handled the message (the team is told only on a hand-off).
async function assist(doc, m) {
  const st = await botSettings();
  if (!st.activo[m.canal] || doc.bot?.pausado || doc.bot?.estado === "asesora") return false;
  doc.nuevoMensaje = false;
  const r = await assistantTurn(doc, { text: m.button ? "" : m.text, button: m.button || "" }, { canal: m.canal, lang: "es", base: env("SITE_URL") || "https://chilian.vercel.app", send: true });
  await saveDoc("solicitudes", doc, "Asistente Chilian");
  return true;
}

async function file(m) {
  const idxKind = m.canal === "whatsapp" ? "wa" : m.canal === "messenger" ? "fb" : "ig";
  const idxKey = m.canal === "whatsapp" ? `${m.line.id}-${m.person}` : m.person;
  const idx = await getIndex(idxKind, idxKey);
  let doc = idx ? await getDoc("solicitudes", idx.id) : null;
  if (doc && (doc.mensajes || []).some((x) => x.mid && x.mid === m.mid)) return;   // already recorded (our own reply's echo)
  const label = { whatsapp: "WhatsApp", instagram: "Instagram", messenger: "Messenger" }[m.canal];
  const msg = { mid: clip(m.mid, 200), de: m.echo ? "chilian" : "cliente", por: m.echo ? `${label} (Chilian)` : "", texto: clip(m.text, 2000), fecha: m.fecha };
  const where = m.canal === "whatsapp" ? `WhatsApp ${m.line.numero || ""}${m.line.linea ? " (" + m.line.linea + ")" : ""}`.trim() : label;
  if (!doc) {
    if (m.echo) return;   // a conversation we started from the phone with no request yet: nothing to file
    doc = { estado: "nueva", canal: m.canal, fuente: m.canal, herramientas: [], especifica: false, modelos: [],
      tipo: "", tipoNombre: { whatsapp: "WhatsApp", instagram: "Instagram Direct", messenger: "Facebook Messenger" }[m.canal],
      nombre: m.name || m.user || `${label} ${String(m.person).slice(-4)}`, empresa: "", contacto: m.canal === "whatsapp" ? "+" + m.person : m.user || `${label} ${String(m.person).slice(-6)}`,
      notas: msg.texto, mensajes: [msg], nuevoMensaje: true, recibida: msg.fecha,
      ...(m.canal === "instagram" ? { igId: m.person, igUser: m.user || "" } : {}),
      ...(m.canal === "messenger" ? { fbId: m.person } : {}),
      ...(m.canal === "whatsapp" ? { waId: m.person, waLine: m.line.id, whatsapp: { wa: digits(m.line.numero), numero: m.line.numero || "", asesor: m.line.linea || "" } } : {}) };
    let saved = await saveDoc("solicitudes", doc, label);
    await setIndex(idxKind, idxKey, { id: saved.id });
    if (await assist(saved, m)) return;
    return;
  }
  const wasWaiting = !!doc.nuevoMensaje;
  doc.mensajes = [...(doc.mensajes || []), msg].slice(-200);
  if (!m.echo) { doc.nuevoMensaje = true; doc.ultimoMensaje = msg.fecha; if (doc.estado === "descartada") doc.estado = "nueva"; }
  else doc.nuevoMensaje = false;   // answered from the phone
  if (m.name && /^(WhatsApp|Instagram|Messenger) /.test(doc.nombre || "")) doc.nombre = m.name;
  if (m.echo && doc.bot && !doc.bot.pausado) doc.bot.pausado = true;   // someone answered from the phone: the assistant steps back
  doc = await saveDoc("solicitudes", doc, label);
  if (!m.echo && await assist(doc, m)) return;
}

const igText = (m) => m.text || (m.attachments || []).map((a) => `[${a.type === "image" ? "imagen" : a.type || "archivo"}] ${a.payload?.url || ""}`.trim()).join(" ") || (m.is_deleted ? "[mensaje borrado]" : "[mensaje]");
const waText = (x) => x.text?.body || (x.type === "image" ? `[imagen] ${x.image?.caption || ""}` : x.type === "document" ? `[documento] ${x.document?.filename || ""}` : x.type === "audio" ? "[nota de voz]" : x.type === "video" ? `[video] ${x.video?.caption || ""}` : x.type === "location" ? `[ubicación] ${x.location?.latitude},${x.location?.longitude}` : x.type === "button" ? x.button?.text : x.type === "interactive" ? (x.interactive?.button_reply?.title || x.interactive?.list_reply?.title) : x.type === "reaction" ? `[reacción ${x.reaction?.emoji || ""}]` : x.type === "sticker" ? "[sticker]" : `[${x.type || "mensaje"}]`).trim();

async function linesFromSettings() {
  const st = await getDoc("ajustes", "general").catch(() => null);
  return (st?.whatsapps || []).map((w) => ({ wa: digits(w.wa || w.numero), numero: w.numero, linea: w.linea }));
}

async function intake(d) {
  if (d.object === "whatsapp_business_account") {
    const lines = await linesFromSettings();
    for (const entry of d.entry || []) for (const ch of entry.changes || []) {
      const v = ch.value || {}, md = v.metadata || {};
      const known = lines.find((l) => l.wa && digits(md.display_phone_number).endsWith(l.wa.slice(-10)));
      const line = { id: md.phone_number_id || "", numero: known?.numero || fmtPhone(md.display_phone_number), linea: known?.linea || "" };
      const names = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name || ""]));
      for (const x of v.messages || []) await file({ canal: "whatsapp", person: x.from, mid: x.id, text: waText(x), button: x.interactive?.button_reply?.id || x.interactive?.list_reply?.id || x.button?.payload || "", fecha: new Date((+x.timestamp || Date.now() / 1000) * 1000).toISOString(), echo: false, name: names[x.from], line });
      // WhatsApp Business app + Cloud API (coexistence): what the team sends from the phone
      for (const x of v.message_echoes || []) await file({ canal: "whatsapp", person: x.to, mid: x.id, text: waText(x), fecha: new Date((+x.timestamp || Date.now() / 1000) * 1000).toISOString(), echo: true, line });
    }
    return;
  }
  if (d.object === "instagram" || d.object === "page") {
    const canal = d.object === "instagram" ? "instagram" : "messenger";
    for (const entry of d.entry || []) for (const ev of entry.messaging || []) {
      const m = ev.message; if (!m) continue;
      const echo = !!m.is_echo || ev.sender?.id === entry.id, person = echo ? ev.recipient?.id : ev.sender?.id; if (!person) continue;
      let name = "", user = "";
      if (!echo && !(await getIndex(canal === "instagram" ? "ig" : "fb", person))) {
        if (canal === "instagram" && env("IG_ACCESS_TOKEN")) { const p = await getJSON(`${IG_GRAPH}/${encodeURIComponent(person)}?fields=name,username`, env("IG_ACCESS_TOKEN")); name = p.name || ""; user = p.username ? "@" + p.username : ""; }
        if (canal === "messenger" && env("META_PAGE_TOKEN")) { const p = await getJSON(`${FB_GRAPH}/${encodeURIComponent(person)}?fields=first_name,last_name`, env("META_PAGE_TOKEN")); name = [p.first_name, p.last_name].filter(Boolean).join(" "); }
      }
      await file({ canal, person, mid: m.mid, text: igText(m), button: m.quick_reply?.payload || "", fecha: new Date(ev.timestamp || Date.now()).toISOString(), echo, name, user }).catch((e) => console.error("meta intake", e));
    }
  }
}

/* ---------- replies from the OS ---------- */
async function reply(doc, texto) {
  const canal = doc.canal === "whatsapp" || doc.waId ? "whatsapp" : doc.fbId ? "messenger" : "instagram";
  let r;
  if (canal === "whatsapp") {
    if (!env("WA_ACCESS_TOKEN")) throw Object.assign(new Error("WhatsApp aún no está conectado (falta WA_ACCESS_TOKEN en Vercel). Responde desde el teléfono."), { status: 400 });
    r = await fetch(`${FB_GRAPH}/${encodeURIComponent(doc.waLine)}/messages`, { method: "POST", headers: { authorization: "Bearer " + env("WA_ACCESS_TOKEN"), "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: doc.waId, type: "text", text: { body: texto } }) });
  } else if (canal === "messenger") {
    if (!env("META_PAGE_TOKEN")) throw Object.assign(new Error("Messenger aún no está conectado (falta META_PAGE_TOKEN en Vercel). Responde desde Meta Business Suite."), { status: 400 });
    r = await fetch(`${FB_GRAPH}/me/messages`, { method: "POST", headers: { authorization: "Bearer " + env("META_PAGE_TOKEN"), "content-type": "application/json" }, body: JSON.stringify({ recipient: { id: doc.fbId }, messaging_type: "RESPONSE", message: { text: texto } }) });
  } else {
    if (!env("IG_ACCESS_TOKEN")) throw Object.assign(new Error("Instagram aún no está conectado (falta IG_ACCESS_TOKEN en Vercel). Responde desde la app de Instagram."), { status: 400 });
    r = await fetch(`${IG_GRAPH}/me/messages`, { method: "POST", headers: { authorization: "Bearer " + env("IG_ACCESS_TOKEN"), "content-type": "application/json" }, body: JSON.stringify({ recipient: { id: doc.igId }, message: { text: texto } }) });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`Meta no aceptó el mensaje: ${j.error?.message || r.status}. Pasadas 24 h desde el último mensaje del cliente solo se puede escribir desde el teléfono${canal === "whatsapp" ? " o con una plantilla aprobada" : ""}.`), { status: 502 });
  return j.messages?.[0]?.id || j.message_id || "";
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    if (q.get("hub.mode") === "subscribe") {
      const ok = verifyToken() && q.get("hub.verify_token") === verifyToken();
      return new Response(ok ? q.get("hub.challenge") || "" : "Token no válido", { status: ok ? 200 : 403 });
    }
    const s = await sessionOf(req);
    if (!s || s.role !== "admin") return json({ error: "Solo la cuenta principal." }, 403);
    return json({ webhook: new URL("/api/meta", req.url).href, verifyToken: verifyToken(), verify: !!verifyToken(), secret: secrets().length > 0,
      whatsapp: !!env("WA_ACCESS_TOKEN"), token: !!env("IG_ACCESS_TOKEN"), instagram: !!env("IG_ACCESS_TOKEN"), messenger: !!env("META_PAGE_TOKEN"),
      });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const raw = await req.text();
    if (raw.length > 400_000) return json({ error: "Demasiado grande" }, 413);
    let d = {}; try { d = JSON.parse(raw || "{}"); } catch { return json({ error: "JSON no válido" }, 400); }

    if (d.accion === "responder") {
      const s = await sessionOf(req);
      if (!s) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
      const doc = await getDoc("solicitudes", d.id);
      if (!doc || !(doc.igId || doc.fbId || doc.waId || doc.canal === "chat")) return json({ error: "Esta solicitud no viene de WhatsApp, Instagram, Messenger ni del chat del sitio." }, 400);
      const texto = clip(d.texto, 1000).trim(); if (!texto) return json({ error: "Escribe el mensaje." }, 400);
      const mid = doc.canal === "chat" && !(doc.igId || doc.fbId || doc.waId) ? "" : await reply(doc, texto);   // website chat: the page reads it
      doc.mensajes = [...(doc.mensajes || []), { mid: clip(mid, 200), de: "chilian", por: s.name, texto, fecha: new Date().toISOString() }].slice(-200);
      doc.nuevoMensaje = false;
      if (doc.bot) doc.bot = { ...doc.bot, pausado: true };   // a person took over: the assistant stays quiet
      return json({ doc: await saveDoc("solicitudes", doc, s.name) });
    }

    if (d.accion === "asistente") {   // pause or resume the assistant on one conversation
      const s = await sessionOf(req);
      if (!s) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
      const doc = await getDoc("solicitudes", d.id);
      if (!doc) return json({ error: "No encontramos la solicitud." }, 404);
      const on = !!d.activo;
      doc.bot = { ...(doc.bot || { paso: "inicio", d: {} }), pausado: !on, ...(on && doc.bot?.estado === "asesora" ? { estado: "" } : {}) };
      return json({ doc: await saveDoc("solicitudes", doc, s.name) });
    }

    // Webhook from Meta: only signed deliveries are accepted.
    if (!signed(raw, req.headers.get("x-hub-signature-256"))) return new Response("Firma no válida", { status: 401 });
    try { await intake(d); } catch (e) { console.error("meta webhook", e); }
    return new Response("EVENT_RECEIVED");
  } catch (e) { return fail(e); }
}
