/* Print on Demand, fulfilled without anyone typing it in: when the payment of a Print on Demand request is confirmed
   (Mercado Pago or Stripe), the work order (OT) is created and a task reminds the team to ask for the art and the sizes.
   The OS then shows it in «Cola POD», batched with the other orders of the same garment, color and print size.
   Idempotent: a request that already has its OT is left alone. */
import { getDoc, saveDoc } from "./_lib.js";

const SIZES = ["CH", "M", "G", "EG", "2EG", "3EG"];
const today = () => new Date().toISOString().slice(0, 10);
function workDays(n, from = new Date()) { const d = new Date(from); d.setHours(12, 0, 0, 0); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; } return d.toISOString().slice(0, 10); }
export const isPod = (doc) => doc?.bot?.cot?.d?.prod === "pod" || (doc?.estimados || []).some((e) => e.producto === "pod");

export function podOtDoc(doc) {
  const c = doc.bot?.cot || {}, d = c.d || {}, e = (doc.estimados || [])[0] || {};
  const opcion = d.pod || e.pod || "regular", color = d.color || e.color || "blanca", dcm = d.dcm || 27, piezas = +(d.qty || e.piezas || doc.piezas || 1), locs = Math.max(1, +(d.locs || e.ubicaciones || 1));
  const nombres = { regular: "Regular", oversized: "Oversized", economica: "Económica" };
  return {
    solicitudId: doc.id, cuentaId: doc.cuentaId || "", clienteNombre: doc.nombre || "Cliente Print on Demand", etapa: "arte", prioridad: "normal", pod: true,
    podInfo: { opcion, color, dcm, pack: d.pack || "", destino: d.dest || "mx", ubicaciones: locs },
    fechaCompromiso: workDays(5), tokenCliente: Array.from({ length: 3 }, () => Math.random().toString(36).slice(2, 10)).join(""),
    lineas: [{ id: "pod1", descripcion: `Print on Demand ${nombres[opcion] || opcion} ${color === "blanca" ? "blanca" : "de color"}${d.pack ? " · " + d.pack : ""}`, modelo: e.prenda || c.prenda || "", color: color === "blanca" ? "Blanca" : "", piezas,
      ubicaciones: Array.from({ length: locs }, (_, i) => ({ nombre: i ? `Ubicación ${i + 1}` : "Frente", tecnica: "dtg", oscura: color !== "blanca", colores: 0, tintas: "", cm: dcm })), tallas: Object.fromEntries(SIZES.map((s) => [s, 0])) }],
    total: +(c.totalFinal || e.totalFinal || 0), anticipo: 100,
    pagos: (doc.pagos || []).map((p) => ({ ...p })), notas: `Pedido Print on Demand de ${doc.id}. Pedir al cliente el arte (PNG 300 DPI) y las tallas.${d.dest === "intl" ? " Envío fuera de México: cotizar flete." : ""}`,
    arte: { estado: "pendiente", archivos: [] }, programacion: [], merma: [],
    historial: [{ etapa: "arte", fecha: new Date().toISOString(), por: "Sistema", nota: `Creada solo al confirmarse el pago de ${doc.id}` }]
  };
}

// Called after a payment is recorded on a request. Returns the OT id, or "" if there was nothing to do.
export async function crearOtPod(solId) {
  const doc = await getDoc("solicitudes", solId);
  if (!doc || !isPod(doc) || doc.otId || !(doc.pagos || []).length) return "";
  const ot = await saveDoc("ots", podOtDoc(doc), "Sistema");
  await saveDoc("solicitudes", { ...(await getDoc("solicitudes", solId)), otId: ot.id, estado: "convertida" }, "Sistema").catch(() => {});
  await saveDoc("tareas", { tipo: "WhatsApp", texto: `Print on Demand ${ot.id}: pedir el arte y las tallas a ${doc.nombre || "el cliente"}`, fecha: today(), solicitudId: solId, otId: ot.id, asesor: "" }, "Sistema").catch(() => {});
  return ot.id;
}
