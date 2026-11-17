// Price audit for Print on Demand: recomputes every combination by hand from the official lists
// (garment list + DTG list + service fee + pack + VAT + payment fee + shipping) and compares it with the engine.
// Run: node tools/seo/audit_pod_prices.mjs   (exit code 1 if anything differs by more than 1 cent)
import { mergePrecios } from '../../api/precios.js';
import { quote } from '../../api/_pricing.js';
import { DTG } from '../../api/_dtg.js';
import { LISTA_PLAYERAS as LISTA, LISTA_TRAMOS } from '../../api/_lista.js';

const P = mergePrecios(null);
const LT = LISTA_TRAMOS;
const tier = (q, arr) => { let i = 0; arr.forEach((x, k) => { if (q >= x) i = k; }); return i; };
const listRow = (code) => LISTA.find((r) => r.codigo === code);
const dtg = (cm, q, white) => { const s = DTG.medidas.findIndex((x) => x >= cm); return DTG[white ? 'blanca' : 'color'][s < 0 ? 8 : s][tier(q, DTG.tramos)]; };

function manual(o, col, q, cm, pk, dest) {
  const white = col === 'blanca', O = P.pod.opciones[o];
  const g = listRow(O.codigos[col]).precios[tier(q, LT)];
  let unit = g + dtg(cm, q, white);
  let pct = 0; P.pod.recargo.tramos.forEach(([f, p]) => { if (q >= f) pct = p; });
  if (pct > 0 && !white) pct += P.pod.recargo.colorExtra;
  unit *= 1 + pct / 100;
  const pack = pk ? P.pod.packs[pk] : null;
  if (pack) unit *= 1 - pack.desc / 100;
  const fin = unit * (1 + P.iva / 100) * (1 + P.cargos.comision / 100), sub = fin * q;
  let ship = null;
  const t = P.pod.envio.mx.find(([m]) => q <= m);
  if (dest === 'mx' && t) ship = pack?.envioGratis || sub >= P.pod.envio.gratisDesde ? 0 : t[1];
  return { garment: g, print: dtg(cm, q, white), pct, unitFinal: fin, sub, ship, total: sub + (ship || 0) };
}

let bad = 0, n = 0;
const rows = [];
for (const o of Object.keys(P.pod.opciones)) for (const col of ['blanca', 'color']) for (const cm of DTG.medidas)
  for (const q of [1, 2, 3, 4, 5, 6, 10, 12, 13, 20, 24, 25]) for (const pk of ['', ...Object.keys(P.pod.packs)]) for (const dest of ['mx', 'intl']) {
    if (pk && P.pod.packs[pk].piezas !== q) continue;
    const m = manual(o, col, q, cm, pk, dest);
    const e = quote(P, { prod: 'pod', pod: o, color: col, qty: q, dcm: cm, locs: 1, pack: pk, dest });
    n++;
    const ship = e.envioCotizar ? null : e.envio;
    const diff = Math.abs(e.unitFinal - Math.round(m.unitFinal * 100) / 100) > 0.011 || Math.abs(e.totalFinal - Math.round(m.total * 100) / 100) > 0.02 || ship !== m.ship;
    if (diff) { bad++; if (bad < 15) console.log('DIFF', o, col, cm, q, pk, dest, 'engine', e.unitFinal, e.totalFinal, ship, 'manual', m.unitFinal.toFixed(2), m.total.toFixed(2), m.ship); }
    if (cm === 27 && dest === 'mx' && (q === 1 || pk)) rows.push([o, col, q, pk || '-', m.garment, m.print, m.pct + '%', m.unitFinal.toFixed(2), m.sub.toFixed(2), m.ship, m.total.toFixed(2)]);
  }
console.log(`${n} combinations checked, ${bad} differences`);
console.log('option | color | pcs | pack | garment list | DTG list | fee | final/pc | subtotal | ship | total');
rows.forEach((r) => console.log(r.join(' | ')));
process.exit(bad ? 1 : 0);
