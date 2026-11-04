/* Public, with the permit /api/solicitud returned: the mockup and the design files a visitor
   made in Estampa tu idea, attached to their request (files/<SOL-…>/…).
   POST ?sol=SOL-…&t=<permit>&name=mockup-frente.png&tipo=mockup|diseno   (body = the image)
   Limits: PNG, JPG or WebP, 4 MB each, 8 files per request, 30 minutes after filing it. */
import { verify, getDoc, saveDoc, saveFile, json, fail } from "./_lib.js";

const ALLOWED = /^image\/(png|jpeg|webp)$/;

export async function POST(req) {
  try {
    const q = new URL(req.url).searchParams, sol = String(q.get("sol") || "");
    const permit = verify(q.get("t"));
    if (!permit || permit.sol !== sol) return json({ error: "El permiso para adjuntar venció. Manda tus archivos por WhatsApp." }, 401);
    const type = (req.headers.get("content-type") || "").split(";")[0];
    if (!ALLOWED.test(type)) return json({ error: "Solo PNG, JPG o WebP." }, 415);
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length || bytes.length > 4_200_000) return json({ error: "El archivo pasa de 4 MB." }, 413);
    const tipo = q.get("tipo") === "mockup" ? "mockup" : "diseno";
    const name = String(q.get("name") || (tipo === "mockup" ? "mockup.png" : "diseno.png")).slice(0, 100);
    let doc = await getDoc("solicitudes", sol);
    if (!doc) return json({ error: "No encontramos la solicitud." }, 404);
    if ((doc.adjuntos || []).length >= 8) return json({ error: "Ya se adjuntaron 8 archivos a esta solicitud." }, 429);
    const path = await saveFile(sol, name, bytes, type);
    const item = { path, name, type, size: bytes.length, tipo, fecha: new Date().toISOString() };
    // the team may be saving this request at the same moment: retry on a conflict instead of overwriting
    for (let i = 0; i < 4; i++) {
      try { doc = await saveDoc("solicitudes", { ...doc, adjuntos: [...(doc.adjuntos || []), item] }, "Sitio web", { base: doc.updatedAt }); break; }
      catch (e) { if (e.status !== 409 || i === 3) throw e; doc = e.current; }
    }
    return json({ ok: true, path });
  } catch (e) { return fail(e); }
}
