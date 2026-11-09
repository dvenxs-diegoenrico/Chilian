/* Public price list for the website's instant quote ("Cotiza en un minuto").
   GET -> { precios, ejemplo }   (cached 5 minutes at the edge)
   The team edits it in Chilian OS → Ajustes → Precios del cotizador web (ajustes/precios-web).
   Until then the defaults below are EXAMPLE values and the site says so. Sale prices only (MXN,
   before VAT): the plant's costs never leave the OS. */
import { getDoc, fail } from "./_lib.js";

export const DEFAULTS = {
  tramos: [50, 100, 500, 2000, 10000],   // price breaks by pieces; each list below has one price per break
  productos: [
    { id: "playera", nombre: "Playera de algodón", plural: "playeras de algodón", en: "Cotton T-shirt", pluralEn: "cotton T-shirts", precios: [98, 88, 76, 70, 65] },
    { id: "sport", nombre: "Playera deportiva Chilian Sport", plural: "playeras Chilian Sport", en: "Chilian Sport performance tee", pluralEn: "Chilian Sport tees", precios: [110, 100, 92, 86, 82], fullprint: true },
    { id: "sudadera", nombre: "Sudadera o crewneck", plural: "sudaderas", en: "Hoodie or crewneck", pluralEn: "sweatshirts", precios: [285, 265, 240, 225, 212] },
    { id: "polo", nombre: "Polo", plural: "polos", en: "Polo", pluralEn: "polos", precios: [195, 180, 165, 155, 148] },
    { id: "camisa", nombre: "Camisa de uniforme", plural: "camisas de uniforme", en: "Uniform shirt", pluralEn: "uniform shirts", precios: [340, 320, 300, 285, 270] },
    { id: "gorra", nombre: "Gorra", plural: "gorras", en: "Cap", pluralEn: "caps", precios: [78, 70, 62, 57, 53], nodtg: true },
    { id: "bolsa", nombre: "Bolsa de tela", plural: "bolsas de tela", en: "Tote bag", pluralEn: "tote bags", precios: [45, 40, 34, 31, 29] },
    { id: "propia", nombre: "Mi prenda (la envío yo)", plural: "prendas del cliente", en: "My own garment (I ship it)", pluralEn: "customer garments", precios: [0, 0, 0, 0, 0] }
  ],
  // Chilian Sport Full Print: the price breaks published in the Chilian store (garment + sublimation)
  fullprint: { tramos: [100, 300, 1000, 3000, 10000], precios: [310.8, 199.8, 177.6, 155.4, 133.2] },
  tinta: [9, 6.5, 2.4, 1.6, 1.2],          // screen printing: per ink, per location, per piece
  baseUbicacion: [3, 2, 1, 0.8, 0.6],      // per location, per piece
  pantalla: 380,                           // per screen (one per ink and location), spread over the run
  especiales: { plastisol: 0, waterbase: 0.8, discharge: 1.6, hd: 2.5, puff: 2, glitter: 3, gitd: 3.5 },   // extra per location
  dtg: [85, 75, 65, 60, 58],               // per location, per piece
  bordado: { chico: [32, 28, 24, 22, 20], mediano: [55, 48, 42, 38, 35], grande: [95, 85, 75, 68, 62] },   // per location
  ponchado: 450,                           // digitizing, per design (one per location)
  express: 18, diasExpress: 3,             // % surcharge and business days saved
  dias: { serigrafia: [[2000, 8], [10000, 10], [1e9, 15]], dtg: [[100, 4], [500, 6], [1e9, 9]], bordado: [[500, 8], [3000, 12], [1e9, 18]], full: [[1000, 12], [5000, 15], [1e9, 20]] },
  minimos: { serigrafia: 50, dtg: 1, bordado: 12, full: 100 },
  iva: 16,
  // Garment lines (Básica, Clásica, Premium). "factor" multiplies the garment price above (Clásica = the
  // price in the list). The specs are what the assistant tells customers; EXAMPLES until Chilian confirms them.
  lineas: {
    basica: { nombre: "Básica", en: "Basic", factor: 0.85, para: "eventos, promociones y activaciones", paraEn: "events, promotions and activations" },
    clasica: { nombre: "Clásica", en: "Classic", factor: 1, para: "uniformes, equipos y merch de uso diario", paraEn: "uniforms, teams and everyday merch" },
    premium: { nombre: "Premium", en: "Premium", factor: 1.4, para: "marcas de ropa, bandas y merch premium", paraEn: "apparel brands, bands and premium merch" }
  },
  specs: {   // per product and line: fabric and weight
    playera: { basica: "50 % algodón 50 % poliéster · 140–150 g/m²", clasica: "100 % algodón peinado · 160–165 g/m²", premium: "100 % algodón peinado peso completo · 190–220 g/m², corte regular u oversize" },
    sudadera: { basica: "50 % algodón 50 % poliéster afelpada · 240 g/m²", clasica: "80 % algodón 20 % poliéster · 280 g/m²", premium: "100 % algodón french terry · 330 g/m² o más" },
    polo: { basica: "Piqué 50 % algodón 50 % poliéster · 180 g/m²", clasica: "Piqué 100 % algodón · 200 g/m²", premium: "Piqué algodón peinado · 220 g/m², o dry fit premium" }
  }
};

const merge = (d, s) => {
  if (!s || typeof s !== "object" || Array.isArray(d)) return s ?? d;
  const out = { ...d };
  for (const k of Object.keys(s)) out[k] = d[k] && typeof d[k] === "object" && !Array.isArray(d[k]) ? merge(d[k], s[k]) : s[k];
  return out;
};

export async function GET() {
  try {
    const saved = await getDoc("ajustes", "precios-web").catch(() => null);
    const body = { precios: merge(DEFAULTS, saved?.precios), ejemplo: saved ? saved.ejemplo !== false : true };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (e) { return fail(e); }
}
