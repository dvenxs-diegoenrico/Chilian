/* Sales: the website chat, payment links and payment webhooks.
   POST { accion: "chat", sid?, t?, text?, button?, lang?, fuente?, prueba? }   website chat turn (public; t = conversation permit)
   GET  ?accion=chat&sid=…&t=…&desde=N                                          new messages (the page polls while open)
   POST { accion: "link", ref, monto, concepto }  (signed in)                    payment link for a request or a quote
   GET  ?accion=estado  (main account)                                           what is configured
   POST ?webhook=mp | ?webhook=stripe                                            payment confirmations */
import { sessionOf, getDoc, saveDoc, sign, verify, json, fail } from "./_lib.js";
import { botTurn, botSettings, PERFIL_NOMBRE } from "./_bot.js";
import { payLinks, payReady, mpWebhook, stripeWebhook } from "./_pay.js";
import { sendReplies } from "./_channels.js";
import { notifySafe } from "./_push.js";
import { prices, quote } from "./_pricing.js";

const clip = (t, n) => String(t ?? "").slice(0, n);
const baseOf = (req) => { const u = new URL(req.url); return `${u.protocol}//${u.host}`; };
const pub = (m) => ({ de: m.de, texto: m.texto, fecha: m.fecha, botones: m.botones || undefined, links: m.links || undefined, por: m.de === "chilian" ? m.por : undefined });

// One assistant turn on any conversation; saves the messages and tells the team on a hand-off.
export async function assistantTurn(doc, input, { canal, lang, base, send }) {
  const res = await botTurn(doc, input, { canal, lang, payLinks: (d, amount, concept) => payLinks({ ref: d.id, amount, concept, base }) });
  const now = () => new Date().toISOString();
  const ids = send && res.replies.length ? await sendReplies(doc, res.replies) : [];
  res.replies.forEach((r, i) => doc.mensajes.push({ mid: ids[i] || "", de: "bot", por: "Asistente Chilian", texto: r.text, botones: r.buttons, links: r.links, fecha: now() }));
  if (doc.bot?.cot && (!doc.estimados?.[0] || doc.estimados[0].resumen !== doc.bot.cot.sentence)) {
    const c = doc.bot.cot;   // what was quoted: the OS makes the pre-quote from it, at this price
    doc.estimados = [{ producto: c.d.prod, nombre: (c.nombre || c.d.prod) + (c.linea ? ` · línea ${{ basica: "básica", clasica: "clásica", premium: "premium" }[c.linea]}` : ""), piezas: +c.d.qty, tecnica: c.d.tec, tecnicaNombre: c.tecNombre || c.d.tec, tintas: c.d.inks || 0, ubicaciones: c.d.locs || 0, bordado: c.d.emb || "", entrega: c.d.del || "estandar",
      unitario: c.unit, total: c.total, dias: c.days, fechaEstimada: c.fecha, resumen: c.sentence, origen: "asistente" }];
    doc.prenda = c.sentence; doc.piezas = +c.d.qty;
    if (c.linea) doc.estimados[0].linea = c.linea;
    if (c.spec) { doc.estimados[0].especificacion = c.spec; doc.especificacion = c.spec; }
  }
  const bd = doc.bot?.d || {};   // who the customer is and what it is for: the team sees it on the request
  if (bd.perfil) doc.perfilCliente = PERFIL_NOMBRE[bd.perfil] || bd.perfil;
  if (bd.uso) doc.usoCliente = bd.uso;
  if (bd.qty && !doc.piezas) doc.piezas = +bd.qty;   // what they asked for, before the quote
  await rateLead(doc);
  if (res.handoff) { doc.nuevoMensaje = true; doc.estado = doc.estado === "descartada" ? "nueva" : doc.estado; doc.asistente = { pasoAAsesora: res.handoff, fecha: now() }; }
  return res;
}

/* Is this customer worth it? The order's value in USD: the quote when there is one, or the price engine
   on what we know (product and pieces), or Claude's estimate from the signals (company size, recurrence...),
   whichever is higher. At the threshold (Ajustes > Asistente, default 400 USD) the request is marked
   "vale la pena", rises to the top of Solicitudes and the team is notified once. */
