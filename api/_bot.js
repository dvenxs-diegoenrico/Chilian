/* The Chilian sales assistant: quotes standard orders by message in every channel
   (website chat, WhatsApp, Instagram, Messenger) with the same prices as the website,
   sends a payment link for the deposit, and hands bigger or special orders to an advisor.

   botTurn(doc, input, ctx) -> { replies: [{ text, buttons?: [{ id, title }], links?: [{ url, title }] }], handoff?: string }
     doc   the conversation (a request in «Solicitudes»); its doc.bot keeps the state
     input { text?, button? }
     ctx   { canal, lang, payLinks(doc, amount, concept) -> [{ url, title }] }

   Rules (Ajustes → Asistente de ventas; defaults below): quotes up to $7,200 MXN (final total) are
   paid on the spot; above that, licenses, brand programs, full package, complaints or "person"
   go to an advisor. Advisors work Monday to Friday, 9:00–19:00 (Mexico City).
   It only talks about Chilian: products, techniques, prices, times, orders and payments. */
import { prices, quote, TECS, EMB, parseMedida, sizeIdx } from "./_pricing.js";
import { getDoc, listDocs } from "./_lib.js";
import { understand } from "./_ai.js";
import { nombreReal } from "./_ciclo.js";

// The website chat is published by default; the social channels turn on in Ajustes once Meta is connected.
export const BOT_DEFAULTS = { activo: { web: true, whatsapp: false, instagram: false, messenger: false }, limite: 7200, anticipo: 50, umbralUSD: 400, tipoCambio: 18.5, horario: { dias: [1, 2, 3, 4, 5], desde: 9, hasta: 19 } };
export async function botSettings({ strict = false } = {}) {
  const st = await getDoc("ajustes", "asistente").catch((e) => { if (strict) throw e; return null; });
  return { ...BOT_DEFAULTS, ...(st || {}), activo: { ...BOT_DEFAULTS.activo, ...(st?.activo || {}) }, horario: { ...BOT_DEFAULTS.horario, ...(st?.horario || {}) } };
}
export function inHours(h, now = new Date()) {
  const mx = new Date(now.getTime() - 6 * 3600e3);   // Mexico City, UTC-6 all year
  return h.dias.includes(mx.getUTCDay()) && mx.getUTCHours() >= h.desde && mx.getUTCHours() < h.hasta;
}
const money = (n) => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const PRODS = [["mangalarga", /manga larga|long ?sleeve/], ["tiedye", /tie ?dye|tenid|garment.?dyed|lavad/], ["crewneck", /crewneck|crew neck|sudadera (de )?cuello redondo/], ["short", /\bshorts?\b/], ["pants", /\bpants\b|jogger|pantalon deportivo/],
  ["sport", /sport|deportiv|jersey|sublimad/], ["playera", /playera|camiseta|t-?shirt|tee/], ["sudadera", /sudadera|hoodie|crewneck|sueter/], ["polo", /\bpolo/],
  ["camisa", /camisa|uniforme/], ["gorra", /gorra|cap\b|cachucha/], ["bolsa", /bolsa|tote/], ["propia", /mi prenda|propia|la envio|own garment/]];
const TEC_RX = [["fullprint", /full ?print|sublima/], ["dtg", /\bdtg|digital|foto/], ["embroidery", /bordad|embroider/], ["plastisol", /serigraf|plastisol|screen/]];
const HANDOFF_RX = /asesor|persona|humano|agente|llamar|hablar con|licencia|paquete completo|maquila|programa de|queja|reclamo|factura|human|advisor|license/;

function parse(text, d) {
  const t = norm(text);
  for (const [id, rx] of PRODS) if (rx.test(t)) { d.prod = id; break; }
  for (const [id, rx] of TEC_RX) if (rx.test(t)) { d.tec = id; break; }
  const qty = t.match(/(\d[\d,.]*)\s*(pzas?|piezas?|playeras|sudaderas|polos|camisas|gorras|bolsas|unidades|pcs|pieces|shirts|tees)?/);
  const inks = t.match(/(\d{1,2})\s*(tintas?|colou?res|colors?|inks?)/);
  if (inks) d.inks = Math.min(11, Math.max(1, +inks[1]));
  const cm = t.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:x|por|×)\s*(\d{1,2}(?:[.,]\d)?)\s*cm/);
  if (cm) d.size = Math.round(parseFloat(cm[1].replace(",", ".")) * parseFloat(cm[2].replace(",", ".")));
  else if (/doble carta/.test(t)) d.size = 1200; else if (/media carta/.test(t)) d.size = 300; else if (/\bcarta\b/.test(t)) d.size = 600;
  else if (/escudo|pecho izquierdo|logo chico/.test(t)) d.size = 100; else if (/frente completo|full front/.test(t)) d.size = 1800;
  const ex = [/antimigr|barrier|barrera/.test(t) && "antimigrante", /exportaci|export quality/.test(t) && "export", /afelpad|fleece/.test(t) && "fleece"].filter(Boolean);
  if (ex.length) d.extras = [...new Set([...(d.extras || []), ...ex])];
  if (qty && (!inks || qty.index !== inks.index)) { const n = parseInt(qty[1].replace(/[,.]/g, ""), 10); if (n >= 1 && n < 1e6 && (qty[2] || !d.qty)) d.qty = n; }
  const where = ["frente", "espalda", "manga", "nuca", "pecho", "front", "back", "sleeve"].filter((w) => t.includes(w)).length;
  if (where) d.locs = Math.min(4, where);
  if (/express|urgente|rapido|rush/.test(t)) d.del = "express";
  if (/\bblanc[oa]s?\b|\bwhite\b/.test(t)) d.color = "blanca"; else if (/\b(negr[oa]s?|azul(es)?|roj[oa]s?|gris(es)?|verdes?|amarill[oa]s?|rosas?|morad[oa]s?|beige|marino|colou?r(es|ed)?|black|navy)\b/.test(t)) d.color = "color";
  for (const k of Object.keys(EMB)) if (t.includes(k)) d.emb = k;
  return d;
}

/* Who is writing (from the owner's brief): the assistant first sorts the customer, then advises.
   · experto     knows everything (garment, fabric, weight, printing system) and is comparing quotes:
                 straight to the spec and the price.
   · intermedio  knows the product but not lines or printing systems: asked what it is for, then
                 offered three options at a time (Básica, Clásica, Premium; the middle one usually wins).
   · explorador  doesn't know what to quote: same path, starting from the use, with more explanation.
   · cliente     already buys from Chilian: repeat an order, quote something new or talk to their advisor. */
