/* Public: the website's quote form files its request here (as well as opening
   WhatsApp), so every request lands in the team's inbox with a folio.
   POST { ... } -> { id } */
import { saveDoc, json, fail, body } from "./_lib.js";

const s = (v, n = 300) => String(v ?? "").trim().slice(0, n);

export async function POST(req) {
  try {
    const d = await body(req, 40_000);
    if (d.web) return json({ id: "ok" });                      // honeypot field: bots fill it, people never see it
    if (!s(d.nombre) || !s(d.contacto)) return json({ error: "Faltan nombre y contacto." }, 400);
    const modelos = Array.isArray(d.modelos) ? d.modelos.slice(0, 40).map((m) => ({
      id: s(m.id, 40), titulo: s(m.titulo, 120), modelos: Array.isArray(m.modelos) ? m.modelos.slice(0, 6).map((x) => s(x, 30)) : [],
      piezas: Math.max(0, parseInt(m.piezas, 10) || 0), color: s(m.color, 80), catalogo: s(m.catalogo, 10), pagina: parseInt(m.pagina, 10) || 0, tipo: s(m.tipo, 20)
    })) : [];
    const doc = {
      estado: "nueva",
      tipo: s(d.tipo, 30), tipoNombre: s(d.tipoNombre, 60), asesor: s(d.asesor, 60),
      prenda: s(d.prenda, 120), piezas: Math.max(0, parseInt(d.piezas, 10) || 0),
      tecnicas: Array.isArray(d.tecnicas) ? d.tecnicas.slice(0, 12).map((x) => s(x, 40)) : [],
      fechaNecesaria: s(d.fecha, 10), nombre: s(d.nombre, 120), empresa: s(d.empresa, 160), contacto: s(d.contacto, 160),
      notas: s(d.notas, 3000), modelos, idioma: d.idioma === "en" ? "en" : "es",
      canal: s(d.canal, 20) || "web", pagina: s(d.pagina, 300), referencia: s(d.referencia, 300),
      recibida: new Date().toISOString()
    };
    const saved = await saveDoc("solicitudes", doc, "Sitio web");
    return json({ id: saved.id });
  } catch (e) { return fail(e); }
}
