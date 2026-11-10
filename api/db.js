/* The team's records (signed in only).
   GET    ?all=1               -> { cols: { solicitudes: [...], ... } }   (the OS loads everything with this)
   GET    ?col=ots             -> { docs: [...] }
   GET    ?col=ots&id=OT-...   -> { doc }
   POST   { col, doc, base }   -> { doc }       (base = updatedAt the edit started from)
   DELETE ?col=ots&id=OT-...   -> { ok: true } */
import { COLLECTIONS, sessionOf, listDocs, listAllDocs, getDoc, saveDoc, deleteDoc, json, fail, body } from "./_lib.js";

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
    const q = new URL(req.url).searchParams;
    if (q.get("all")) return json({ cols: await listAllDocs() });   // everything with one listing of the store
    const col = colOf(q.get("col"));
    if (q.get("id")) return json({ doc: await getDoc(col, q.get("id")) });
    return json({ docs: await listDocs(col) });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const s = await guard(req);
    const { col, doc, base } = await body(req, 900_000);
    if (!doc || typeof doc !== "object") return json({ error: "Falta el registro." }, 400);
    if (col === "ajustes" && s.role !== "admin") return json({ error: "Solo la cuenta principal cambia los ajustes." }, 403);
    const saved = await saveDoc(colOf(col), doc, s.name, { base });
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
