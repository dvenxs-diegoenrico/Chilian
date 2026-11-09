/* Online payments: Mercado Pago (Mexico: SPEI, OXXO, cards, months without interest) and
   Stripe (cards, US and international). A link pays a deposit or a balance for a request
   (SOL-…) or a quote (COT-…); the webhook records it there, notifies the team and tells the
   customer in their chat. The OS then carries the payment into the work order.

   Environment (Vercel, as Sensitive): MP_ACCESS_TOKEN (Mercado Pago, production access token),
   STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET (Stripe). Without them, no link is offered. */
import crypto from "node:crypto";
import { getDoc, saveDoc } from "./_lib.js";
import { notifySafe } from "./_push.js";
import { sendReplies } from "./_channels.js";

const env = (k) => process.env[k] || "";
export const payReady = () => ({ mp: !!env("MP_ACCESS_TOKEN"), stripe: !!env("STRIPE_SECRET_KEY"), stripeHook: !!env("STRIPE_WEBHOOK_SECRET") });
const colOf = (ref) => (String(ref).startsWith("COT-") ? "cotizaciones" : "solicitudes");

// ref: "SOL-2611-001" or "COT-…"; concept: what is being paid; base: https://site
export async function payLinks({ ref, amount, concept, base, email = "" }) {
  amount = Math.round(+amount * 100) / 100;
  if (!(amount > 0)) return [];
  const out = [], back = `${base}/pago?ref=${encodeURIComponent(ref)}`;
  if (env("MP_ACCESS_TOKEN")) {
    try {
      const r = await fetch("https://api.mercadopago.com/checkout/preferences", { method: "POST",
        headers: { authorization: "Bearer " + env("MP_ACCESS_TOKEN"), "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ items: [{ id: ref, title: String(concept).slice(0, 250), quantity: 1, unit_price: amount, currency_id: "MXN" }],
          external_reference: ref, notification_url: `${base}/api/venta?webhook=mp`, statement_descriptor: "CHILIAN",
          back_urls: { success: back + "&estado=ok", pending: back + "&estado=pendiente", failure: back + "&estado=error" }, auto_return: "approved",
          ...(email ? { payer: { email } } : {}) }) });
      const j = await r.json();
      if (r.ok && j.init_point) out.push({ url: j.init_point, title: "Pagar con Mercado Pago (SPEI, OXXO, tarjeta, MSI)" });
      else console.error("mp", r.status, j.message);
    } catch (e) { console.error("mp", e.message); }
  }
  if (env("STRIPE_SECRET_KEY")) {
    try {
      const f = new URLSearchParams({ mode: "payment", client_reference_id: ref, "metadata[ref]": ref, "metadata[concepto]": String(concept).slice(0, 400),
        "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "mxn", "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
        "line_items[0][price_data][product_data][name]": String(concept).slice(0, 250), success_url: back + "&estado=ok", cancel_url: back + "&estado=cancelado" });
      if (email) f.set("customer_email", email);
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: "Bearer " + env("STRIPE_SECRET_KEY"), "content-type": "application/x-www-form-urlencoded" }, body: f });
      const j = await r.json();
      if (r.ok && j.url) out.push({ url: j.url, title: "Pagar con tarjeta (Stripe)" });
      else console.error("stripe", r.status, j.error?.message);
    } catch (e) { console.error("stripe", e.message); }
  }
  return out;
}

// Record a confirmed payment once (by its provider reference).
export async function recordPayment({ ref, monto, metodo, pid, concepto = "" }) {
  const col = colOf(ref);
  for (let i = 0; i < 4; i++) {
    const doc = await getDoc(col, ref);
    if (!doc) return false;
    if ((doc.pagos || []).some((p) => p.pid === pid)) return true;
    const pago = { monto: Math.round(+monto * 100) / 100, metodo, fecha: new Date().toISOString().slice(0, 10), nota: `${concepto || "Pago en línea"} · ${pid}`.slice(0, 200), por: metodo, pid, enLinea: true };
    const next = { ...doc, pagos: [...(doc.pagos || []), pago], pagadoEnLinea: true };
    const thanks = { text: `¡Pago recibido! ${pago.monto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} con ${metodo}. Ya quedó registrado en tu pedido; te pedimos tu logo o arte para preparar la prueba de aprobación.` };
    if (col === "solicitudes") next.mensajes = [...(doc.mensajes || []), { de: "bot", por: "Asistente Chilian", texto: thanks.text, fecha: new Date().toISOString() }].slice(-200);
    try {
      await saveDoc(col, next, metodo, { base: doc.updatedAt });
      await notifySafe("all", { title: `Pago recibido: ${ref}`, body: `${doc.nombre || doc.cliente || ""} · ${pago.monto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} con ${metodo}`, url: col === "solicitudes" ? "#solicitudes" : "#cotizacion/" + ref, tag: "pago-" + pid, urgent: true });
      if (col === "solicitudes") await sendReplies(doc, [thanks]).catch(() => {});
      return true;
    } catch (e) { if (e.status !== 409) throw e; }
  }
  return false;
}

// Mercado Pago tells us a payment id; we ask Mercado Pago for it (the answer is the proof).
export async function mpWebhook(url, bodyText) {
  if (!env("MP_ACCESS_TOKEN")) return;
  let b = {}; try { b = JSON.parse(bodyText || "{}"); } catch {}
  const q = new URL(url).searchParams;
  const type = b.type || b.topic || q.get("type") || q.get("topic"), id = b.data?.id || q.get("data.id") || q.get("id");
  if (type !== "payment" || !id) return;
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, { headers: { authorization: "Bearer " + env("MP_ACCESS_TOKEN") } });
  if (!r.ok) return;
  const p = await r.json();
  if (p.status === "approved" && p.external_reference) await recordPayment({ ref: p.external_reference, monto: p.transaction_amount, metodo: "Mercado Pago", pid: "mp-" + p.id, concepto: p.description });
}

// Stripe signs its webhooks: t=…,v1=HMAC_SHA256(secret, `${t}.${body}`)
export async function stripeWebhook(sigHeader, bodyText) {
  const secret = env("STRIPE_WEBHOOK_SECRET"); if (!secret || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((x) => x.split("=")));
  const want = crypto.createHmac("sha256", secret).update(`${parts.t}.${bodyText}`).digest("hex");
  const ok = parts.v1 && parts.v1.length === want.length && crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(want)) && Math.abs(Date.now() / 1000 - +parts.t) < 600;
  if (!ok) return false;
  const ev = JSON.parse(bodyText);
  if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
    const s = ev.data.object;
    if (s.payment_status === "paid") await recordPayment({ ref: s.client_reference_id || s.metadata?.ref, monto: s.amount_total / 100, metodo: "Stripe", pid: "st-" + (s.payment_intent || s.id), concepto: s.metadata?.concepto });
  }
  return true;
}
