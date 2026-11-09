/* Send the assistant's replies to the customer's channel, with buttons where the channel has them.
   WhatsApp: up to 3 buttons, or a list of up to 10; Instagram and Messenger: quick replies.
   Web chat: nothing to send, the page reads the conversation. Returns the message ids. */
const FB = process.env.FB_GRAPH_URL || "https://graph.facebook.com/v21.0";
const IG = process.env.IG_GRAPH_URL || "https://graph.instagram.com/v21.0";
const env = (k) => process.env[k] || "";
const cut = (s, n) => String(s || "").slice(0, n);

const asText = (r) => [r.text, ...(r.links || []).map((l) => `${l.title}: ${l.url}`)].filter(Boolean).join("\n\n");

async function post(url, token, body) {
  try {
    const res = await fetch(url, { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) console.error("channel send", res.status, j.error?.message);
    return j.messages?.[0]?.id || j.message_id || "";
  } catch (e) { console.error("channel send", e.message); return ""; }
}

export async function sendReplies(doc, replies) {
  const ids = [];
  for (const r of replies) {
    if (doc.waId && env("WA_ACCESS_TOKEN")) {
      const b = r.buttons || [];
      const msg = !b.length ? { type: "text", text: { body: cut(asText(r), 4096), preview_url: true } }
        : b.length <= 3 ? { type: "interactive", interactive: { type: "button", body: { text: cut(asText(r), 1024) }, action: { buttons: b.map((x) => ({ type: "reply", reply: { id: cut(x.id, 256), title: cut(x.title, 20) } })) } } }
        : { type: "interactive", interactive: { type: "list", body: { text: cut(asText(r), 1024) }, action: { button: "Elegir", sections: [{ title: "Opciones", rows: b.slice(0, 10).map((x) => ({ id: cut(x.id, 200), title: cut(x.title, 24) })) }] } } };
      ids.push(await post(`${FB}/${encodeURIComponent(doc.waLine)}/messages`, env("WA_ACCESS_TOKEN"), { messaging_product: "whatsapp", recipient_type: "individual", to: doc.waId, ...msg }));
    } else if ((doc.igId && env("IG_ACCESS_TOKEN")) || (doc.fbId && env("META_PAGE_TOKEN"))) {
      const message = { text: cut(asText(r), 1000), ...(r.buttons?.length ? { quick_replies: r.buttons.slice(0, 13).map((x) => ({ content_type: "text", title: cut(x.title, 20), payload: cut(x.id, 1000) })) } : {}) };
      ids.push(doc.igId ? await post(`${IG}/me/messages`, env("IG_ACCESS_TOKEN"), { recipient: { id: doc.igId }, message })
        : await post(`${FB}/me/messages`, env("META_PAGE_TOKEN"), { recipient: { id: doc.fbId }, messaging_type: "RESPONSE", message }));
    } else ids.push("");
  }
  return ids;
}
