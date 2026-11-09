/* Chilian · website chat ("Cotiza por chat"). The same assistant as WhatsApp and Instagram:
   it quotes step by step with buttons, sends payment links, and passes to an advisor.
   Shown when the assistant is on for the website (OS → Ajustes → Asistente de ventas),
   or on any page with ?asistente=1 (test mode; nothing reaches the public). */
(() => {
  const API = "/api/venta", KEY = "chilian-chat", qs = new URLSearchParams(location.search);
  const test = qs.get("asistente") === "1" || sessionStorage.getItem("chilian-chat-test") === "1";
  if (test) try { sessionStorage.setItem("chilian-chat-test", "1"); } catch (e) {}
  const lang = () => (document.documentElement.lang || "es").startsWith("en") ? "en" : "es";
  const T = (es, en) => (lang() === "en" ? en : es);
  let st = {}; try { st = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  let total = st.total || 0, busy = false, timer = 0, root, log, form, input;

  const css = `
  .cc-btn { position: fixed; z-index: 41; right: calc(18px + env(safe-area-inset-right, 0px)); bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    display: inline-flex; align-items: center; gap: .5rem; min-height: 48px; padding: .75rem 1.05rem; border-radius: 999px; border: 0; cursor: pointer;
    background: var(--magenta, #C9922E); color: var(--on-accent, #0B0B0B); box-shadow: 0 10px 30px rgba(0,0,0,.3);
    font: 600 .78rem var(--f-mono, "Jost", sans-serif); letter-spacing: .08em; text-transform: uppercase; }
  .cc-btn svg { width: 20px; height: 20px; }
  .cc-panel { position: fixed; z-index: 60; right: calc(16px + env(safe-area-inset-right, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    width: min(390px, calc(100vw - 32px)); height: min(620px, calc(100dvh - 32px)); display: none; flex-direction: column;
    background: var(--card, #171512); color: var(--ink, #F3EBDD); border: 1px solid rgba(243,235,221,.18); border-radius: 18px; overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,.5); font: 400 15px/1.5 var(--f-body, "Questrial", sans-serif); }
  .cc-panel.open { display: flex; }
  .cc-head { display: flex; align-items: center; gap: .7rem; padding: .85rem 1rem; border-bottom: 1px solid rgba(243,235,221,.14); }
  .cc-head b { font: 650 .95rem var(--f-display, "Jost", sans-serif); text-transform: uppercase; letter-spacing: .04em; display: block; }
  .cc-head small { color: var(--steel, #B9AF9E); font-size: .75rem; }
  .cc-head .cc-x { margin-left: auto; width: 44px; height: 44px; border: 0; background: none; color: inherit; font-size: 1.5rem; cursor: pointer; border-radius: 50%; }
  .cc-log { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: .6rem; overscroll-behavior: contain; }
  .cc-m { max-width: 86%; padding: .6rem .85rem; border-radius: 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
  .cc-m.bot, .cc-m.chilian { align-self: flex-start; background: rgba(243,235,221,.07); border-bottom-left-radius: 4px; }
  .cc-m.cliente { align-self: flex-end; background: var(--magenta, #C9922E); color: var(--on-accent, #0B0B0B); border-bottom-right-radius: 4px; }
  .cc-m .who { display: block; font-size: .7rem; color: var(--steel, #B9AF9E); margin-bottom: .15rem; }
  .cc-opts { display: flex; flex-wrap: wrap; gap: .4rem; align-self: flex-start; max-width: 100%; }
  .cc-opts button, .cc-opts a { min-height: 40px; padding: .45rem .8rem; border-radius: 999px; border: 1px solid rgba(243,235,221,.35); background: none; color: inherit;
    font: inherit; font-size: .85rem; font-weight: 500; text-align: left; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
  .cc-opts a { background: var(--magenta, #C9922E); border-color: transparent; color: var(--on-accent, #0B0B0B); font-weight: 600; }
  .cc-opts button:hover { border-color: var(--magenta, #C9922E); }
  .cc-form { display: flex; gap: .5rem; padding: .7rem; border-top: 1px solid rgba(243,235,221,.14); }
  .cc-form input { flex: 1; min-width: 0; min-height: 46px; padding: 0 .9rem; border-radius: 999px; border: 1px solid rgba(243,235,221,.25); background: rgba(0,0,0,.25); color: inherit; font: inherit; font-size: 16px; }
  .cc-form button { min-width: 46px; min-height: 46px; border-radius: 50%; border: 0; background: var(--magenta, #C9922E); color: var(--on-accent, #0B0B0B); cursor: pointer; font-size: 1.1rem; }
  .cc-typing { align-self: flex-start; color: var(--steel, #B9AF9E); font-size: .8rem; }
  .cc-test { background: #6b4d14; color: #fff; font-size: .72rem; text-align: center; padding: .25rem; }
  .cc-panel :focus-visible, .cc-btn:focus-visible { outline: 2px solid var(--magenta, #C9922E); outline-offset: 2px; }
  html.qz-on .cc-btn { opacity: 0; pointer-events: none; }
  @media (max-width: 560px) { .cc-btn .txt { display: none; } .cc-btn { padding: .85rem; } .cc-panel { right: 0; bottom: 0; width: 100vw; height: 100dvh; border-radius: 0; border: 0; } }`;

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function render(ms) {
    log.querySelectorAll(".cc-opts").forEach((o) => o.remove());   // only the latest choices stay clickable
    for (const m of ms) {
      const b = el("div", "cc-m " + (m.de || "bot"));
      if (m.de === "chilian") b.append(el("span", "who", m.por || "Chilian"));
      b.append(document.createTextNode(m.texto || ""));
      log.append(b);
    }
    const last = ms.at(-1);
    if (last && last.de !== "cliente" && (last.botones?.length || last.links?.length)) {
      const o = el("div", "cc-opts");
      for (const l of last.links || []) { const a = el("a", "", l.title); a.href = l.url; a.target = "_blank"; a.rel = "noopener"; o.append(a); }
      for (const x of last.botones || []) { const btn = el("button", "", x.title); btn.type = "button"; btn.onclick = () => send("", x.id, x.title); o.append(btn); }
      log.append(o);
    }
    log.scrollTop = log.scrollHeight;
  }

  async function call(body) {
    const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "error");
    return j;
  }

  async function send(text, button, label) {
    if (busy) return; busy = true; quietSince = Date.now();
    if (text || label) render([{ de: "cliente", texto: text || label }]);
    const typing = el("div", "cc-typing", T("Escribiendo…", "Typing…")); log.append(typing); log.scrollTop = log.scrollHeight;
    try {
      const fuente = (() => { try { return JSON.parse(sessionStorage.getItem("chilian-origen") || "{}").fuente; } catch (e) { return ""; } })();
      const j = await call({ accion: "chat", sid: st.sid, t: st.t, text, button, lang: lang(), fuente: fuente || "sitio web", prueba: test || undefined });
      st.sid = j.sid; st.t = j.t; total = st.total = j.total; save();
      typing.remove();
      render(j.mensajes.filter((m) => m.de !== "cliente"));
    } catch (e) {
      typing.remove();
      render([{ de: "bot", texto: T("No pude conectar. Inténtalo de nuevo o escríbenos por WhatsApp.", "Could not connect. Try again or message us on WhatsApp.") }]);
    } finally { busy = false; }
  }

  let quietSince = Date.now();
  async function poll() {
    if (!st.sid || busy || !root.classList.contains("open")) return;
    if (document.visibilityState !== "visible" || Date.now() - quietSince > 15 * 60_000) return;   // tab hidden or 15 min without news
    try {
      const r = await fetch(`${API}?accion=chat&sid=${encodeURIComponent(st.sid)}&t=${encodeURIComponent(st.t)}&desde=${total}`);
      if (r.status === 401 || r.status === 404) { st = {}; total = 0; save(); return; }
      const j = await r.json();
      if (j.mensajes?.length) { quietSince = Date.now(); total = st.total = j.total; save(); render(j.mensajes.filter((m) => m.de !== "cliente")); }
    } catch (e) {}
  }

  async function history() {
    if (!st.sid) return false;
    try {
      const r = await fetch(`${API}?accion=chat&sid=${encodeURIComponent(st.sid)}&t=${encodeURIComponent(st.t)}&desde=0`);
      if (!r.ok) { st = {}; total = 0; save(); return false; }
      const j = await r.json(); total = st.total = j.total; save(); render(j.mensajes); return true;
    } catch (e) { return false; }
  }

  let started = false;
  async function open() {
    root.classList.add("open"); btn.setAttribute("aria-expanded", "true");
    if (!started) { started = true; if (!(await history())) await send("", ""); }
    clearInterval(timer); timer = setInterval(poll, 8000);   // storage reads are limited: every 8 s while open
    if (matchMedia("(min-width: 561px)").matches) input.focus();
  }
  function close() { root.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); clearInterval(timer); btn.focus(); }

  let btn;
  function mount() {
    const s = el("style"); s.textContent = css; document.head.append(s);
    btn = el("button", "cc-btn"); btn.type = "button"; btn.setAttribute("aria-controls", "cc-panel"); btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
    const txt = el("span", "txt", T("Cotiza por chat", "Quote by chat")); btn.append(txt); btn.setAttribute("aria-label", txt.textContent);
    root = el("section", "cc-panel"); root.id = "cc-panel"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", T("Chat de cotización", "Quote chat"));
    if (test) root.append(el("div", "cc-test", T("Modo de prueba: el chat aún no es público", "Test mode: the chat is not public yet")));
    const head = el("div", "cc-head"), who = el("div");
    who.append(el("b", "", T("Asistente Chilian", "Chilian assistant")), el("small", "", T("Cotiza en minutos · asesoras L–V 9:00–19:00", "Quotes in minutes · advisors Mon–Fri 9am–7pm (CDMX)")));
    const x = el("button", "cc-x", "×"); x.type = "button"; x.setAttribute("aria-label", T("Cerrar", "Close")); x.onclick = close;
    head.append(who, x);
    log = el("div", "cc-log"); log.setAttribute("aria-live", "polite");
    form = el("form", "cc-form"); input = el("input"); input.placeholder = T("Escribe aquí…", "Type here…"); input.setAttribute("aria-label", T("Mensaje", "Message")); input.maxLength = 1500; input.autocomplete = "off";
    const go = el("button", "", "➤"); go.type = "submit"; go.setAttribute("aria-label", T("Enviar", "Send"));
    form.append(input, go);
    form.onsubmit = (e) => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; send(v, ""); };
    root.append(head, log, form);
    root.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    btn.onclick = () => (root.classList.contains("open") ? close() : open());
    document.body.append(btn, root);
    document.querySelectorAll("[data-chat-open]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(); }));
    window.chilianChat = { open };
  }

  async function init() {
    if (!test && !st.sid) {
      try { const r = await fetch(`${API}?accion=activo`); const j = await r.json(); if (!j.web) return; } catch (e) { return; }
    }
    mount();
  }
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", init) : init();
})();