const USOS = {
  carrera: { es: "Carrera o deporte", en: "Race or sports", prods: ["sport", "playera", "gorra"], linea: "clasica", tec: "fullprint",
    tip: ["Para carreras te sugiero la Chilian Sport: poliéster dry fit que no se pega con el sudor, la que usamos en maratones, y se puede sublimar de costura a costura (full print).", "For races I suggest the Chilian Sport: dry-fit polyester that doesn't cling with sweat, the one we make for marathons, and it can be sublimated seam to seam (full print)."] },
  evento: { es: "Evento o activación", en: "Event or activation", prods: ["playera", "bolsa", "gorra"], linea: "basica", tec: "plastisol",
    tip: ["Para un evento conviene la línea básica: buen precio por volumen y buena presentación, con tu logo en serigrafía.", "For an event the basic line works best: good price at volume and a good look, with your logo screen printed."] },
  negocio: { es: "Merch de mi negocio", en: "Merch for my business", prods: ["playera", "bolsa", "gorra"], linea: "basica", tec: "plastisol",
    tip: ["Para el merch de tu negocio (cafetería, restaurante, tienda) unas básicas funcionan muy bien: precio accesible para regalar o vender.", "For your business merch (café, restaurant, shop) basic tees work great: an easy price to give away or sell."] },
  uniforme: { es: "Uniforme de empresa", en: "Company uniform", prods: ["polo", "playera", "camisa"], linea: "clasica", tec: "embroidery",
    tip: ["Para uniformes te recomiendo la línea clásica: aguanta el uso diario y las lavadas. El logo bordado se ve más formal.", "For uniforms I recommend the classic line: it holds up to daily wear and washing. An embroidered logo looks more formal."] },
  banda: { es: "Banda, artista o gira", en: "Band, artist or tour", prods: ["playera", "sudadera", "gorra"], linea: "premium", tec: "plastisol",
    tip: ["Para merch de banda o gira necesitas buena calidad: la línea premium tiene tela más gruesa y se siente de marca. Si ya tienes tu diseño, la serigrafía con efectos (relieve, puff, base agua) lo hace destacar.", "For band or tour merch you need quality: the premium line has a heavier fabric and feels branded. With your design ready, screen printing with effects (high density, puff, water-based) makes it stand out."] },
  marca: { es: "Mi marca de ropa", en: "My apparel brand", prods: ["playera", "sudadera", "polo"], linea: "premium", tec: "waterbase",
    tip: ["Para una marca de ropa va la línea premium, con impresión base agua o discharge para un tacto suave, como las marcas grandes que estampamos.", "For an apparel brand go premium, with water-based or discharge printing for a soft hand, like the big brands we print for."] },
  regalo: { es: "Regalo o promocional", en: "Gift or giveaway", prods: ["playera", "bolsa", "gorra"], linea: "basica", tec: "plastisol",
    tip: ["Para regalos y promocionales, la línea básica rinde el presupuesto; las bolsas y gorras también funcionan muy bien.", "For gifts and giveaways the basic line stretches the budget; totes and caps work great too."] }
};
const USO_RX = [["carrera", /carrera|maraton|correr|running|deport|futbol|liga|torneo|triatl|ciclis|race|marathon|sport/], ["banda", /banda|grupo de rock|musico|artista|gira|tour|concierto|band\b/],
  ["marca", /mi marca|marca de ropa|coleccion|streetwear|clothing brand|apparel brand/], ["uniforme", /uniforme|empleados|personal|corporativ|uniform/],
  ["negocio", /cafeter|restaurant|negocio|tienda|local|barberia|gimnasio|\bgym|cafe\b|business|shop/], ["regalo", /regalo|promocional|giveaway|gift/],
  ["evento", /evento|boda|xv|fiesta|congreso|activacion|graduacion|aniversario|event/]];
const LINEA_RX = [["basica", /basica|economica|basic|cheap/], ["premium", /premium|alta calidad|gruesa|peso completo|heavyweight/], ["clasica", /clasica|classic/]];
const PERFILES = { experto: ["Ya sé lo que quiero", "I know what I want"], intermedio: ["Necesito asesoría", "I need advice"], explorador: ["Estoy explorando", "Just exploring"], cliente: ["Ya soy cliente", "I'm a customer"] };
export const PERFIL_NOMBRE = { experto: "Sabe lo que quiere (compara)", intermedio: "Necesita asesoría", explorador: "Explorando", cliente: "Cliente que ya compra" };
const ALL_TECS = ["plastisol", "waterbase", "discharge", "hd", "puff", "glitter", "dtg", "embroidery", "fullprint"];

function parseMore(text, d) {
  const t = norm(text);
  for (const [id, rx] of USO_RX) if (rx.test(t)) { d.uso ||= id; break; }
  for (const [id, rx] of LINEA_RX) if (rx.test(t)) { d.linea = id; break; }
  const o = String(text).toLowerCase();   // the spec keeps the customer's own words (with accents)
  const spec = [o.match(/\d{3}\s*(g\b|gr|grs|gsm|g\/m)\S*/)?.[0], o.match(/\d{2,3}\s*%?\s*(algod[oó]n|poli[eé]ster|cotton|poly)\S*(\s*\d{1,3}\s*%?\s*(algod[oó]n|poli[eé]ster|cotton|poly)\S*)?/)?.[0], o.match(/peinado|ring ?spun|pima|french terry|dry ?fit|oversize/)?.[0]].filter(Boolean);
  if (spec.length) d.spec = [...new Set([...(d.spec ? [d.spec] : []), ...spec])].join(" · ").slice(0, 160);
  if (d.spec && !d.linea) {   // the closest line prices their spec; the advisor confirms the exact fabric
    const g = +(d.spec.match(/(\d{3})\s*(g|gr|gsm)/)?.[1] || 0);
    d.linea = g >= 185 || /peso completo|french terry|oversize/.test(d.spec) ? "premium" : /50\s*%?\s*(algod|poli|cotton|poly)/.test(d.spec) || (g && g < 150) ? "basica" : "clasica";
  }
  return d;
}

const esSaludo = (t) => !t || /^\s*(hola+|buen[oa]s?( (dias|tardes|noches))?|hi|hello|hey|que tal|saludos)[\s!.,¡¿?]*$/.test(norm(t));

