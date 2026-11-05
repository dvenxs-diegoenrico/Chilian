/* The team's records (signed in only).
   GET    ?col=ots             -> { docs: [...] }
   GET    ?col=ots&id=OT-...   -> { doc }
   POST   { col, doc, base }   -> { doc }       (base = updatedAt the edit started from)
   DELETE ?col=ots&id=OT-...   -> { ok: true } */
import { notifySafe } from "./_push.js";
import { COLLECTIONS, sessionOf, listDocs, getDoc, saveDoc, deleteDoc, json, fail, body } from "./_lib.js";

const guard = async (req) => {
  const s = await sessionOf(req);
  if (!s) throw Object.assign(new Error("Tu sesión terminó. Vuelve a entrar."), { status: 401 });
  return s;
};
const colOf = (c) => {
  if (!COLLECTIONS.includes(c)) throw Object.assign(new Error("Colección no válida"), { status: 400 });
  return c;
};

export async function GET(req) {
  try {
    await guard(req);
    const q = new URL(req.url).searchParams, col = colOf(q.get("col"));
    if (q.get("id")) return json({ doc: await getDoc(col, q.get("id")) });
    return json({ docs: await listDocs(col) });
  } catch (e) { return fail(e); }
}

// Someone gets work assigned by someone else: a notification on their devices.
async function assigned(col, prev, d, s) {
  const who = col === "cuentas" ? d.responsable : d.asesor;
  if (!who || who === s.name || (prev && (col === "cuentas" ? prev.responsable : prev.asesor) === who)) return;
  const msg = col === "tareas" ? (d.hecha ? null : { title: `${s.name} te asignó una tarea`, body: `${d.tipo ? d.tipo + ": " : ""}${d.texto || ""}${d.fecha ? " · para el " + d.fecha.split("-").reverse().join("/") : ""}`, url: d.oportunidadId ? "#oportunidad/" + d.oportunidadId : "#tareas" })
    : col === "oportunidades" ? { title: `${s.name} te asignó una oportunidad`, body: `${d.titulo || ""}${d.proximaAccion?.texto ? " · " + d.proximaAccion.texto : ""}`, url: "#oportunidad/" + d.id }
    : col === "cuentas" ? { title: `${s.name} te hizo responsable de una cuenta`, body: d.nombre || "", url: "#cuenta/" + d.id }
    : null;
  if (msg) await notifySafe({ names: [who] }, { ...msg, tag: col + "-" + d.id }, { except: s.u });
}

export async function POST(req) {
  try {
    const s = await guard(req);
    const { col, doc, base } = await body(req, 900_000);
    if (!doc || typeof doc !== "object") return json({ error: "Falta el registro." }, 400);
    if (col === "ajustes" && s.role !== "admin") return json({ error: "Solo la cuenta principal cambia los ajustes." }, 403);
    const prev = ["tareas", "oportunidades", "cuentas", "ots"].includes(col) && doc.id ? await getDoc(col, doc.id).catch(() => null) : null;
    const saved = await saveDoc(colOf(col), doc, s.name, { base });
    await assigned(col, prev, saved, s);
    return json({ doc: saved });
  } catch (e) { return fail(e); }
}

export async function DELETE(req) {
  try {
    const s = await guard(req);
    const q = new URL(req.url).searchParams;
    if (q.get("col") === "cuentas" && s.role !== "admin") return json({ error: "Solo la cuenta principal borra cuentas." }, 403);
    await deleteDoc(colOf(q.get("col")), q.get("id"));
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