export async function rateLead(doc) {
  const st = await botSettings(), b = doc.bot || {}, d = b.d || {}, tc = +st.tipoCambio || 18.5;
  let mxn = b.cot?.total || 0, fuente = b.cot ? "cotización" : "";
  if (!mxn && d.prod && d.qty) {
    try { const { P } = await prices(); const r = quote(P, { tec: "plastisol", inks: 1, locs: 1, del: "estandar", ...d }, "es"); if (r.total) { mxn = r.total; fuente = "estimado"; } } catch {}
  }
  const engineUSD = Math.round(mxn / tc), aiUSD = Math.round(b.leadAI?.valorUSD || 0);
  const valorUSD = Math.max(engineUSD, aiUSD), umbral = +st.umbralUSD || 400, valioso = valorUSD >= umbral;
  const razones = [...(engineUSD ? [`${fuente === "cotización" ? "Cotización" : "Estimado"}: ~$${engineUSD.toLocaleString("en-US")} USD (${d.qty || "?"} pzas)`] : []), ...(b.leadAI?.razones || []), ...(b.leadAI?.recurrente ? ["Podría comprar seguido"] : [])];
  const was = doc.lead?.valioso;
  doc.lead = { valorUSD, valioso, razones: razones.slice(0, 6), recurrente: !!b.leadAI?.recurrente, umbralUSD: umbral, fecha: new Date().toISOString() };
  if (valioso && !was) {
    doc.nuevoMensaje = true;
    await notifySafe("all", { title: `Cliente que vale la pena (~$${valorUSD.toLocaleString("en-US")} USD)`, body: `${doc.nombre || "Cliente"} · ${razones.slice(0, 2).join(" · ")}`.slice(0, 180), url: "#solicitudes", tag: "lead-" + doc.id, urgent: true });
  }
  return doc.lead;
}

