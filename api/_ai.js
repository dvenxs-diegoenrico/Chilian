/* The assistant's understanding, with Claude (only when ANTHROPIC_API_KEY is set in Vercel).
   Every free-text message goes to Claude with four functions (tools); Claude calls the ones that apply:
     registrar_pedido   what the customer said about the order (product, pieces, technique, use…)
     responder          an answer to a question about Chilian (times, minimums, techniques, process)
     calificar_cliente  how much the order is likely worth in USD, and why (company size, volume, recurrence…)
     pasar_a_asesora    licenses, brand programs, full package, complaints, invoices, or asking for a person
   Prices never come from Claude: the price engine (_pricing.js) quotes. Model: BOT_MODEL, default claude-opus-5-5. */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = () => process.env.BOT_MODEL || "claude-opus-5-5";
let client = null;
const ai = () => (client ||= new Anthropic({ timeout: 20_000, maxRetries: 1 }));
export const aiReady = () => !!process.env.ANTHROPIC_API_KEY;

const SYSTEM = `Eres el asistente de ventas de Chilian (Grupo Chilian), planta de serigrafía, bordado y confección en Puebla, México, con más de 35 años. Atiendes por el chat del sitio, WhatsApp, Instagram y Messenger.

Tu trabajo en cada mensaje del cliente es ENTENDERLO y usar las funciones:
- registrar_pedido: siempre que el mensaje diga algo del pedido (producto, piezas, técnica, tintas, ubicaciones, tamaño de bordado, entrega, para qué es, calidad o línea, tela/composición/gramaje, quién es el cliente). Pon null en lo que no dijo. No inventes datos.
- responder: si el cliente hace una pregunta (cómo funciona, tiempos, mínimos, diferencias entre técnicas o líneas, si estampan su propia prenda, dónde están). Respuesta breve, cálida, en el idioma del cliente, de 1 a 3 frases, sin precios (los precios los calcula el sistema).
- calificar_cliente: SIEMPRE. Estima cuánto vale el pedido en dólares (USD) con lo que sabes: piezas × precio típico (playera 4–8 USD, polo 9–14, sudadera 13–20, gorra 4–6, bolsa 2–3, con impresión), y señales: empresa o marca, número de empleados o corredores, pedidos recurrentes, varios productos, fecha de evento, que esté comparando proveedores. Si no hay datos, estima bajo.
- pasar_a_asesora: si pide hablar con una persona, licencias o personajes, programas de marca o maquila, paquete completo (corte y confección), una queja, factura o un tema que no es de pedidos.

Datos de Chilian (úsalos solo si preguntan):
- Hasta 20,000 piezas al día; auditorías Disney FAMA, WRAP, SMETA, Walmart, VF, C&A.
- Técnicas: serigrafía plastisol, base agua, discharge, alta densidad, puff, glitter, brilla en la oscuridad; DTG digital (fotos, desde 1 pieza); bordado (desde 12 piezas); full print sublimado en la playera deportiva Chilian Sport (desde 100).
- Mínimos: serigrafía 50 piezas, DTG 1, bordado 12, full print 100. Marcas y OEM desde 600.
- Líneas de prenda: Básica (eventos y promociones), Clásica (uniformes y uso diario), Premium (marcas de ropa, bandas, merch premium). También estampan la prenda del cliente.
- Tiempos típicos: serigrafía 8 a 15 días hábiles, DTG 4 a 9, bordado 8 a 18, después de aprobar el arte; express con cargo.
- Proceso: cotización, muestra o prueba de arte aprobada, producción y entrega. Anticipo para arrancar.
- Planta y showroom en Santa Isabel Cholula, Puebla; asesoras de lunes a viernes de 9:00 a 19:00.

Solo hablas de Chilian y de pedidos de ropa y promocionales. Valores para registrar_pedido:
prod: playera | sport (playera deportiva Chilian Sport) | sudadera | polo | camisa | gorra | bolsa | propia (prenda del cliente)
tec: plastisol | waterbase | discharge | hd | puff | glitter | gitd | dtg | embroidery | fullprint
uso: carrera | evento | negocio | uniforme | banda | marca | regalo
perfil: experto (ya sabe tela, gramaje y sistema de impresión, o compara cotizaciones) | intermedio (sabe el producto, necesita asesoría) | explorador (no sabe qué cotizar) | cliente (ya le compra a Chilian)`;

