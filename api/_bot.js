/* The Chilian sales assistant: quotes standard orders by message in every channel
   (website chat, WhatsApp, Instagram, Messenger) with the same prices as the website,
   sends a payment link for the deposit, and hands bigger or special orders to an advisor.

   botTurn(doc, input, ctx) -> { replies: [{ text, buttons?: [{ id, title }], links?: [{ url, title }] }], handoff?: string }
     doc   the conversation (a request in «Solicitudes»); its doc.bot keeps the state
     input { text?, button? }
     ctx   { canal, lang, payLinks(doc, amount, concept) -> [{ url, title }] }

   Rules (Ajustes → Asistente de ventas; defaults below): quotes up to $6,000 MXN with VAT are
   paid on the spot; above that, licenses, brand programs, full package, complaints or "person"
   go to an advisor. Advisors work Monday to Friday, 9:00–19:00 (Mexico City).
   It only talks about Chilian: products, techniques, prices, times, orders and payments. */
import { prices, quote, TECS, EMB } from "./_pricing.js";
import { getDoc } from "./_lib.js";

export const BOT_DEFAULTS = { activo: { web: false, whatsapp: false, instagram: false, messenger: false }, limite: 6000, anticipo: 50, horario: { dias: [1, 2, 3, 4, 5], desde: 9, hasta: 19 } };
export async function botSettings() {
  const st = await getDoc("ajustes", "asistente").catch(() => null);
  return { ...BOT_DEFAULTS, ...(st || {}), activo: { ...BOT_DEFAULTS.activo, ...(st?.activo || {}) }, horario: { ...BOT_DEFAULTS.horario, ...(st?.horario || {}) } };
}
export function inHours(h, now = new Date()) {
  const mx = new Date(now.getTime() - 6 * 3600e3);   // Mexico City, UTC-6 all year
  return h.dias.includes(mx.getUTCDay()) && mx.getUTCHours() >= h.desde && mx.getUTCHours() < h.hasta;
}
const money = (n) => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const PRODS = [["playera", /playera|camiseta|t-?shirt|tee/], ["sport", /sport|deportiv|jersey|sublimad/], ["sudadera", /sudadera|hoodie|crewneck|sueter/], ["polo", /\bpolo/],
  ["camisa", /camisa|uniforme/], ["gorra", /gorra|cap\b|cachucha/], ["bolsa", /bolsa|tote/], ["propia", /mi prenda|propia|la envio|own garment/]];
const TEC_RX = [["fullprint", /full ?print|sublima/], ["dtg", /\bdtg|digital|foto/], ["embroidery", /bordad|embroider/], ["plastisol", /serigraf|plastisol|screen/]];
const HANDOFF_RX = /asesor|persona|humano|agente|llamar|hablar con|licencia|paquete completo|maquila|programa de|queja|reclamo|factura|human|advisor|license/;

function parse(text, d) {
  const t = norm(text);
  for (const [id, rx] of PRODS) if (rx.test(t)) { d.prod = id; break; }
  for (const [id, rx] of TEC_RX) if (rx.test(t)) { d.tec = id; break; }
  const qty = t.match(/(\d[\d,.]*)\s*(pzas?|piezas?|playeras|sudaderas|polos|camisas|gorras|bolsas|unidades|pcs|pieces|shirts|tees)?/);
  const inks = t.match(/(\d)\s*(tintas?|colou?res|colors?|inks?)/);
  if (inks) d.inks = +inks[1];
  if (qty && (!inks || qty.index !== inks.index)) { const n = parseInt(qty[1].replace(/[,.]/g, ""), 10); if (n >= 1 && n < 1e6 && (qty[2] || !d.qty)) d.qty = n; }
  const where = ["frente", "espalda", "manga", "nuca", "pecho", "front", "back", "sleeve"].filter((w) => t.includes(w)).length;
  if (where) d.locs = Math.min(4, where);
  if (/express|urgente|rapido|rush/.test(t)) d.del = "express";
  for (const k of Object.keys(EMB)) if (t.includes(k)) d.emb = k;
  return d;
}

// Optional: with ANTHROPIC_API_KEY set, free text the patterns don't catch is read by Claude (fields only).
async function extract(text) {
  const key = process.env.ANTHROPIC_API_KEY; if (!key) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.BOT_MODEL || "claude-haiku-5-5", max_tokens: 200, system: "Extract an apparel printing order from the customer's message for Chilian, a Mexican screen printing plant. Reply ONLY with JSON: {\"prod\": one of playera|sport|sudadera|polo|camisa|gorra|bolsa|propia|null, \"qty\": number|null, \"tec\": one of plastisol|dtg|embroidery|fullprint|null, \"inks\": 1-6|null, \"locs\": 1-4|null, \"emb\": chico|mediano|grande|null, \"del\": estandar|express|null, \"handoff\": true if they ask for a person, licensing, brand programs, full package, complaints or anything not about ordering}. Never add text.",
        messages: [{ role: "user", content: String(text).slice(0, 1500) }] }) });
    if (!r.ok) return null;
    const j = await r.json(); const m = (j.content?.[0]?.text || "").match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