async function chatTurn(req, d) {
  const st = await botSettings();
  let doc, permit = d.t ? verify(d.t) : null;
  if (d.sid && permit?.chat === d.sid) doc = await getDoc("solicitudes", d.sid);
  const text = clip(d.text, 1500).trim(), button = clip(d.button, 80);
  const lang = d.lang === "en" || d.lang === "es" ? d.lang : doc?.bot?.lang || doc?.idioma || "es";
  if (!doc) {
    if (!st.activo.web && !d.prueba) return json({ error: "El chat no está activo." }, 403);
    doc = { estado: "nueva", canal: "chat", fuente: clip(d.fuente, 40) || "sitio web", herramientas: ["asistente"], especifica: false, modelos: [], tipo: "", tipoNombre: "Chat del sitio",
      nombre: "Chat del sitio", empresa: "", contacto: "", notas: "", mensajes: [], nuevoMensaje: false, recibida: new Date().toISOString(), idioma: lang, bot: { paso: "inicio", d: {}, lang } };
    doc = await saveDoc("solicitudes", doc, "Chat del sitio");
    permit = { chat: doc.id, exp: Date.now() + 90 * 864e5 }; d.t = sign(permit);   // the page keeps it 90 days
  }
  const before = doc.mensajes.length;
  if (text || button) doc.mensajes.push({ de: "cliente", texto: text || (doc.mensajes.at(-1)?.botones || []).find((b) => b.id === button)?.title || button, boton: button || undefined, fecha: new Date().toISOString() });
  // after a hand-off the next message can be the customer's name and contact
  if (doc.bot?.estado === "asesora" && text && !doc.contactoOk) {
    const phone = text.replace(/[^\d+]/g, ""), mail = (text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [])[0];
    if (phone.replace(/\D/g, "").length >= 10 || mail) {
      doc.contacto = mail || phone; doc.contactoOk = true;
      const name = text.replace(mail || "", "").replace(/[\d+()\-\s]{8,}/g, " ").replace(/\s+/g, " ").trim(); if (name && name.length < 60) doc.nombre = name;
      doc.mensajes.push({ de: "bot", por: "Asistente Chilian", texto: lang === "en" ? "Thanks! Your advisor will contact you there." : "¡Gracias! Tu asesora te contacta ahí.", fecha: new Date().toISOString() });
    }
    doc.nuevoMensaje = true;
  } else if (text || button || !before) {
    const r = await assistantTurn(doc, { text, button }, { canal: "chat", lang, base: baseOf(req), send: false });
    if (r.handoff) {
      if (!doc.contactoOk) doc.mensajes.push({ de: "bot", por: "Asistente Chilian", texto: lang === "en" ? "Leave your name and WhatsApp or email so they can reach you even if you close this page." : "Déjame tu nombre y tu WhatsApp o correo para que te contacte aunque cierres esta página.", fecha: new Date().toISOString() });
      await notifySafe("all", { title: `Chat del sitio: pasa a asesora (${doc.id})`, body: r.handoff, url: "#solicitudes", tag: doc.id, urgent: true });
    } else if (doc.bot?.pausado || doc.bot?.estado === "asesora") doc.nuevoMensaje = true;
  }
  doc.ultimoMensaje = new Date().toISOString();
  doc = await saveDoc("solicitudes", doc, "Chat del sitio");
  return json({ sid: doc.id, t: d.t, mensajes: doc.mensajes.slice(before).map(pub), total: doc.mensajes.length });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    if (q.get("accion") === "chat") {
      const p = verify(q.get("t")), sid = q.get("sid");
      if (!p || p.chat !== sid) return json({ error: "Conversación no válida." }, 401);
      const doc = await getDoc("solicitudes", sid); if (!doc) return json({ error: "No encontramos la conversación." }, 404);
      const from = Math.max(0, parseInt(q.get("desde"), 10) || 0);
      return json({ mensajes: doc.mensajes.slice(from).map(pub), total: doc.mensajes.length });
    }
    if (q.get("accion") === "activo") {   // public: is the website chat on?
      const st = await botSettings();
      return new Response(JSON.stringify({ web: !!st.activo.web }), { headers: { "content-type": "application/json", "cache-control": "public, max-age=60, s-maxage=60" } });
    }
    if (q.get("accion") === "estado") {
      const s = await sessionOf(req); if (!s || s.role !== "admin") return json({ error: "Solo la cuenta principal." }, 403);
      return json({ pagos: payReady(), ia: !!process.env.ANTHROPIC_API_KEY, modelo: process.env.ANTHROPIC_API_KEY ? process.env.BOT_MODEL || "claude-opus-5-5" : "", ajustes: await botSettings(), webhooks: { mp: `${baseOf(req)}/api/venta?webhook=mp`, stripe: `${baseOf(req)}/api/venta?webhook=stripe` } });
    }
    return json({ error: "Acción no válida." }, 400);
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const q = new URL(req.url).searchParams;
    if (q.get("webhook") === "mp") { await mpWebhook(req.url, await req.text()); return new Response("ok"); }
    if (q.get("webhook") === "stripe") { const ok = await stripeWebhook(req.headers.get("stripe-signature"), await req.text()); return new Response(ok ? "ok" : "firma no válida", { status: ok ? 200 : 400 }); }
    const raw = await req.text(); if (raw.length > 20_000) return json({ error: "Demasiado grande" }, 413);
    let d = {}; try { d = JSON.parse(raw || "{}"); } catch { return json({ error: "JSON no válido" }, 400); }
    if (d.accion === "chat") return await chatTurn(req, d);
    if (d.accion === "link") {
      const s = await sessionOf(req); if (!s) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
      const ref = clip(d.ref, 40), monto = +d.monto;
      if (!/^(SOL|COT)-/.test(ref) || !(monto > 0)) return json({ error: "Falta el folio o el monto." }, 400);
      const links = await payLinks({ ref, amount: monto, concept: clip(d.concepto, 200) || `Pago ${ref}`, base: baseOf(req), email: clip(d.correo, 120) });
      if (!links.length) return json({ error: "Aún no hay pagos en línea conectados (faltan las llaves de Mercado Pago o Stripe en Vercel)." }, 400);
      return json({ links });
    }
    return json({ error: "Acción no válida." }, 400);
  } catch (e) { return fail(e); }
}