const str = (desc, e) => ({ anyOf: [e ? { type: "string", enum: e } : { type: "string" }, { type: "null" }], description: desc });
const int = (desc) => ({ anyOf: [{ type: "integer" }, { type: "null" }], description: desc });
const obj = (props) => ({ type: "object", properties: props, required: Object.keys(props), additionalProperties: false });

const TOOLS = [
  { name: "registrar_pedido", strict: true, description: "Guarda lo que el cliente dijo de su pedido. Usa null en lo que no mencionó.",
    input_schema: obj({
      perfil: str("Tipo de cliente", ["experto", "intermedio", "explorador", "cliente"]),
      uso: str("Para qué es", ["carrera", "evento", "negocio", "uniforme", "banda", "marca", "regalo"]),
      prod: str("Producto", ["playera", "sport", "sudadera", "polo", "camisa", "gorra", "bolsa", "propia"]),
      qty: int("Piezas"),
      tec: str("Técnica", ["plastisol", "waterbase", "discharge", "hd", "puff", "glitter", "gitd", "dtg", "embroidery", "fullprint"]),
      inks: int("Número de tintas o colores del diseño (1 a 6)"),
      locs: int("Número de ubicaciones de impresión (1 a 4)"),
      emb: str("Tamaño de bordado", ["chico", "mediano", "grande"]),
      del: str("Entrega", ["estandar", "express"]),
      linea: str("Línea de prenda", ["basica", "clasica", "premium"]),
      spec: str("Tela, composición o gramaje que pidió, en sus palabras"),
      nombre: str("Nombre de la persona"),
      empresa: str("Empresa, marca o evento"),
      fecha: str("Para cuándo lo necesita, en sus palabras") }) },
  { name: "responder", strict: true, description: "Responde una pregunta del cliente sobre Chilian, sin precios.",
    input_schema: obj({ texto: { type: "string", description: "Respuesta breve en el idioma del cliente" } }) },
  { name: "calificar_cliente", strict: true, description: "Estima el valor del pedido en USD y explica por qué. Llámala en cada mensaje.",
    input_schema: obj({
      valor_usd: { type: "number", description: "Valor estimado del pedido en dólares" },
      recurrente: { type: "boolean", description: "Si parece que compraría seguido" },
      razones: { type: "array", items: { type: "string" }, description: "Señales breves en español, por ejemplo: 300 corredores, empresa con 80 empleados" } }) },
  { name: "pasar_a_asesora", strict: true, description: "Pasa la conversación a una asesora de Chilian.",
    input_schema: obj({ motivo: { type: "string", description: "Por qué, en una frase en español" } }) }
];

// conversation → Claude messages (last few turns), ending with the customer's new message and the order so far
function history(doc, text, state) {
  const msgs = [];
  for (const m of (doc.mensajes || []).slice(-10)) {
    const role = m.de === "cliente" ? "user" : "assistant", t = String(m.texto || "").slice(0, 800);
    if (!t) continue;
    if (msgs.length && msgs.at(-1).role === role) msgs.at(-1).content += "\n" + t; else msgs.push({ role, content: t });
  }
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (msgs.length && msgs.at(-1).role === "user" && msgs.at(-1).content.endsWith(text)) msgs.pop();   // the new message goes below
  msgs.push({ role: "user", content: `${text}\n\n[Pedido hasta ahora: ${JSON.stringify(state)}]` });
  return msgs;
}

export async function understand(doc, text, state) {
  if (!aiReady() || !text) return null;
  try {
    const res = await ai().beta.messages.create({
      model: MODEL(), max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",   // if the model declines, the API retries on a fallback model
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: TOOLS, tool_choice: { type: "auto" },
      messages: history(doc, text, state)
    });
    if (res.stop_reason === "refusal") return null;
    const out = { campos: {}, respuesta: "", lead: null, asesora: "" };
    for (const b of res.content) {
      if (b.type !== "tool_use") continue;
      const x = b.input || {};
      if (b.name === "registrar_pedido") for (const [k, v] of Object.entries(x)) { if (v !== null && v !== "") out.campos[k] = v; }
      else if (b.name === "responder") out.respuesta = String(x.texto || "").slice(0, 700);
      else if (b.name === "calificar_cliente") out.lead = { valorUSD: Math.max(0, +x.valor_usd || 0), recurrente: !!x.recurrente, razones: (x.razones || []).slice(0, 6).map((r) => String(r).slice(0, 120)) };
      else if (b.name === "pasar_a_asesora") out.asesora = String(x.motivo || "Pidió algo que atiende una asesora").slice(0, 200);
    }
    return out;
  } catch (e) { console.error("ai", e.status || "", e.message); return null; }
}