// The name and the way to reach them, asked at the start (the website chat has neither).
function parseContacto(text) {
  const mail = String(text).match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0];
  if (mail) return mail.slice(0, 120);
  const dg = String(text).replace(/[^\d+]/g, "");
  return dg.replace(/\D/g, "").length >= 10 ? dg.slice(0, 18) : "";
}
function parseNombre(text) {
  const t = String(text).trim().replace(/^(hola[,! ]*)?(me llamo|mi nombre es|soy|my name is|i am|i'm)\s+/i, "").replace(/[.!¡]+$/g, "").trim();
  if (t.length < 2 || t.length > 50 || /\d|@|https?:/.test(t)) return "";
  const words = t.split(/\s+/);
  if (words.length > 4 || /\b(playeras?|piezas?|pzas|cotiz\w*|precio|quiero|necesito|tengo|hola|buen[oa]s|gracias|ayuda|cuanto|hello|hi|quote|price|want|need)\b/.test(norm(t))) return "";
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// A customer we already have: by the account on the conversation, or by the phone on any account.
async function knownClient(doc) {
  if (doc.cuentaId) { const c = await getDoc("cuentas", doc.cuentaId).catch(() => null); if (c) return c; }
  const phone = String(doc.waId || "").replace(/\D/g, "").slice(-10);   // only WhatsApp's own id: a number typed in the website chat proves nothing
  if (phone.length < 10) return null;
  try { return (await listDocs("cuentas")).find((c) => (c.contactos || []).some((x) => String(x.contacto || "").replace(/\D/g, "").slice(-10) === phone)) || null; } catch { return null; }
}

export async function botTurn(doc, input, ctx) {
  const st = await botSettings();
  const b = (doc.bot ||= { paso: "inicio", d: {}, lang: ctx.lang || "es" });
  const L = (es, en) => (b.lang === "en" ? en : es);
  // «nueva cotización» and «cerrar chat» work at any moment, even with an advisor on the conversation
  const t0 = norm(input.text || "").trim();
  if (input.button === "nueva" || /^(otra|nueva) cotizacion$|^(new|another) quote$/.test(t0)) return { replies: [], nueva: true };
  if (input.button === "cerrar" || /^(cerrar|terminar|finalizar)( el)? chat$|^close( the)? chat$/.test(t0)) {
    b.cerrado = true;
    return { replies: [{ text: L("Listo, cerré el chat. Tu cotización quedó guardada. Cuando quieras otra, toca «Nueva cotización». ¡Gracias!", "Done, I closed the chat. Your quote is saved. Whenever you want another, tap “New quote”. Thanks!"), buttons: [{ id: "nueva", title: L("Nueva cotización", "New quote") }] }], cerrar: true };
  }
  if (b.pausado || b.estado === "asesora") return { replies: [] };
  const { P, ejemplo } = await prices();
  let text = input.text || "", btn = input.button || "";
  const out = [];
  const say = (t, buttons, links) => out.push({ text: t, ...(buttons ? { buttons } : {}), ...(links ? { links } : {}) });
  const done = () => ({ replies: out });
  const OTRA = [{ id: "nueva", title: L("Otra cotización", "Another quote") }, { id: "cerrar", title: L("Cerrar chat", "Close chat") }];
  const handoff = (why, opciones) => {
    b.estado = "asesora"; b.paso = "asesora";
    const open = inHours(st.horario);
    say(open ? L("Te paso con una asesora de Chilian; te escribe aquí mismo en unos minutos.", "I'm passing you to a Chilian advisor; they'll write to you here in a few minutes.")
      : L("Te paso con una asesora de Chilian. Atienden de lunes a viernes de 9:00 a 19:00; te escribe aquí en cuanto abran.", "I'm passing you to a Chilian advisor. They work Monday to Friday, 9:00–19:00 (Mexico City); they'll write to you here as soon as they're in."), opciones ? OTRA : undefined);
    return { replies: out, handoff: why };
  };
  const d = b.d, mem = doc.memoria;
  let consumed = false;
  if (b.paso === "nombre" && text) {
    const ct = parseContacto(text), rest = text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/, " ").replace(/[\d+()\-\s]{8,}/g, " ").trim(), nm = parseNombre(rest);
    if (nm) { doc.nombre = nm; consumed = true; }
    if (ct) { doc.contacto = ct; doc.contactoOk = true; consumed = true; }
    b.paso = "inicio";
  } else if (b.paso === "contacto" && text) {
    const ct = parseContacto(text); if (ct) { doc.contacto = ct; doc.contactoOk = true; consumed = true; }
    b.paso = "inicio";
  }
  if (btn === "omitir") { b.sinDatos = true; consumed = true; }
  if (consumed) { text = ""; btn = ""; }
  // a measure typed in words is read here, without Claude
  const midiendo = (b.paso === "medida" || b.paso === "size") && text && parseMedida(text);
  const midiendoDtg = b.paso === "dcm" && text && parseMedida(text);   // DTG: the design's longest side picks the size
  // free text: Claude reads it (when the key is set) and calls the functions that apply
  const ai = text && b.paso !== "spec" && b.paso !== "medida" && !midiendo && !midiendoDtg && !/^\s*\d{1,6}\s*$/.test(text) ? await understand(doc, text, d) : null;
  if (ai?.lead) b.leadAI = ai.lead;
  if (btn === "asesora") return handoff("El cliente pidió hablar con una asesora");
  if (ai?.asesora) { if (ai.respuesta) say(ai.respuesta); return handoff(ai.asesora); }
  if (!ai && text && HANDOFF_RX.test(norm(text))) return handoff("Pidió algo que atiende una asesora: " + text.slice(0, 120));
  if (btn === "reiniciar" || /^(reiniciar|empezar|otra cotizacion|nueva cotizacion|start over)$/.test(norm(text).trim())) { b.d = { perfil: d.perfil, uso: d.uso, cliente: d.cliente }; b.paso = "reinicio"; b.todos = false; return botTurn(doc, {}, ctx); }

  // one print location with its measure: the table prices each by its area
  const addUbic = (area, cm) => {
    const S = P.serigrafia, i = sizeIdx(S, area), max = S.tamanos[S.tamanos.length - 1], excede = area > max;
    const lug = d.lugarActual && S.lugares[d.lugarActual] ? L(S.lugares[d.lugarActual].es, S.lugares[d.lugarActual].en) : `${L("Ubicación", "Location")} ${(d.ubic || []).length + 1}`;
    (d.ubic ||= []).push({ lugar: lug, area: excede ? max : area, cm: cm || "", ...(excede ? { excede: true } : {}) });
    delete d.lugarActual; d.masUbic = false;
    if (cm) say(excede ? L(`Tu medida de ${cm} (${area} cm²) pasa de nuestro tamaño máximo (≈ 30×60 cm): tu asesora la revisa.`, `Your size of ${cm} (${area} cm²) is above our largest size (≈ 30×60 cm): your advisor will review it.`)
      : L(`Tu medida de ${cm} (${area} cm²) entra en «${S.nombres[i].es}» (hasta ${S.medidas[i].replace("≈ ", "")}); la cotizo con ese tamaño.`, `Your size of ${cm} (${area} cm²) fits «${S.nombres[i].en}» (up to ${S.medidas[i].replace("≈ ", "")}); I'll quote it at that size.`));
  };

  // what the customer tapped or said fills the order
  const pre = btn.split(":")[0], val = btn.slice(pre.length + 1);
  if (pre === "perfil") d.perfil = val;
  else if (pre === "uso") d.uso = val;
  else if (pre === "prod") { if (val === "otro") b.todos = true; else if (val === "mas") { b.todos = true; b.mas = true; } else { d.prod = val; b.prodElegido = true; if (val === "pod") d.tec = "dtg"; } }
  else if (pre === "pod") { d.pod = val; d.tec = "dtg"; }
  else if (pre === "dcm") d.dcm = +val;
  else if (pre === "color") d.color = val;
  else if (pre === "linea") { if (val === "otra") { b.paso = "spec"; say(L("Escríbeme la tela, la composición y el gramaje que buscas (por ejemplo: 100 % algodón peinado, 180 g/m², corte oversize).", "Tell me the fabric, blend and weight you need (for example: 100% combed cotton, 180 gsm, oversized fit).")); return done(); } d.linea = val; }
  else if (pre === "qty") d.qty = +val;
  else if (pre === "dis") { d.dis = val; if (val === "logo") d.tec = USOS[d.uso]?.tec && !["fullprint", "embroidery"].includes(USOS[d.uso].tec) ? USOS[d.uso].tec : "plastisol"; else if (val === "foto") d.tec = (d.qty || 0) >= 300 ? "plastisol" : "dtg"; else if (val === "bordado") d.tec = "embroidery"; else if (val === "full") d.tec = "fullprint"; else if (val === "nodis") { d.tec = "plastisol"; d.inks = 1; } if (val === "foto" && d.tec === "plastisol") d.inks = 6; }
  else if (pre === "tec") d.tec = val;
  else if (pre === "inks") d.inks = +val;
  else if (pre === "lugar") { d.lugarActual = val; d.masUbic = false; }
  else if (pre === "mas") { if (val === "si") d.masUbic = true; else d.ubicListo = true; }
  else if (pre === "size") {
    if (val === "otra") { b.paso = "medida"; say(L("Escríbeme la medida del estampado como ancho × alto en cm, por ejemplo 20 × 25. Si prefieres pulgadas, también sirve (8 × 10 pulgadas).", "Write the print size as width × height in cm, for example 20 × 25. Inches work too (8 × 10 inches).")); return done(); }
    addUbic(+val, "");
  }
  else if (pre === "igual" || btn === "igual") { Object.assign(d, mem?.prefs || {}); d.perfil = mem?.perfil || "experto"; if (d.prod) b.prodElegido = true; }
  else if (btn === "cotizar") { if (mem?.perfil) d.perfil = mem.perfil; }
  else if (pre === "emb") d.emb = val;
  else if (pre === "locs") d.locs = +val;
  else if (pre === "del") d.del = val;
  else if (pre === "cli") {
    if (val === "repetir") return handoff(`Cliente que ya compra${d.cliente ? " (" + d.cliente + ")" : ""}: quiere repetir un pedido`);
    if (val === "nuevo") d.perfil = "experto";
  }
  else if (midiendoDtg) { const med = parseMedida(text), side = Math.max(med.w, med.h), M = P.dtgTabla?.medidas || [53]; d.dcm = M.find((x) => x >= side) || M[M.length - 1]; }   // the size that covers it
  else if (midiendo) { const med = parseMedida(text); addUbic(med.area, `${med.w}×${med.h} cm`); b.paso = "size"; }
  else if (b.paso === "medida" && text) { say(L("No pude leer esa medida. Escríbela como ancho × alto en cm, por ejemplo 20 × 25.", "I couldn't read that size. Write it as width × height in cm, for example 20 × 25.")); return done(); }
  else if (b.paso === "spec" && text) { d.spec = text.slice(0, 160); d.linea ||= "clasica"; }
  else if (/^\s*\d{1,6}\s*$/.test(text) && ["qty", "inks", "locs"].includes(b.paso)) d[b.paso] = parseInt(text, 10);
  else if (text) {
    parse(text, d); parseMore(text, d);
    if (ai) {   // what Claude understood wins over the patterns
      const c = ai.campos, okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
      for (const k of ["perfil", "uso", "prod", "tec", "emb", "del", "linea", "color"]) if (c[k]) d[k] = c[k];
      if ([100, 300, 600, 1200, 1800].includes(c.size)) d.size = c.size;
      if (c.ancho_cm > 0 && c.alto_cm > 0 && c.ancho_cm <= 300 && c.alto_cm <= 300) { if (c.lugar && P.serigrafia.lugares[c.lugar]) d.lugarActual = c.lugar; addUbic(Math.round(c.ancho_cm * c.alto_cm), `${c.ancho_cm}×${c.alto_cm} cm`); }
      if (Array.isArray(c.extras) && c.extras.length) d.extras = [...new Set([...(d.extras || []), ...c.extras])];
      if (c.prod) b.prodElegido = true;
      if (okInt(c.qty, 1, 999999)) d.qty = c.qty;
      if (okInt(c.inks, 1, 11)) d.inks = c.inks;
      if (okInt(c.locs, 1, 4)) d.locs = c.locs;
      if (c.spec) { d.spec = String(c.spec).slice(0, 160); if (!c.linea) { delete d.linea; parseMore("", d); } }
      if (c.nombre && (!doc.nombre || /^(Chat del sitio|Cliente)$/.test(doc.nombre))) doc.nombre = String(c.nombre).slice(0, 80);
      if (c.empresa && !doc.empresa) doc.empresa = String(c.empresa).slice(0, 120);
      if (c.fecha) doc.fechaTexto = String(c.fecha).slice(0, 80);
      if (ai.respuesta) say(ai.respuesta);
    }
  }
  if (d.tec === "fullprint") d.prod = "sport";
  if (d.prod === "sport" && d.uso === undefined && !d.perfil) d.uso = "carrera";

  if (btn === "pagar" && b.cot) {
    const due = b.cot.totalFinal || b.cot.totalIva, amount = Math.round(due * st.anticipo) / 100;
    const links = await ctx.payLinks(doc, amount, `Anticipo ${st.anticipo}% · ${b.cot.sentence}`);
    if (!links.length) return handoff("Quiso pagar el anticipo y aún no hay pagos en línea conectados");
    b.paso = "pago";
    say(L(`Aquí tu link para pagar el anticipo de ${money(amount)} (${st.anticipo}% de ${money(due)}). Con Mercado Pago puedes pagar con SPEI, OXXO, tarjeta o meses sin intereses. Cuando se acredite te confirmo aquí y te pedimos tu logo para el arte.`,
      `Here is your link to pay the ${st.anticipo}% deposit of ${money(amount)} MXN (of ${money(due)} MXN). Once it clears I'll confirm here and we'll ask for your artwork.`), null, links);
    return done();
  }

  // 0. the name and a way to reach them, from the start: one question at a time
  const pedirDatos = (antes) => {
    if (b.sinDatos || ctx.canal !== "chat") return false;
    const omitir = [{ id: "omitir", title: L("Prefiero no decirlo", "I'd rather not say") }];
    if (!nombreReal(doc.nombre) && (b.pidioNombre || 0) < 2) {
      b.pidioNombre = (b.pidioNombre || 0) + 1; b.paso = "nombre";
      say(antes ? L("Antes de darte el precio, ¿cómo te llamas?", "Before I give you the price, what's your name?")
        : b.saludado ? L("¿Cómo te llamas?", "What's your name?") : L("¡Hola! Soy el asistente de Chilian y te ayudo a cotizar. Para empezar, ¿cómo te llamas?", "Hi! I'm Chilian's assistant and I'll help you get a quote. To start, what's your name?"), omitir);
      b.saludado = true; return true;
    }
    if (!doc.contactoOk && (b.pidioContacto || 0) < 2) {
      b.pidioContacto = (b.pidioContacto || 0) + 1; b.paso = "contacto"; b.saludado = true;
      say(L(`${nombreReal(doc.nombre) ? "Mucho gusto, " + nombreReal(doc.nombre) + ". " : ""}¿A qué WhatsApp o correo te escribimos si se corta el chat?`, `${nombreReal(doc.nombre) ? "Nice to meet you, " + nombreReal(doc.nombre) + ". " : ""}What WhatsApp or email can we reach you at if the chat drops?`), omitir);
      return true;
    }
    return false;
  };
  if (!btn && esSaludo(text) && b.paso === "inicio" && !d.perfil && pedirDatos(false)) return done();
  // a customer we already know (this chat comes from an earlier one): say so, and offer to repeat what they asked for last time
  if (!d.perfil && doc.anterior && mem?.nombre && !b.saludadoMem && !btn && esSaludo(text) && b.paso === "inicio") {
    b.saludadoMem = true; b.saludado = true; b.paso = "memoria";
    say(L(`¡Hola de nuevo, ${mem.nombre}! Qué gusto verte. ¿Hacemos otra cotización?`, `Welcome back, ${mem.nombre}! Great to see you. Shall we do another quote?`),
      [...(mem.prefs?.prod ? [{ id: "igual", title: L("Igual que la última vez", "Same as last time") }] : []), { id: "cotizar", title: L("Cotizar algo nuevo", "Quote something new") }, { id: "asesora", title: L("Hablar con asesora", "Talk to an advisor") }]);
    return done();
  }

  // 1. who is writing
  if (!d.perfil) {
    if (b.paso === "inicio" && !b.revisado) {
      b.revisado = true;
      const c = await knownClient(doc);
      if (c) {
        d.perfil = "cliente"; d.cliente = c.nombre;
        say(L(`¡Hola de nuevo! Qué gusto saludarte de parte de ${c.nombre}. ¿En qué te ayudo hoy?`, `Welcome back! Great to hear from ${c.nombre}. How can I help today?`),
          [{ id: "cli:repetir", title: L("Repetir un pedido", "Repeat an order") }, { id: "cli:nuevo", title: L("Cotizar algo nuevo", "Quote something new") }, { id: "asesora", title: L("Hablar con mi asesora", "Talk to my advisor") }]);
        b.paso = "cliente"; return done();
      }
    }
    // the first message can already say who they are: a full spec is someone comparing; a use is someone to advise
    const known = ["prod", "qty", "tec"].filter((k) => d[k]).length;
    if (known >= 3 || d.spec || (known >= 2 && (d.linea || d.inks || d.locs))) d.perfil = "experto";
    else if (d.uso) d.perfil = d.prod ? "intermedio" : "explorador";
    else if (d.prod && d.qty) d.perfil = "intermedio";
  }
  if (!d.perfil) {
    say(b.saludado ? L(`${nombreReal(doc.nombre) ? "Gracias, " + nombreReal(doc.nombre) + ". " : ""}Para atenderte mejor, ¿cuál te describe?`, `${nombreReal(doc.nombre) ? "Thanks, " + nombreReal(doc.nombre) + ". " : ""}To help you best, which one describes you?`)
      : L("¡Hola! Soy el asistente de Chilian y te ayudo a cotizar. Para atenderte mejor, ¿cuál te describe?", "Hi! I'm Chilian's assistant and I'll help you get a quote. To help you best, which one describes you?"),
      Object.entries(PERFILES).map(([id, t]) => ({ id: "perfil:" + id, title: L(t[0], t[1]) })));
    b.paso = "perfil"; return done();
  }
  if (d.perfil === "cliente" && b.paso === "cliente" && !btn) {
    say(L("¿Repetimos un pedido, cotizamos algo nuevo o te paso con tu asesora?", "Shall we repeat an order, quote something new, or pass you to your advisor?"),
      [{ id: "cli:repetir", title: L("Repetir un pedido", "Repeat an order") }, { id: "cli:nuevo", title: L("Cotizar algo nuevo", "Quote something new") }, { id: "asesora", title: L("Hablar con mi asesora", "Talk to my advisor") }]);
    return done();
  }
  const advise = d.perfil === "intermedio" || d.perfil === "explorador";
  const prodName = (id) => { const p = P.productos.find((x) => x.id === id); return ((b.lang === "en" ? p?.en : p?.nombre) || id).replace(/^Playera deportiva Chilian Sport$/, "Chilian Sport deportiva").replace(/^Chilian Sport performance tee$/i, "Chilian Sport tee").slice(0, 22); };
  const ALL_PRODS = P.productos.map((p) => ({ id: "prod:" + p.id, title: p.pod ? "Print on Demand" : prodName(p.id) }));

  // 2. what it is for (advice path)
  if (advise && !d.uso) {
    say(d.perfil === "explorador" ? L("¡Te ayudo a aterrizarlo! Cuéntame, ¿para qué lo quieres? Con eso te sugiero el producto, la calidad y la impresión.", "Let's figure it out together! What is it for? With that I'll suggest the product, quality and print.")
      : L("¿Para qué es? Con eso te recomiendo la calidad y la impresión que más te conviene.", "What is it for? With that I'll recommend the quality and print that suit you best."),
      Object.entries(USOS).map(([id, u]) => ({ id: "uso:" + id, title: L(u.es, u.en) })));
    b.paso = "uso"; return done();
  }
  const uso = USOS[d.uso];

  // 3. the product: three suggestions for its use, or the whole list
  if (advise && uso && d.prod && !b.prodElegido && !b.todos && d.prod !== uso.prods[0] && !d.qty) delete d.prod;   // e.g. a race: offer the Chilian Sport first
  if (!d.prod) {
    if (advise && uso && !b.todos) {
      say(`${L(uso.tip[0], uso.tip[1])}\n\n${L("Te sugiero una de estas tres:", "I suggest one of these three:")}`,
        [...uso.prods.map((id, i) => ({ id: "prod:" + id, title: (i === 0 ? "⭐ " : "") + prodName(id) })), { id: "prod:otro", title: L("Otro producto", "Other product") }]);
    } else {   // WhatsApp lists hold 10 options: the rest go on a second page
      const page = ALL_PRODS.length <= 10 ? ALL_PRODS : b.mas ? ALL_PRODS.slice(9) : [...ALL_PRODS.slice(0, 9), { id: "prod:mas", title: L("Más productos", "More products") }];
      say(L("¿Qué producto necesitas?", "What product do you need?"), page);
    }
    b.paso = "prod"; return done();
  }
  if (!d.qty) {
    say(L("¿Cuántas piezas necesitas?", "How many pieces do you need?") + (advise ? L(" Si no sabes exacto, elige la más cercana.", " If you're not sure, pick the closest.") : ""),
      (d.prod === "pod" || d.tec === "dtg" ? [1, 5, 12, 50, 100] : [12, 50, 100, 500, 1000]).map((n) => ({ id: "qty:" + n, title: String(n) }))); b.paso = "qty"; return done();
  }
  const prod = P.productos.find((p) => p.id === d.prod) || P.productos[0];

  // 4a. Print on Demand: the garment (oversized, regular or budget), sold printed with 1 DTG print included
  if (prod.pod && !d.pod) {
    const O = P.pod.opciones, pr = (id) => { const r = quote(P, { prod: "pod", pod: id, qty: d.qty, color: d.color || "blanca", dcm: d.dcm || 27, locs: 1, del: "estandar" }, b.lang); return r.err ? "" : money(r.unitFinal); };
    say(L(`Print on Demand: la playera se vende estampada y el precio ya incluye 1 estampado DTG a todo color (hasta 27 cm). Para ${d.qty} pieza${d.qty === 1 ? "" : "s"}, en blanca:\n`, `Print on demand: the tee is sold printed and the price includes 1 full-color DTG print (up to 27 cm). For ${d.qty} piece${d.qty === 1 ? "" : "s"}, in white:\n`)
      + ["oversized", "regular", "economica"].map((id) => `• ${L(O[id].nombre, O[id].en)} (${L(O[id].para, O[id].paraEn)}): ${pr(id)}${O[id].provisional ? L(" (por confirmar)", " (to be confirmed)") : ""}`).join("\n"),
      ["oversized", "regular", "economica"].map((id) => ({ id: "pod:" + id, title: L(O[id].nombre, O[id].en) })));
    b.paso = "pod"; return done();
  }
  // 4. the line: three options side by side, with their price at this quantity (the middle one usually wins)
  const specs = P.specs?.[prod.id];
  if (specs && !d.linea) {
    const rec = uso?.linea || "clasica";
    const base = { prod: prod.id, qty: d.qty, tec: d.tec || (uso?.tec === "fullprint" ? "plastisol" : uso?.tec) || "plastisol", inks: d.inks || 1, size: d.size || 300, extras: d.extras, color: d.color || "color", locs: d.locs || 1, emb: d.emb || "mediano", del: "estandar" };
    const rows = ["basica", "clasica", "premium"].map((id) => { const ln = P.lineas[id], r = quote(P, { ...base, linea: id }, b.lang);
      return `${id === rec && advise ? "⭐ " : "• "}${L(ln.nombre, ln.en)}: ${specs[id]}. ${L("Para", "For")} ${L(ln.para, ln.paraEn)}. ${r.err ? "" : L(`Aprox. ${money(r.unitFinal)} por pieza`, `About ${money(r.unitFinal)} MXN per piece`)}`; });
    say(`${advise ? L("Tenemos tres calidades. ", "We have three qualities. ") : ""}${L(`Para ${d.qty} ${prod.plural || prod.nombre}`, `For ${d.qty} ${prod.pluralEn || prod.en}`)}:\n${rows.join("\n")}${advise ? L(`\n\nPara lo que me cuentas te recomiendo la ${P.lineas[rec].nombre.toLowerCase()}.`, `\n\nFor what you told me I'd go with ${P.lineas[rec].en.toLowerCase()}.`) : ""}\n${(base.tec === "dtg" ? L("(Precio a todo color hasta 27 cm en 1 lugar, con IVA y comisión de pago; lo ajusto con tu diseño.)", "(Full color up to 27 cm in 1 location, with VAT and payment fee; I'll adjust it to your design.)") : base.tec === "embroidery" ? L("(Precio con 1 bordado mediano, con IVA y comisión de pago; lo ajusto con tu diseño.)", "(1 medium embroidery, with VAT and payment fee; I'll adjust it to your design.)") : L("(Precio con 1 tinta de unos 17×17 cm en 1 lugar, con IVA y comisión de pago; lo ajusto con tu diseño.)", "(1 ink of about 17×17 cm in 1 location, with VAT and payment fee; I'll adjust it to your design.)"))}`,
      [...["basica", "clasica", "premium"].map((id) => ({ id: "linea:" + id, title: (id === rec && advise ? "⭐ " : "") + L(P.lineas[id].nombre, P.lineas[id].en) })), ...(advise ? [] : [{ id: "linea:otra", title: L("Otra tela o gramaje", "Other fabric/weight") }])]);
    b.paso = "linea"; return done();
  }

  // 4b. white or colored garment: the official list prices them apart
  if ((prod.lista || prod.pod || prod.listaCodigo === "12030") && !d.color) {
    const pr = (color) => { const r = quote(P, { prod: prod.id, qty: d.qty, linea: d.linea, pod: d.pod, color, tec: prod.pod ? "dtg" : "plastisol", inks: 1, locs: 1, del: "estandar" }, b.lang); return r.err ? "" : ` · ${money(r.unitFinal)}`; };
    say(L("¿La prenda es blanca o de color? La blanca cuesta un poco menos.", "White or colored garment? White costs a little less."),
      [{ id: "color:blanca", title: L("Blanca", "White") + pr("blanca") }, { id: "color:color", title: L("De color", "Colored") + pr("color") }]);
    b.paso = "color"; return done();
  }

  // 5. how it is printed: the expert picks the system; the rest describe their design and we suggest
  if (!d.tec) {
    if (advise) {
      const opts = [{ id: "dis:logo", title: L("Logo o texto", "Logo or text") }, { id: "dis:foto", title: L("Foto o muchos colores", "Photo or many colors") }];
      if (prod.fullprint) opts.unshift({ id: "dis:full", title: L("⭐ Full print", "⭐ Full print") });
      opts.push(["polo", "camisa", "gorra"].includes(prod.id) || d.uso === "uniforme" ? { id: "dis:bordado", title: L("⭐ Bordado", "⭐ Embroidery") } : { id: "dis:bordado", title: L("Bordado", "Embroidery") });
      opts.push({ id: "dis:nodis", title: L("Aún no tengo diseño", "No design yet") });
      say(L("¿Cómo es tu diseño? Con eso te sugiero la impresión: serigrafía para logos de pocos colores y volumen, DTG para fotos en pocas piezas, bordado para un acabado formal" + (prod.fullprint ? " y full print para cubrir toda la prenda." : "."),
        "What is your design like? With that I'll suggest the print: screen printing for logos with few colors and volume, DTG for photos in short runs, embroidery for a formal finish" + (prod.fullprint ? " and full print to cover the whole garment." : ".")), opts);
      b.paso = "dis"; return done();
    }
    const opts = ALL_TECS.filter((id) => !(id === "fullprint" && !prod.fullprint) && !(id === "dtg" && prod.nodtg)).map((id) => { const t = TECS.find((x) => x.id === id); return { id: "tec:" + id, title: t ? L(t.es, t.en).slice(0, 24) : id }; });
    say(L("¿Qué sistema de impresión?", "Which printing system?"), opts); b.paso = "tec"; return done();
  }
  const tec = TECS.find((x) => x.id === d.tec) || TECS[0];
  if (tec.kind === "serigrafia" && !d.color) {   // on colored garments the ink needs a white base: it costs a little more
    say(L("¿La prenda es clara (blanca) o de color u oscura? En prendas de color se imprime una base blanca debajo, que suma un poco.", "Is the garment light (white) or colored/dark? On colored garments a white base goes underneath, which adds a little."),
      [{ id: "color:blanca", title: L("Blanca o clara", "White or light") }, { id: "color:color", title: L("De color u oscura", "Colored or dark") }]);
    b.paso = "color"; return done();
  }
  if (tec.kind === "serigrafia" && !d.inks) { say(L("¿Cuántos colores tiene tu diseño?", "How many colors does your design have?"), ((d.qty || 0) < 100 ? [["1", 1], ["2", 2], ["3", 3], ["4", 4], ["5", 5], ["6", 6], ["7", 7], ["8", 8], [L("9 o más", "9 or more"), 9]] : [["1", 1], ["2-3", 2], ["4-5", 4], ["6-7", 6], ["8-9", 8], ["10-11", 10]]).map(([title, n]) => ({ id: "inks:" + n, title }))); b.paso = "inks"; return done(); }   // under 100 pieces the price goes by the exact number of inks
  if (tec.kind === "serigrafia" && !d.ubicListo) {
    const S = P.serigrafia, nm = (id) => L(S.lugares[id].es, S.lugares[id].en);
    if (!(d.ubic || []).length && d.size) {   // a size said in words, or an older answer: one location, or as many as said
      const cnt = Math.max(1, Math.min(4, d.locs || 1));
      d.ubic = Array.from({ length: cnt }, (_, i) => ({ lugar: `${L("Ubicación", "Location")} ${i + 1}`, area: d.size, cm: "" })); if (d.locs) d.ubicListo = true;
    }
    if (!d.ubicListo) {
      const n2 = (d.ubic || []).length;
      if (d.lugarActual) {   // its measure: real sizes with what they are for, or the customer's own
        const sug = sizeIdx(S, S.lugares[d.lugarActual]?.sugerida || 600);
        const lines = S.tamanos.map((a, i) => `${i === sug ? "⭐ " : "• "}${L(S.nombres[i].es, S.nombres[i].en)} ${S.medidas[i]}: ${L(S.usos[i].es, S.usos[i].en)}`).join("\n");
        say(L(`¿De qué medida es ${nm(d.lugarActual).toLowerCase()}? Estas son nuestras medidas:\n${lines}\n\nElige una, o escríbeme tu medida (por ejemplo 20 × 25 cm) y la acomodo.`, `What size is the ${nm(d.lugarActual).toLowerCase()} print? These are our sizes:\n${lines}\n\nPick one, or write your own size (for example 20 × 25 cm) and I'll fit it.`),
          [...S.tamanos.map((a, i) => ({ id: "size:" + a, title: `${i === sug ? "⭐ " : ""}${L(S.nombres[i].es, S.nombres[i].en)} ${S.medidas[i].replace("≈ ", "")}`.slice(0, 24) })), { id: "size:otra", title: L("Otra medida", "Other size") }]);
        b.paso = "size"; return done();
      }
      if (!n2 || d.masUbic) {   // where
        const used = new Set((d.ubic || []).map((u) => u.lugar));
        say(!n2 ? L("¿Dónde va el estampado? Te voy preguntando la medida de cada lugar.", "Where does the print go? I'll ask the size of each place.") : L("¿En qué otro lugar?", "Where else?"),
          Object.keys(S.lugares).filter((id) => !used.has(nm(id))).map((id) => ({ id: "lugar:" + id, title: nm(id) })));
        b.paso = "lugar"; return done();
      }
      if (n2 >= 4) d.ubicListo = true;
      else {
        say(L(`Hasta ahora: ${d.ubic.map((u) => `${u.lugar} (${u.cm || S.medidas[sizeIdx(S, u.area)].replace("≈ ", "")})`).join(", ")}. ¿Agregamos otra ubicación?`, `So far: ${d.ubic.map((u) => `${u.lugar} (${u.cm || S.medidas[sizeIdx(S, u.area)].replace("≈ ", "")})`).join(", ")}. Add another location?`),
          [{ id: "mas:si", title: L("Sí, otra ubicación", "Yes, another") }, { id: "mas:no", title: L("No, es todo", "No, that's all") }]);
        b.paso = "mas"; return done();
      }
    }
  }
  if (tec.kind === "dtg" && !d.dcm && P.dtgTabla) {   // DTG is priced by the design's longest side
    const D = P.dtgTabla, pick = [0, 1, 2, 3, 5, 6, 8];
    say(L("¿Qué tan grande es tu diseño? Cuenta su lado más largo. También puedes escribirme la medida (por ejemplo 20 × 25 cm).", "How big is your design? Count its longest side. You can also type the size (for example 20 × 25 cm).") + "\n" + pick.map((i) => `• ${L("Hasta", "Up to")} ${D.medidas[i]} cm: ${L(D.usos[i].es, D.usos[i].en)}`).join("\n"),
      pick.map((i) => ({ id: "dcm:" + D.medidas[i], title: `${L("Hasta", "Up to")} ${D.medidas[i]} cm${D.medidas[i] === 27 ? " ⭐" : ""}` })));
    b.paso = "dcm"; return done();
  }
  if (tec.kind === "bordado" && !d.emb) { say(L("¿De qué tamaño es el bordado?", "How big is the embroidery?"), Object.entries(EMB).map(([id, v]) => ({ id: "emb:" + id, title: `${b.lang === "en" ? v[1] : v[0]} ${v[2]}` }))); b.paso = "emb"; return done(); }
  if (tec.kind !== "full" && tec.kind !== "serigrafia" && !d.locs) { say(L("¿En cuántos lugares va? Por ejemplo frente, espalda, manga y nuca.", "How many locations? For example front, back, sleeve and back neck."), [1, 2, 3, 4].map((n) => ({ id: "locs:" + n, title: prod.pod ? (n === 1 ? L("1 (incluido)", "1 (included)") : L(`${n} (+${n - 1} extra)`, `${n} (+${n - 1} extra)`)) : String(n) }))); b.paso = "locs"; return done(); }
  if (!d.del) { say(L("¿Entrega estándar o express?", "Standard or express delivery?"), [{ id: "del:estandar", title: L("Estándar", "Standard") }, { id: "del:express", title: `Express +${P.express}%` }]); b.paso = "del"; return done(); }

  // 6. the quote (the name and contact first, if they were skipped at the start)
  if (pedirDatos(true)) return done();
  const r = quote(P, d, b.lang);
  if (r.err) { say(r.err + " " + L("¿Cambiamos las piezas o la técnica?", "Shall we change the pieces or the technique?"), [{ id: "qty:" + r.min, title: L(`Usar ${r.min} piezas`, `Use ${r.min} pieces`) }, { id: "reiniciar", title: L("Empezar de nuevo", "Start over") }]); delete d.qty; b.paso = "qty"; return done(); }
  b.cot = { nombre: r.prod.nombre, tecNombre: r.tec.es, linea: d.linea || "", spec: d.spec || "", sentence: r.sentence, unit: r.unit, total: r.total, totalIva: r.totalIva,
    unitFinal: r.unitFinal, envio: r.envio, envioCotizar: r.envioCotizar, totalFinal: r.totalFinal, prenda: r.prenda?.codigo || "", days: r.days, fecha: r.date.toISOString().slice(0, 10), d: { ...d } };
  const when = r.date.toLocaleDateString(b.lang === "en" ? "en-US" : "es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City" });
  const specLine = d.spec ? L(`\n• Tu especificación: ${d.spec} (tu asesora confirma el precio exacto con esa tela)`, `\n• Your spec: ${d.spec} (your advisor confirms the exact price for that fabric)`)
    : r.prenda?.tela ? `\n• ${r.prenda.tela}${d.color ? L(d.color === "blanca" ? ", blanca" : ", de color", d.color === "blanca" ? ", white" : ", colored") : ""}` : specs && d.linea ? `\n• ${specs[d.linea]}` : "";
  const ship = r.envio ? L(`\n• Envío: ${money(r.envio)}`, `\n• Shipping: ${money(r.envio)} MXN`) : r.envioCotizar ? L("\n• Envío: a cotizar con tu asesora", "\n• Shipping: quoted by your advisor") : "";
  const sinEnvio = r.envioCotizar ? L(" (sin envío)", " (shipping not included)") : "";
  const body = L(`Tu cotización: ${r.sentence}.${specLine}\n• ${money(r.unitFinal)} por pieza (IVA y comisión de pago incluidos)${ship}\n• Total${sinEnvio}: ${money(r.totalFinal)}\n• Entrega estimada: ${when} (${r.days} días hábiles después de aprobar tu arte)${ejemplo ? "\nPrecio de referencia: tu asesora lo confirma al revisar tu arte." : "\nEl precio final se confirma al revisar tu arte."}`,
    `Your quote: ${r.sentence}.${specLine}\n• ${money(r.unitFinal)} MXN per piece (VAT and payment fee included)${ship}\n• Total${sinEnvio}: ${money(r.totalFinal)} MXN\n• Estimated delivery: ${when} (${r.days} business days after you approve the artwork)\nFinal price confirmed after reviewing your artwork.`);
  b.paso = "cotizado"; b.cotizadoEn = Date.now();   // 24 hours after this, the chat starts over
  if (!b.contado) { b.contado = true; doc.memoria = { ...(doc.memoria || {}), cotizaciones: ((doc.memoria || {}).cotizaciones || 0) + 1 }; }
  if (r.totalFinal > st.limite) { say(body); return handoff(`Cotización arriba de ${money(st.limite)}: ${r.sentence} · ${money(r.totalFinal)} total`, true); }
  if (d.spec) { say(body); return handoff(`Cotizó con una especificación propia (${d.spec}): ${r.sentence}`, true); }
  if (r.excede) { say(body); return handoff(`Medida de estampado mayor a 30×60 cm: ${r.sentence}`, true); }
  say(body, [{ id: "pagar", title: L(`Pagar anticipo ${st.anticipo}%`, `Pay ${st.anticipo}% deposit`) }, { id: "reiniciar", title: L("Cambiar algo", "Change something") }, { id: "asesora", title: L("Hablar con asesora", "Talk to an advisor") }, ...OTRA]);
  return done();
}
