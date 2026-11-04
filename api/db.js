/* The team's records (signed in only).
   GET    ?col=ots             -> { docs: [...] }
   GET    ?col=ots&id=OT-...   -> { doc }
   POST   { col, doc, base }   -> { doc }       (base = updatedAt the edit started from)
   DELETE ?col=ots&id=OT-...   -> { ok: true } */
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

export async function POST(req) {
  try {
    const s = await guard(req);
    const { col, doc, base } = await body(req, 900_000);
    if (!doc || typeof doc !== "object") return json({ error: "Falta el registro." }, 400);
    if (col === "ajustes" && s.role !== "admin") return json({ error: "Solo la cuenta principal cambia los ajustes." }, 403);
    return json({ doc: await saveDoc(colOf(col), doc, s.name, { base }) });
  } catch (e) { return fail(e); }
}

export async function DELETE(req) {
  try {
    await guard(req);
    const q = new URL(req.url).searchParams;
    await deleteDoc(colOf(q.get("col")), q.get("id"));
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
