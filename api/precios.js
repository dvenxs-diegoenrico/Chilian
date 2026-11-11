/* Public price list for the website's instant quote ("Cotiza en un minuto") and the assistant.
   GET -> { precios, ejemplo }   (cached 5 minutes at the edge)
   The team edits it in Chilian OS → Ajustes → Precios del cotizador web (ajustes/precios-web).
   T-shirts come from Chilian's official list (_lista.js, LP cuello redondo). Products Chilian has no
   list for yet take Factory 1 Direct's prices as a reference (ref: "Factory 1"). Screen printing (LN1) and
   DTG come from Chilian's lists; embroidery prices are still EXAMPLES until Chilian confirms them. The customer pays: (garment + printing) + 16 % VAT
   + 5 % payment fee (Mercado Pago / Stripe) + shipping — see "cargos". */
import { getDoc, fail } from "./_lib.js";
import { LISTA_PLAYERAS, LISTA_TRAMOS } from "./_lista.js";
import { SERIGRAFIA } from "./_serigrafia.js";
import { DTG } from "./_dtg.js";

export const DEFAULTS = {
  tramos: [50, 100, 500, 2000, 10000],   // price breaks by pieces; each list below has one price per break
  productos: [
    // lista: the garment price comes from the official list, by line (Básica/Clásica/Premium) and white or colored
    { id: "playera", nombre: "Playera cuello redondo", plural: "playeras cuello redondo", en: "Crew-neck T-shirt", pluralEn: "crew-neck T-shirts", precios: [98, 88, 76, 70, 65], lista: true },
    // Print on Demand: the garment is only sold printed; the price includes 1 DTG print (up to the size picked); each extra print adds its DTG price
    { id: "pod", nombre: "Print on Demand (prenda + DTG)", plural: "prendas Print on Demand", en: "Print on demand (garment + DTG)", pluralEn: "print-on-demand garments", precios: [0, 0, 0, 0, 0], pod: true },
    { id: "sport", nombre: "Playera deportiva Chilian Sport", plural: "playeras Chilian Sport", en: "Chilian Sport performance tee", pluralEn: "Chilian Sport tees", precios: [110, 100, 92, 86, 82], fullprint: true, listaCodigo: "CH-SPORT" },
    { id: "tiedye", nombre: "Playera teñida en prenda", plural: "playeras teñidas en prenda", en: "Garment-dyed tee", pluralEn: "garment-dyed tees", precios: [158.87, 148.27, 142.98, 137.68, 127.09], tramos: [12, 50, 100, 300, 1000], listaCodigo: "12030" },
    // Factory 1 Direct as the reference (USD price with one print, less the 3 USD print, × 18.5), until Chilian prices them
    { id: "mangalarga", nombre: "Playera manga larga", plural: "playeras manga larga", en: "Long-sleeve tee", pluralEn: "long-sleeve tees", precios: [139, 130, 125, 120, 111], tramos: [12, 50, 100, 300, 1000], ref: "Factory 1" },
    { id: "crewneck", nombre: "Sudadera cuello redondo (crewneck)", plural: "sudaderas crewneck", en: "Crewneck sweatshirt", pluralEn: "crewneck sweatshirts", precios: [209, 195, 188, 181, 167], tramos: [12, 50, 100, 300, 1000], ref: "Factory 1", fleece: true },
    { id: "short", nombre: "Short de algodón", plural: "shorts", en: "Cotton shorts", pluralEn: "shorts", precios: [583, 544, 525, 505, 466], tramos: [12, 50, 100, 300, 1000], ref: "Factory 1", nodtg: false },
    { id: "pants", nombre: "Pants o jogger", plural: "pants", en: "Sweatpants or joggers", pluralEn: "sweatpants", precios: [657, 613, 591, 569, 526], tramos: [12, 50, 100, 300, 1000], ref: "Factory 1" },
    { id: "sudadera", nombre: "Sudadera o crewneck", plural: "sudaderas", en: "Hoodie or crewneck", pluralEn: "sweatshirts", precios: [285, 265, 240, 225, 212], fleece: true },
    { id: "polo", nombre: "Polo", plural: "polos", en: "Polo", pluralEn: "polos", precios: [195, 180, 165, 155, 148] },
    { id: "camisa", nombre: "Camisa de uniforme", plural: "camisas de uniforme", en: "Uniform shirt", pluralEn: "uniform shirts", precios: [340, 320, 300, 285, 270] },
    { id: "gorra", nombre: "Gorra", plural: "gorras", en: "Cap", pluralEn: "caps", precios: [78, 70, 62, 57, 53], nodtg: true },
    { id: "bolsa", nombre: "Bolsa de tela", plural: "bolsas de tela", en: "Tote bag", pluralEn: "tote bags", precios: [45, 40, 34, 31, 29] },
    { id: "propia", nombre: "Mi prenda (la envío yo)", plural: "prendas del cliente", en: "My own garment (I ship it)", pluralEn: "customer garments", precios: [0, 0, 0, 0, 0] }
  ],
  // Chilian Sport Full Print: the price breaks published in the Chilian store (garment + sublimation)
  fullprint: { tramos: [100, 300, 1000, 3000, 10000], precios: [310.8, 199.8, 177.6, 155.4, 133.2] },
  serigrafia: SERIGRAFIA,                  // Chilian's official screen-printing table (LN1): by print size, pieces and colors, plus extras
  dtgTabla: DTG,                           // Chilian's DTG list: per location by the design's longest side, pieces and garment (white / colored)
  // Print on Demand garments: the official list's T-shirt for each option (white / colored). Oversized has no row in the list yet:
  // until Chilian sends its price it uses the heavyweight Óptima (190 g) and says so (provisional).
  pod: { incluidos: 1, opciones: {
    oversized: { nombre: "Oversized", en: "Oversized", codigos: { blanca: "OP-MXB", color: "OP-MXC" }, provisional: true, para: "corte amplio, 100 % algodón", paraEn: "relaxed fit, 100% cotton" },
    regular: { nombre: "Regular", en: "Regular", codigos: { blanca: "OP-PRB", color: "OP-PRC" }, para: "100 % algodón, 155 g", paraEn: "100% cotton, 155 g" },
    economica: { nombre: "Económica", en: "Budget", codigos: { blanca: "OP-STPB", color: "OP-STPC" }, para: "50/50 algodón-poliéster", paraEn: "50/50 cotton-poly" }
  } },
  bordado: { chico: [32, 28, 24, 22, 20], mediano: [55, 48, 42, 38, 35], grande: [95, 85, 75, 68, 62] },   // per location
  ponchado: 450,                           // digitizing, per design (one per location)
  express: 18, diasExpress: 3,             // % surcharge and business days saved
  dias: { serigrafia: [[2000, 8], [10000, 10], [1e9, 15]], dtg: [[100, 4], [500, 6], [1e9, 9]], bordado: [[500, 8], [3000, 12], [1e9, 18]], full: [[1000, 12], [5000, 15], [1e9, 20]] },
  minimos: { serigrafia: 6, dtg: 1, bordado: 12, full: 100 },   // screen printing: the 6–99 pz table, then LN1 from 100
  iva: 16,
  // Garment lines (Básica, Clásica, Premium). "factor" multiplies the garment price above (Clásica = the
  // price in the list). The specs are what the assistant tells customers; EXAMPLES until Chilian confirms them.
  lineas: {
    // codigos: the T-shirt of the official list each line uses (white / colored)
    basica: { nombre: "Básica", en: "Basic", factor: 0.85, codigos: { blanca: "OP-STPB", color: "OP-STPC" }, para: "eventos, promociones y activaciones", paraEn: "events, promotions and activations" },
    clasica: { nombre: "Clásica", en: "Classic", factor: 1, codigos: { blanca: "OP-PRB", color: "OP-PRC" }, para: "uniformes, equipos y merch de uso diario", paraEn: "uniforms, teams and everyday merch" },
    premium: { nombre: "Premium", en: "Premium", factor: 1.4, codigos: { blanca: "OP-MXB", color: "OP-MXC" }, para: "marcas de ropa, bandas y merch premium", paraEn: "apparel brands, bands and premium merch" }
  },
  specs: {   // per product and line: fabric and weight
    playera: { basica: "Peso medio 50 % algodón 50 % poliéster · 155 g", clasica: "Peso medio 100 % algodón · 155 g", premium: "Peso completo 100 % algodón · 190 g" },
    sudadera: { basica: "50 % algodón 50 % poliéster afelpada · 240 g/m²", clasica: "80 % algodón 20 % poliéster · 280 g/m²", premium: "100 % algodón french terry · 330 g/m² o más" },
    polo: { basica: "Piqué 50 % algodón 50 % poliéster · 180 g/m²", clasica: "Piqué 100 % algodón · 200 g/m²", premium: "Piqué algodón peinado · 220 g/m², o dry fit premium" }
  },
  // the official list (T-shirts) and what the customer pays on top
  listaTramos: LISTA_TRAMOS,
  lista: LISTA_PLAYERAS,
  cargos: { comision: 5, envio: { cotizar: true, porPedido: 0, gratisDesde: 0 } }   // % payment fee (Mercado Pago / Stripe); shipping: "a cotizar" (not added) unless cotizar is false and a per-order amount is set
};

