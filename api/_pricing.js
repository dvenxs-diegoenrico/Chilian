/* Server-side price engine: the same rules as "Cotiza en un minuto" on the website
   (index.html → qzCalc), so the chat assistant, WhatsApp and the site quote the same.
   Prices come from /api/precios defaults merged with Ajustes → Precios del cotizador web. */
import { getDoc } from "./_lib.js";
import { mergePrecios } from "./precios.js";

export const TECS = [
  { id: "plastisol", kind: "serigrafia", es: "Plastisol", en: "Plastisol" },
  { id: "waterbase", kind: "serigrafia", es: "Base agua", en: "Water-based" },
  { id: "discharge", kind: "serigrafia", es: "Discharge", en: "Discharge" },
  { id: "hd", kind: "serigrafia", es: "Alta densidad", en: "High density" },
  { id: "puff", kind: "serigrafia", es: "Puff", en: "Puff" },
  { id: "glitter", kind: "serigrafia", es: "Glitter", en: "Glitter" },
  { id: "gitd", kind: "serigrafia", es: "Brilla en la oscuridad", en: "Glow in the dark" },
  { id: "fullprint", kind: "full", es: "Full print", en: "Full print" },
  { id: "dtg", kind: "dtg", es: "DTG a todo color", en: "Full-color DTG" },
  { id: "embroidery", kind: "bordado", es: "Bordado", en: "Embroidery" }
];
export const EMB = { chico: ["chico", "small", "≤ 7 cm"], mediano: ["mediano", "medium", "≤ 12 cm"], grande: ["grande", "large", "≤ 25 cm"] };

let cache = { at: 0, v: null };
export async function prices() {
  if (cache.v && Date.now() - cache.at < 60_000) return cache.v;
  const saved = await getDoc("ajustes", "precios-web").catch(() => null);
  cache = { at: Date.now(), v: { P: mergePrecios(saved?.precios), ejemplo: saved ? saved.ejemplo !== false : true } };
  return cache.v;
}
export const EXTRAS_ELEGIBLES = ["antimigrante", "fleece", "export"];   // fabric (colored garment), HD/puff, glitter and fleece garments apply by themselves
export const inkIdx = (n) => Math.min(5, Math.floor(Math.max(1, +n || 1) / 2));   // 1 | 2-3 | 4-5 | 6-7 | 8-9 | 10-11
export const sizeIdx = (S, area) => { const i = S.tamanos.findIndex((x) => x >= area); return i < 0 ? S.tamanos.length - 1 : i; };
// Extras that apply: the ones picked, the ink's own (HD/puff, glitter) and fleece garments.
export function extrasOf(c, tec, prod) {
  const ids = new Set((c.extras || []).filter((x) => EXTRAS_ELEGIBLES.includes(x)));
  if (tec.id === "hd" || tec.id === "puff") ids.add("hdpuff");
  if (tec.id === "glitter") ids.add("glitter");
  if (prod.fleece) ids.add("fleece");
  if (c.color === "color") ids.add("fabric");   // colored garment: white base underneath
  return [...ids];
}
// Official screen-printing table: per location by size, quantity break and colors, plus extras.
export function printCost(P, c, tec, prod, q, locs) {
  const S = P.serigrafia, t = tierOf(q, S.tramos), ik = inkIdx(c.inks);
  const areas = (c.areas && c.areas.length ? c.areas.slice(0, 4) : Array(locs).fill(+c.size || 300));
  const ids = extrasOf(c, tec, prod); let base = 0, extra = 0;
  for (const a of areas) { const k = String(S.tamanos[sizeIdx(S, a)]); base += S.tabla[k][t][ik]; for (const id of ids) extra += S.extras[id][k][t]; }
  return { base, extra, ids, areas };
}
const tierOf = (q, tramos) => { let i = 0; tramos.forEach((x, k) => { if (q >= x) i = k; }); return i; };
/* The garment's price per piece: T-shirts from the official list (by line and white/colored), other
   products from their own price breaks. Returns { precio, codigo, tela }. */
export function garment(P, prod, c, q) {
  const lineOf = c.linea && P.lineas?.[c.linea] ? c.linea : "clasica", white = c.color === "blanca";
  const row = (code) => (P.lista || []).find((r) => r.codigo === code && (white ? /blanc/i.test(r.color) : !/^blanc/i.test(r.color))) || (P.lista || []).find((r) => r.codigo === code);
  let r = null;
  if (prod.lista) r = row(P.lineas[lineOf].codigos?.[white ? "blanca" : "color"]);
  else if (prod.listaCodigo) r = row(prod.listaCodigo);
  if (r) return { precio: r.precios[tierOf(q, P.listaTramos || [12, 50, 100, 300, 1000])] || 0, codigo: r.codigo, tela: r.tela };
  const ln = c.linea && P.lineas?.[c.linea] && P.specs?.[prod.id] ? +P.lineas[c.linea].factor || 1 : 1;
  return { precio: (prod.precios[tierOf(q, prod.tramos || P.tramos)] || 0) * ln, codigo: "", tela: "" };
}
// What the customer pays: base × (1 + VAT) × (1 + payment fee), plus shipping per order.
export function charges(P, base, q) {
  const iva = (P.iva ?? 16) / 100, fee = (P.cargos?.comision ?? 5) / 100, env = P.cargos?.envio || {};
  const unitFinal = base * (1 + iva) * (1 + fee), sub = unitFinal * q;
  const envioCotizar = env.cotizar !== false;   // shipping is quoted by the advisor: it is not added to the total
  const envio = q && !envioCotizar ? (env.gratisDesde && sub >= env.gratisDesde ? 0 : +env.porPedido || 0) : 0;
  return { unitFinal, envio, envioCotizar, totalFinal: sub + envio };
}
export function addBusinessDays(n, from = new Date()) { const d = new Date(from); d.setHours(12, 0, 0, 0); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; } return d; }

