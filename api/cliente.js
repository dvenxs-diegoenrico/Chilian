/* Public, by the order's client token (the link the advisor sends):
   GET  ?t=...                                   -> what the client may see of the order
   POST { t, accion: "aprobar"|"cambios", nombre, comentario } -> records the art decision */
import { otByToken, saveDoc, json, fail, body } from "./_lib.js";

const ETAPAS = ["arte", "aprobacion", "compra", "pantallas", "programada", "impresion", "calidad", "empaque", "embarcada", "entregada"];
const view = (ot) => ({
  id: ot.id, cliente: ot.clienteNombre || "", fechaCompromiso: ot.fechaCompromiso || "", etapa: ot.etapa || "arte", etapas: ETAPAS,
  historial: (ot.historial || []).map((h) => ({ etapa: h.etapa, fecha: h.fecha })),
  lineas: (ot.lineas || []).map((l) => ({ descripcion: l.descripcion, piezas: l.piezas, color: l.color, ubicaciones: (l.ubicaciones || []).map((u) => ({ nombre: u.nombre, colores: u.colores })) })),
  arte: { estado: ot.arte?.estado || "pendiente", archivos: (ot.arte?.archivos || []).map((a) => ({ path: a.path, name: a.name, type: a.type })), aprobadoPor: ot.arte?.aprobadoPor || "", fecha: ot.arte?.fecha || "", comentario: ot.arte?.comentario || "" },
  embarque: ot.embarque ? { paqueteria: ot.embarque.paqueteria || "", guia: ot.embarque.guia || "", rastreoUrl: ot.embarque.rastreoUrl || "", fecha: ot.embarque.fecha || "" } : null
});

export async function GET(req) {
  try {
    const ot = await otByToken(new URL(req.url).searchParams.get("t"));
    if (!ot) return json({ error: "Este enlace no es válido o ya no está activo." }, 404);
    return json({ ot: view(ot) });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const { t, accion, nombre, comentario } = await body(req, 8000);
    const ot = await otByToken(t);
    if (!ot) return json({ error: "Este enlace no es válido o ya no está activo." }, 404);
    if (!["aprobar", "cambios"].includes(accion)) return json({ error: "Acción no válida." }, 400);
    const who = String(nombre || "").trim().slice(0, 80);
    if (!who) return json({ error: "Escribe tu nombre para registrar la decisión." }, 400);
    if (accion === "cambios" && !String(comentario || "").trim()) return json({ error: "Cuéntanos qué cambio necesitas." }, 400);
    const now = new Date().toISOString();
    ot.arte = { ...(ot.arte || {}), estado: accion === "aprobar" ? "aprobada" : "cambios", aprobadoPor: who, fecha: now, comentario: String(comentario || "").slice(0, 2000) };
    ot.historial = [...(ot.historial || []), { etapa: accion === "aprobar" ? "aprobacion" : "arte", fecha: now, por: `${who} (cliente)`, nota: accion === "aprobar" ? "Arte aprobado por el cliente" : `Cambios pedidos: ${ot.arte.comentario}` }];
    if (accion === "aprobar" && ETAPAS.indexOf(ot.etapa || "arte") < ETAPAS.indexOf("compra")) ot.etapa = "compra";
    if (accion === "cambios") ot.etapa = "arte";
    const saved = await saveDoc("ots", ot, `${who} (cliente)`);
    return json({ ot: view(saved) });
  } catch (e) { return fail(e); }
}