export async function botTurn(doc, input, ctx) {
  const st = await botSettings();
  const b = (doc.bot ||= { paso: "inicio", d: {}, lang: ctx.lang || "es" });
  const L = (es, en) => (b.lang === "en" ? en : es);
  if (b.pausado || b.estado === "asesora") return { replies: [] };
  const { P, ejemplo } = await prices();
  const text = input.text || "", btn = input.button || "";
  const out = [];
  const say = (t, buttons, links) => out.push({ text: t, ...(buttons ? { buttons } : {}), ...(links ? { links } : {}) });
  const handoff = (why) => {
    b.estado = "asesora"; b.paso = "asesora";
    const open = inHours(st.horario);
    say(open ? L("Te paso con una asesora de Chilian; te escribe aquí mismo en unos minutos.", "I'm passing you to a Chilian advisor; they'll write to you here in a few minutes.")
      : L("Te paso con una asesora de Chilian. Atienden de lunes a viernes de 9:00 a 19:00; te escribe aquí en cuanto abran.", "I'm passing you to a Chilian advisor. They work Monday to Friday, 9:00–19:00 (Mexico City); they'll write to you here as soon as they're in."));
    return { replies: out, handoff: why };
  };
  if (btn === "asesora" || (text && HANDOFF_RX.test(norm(text)))) return handoff(btn === "asesora" ? "El cliente pidió hablar con una asesora" : "Pidió algo que atiende una asesora: " + text.slice(0, 120));
  if (btn === "reiniciar" || /^(reiniciar|empezar|otra cotizacion|nueva cotizacion|start over)$/.test(norm(text).trim())) { b.paso = "inicio"; b.d = {}; }

  // what the customer said or tapped fills the order
  const d = b.d;
  if (btn.startsWith("prod:")) d.prod = btn.slice(5);
  else if (btn.startsWith("qty:")) d.qty = +btn.slice(4);
  else if (btn.startsWith("tec:")) d.tec = btn.slice(4);
  else if (btn.startsWith("inks:")) d.inks = +btn.slice(5);
  else if (btn.startsWith("emb:")) d.emb = btn.slice(4);
  else if (btn.startsWith("locs:")) d.locs = +btn.slice(5);
  else if (btn.startsWith("del:")) d.del = btn.slice(4);
  else if (/^\s*\d{1,6}\s*$/.test(text) && ["qty", "inks", "locs"].includes(b.paso)) d[b.paso] = parseInt(text, 10);
  else if (text) {
    const before = JSON.stringify(d);
    parse(text, d);
    if (JSON.stringify(d) === before && b.paso !== "inicio") {
      const x = await extract(text);
      if (x?.handoff) return handoff("Pidió algo que atiende una asesora: " + text.slice(0, 120));
      if (x) for (const k of ["prod", "qty", "tec", "inks", "locs", "emb", "del"]) if (x[k] != null) d[k] = x[k];
    }
  }
  if (d.tec === "fullprint") d.prod = "sport";

  if (btn === "pagar" && b.cot) {
    const amount = Math.round(b.cot.totalIva * st.anticipo) / 100;
    const links = await ctx.payLinks(doc, amount, `Anticipo ${st.anticipo}% · ${b.cot.sentence}`);
    if (!links.length) return handoff("Quiso pagar el anticipo y aún no hay pagos en línea conectados");
    b.paso = "pago";
    say(L(`Aquí tu link para pagar el anticipo de ${money(amount)} (${st.anticipo}% de ${money(b.cot.totalIva)} con IVA). Con Mercado Pago puedes pagar con SPEI, OXXO, tarjeta o meses sin intereses. Cuando se acredite te confirmo aquí y te pedimos tu logo para el arte.`,
      `Here is your link to pay the ${st.anticipo}% deposit of ${money(amount)} MXN (of ${money(b.cot.totalIva)} with VAT). Once it clears I'll confirm here and we'll ask for your artwork.`), null, links);
    return { replies: out };
  }

  // ask for what is missing, in order
  const PRODS_BTNS = P.productos.map((p) => ({ id: "prod:" + p.id, title: ((b.lang === "en" ? p.en : p.nombre) || "").replace(/^Playera deportiva Chilian Sport$/, "Chilian Sport (deportiva)").replace(/^Chilian Sport performance tee$/i, "Chilian Sport tee").slice(0, 24) }));
  if (!d.prod) { say(b.paso === "inicio" ? L("¡Hola! Soy el asistente de Chilian. Te cotizo en un minuto. ¿Qué producto necesitas?", "Hi! I'm Chilian's assistant. I'll quote you in a minute. What product do you need?") : L("¿Qué producto necesitas?", "What product do you need?"), PRODS_BTNS); b.paso = "prod"; return { replies: out }; }
  if (!d.qty) { say(L("¿Cuántas piezas?", "How many pieces?"), [50, 100, 300, 500, 1000].map((n) => ({ id: "qty:" + n, title: String(n) }))); b.paso = "qty"; return { replies: out }; }
  const prod = P.productos.find((p) => p.id === d.prod) || P.productos[0];
  if (!d.tec) {
    const opts = [["plastisol", L("Serigrafía", "Screen print")], ["dtg", "DTG"], ["embroidery", L("Bordado", "Embroidery")], ...(prod.fullprint ? [["fullprint", "Full print"]] : [])].filter(([id]) => !(id === "dtg" && prod.nodtg));
    say(L("¿Con qué técnica? Serigrafía para colores sólidos y volumen; DTG para fotos y pocas piezas; bordado para logos en polo, gorra o camisa.", "Which technique? Screen printing for solid colors and volume; DTG for photos and short runs; embroidery for logos on polos, caps or shirts."), opts.map(([id, title]) => ({ id: "tec:" + id, title })));
    b.paso = "tec"; return { replies: out };
  }
  const tec = TECS.find((x) => x.id === d.tec) || TECS[0];
  if (tec.kind === "serigrafia" && !d.inks) { say(L("¿Cuántos colores tiene tu diseño?", "How many colors does your design have?"), [1, 2, 3, 4, 5, 6].map((n) => ({ id: "inks:" + n, title: String(n) }))); b.paso = "inks"; return { replies: out }; }
  if (tec.kind === "bordado" && !d.emb) { say(L("¿De qué tamaño es el bordado?", "How big is the embroidery?"), Object.entries(EMB).map(([id, v]) => ({ id: "emb:" + id, title: `${b.lang === "en" ? v[1] : v[0]} ${v[2]}` }))); b.paso = "emb"; return { replies: out }; }
  if (tec.kind !== "full" && !d.locs) { say(L("¿En cuántos lugares va? Por ejemplo frente, espalda, manga y nuca.", "How many locations? For example front, back, sleeve and back neck."), [1, 2, 3, 4].map((n) => ({ id: "locs:" + n, title: String(n) }))); b.paso = "locs"; return { replies: out }; }
  if (!d.del) { say(L("¿Entrega estándar o express?", "Standard or express delivery?"), [{ id: "del:estandar", title: L("Estándar", "Standard") }, { id: "del:express", title: `Express +${P.express}%` }]); b.paso = "del"; return { replies: out }; }

  // the quote
  const r = quote(P, d, b.lang);
  if (r.err) { say(r.err + " " + L("¿Cambiamos las piezas o la técnica?", "Shall we change the pieces or the technique?"), [{ id: "qty:" + r.min, title: L(`Usar ${r.min} piezas`, `Use ${r.min} pieces`) }, { id: "reiniciar", title: L("Empezar de nuevo", "Start over") }]); delete d.qty; b.paso = "qty"; return { replies: out }; }
  b.cot = { nombre: r.prod.nombre, tecNombre: r.tec.es, sentence: r.sentence, unit: r.unit, total: r.total, totalIva: r.totalIva, days: r.days, fecha: r.date.toISOString().slice(0, 10), d: { ...d } };
  const when = r.date.toLocaleDateString(b.lang === "en" ? "en-US" : "es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" });
  const body = L(`Tu cotización: ${r.sentence}.\n• ${money(r.unit)} por pieza\n• Total ${money(r.total)} más IVA (${money(r.totalIva)} con IVA)\n• Entrega estimada: ${when} (${r.days} días hábiles después de aprobar tu arte)${ejemplo ? "\nPrecio de referencia: tu asesora lo confirma al revisar tu arte." : "\nEl precio final se confirma al revisar tu arte."}`,
    `Your quote: ${r.sentence}.\n• ${money(r.unit)} MXN per piece\n• Total ${money(r.total)} MXN plus VAT (${money(r.totalIva)} with VAT)\n• Estimated delivery: ${when} (${r.days} business days after you approve the artwork)\nFinal price confirmed after reviewing your artwork.`);
  b.paso = "cotizado";
  if (r.totalIva > st.limite) {
    say(body);
    return handoff(`Cotización arriba de ${money(st.limite)}: ${r.sentence} · ${money(r.totalIva)} con IVA`);
  }
  say(body, [{ id: "pagar", title: L(`Pagar anticipo ${st.anticipo}%`, `Pay ${st.anticipo}% deposit`) }, { id: "reiniciar", title: L("Cambiar algo", "Change something") }, { id: "asesora", title: L("Hablar con asesora", "Talk to an advisor") }]);
  return { replies: out };
}