/* c: { prod, qty, tec, inks, locs, emb, del } -> { unit, total, totalIva, days, date, min, err, sentence } */
export function quote(P, c, lang = "es") {
  const L = (es, en) => (lang === "en" ? en : es);
  const prod = P.productos.find((p) => p.id === c.prod) || P.productos[0];
  const tec = TECS.find((x) => x.id === c.tec) || TECS[0], kind = tec.kind;
  const q = Math.max(0, parseInt(c.qty, 10) || 0), i = tierOf(q, P.tramos);
  const locs = Math.min(4, Math.max(1, c.areas && c.areas.length ? c.areas.length : c.locs | 0 || 1)), inks = Math.min(11, Math.max(1, c.inks | 0 || 1));
  let unit = 0, pc = null;
  if (kind === "full") unit = P.fullprint.precios[tierOf(q, P.fullprint.tramos)] || 0;
  else {
    const g = garment(P, prod, c, q); unit += g.precio; var gar = g;
    if (kind === "serigrafia") { pc = printCost(P, c, tec, prod, q, locs); unit += pc.base + pc.extra; }
    else if (kind === "dtg") unit += (P.dtg[i] || 0) * locs;
    else { const size = P.bordado[c.emb] ? c.emb : "mediano"; unit += (P.bordado[size][i] || 0) * locs + (q ? P.ponchado * locs / q : 0); }
  }
  if (c.del === "express") unit *= 1 + P.express / 100;
  const table = (P.dias || {})[kind] || [[1e9, 10]];
  let days = (table.find(([lim]) => q <= lim) || table[table.length - 1])[1];
  if (c.del === "express") days = Math.max(3, days - (P.diasExpress || 3));
  const min = Math.max((P.minimos || {})[kind] || 1, kind === "serigrafia" ? P.serigrafia.tramos[0] : 0);
  let err = "";
  if (kind === "full" && !prod.fullprint) err = L("El full print solo existe en la playera deportiva Chilian Sport.", "Full print only exists on the Chilian Sport tee.");
  else if (kind === "dtg" && prod.nodtg) err = L("DTG no se imprime en ese producto; elige serigrafía o bordado.", "DTG can't print on that product; pick screen printing or embroidery.");
  else if (q < min) err = L(`El mínimo en ${tec.es.toLowerCase()} es de ${min} piezas.`, `The minimum for ${tec.en.toLowerCase()} is ${min} pieces.`);
  const plural = lang === "en" ? prod.pluralEn || prod.en || prod.nombre : prod.plural || prod.nombre;
  const how = kind === "full" ? L("en full print", "in full print")
    : kind === "serigrafia" ? (() => {
      const S = P.serigrafia, ink = S.colores[inkIdx(inks)], med = [...new Set(pc.areas.map((x) => S.medidas[sizeIdx(S, x)]))].join(" + "), plural = ink !== "1";
      const ex = pc.ids.filter((x) => !["hdpuff", "glitter"].includes(x)).map((x) => (S.extrasNombres[x][lang === "en" ? "en" : "es"]).toLowerCase());
      const ex2 = ex.filter((x) => !x.startsWith(S.extrasNombres.fabric.es.toLowerCase().slice(0, 10)) && !x.startsWith(S.extrasNombres.fabric.en.toLowerCase().slice(0, 10)));
      const onG = !prod.lista && !prod.listaCodigo && c.color ? L(c.color === "color" ? ", sobre prenda de color" : ", sobre prenda clara", c.color === "color" ? ", on a colored garment" : ", on a light garment") : "";
      return L(`en ${tec.es.toLowerCase()}, ${ink} tinta${plural ? "s" : ""} en ${locs} ubicaci${locs > 1 ? "ones" : "ón"} de ${med}${ex2.length ? ", con " + ex2.join(" y ") : ""}${onG}`, `in ${tec.en.toLowerCase()}, ${ink} ink${plural ? "s" : ""} in ${locs} location${locs > 1 ? "s" : ""} of ${med}${ex2.length ? ", with " + ex2.join(" and ") : ""}${onG}`);
    })()
    : kind === "dtg" ? L(`en DTG a todo color, ${locs} ubicaci${locs > 1 ? "ones" : "ón"}`, `in full-color DTG, ${locs} location${locs > 1 ? "s" : ""}`)
    : L(`con bordado ${EMB[c.emb] ? EMB[c.emb][0] : "mediano"}, ${locs} ubicaci${locs > 1 ? "ones" : "ón"}`, `with ${EMB[c.emb] ? EMB[c.emb][1] : "medium"} embroidery, ${locs} location${locs > 1 ? "s" : ""}`);
  const r2 = (n) => Math.round(n * 100) / 100;
  const ch = charges(P, unit, q);
  return { prod, tec, kind, q, inks, locs, unit: r2(unit), total: r2(unit * q), totalIva: r2(unit * q * (1 + (P.iva || 16) / 100)), days, date: addBusinessDays(days), min, err,
    unitFinal: r2(ch.unitFinal), envio: r2(ch.envio), envioCotizar: ch.envioCotizar, totalFinal: r2(ch.totalFinal), prenda: typeof gar !== "undefined" ? gar : null,
    sentence: `${q} ${plural}${c.linea && P.lineas?.[c.linea] && P.specs?.[prod.id] ? L(` línea ${P.lineas[c.linea].nombre.toLowerCase()}`, ` (${(P.lineas[c.linea].en || "").toLowerCase()} line)`) : ""} ${how}${c.del === "express" ? L(", entrega express", ", express delivery") : ""}` };
}