const merge = (d, s) => {
  if (!s || typeof s !== "object" || Array.isArray(d)) return s ?? d;
  const out = { ...d };
  for (const k of Object.keys(s)) out[k] = d[k] && typeof d[k] === "object" && !Array.isArray(d[k]) ? merge(d[k], s[k]) : s[k];
  return out;
};

/* Saved prices over the defaults. Lists replace lists, so the products the team saved keep their own
   prices, and products and fields added here later (lista, tramos, ref) still reach them. */
export function mergePrecios(saved) {
  const P = merge(DEFAULTS, saved);
  if (saved?.productos) {
    const byId = Object.fromEntries(DEFAULTS.productos.map((p) => [p.id, p]));
    P.productos = saved.productos.map((p) => ({ ...(byId[p.id] || {}), ...p, ...(byId[p.id]?.lista ? { lista: true } : {}), ...(byId[p.id]?.listaCodigo ? { listaCodigo: byId[p.id].listaCodigo } : {}) }));
    // products added here later go in at their place in the defaults
    DEFAULTS.productos.forEach((p, i) => { if (!saved.productos.some((x) => x.id === p.id)) P.productos.splice(Math.min(i, P.productos.length), 0, p); });
  }
  if (!saved?.lista) { P.lista = DEFAULTS.lista; P.listaTramos = DEFAULTS.listaTramos; }
  P.serigrafia = DEFAULTS.serigrafia;   // the official table lives in code (_serigrafia.js)
  P.dtgTabla = DEFAULTS.dtgTabla;
  if (P.minimos && +P.minimos.serigrafia >= 50) P.minimos.serigrafia = 6;   // 100 and 50 were the old minimums: screen printing now starts at 6 pz (6–99 pz table)       // and the DTG list (_dtg.js)
  P.pod = DEFAULTS.pod;
  for (const p of P.productos) if (p.id === "pod") p.pod = true;
  for (const p of P.productos) if (DEFAULTS.productos.find((x) => x.id === p.id)?.fleece) p.fleece = true;
  return P;
}

export async function GET() {
  try {
    const saved = await getDoc("ajustes", "precios-web").catch(() => null);
    const body = { precios: mergePrecios(saved?.precios), ejemplo: saved ? saved.ejemplo !== false : true };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (e) { return fail(e); }
}
