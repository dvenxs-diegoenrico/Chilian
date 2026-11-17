// Prices of the Print on Demand landing, from the real engine (called by build_pod.py).
import { mergePrecios } from '../../api/precios.js';
import { quote } from '../../api/_pricing.js';
const P = mergePrecios(null), out = { opciones: {}, packs: {}, envio: P.pod.envio, dias: P.dias.dtg, maxPiezas: P.pod.recargo.maxPiezas };
for (const o of ['oversized', 'regular', 'economica']) { out.opciones[o] = {}; for (const col of ['blanca', 'color']) { out.opciones[o][col] = {}; for (const q of [1, 5, 12]) { const r = quote(P, { prod: 'pod', qty: q, pod: o, dcm: 27, locs: 1, color: col }); out.opciones[o][col][q] = { unitFinal: r.unitFinal, total: r.totalFinal, envio: r.envio }; } } }
for (const [id, k] of Object.entries(P.pod.packs)) { out.packs[id] = { piezas: k.piezas, desc: k.desc, envioGratis: !!k.envioGratis }; for (const col of ['blanca', 'color']) { const r = quote(P, { prod: 'pod', qty: k.piezas, pod: 'regular', dcm: 27, locs: 1, color: col, pack: id }); out.packs[id][col] = { unitFinal: r.unitFinal, total: r.totalFinal, envio: r.envio }; } }
console.log(JSON.stringify(out));
