/* Artwork and mockups of an order.
   POST ?ot=OT-...&name=arte.png  (body = the file; signed in)  -> { path, name, type, size }
   GET  ?path=files/...&s=<session>   or   ?path=files/...&t=<client token of that OT> */
import { sessionOf, saveFile, readFile, otByToken, json, fail } from "./_lib.js";

const ALLOWED = /^(image\/(png|jpeg|webp|svg\+xml|gif)|application\/pdf)$/;

export async function POST(req) {
  try {
    if (!(await sessionOf(req))) return json({ error: "Tu sesión terminó. Vuelve a entrar." }, 401);
    const q = new URL(req.url).searchParams, type = (req.headers.get("content-type") || "").split(";")[0];
    if (!ALLOWED.test(type)) return json({ error: "Sube PNG, JPG, WebP, SVG o PDF." }, 415);
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length > 4_200_000) return json({ error: "El archivo pasa de 4 MB. Reduce la imagen o súbela como JPG." }, 413);
    const path = await saveFile(q.get("ot"), q.get("name"), bytes, type);
    return json({ path, name: q.get("name") || "archivo", type, size: bytes.length });
  } catch (e) { return fail(e); }
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams, p = q.get("path") || "";
    let ok = !!(await sessionOf(req));
    if (!ok && q.get("t")) {
      const ot = await otByToken(q.get("t"));
      ok = !!ot && p.startsWith(`files/${ot.id}/`);
    }
    if (!ok) return new Response("No autorizado", { status: 401 });
    const f = await readFile(p);
    if (!f) return new Response("No encontrado", { status: 404 });
    return new Response(f.stream || f.bytes, { headers: { "content-type": f.type, "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" } });
  } catch (e) { return fail(e); }
}
