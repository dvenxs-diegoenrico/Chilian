/* The life of a chat with the assistant, and what it remembers about the customer.

   · A chat is one request (a quote). Once it has a quote, 24 hours without the customer writing
     close it: the next message starts a NEW chat (a new request) with a clean conversation.
   · What carries over is only the customer's memory: name, company, contact, kind of customer,
     what they asked for before (product, quality, color, technique) and how many quotes they have had.
   · After 72 hours without writing the memory is gone too: the next chat starts from zero.
   · The customer can also close the chat, or start another quote, whenever they want.
   Social channels (WhatsApp, Instagram, Messenger) keep their channel ids (they are how we answer),
   which are not memory; the website chat forgets everything it knew. */
export const H24 = 24 * 3600e3, H72 = 72 * 3600e3;

const GENERICO = /^(Chat del sitio|WhatsApp|Instagram|Messenger|Cliente)(\s|$)/;
export const nombreReal = (n) => (n && !GENERICO.test(String(n).trim()) ? String(n).trim() : "");

// When the customer last wrote (ms). Only chats the assistant has handled age this way.
export const actividad = (doc) => doc.bot?.ultima || Date.parse(doc.ultimoMensaje || doc.recibida || doc.createdAt || "") || 0;

/* "vigente"  keep talking in this chat
   "nuevo"    start a new chat, keeping the customer's memory (closed chat, or 24 h after a quote)
   "olvidar"  start a new chat from zero (72 h without writing) */
export function estadoCiclo(doc, now = Date.now()) {
  if (!doc?.bot) return "vigente";
  const idle = now - actividad(doc);
  if (idle > H72) return "olvidar";
  if (doc.bot.cerrado) return "nuevo";
  if (doc.bot.cotizadoEn && idle > H24) return "nuevo";
  return "vigente";
}

// What we remember of the customer from this chat (and the ones before it).
export function buildMemoria(doc, now = Date.now()) {
  const b = doc.bot || {}, d = b.d || {}, prev = doc.memoria || {};
  const src = b.cot?.d || prev.prefs || {}, prefs = {};
  for (const k of ["prod", "linea", "color", "tec"]) if (src[k]) prefs[k] = src[k];
  const social = !!(doc.waId || doc.igId || doc.fbId);
  return {
    nombre: nombreReal(doc.nombre) || prev.nombre || "",
    empresa: doc.empresa || prev.empresa || "",
    contacto: social || doc.contactoOk ? String(doc.contacto || "") : prev.contacto || "",
    perfil: d.perfil || prev.perfil || "", uso: d.uso || prev.uso || "",
    prefs, cotizaciones: prev.cotizaciones || 0, vista: new Date(now).toISOString()
  };
}

// The next chat of the same customer: same channel, no conversation, memory only if it has not expired.
export function nuevaSolicitud(old, { olvidar = false } = {}, now = Date.now()) {
  const mem = olvidar ? null : buildMemoria(old, now), social = !!(old.waId || old.igId || old.fbId);
  return {
    estado: "nueva", canal: old.canal, fuente: old.fuente, herramientas: ["asistente"], especifica: false, modelos: [], tipo: "", tipoNombre: old.tipoNombre,
    nombre: social ? old.nombre : mem?.nombre || "Chat del sitio", empresa: mem?.empresa || "",
    contacto: social ? old.contacto : mem?.contacto || "", ...(!social && mem?.contacto && mem?.nombre ? { contactoOk: true } : {}),
    notas: "", mensajes: [], nuevoMensaje: false, recibida: new Date(now).toISOString(), idioma: old.idioma,
    anterior: old.id, ciclo: (old.ciclo || 1) + 1,
    ...(old.waId ? { waId: old.waId, waLine: old.waLine, whatsapp: old.whatsapp } : {}),
    ...(old.igId ? { igId: old.igId, igUser: old.igUser || "" } : {}),
    ...(old.fbId ? { fbId: old.fbId } : {}),
    ...(mem ? { memoria: mem } : {}),
    bot: { paso: "inicio", d: {}, lang: old.bot?.lang || old.idioma || "es", ultima: now }
  };
}
