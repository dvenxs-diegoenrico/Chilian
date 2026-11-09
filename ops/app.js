/* =====================================================================
   CHILIAN OS · from the first contact to the shipped box
   ---------------------------------------------------------------------
   One page, hash routes. Every record lives in /api/db (private Vercel
   Blob). The website's quote form files requests in "solicitudes".

   Flow: Solicitud (web) or prospect -> Oportunidad (CRM, cadence, score)
         -> Cotización (price, margin, press minutes) -> OT (work order,
         barcode, art approval, press schedule, scans by station)
         -> Embarque (carrier, tracking link for the client).
   ===================================================================== */
(() => {
  "use strict";

  /* ---------------- constants ---------------- */
  const OPP_STAGES = [
    { id: "nuevo", name: "Nuevo", p: 5 }, { id: "contactado", name: "Contactado", p: 10 }, { id: "calificado", name: "Calificado", p: 25 },
    { id: "cotizacion", name: "Cotización enviada", p: 50 }, { id: "negociacion", name: "Negociación", p: 70 },
    { id: "ganado", name: "Ganado", p: 100 }, { id: "perdido", name: "Perdido", p: 0 }
  ];
  const SEGMENTS = [
    { id: "marca", name: "Marca / OEM" }, { id: "usa", name: "Marca de EE. UU." }, { id: "uniformes", name: "Uniformes" }, { id: "merch", name: "Merch / artista" },
    { id: "promo", name: "Eventos y promocionales" }, { id: "campana", name: "Campaña política" }, { id: "distribuidor", name: "Distribuidor" }
  ];
  // Where a client comes from. Internet and the people/channels that are not internet.
  const SOURCE_GROUPS = [
    ["Por internet", ["Sitio web", "Instagram", "Facebook", "WhatsApp", "TikTok", "Google", "Redes sociales"]],
    ["Sin internet", ["Cliente actual (ya retenido)", "Contacto personal", "Referido", "Llamada o visita", "Feria o evento", "Distribuidor", "Prospección", "Otro"]]
  ];
  const SOURCES = SOURCE_GROUPS.flatMap(([, xs]) => xs);
  const SOURCE_ALIAS = { "Cliente actual": "Cliente actual (ya retenido)", "Feria": "Feria o evento" };
  const srcOf = (v) => SOURCE_ALIAS[v] || v || "";
  // <select> with the sources in two groups; keeps an older value that is not on the list
  const sourceSelect = (attrs, value) => {
    const v = srcOf(value);
    return h("select", { class: "i", ...attrs }, !v ? h("option", { value: "", text: "— Elige de dónde viene —" }) : null,
      v && !SOURCES.includes(v) ? h("option", { value: v, text: v, selected: true }) : null,
      SOURCE_GROUPS.map(([g, xs]) => h("optgroup", { label: g }, xs.map((x) => h("option", { value: x, text: x, selected: x === v })))));
  };
  const OT_STAGES = [
    { id: "arte", name: "Arte" }, { id: "aprobacion", name: "Aprobación" }, { id: "compra", name: "Prenda" }, { id: "pantallas", name: "Pantallas" },
    { id: "programada", name: "Programada" }, { id: "impresion", name: "Impresión" }, { id: "calidad", name: "Calidad" }, { id: "empaque", name: "Empaque" },
    { id: "embarcada", name: "Embarcada" }, { id: "entregada", name: "Entregada" }
  ];
  const STATIONS = [
    { id: "pantallas", name: "Cuarto de pantallas" }, { id: "impresion", name: "Impresión (pulpo, DTG o bordado)" }, { id: "calidad", name: "Calidad" },
    { id: "empaque", name: "Empaque" }, { id: "embarcada", name: "Embarque" }, { id: "entregada", name: "Entregado al cliente" }
  ];
  const MERMA_CAUSAS = ["Pelusa", "Registro", "Tensión de malla", "Curado", "Prenda defectuosa", "Tinta / color", "Manejo", "Otra"];
  const SIZES = ["CH", "M", "G", "EG", "2EG", "3EG"];
  const TIPOS_ACT = ["Llamada", "WhatsApp", "Correo", "Visita", "Muestra", "Reunión", "Nota", "Instagram"];

  // High-ticket fit: the accounts that fill the plant. Points add to 100.
  const SCORE = [
    { id: "volumen", text: "10,000+ piezas al año", pts: 25 },
    { id: "recurrente", text: "Pedidos recurrentes o programa anual", pts: 20 },
    { id: "auditoria", text: "Necesita planta auditada (FAMA, SMETA, WRAP…)", pts: 15 },
    { id: "decisor", text: "Hablamos con quien decide", pts: 15 },
    { id: "presupuesto", text: "Presupuesto o precio objetivo conocido", pts: 10 },
    { id: "fecha", text: "Lo necesita en los próximos 90 días", pts: 10 },
    { id: "segmento", text: "Segmento prioritario (marca, EE. UU., campaña, distribuidor)", pts: 5 }
  ];
  const tierOf = (s) => (s >= 70 ? "A" : s >= 40 ? "B" : "C");

  // A 21-day, 8-touch cadence for high-ticket accounts. {n} = contact, {e} = company, {a} = advisor.
  const CADENCE = [
    { d: 0, tipo: "Llamada", texto: "Llamada de descubrimiento: volumen anual, fechas, prendas, quién decide." },
    { d: 1, tipo: "Correo", texto: "Correo con credenciales: auditorías, capacidad (20,000/día), casos de licencias y propuesta de visita." },
    { d: 3, tipo: "WhatsApp", texto: "WhatsApp corto con un trabajo similar al suyo (foto o video de la planta)." },
    { d: 6, tipo: "LinkedIn", texto: "Conectar con el decisor y con compras en LinkedIn." },
    { d: 9, tipo: "Muestra", texto: "Ofrecer muestra física con su arte o un mockup en Estampa tu idea." },
    { d: 13, tipo: "Visita", texto: "Invitar a visitar la planta y el showroom (o videollamada desde el piso)." },
    { d: 17, tipo: "Correo", texto: "Propuesta de programa: precio por volumen, capacidad apartada y calendario de entregas." },
    { d: 21, tipo: "Llamada", texto: "Llamada de cierre o de pausa: ¿seguimos, cambiamos fecha o cerramos?" }
  ];
  const TEMPLATES = [
    { id: "wa1", name: "Primer WhatsApp (marca)", text: "Hola {n}, soy {a} de Chilian Screen Printing, en Puebla. Estampamos para marcas como The North Face, Vans y licencias Disney, en una planta auditada (FAMA, SMETA, WRAP) con capacidad de 20,000 piezas al día. ¿Te puedo mandar un par de trabajos parecidos a lo que hace {e}?" },
    { id: "mail1", name: "Correo de credenciales", text: "Asunto: Capacidad de estampado auditada para {e}\n\nHola {n}:\n\nTe escribo de Chilian Screen Printing (Puebla, México). Somos una planta de serigrafía con 8 pulpos automáticos Roq y M&R, hasta 20,000 piezas al día y auditorías Disney FAMA, SMETA, Walmart, WRAP, VF y C&A.\n\nTrabajamos programas de marca, uniformes y campañas con muestra física antes de producir. Si te sirve, te propongo una llamada de 15 minutos para entender volumen y fechas, o una visita a la planta.\n\nSaludos,\n{a}\nGrupo Chilian · grupochilian.com.mx" },
    { id: "usa1", name: "First email (US brand)", text: "Subject: Audited print partner in Mexico for {e}\n\nHi {n},\n\nI'm {a} with Chilian Screen Printing in Puebla, Mexico. We print up to 20,000 pieces a day on 8 Roq and M&R automatics, and we're audited for Disney FAMA, SMETA, Walmart, WRAP, VF and C&A.\n\nBrands use us for quick-turn decorated basics, fleece and replenishment programs with a bilingual team in your time zone. Would a 15-minute call this week make sense?\n\nBest,\n{a}" },
    { id: "dist1", name: "Distribuidor (marca blanca)", text: "Hola {n}, soy {a} de Chilian. Tenemos un programa de maquila para distribuidores: lista de precios para distribuidor, envío ciego a tu cliente y nunca le vendemos directo. ¿Te comparto la lista y los tiempos de entrega?" },
    { id: "camp1", name: "Campaña 2027", text: "Hola {n}, soy {a} de Chilian. Para las precampañas (4 ene–12 feb) y campañas (4 abr–2 jun 2027) fabricamos playeras, gorras y banderas textiles en volumen, con factura y planta formal. Podemos apartar capacidad por semana de entrega con anticipo. ¿Te mando paquetes y precios?" },
    { id: "seg1", name: "Seguimiento de cotización", text: "Hola {n}, ¿pudiste revisar la cotización {c}? Si la aprobamos esta semana, aparto el pulpo para tu fecha y te mando la muestra física. ¿Ajustamos algo de cantidades o colores?" }
  ];
  const PROSPECT_SOURCES = [
    { seg: "Marcas de ropa en México", where: "Instagram y TikTok de marcas con 20k+ seguidores, Expo Moda, tiendas en Liverpool y Palacio, directorio de Canaive." },
    { seg: "Marcas de EE. UU.", where: "Impressions Expo (Long Beach 21–23 ene 2027, Atlantic City 17–20 mar), expositores de MAGIC, LinkedIn: 'sourcing manager apparel', marcas en Shopify con producción en Asia." },
    { seg: "Distribuidores de promocionales", where: "ASI y PPAI (directorios), distribuidores en CDMX, Monterrey y Guadalajara, agencias BTL." },
    { seg: "Uniformes corporativos", where: "Parques industriales de Puebla y Tlaxcala, cadenas de restaurantes, hospitales, escuelas privadas, constructoras; compras de RH." },
    { seg: "Campañas 2027", where: "Dirigencias estatales de partidos, coordinadores de campaña, agencias de comunicación política (todas las fuerzas, mismas condiciones)." },
    { seg: "Merch de artistas y creadores", where: "Managers y booking de giras, festivales, creadores con tienda propia, disqueras independientes." }
  ];
  const DEFAULT_SETTINGS = {
    id: "general",
    equipo: ["Federico Chilian", "Carlos Lecona", "Iván Chilian", "Elizabeth Rojano", "Jenny Castro", "Martha Orta", "Itzel González"],
    pulpos: [
      { id: "p1", nombre: "Roq Oval Run XL+", paletas: 36, colores: 12 }, { id: "p2", nombre: "M&R VictoryOne Plus", paletas: 28, colores: 12 },
      { id: "p3", nombre: "Roq ECO XL", paletas: 18, colores: 14 }, { id: "p4", nombre: "Roq ECO", paletas: 16, colores: 14 },
      { id: "p5", nombre: "Roq You XL (1)", paletas: 14, colores: 12 }, { id: "p6", nombre: "Roq You XL (2)", paletas: 14, colores: 12 },
      { id: "p7", nombre: "M&R Sportsman EX", paletas: 14, colores: 12 }, { id: "p8", nombre: "M&R Gauntlet R/S", paletas: 10, colores: 5 },
      { id: "d1", nombre: "DTG 1", tipo: "dtg", cabezas: 1 }, { id: "d2", nombre: "DTG 2", tipo: "dtg", cabezas: 1 },
      { id: "b1", nombre: "Bordadora 6 cabezas", tipo: "bordado", cabezas: 6 }
    ],
    turno: { horas: 9, turnos: 1, uso: 85, dias: [1, 2, 3, 4, 5] },
    // Chilian's WhatsApp lines, as published on the site (each advisor's line)
    whatsapps: [
      { wa: "522226925404", numero: "222 692 5404", linea: "Carlos Lecona · marcas, OEM y general" },
      { wa: "525525599348", numero: "55 2559 9348", linea: "Iván Chilian · EE. UU." },
      { wa: "522201759053", numero: "220 175 9053", linea: "Ventas · uniformes y promocionales (Elizabeth, Martha, Jenny)" },
      { wa: "522226512650", numero: "222 651 2650", linea: "Itzel González · merch y marketing" }
    ],
    tarifas: {
      descVol: [[1, 0], [100, 0], [500, 3], [1000, 5], [5000, 8], [20000, 10]], expressPct: 30, factor: 1.4, margenPrenda: 20, margenEstampado: 30,
      ajusteTabla: 0, tablaTintas: null, costoPantalla: 350, minPantalla: 7, transicion: 10, impHora: 400, iva: 16, anticipo: 50, vigencia: 15,
      // DTG (one garment at a time) and embroidery (one cycle = one garment per head)
      minDTG: 3, minDTGOscura: 4.5, setupDTG: 5, rpmBordado: 750, efBordado: 75, minAro: 1.5, setupBordado: 15,
      ejemploDB: true, costoMilPuntadas: 3, costoPonchado: 450, margenBordado: 40, dtgCostos: { 100: 28, 300: 48, 600: 75, 1200: 115 }, dtgOscura: 18, margenDTG: 40
    }
  };

  /* ---------------- state + helpers ---------------- */
  const S = { token: "", name: "", usuario: "", role: "", users: [], data: {}, loadedAt: 0, settings: structuredClone(DEFAULT_SETTINGS) };
  // The people who can own tasks and clients: the active team accounts.
  const team = () => { const names = S.users.filter((u) => u.active).map((u) => u.name); return names.length ? names : [S.name]; };
  const persistSession = () => store.set("chilian-os", JSON.stringify({ token: S.token, name: S.name, usuario: S.usuario, role: S.role }));
  const COLS = ["solicitudes", "cuentas", "oportunidades", "tareas", "cotizaciones", "ots", "ajustes"];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function h(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "value") n.value = v;
      else if (k === "checked") n.checked = !!v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat(Infinity)) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
    return n;
  }
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
  const fmtN = (n, d = 0) => (Number(n) || 0).toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
  const money = (n) => "$" + fmtN(n, 2);
  const moneyK = (n) => (Math.abs(n) >= 1e6 ? "$" + fmtN(n / 1e6, 1) + " M" : Math.abs(n) >= 1e4 ? "$" + fmtN(n / 1e3, 0) + " k" : money(n));
  const today = () => new Date().toISOString().slice(0, 10);
  const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00"); d.setDate(d.getDate() + n); return localDate(d); };
  const fmtDate = (iso) => (iso ? new Date(iso.length <= 10 ? iso + "T12:00" : iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—");
  const fmtDT = (iso) => (iso ? new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
  const dueClass = (iso) => (!iso ? "" : iso < localDate() ? "due-late" : iso === localDate() ? "due-today" : "");
  const rid = () => Math.random().toString(36).slice(2, 10);
  const list = (col) => [...(S.data[col]?.values() || [])];
  const byId = (col, id) => S.data[col]?.get(id);
  const stageName = (arr, id) => (arr.find((x) => x.id === id) || {}).name || id || "—";
  const segName = (id) => stageName(SEGMENTS, id);
  const cuentaName = (id) => byId("cuentas", id)?.nombre || "Sin cuenta";
  const fill = (t, vars) => t.replace(/\{(\w)\}/g, (_, k) => vars[k] ?? "");
  const waLink = (phone, text) => `https://wa.me/${String(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  const isPhone = (s) => String(s || "").replace(/\D/g, "").length >= 10;
  const isEmail = (s) => /\S+@\S+\.\S+/.test(String(s || ""));

  function toast(msg, bad = false) {
    const t = $("#toast"); t.textContent = msg; t.classList.toggle("bad", bad); t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3400);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("Copiado."); } catch { toast("No se pudo copiar; selecciona el texto y cópialo.", true); }
  }

  /* ---------------- API ---------------- */
  async function api(method, url, data, raw) {
    const opt = { method, headers: { authorization: "Bearer " + S.token } };
    if (raw) { opt.body = raw.body; opt.headers["content-type"] = raw.type; }
    else if (data !== undefined) { opt.body = JSON.stringify(data); opt.headers["content-type"] = "application/json"; }
    const r = await fetch(url, opt);
    let j = {};
    try { j = await r.json(); } catch {}
    if (r.status === 401 && S.token) { logout("Tu sesión terminó. Vuelve a entrar."); throw Object.assign(new Error("401"), { shown: true }); }
    if (!r.ok) throw Object.assign(new Error(j.error || `Error ${r.status}`), { status: r.status, current: j.current });
    return j;
  }
  async function loadAll(silent) {
    const usersP = loadUsers();
    const res = await Promise.all(COLS.map((c) => api("GET", `/api/db?col=${c}`).then((j) => [c, j.docs]).catch((e) => { if (!silent) toast(`No se pudo cargar ${c}: ${e.message}`, true); return [c, null]; })));
    for (const [c, docs] of res) if (docs) S.data[c] = new Map(docs.map((d) => [d.id, d]));
    const st = byId("ajustes", "general");
    S.settings = mergeSettings(st);
    await usersP;
    // name or role changed by the admin: this session follows
    const me = S.users.find((u) => u.username === S.usuario);
    if (me && (me.name !== S.name || me.role !== S.role)) { S.name = me.name; S.role = me.role; persistSession(); }
    S.loadedAt = Date.now();
    ensurePreQuotes();
  }
  const mergeSettings = (st) => {
    const d = structuredClone(DEFAULT_SETTINGS);
    if (!st) return d;
    return { ...d, ...st, turno: { ...d.turno, ...(st.turno || {}) }, tarifas: { ...d.tarifas, ...(st.tarifas || {}) }, whatsapps: st.whatsapps?.length ? st.whatsapps : d.whatsapps, pulpos: st.pulpos?.length ? [...st.pulpos, ...d.pulpos.filter((m) => m.tipo && !st.pulpos.some((x) => x.id === m.id || (x.tipo || "serigrafia") === m.tipo))] : d.pulpos, equipo: st.equipo?.length ? st.equipo : d.equipo };
  };
  // Save with a check: if someone saved this record meanwhile, keep theirs and say so.
  async function save(col, doc, { quiet } = {}) {
    const prev = doc.id ? byId(col, doc.id) : null;
    try {
      if (col === "oportunidades" && (!prev || prev.etapa !== doc.etapa)) doc = { ...doc, etapaDesde: new Date().toISOString() };   // for "days in stage"
      const { doc: saved } = await api("POST", "/api/db", { col, doc, base: prev?.updatedAt });
      (S.data[col] ||= new Map()).set(saved.id, saved);
      if (!quiet) toast("Guardado.");
      return saved;
    } catch (e) {
      if (e.status === 409 && e.current) {
        S.data[col].set(e.current.id, e.current);
        toast(`${e.current.updatedBy || "Alguien"} guardó este registro antes. Se cargó su versión; vuelve a aplicar tu cambio.`, true);
        render();
      } else if (e.message !== "401") toast(e.message, true);
      e.shown = true;
      throw e;
    }
  }
  async function fresh(col, id) {
    try { const { doc } = await api("GET", `/api/db?col=${col}&id=${encodeURIComponent(id)}`); if (doc) S.data[col].set(doc.id, doc); return doc || byId(col, id); } catch { return byId(col, id); }
  }
  async function remove(col, id) {
    await api("DELETE", `/api/db?col=${col}&id=${encodeURIComponent(id)}`);
    S.data[col]?.delete(id);
  }

  /* ---------------- calculations ---------------- */
  const T = () => S.settings.tarifas;
  const TECS = { serigrafia: "Serigrafía", dtg: "DTG", bordado: "Bordado" };
  const machineType = (m) => m.tipo || "serigrafia";
  const machinesOf = (tec) => S.settings.pulpos.filter((m) => machineType(m) === tec);
  const machineName = (id) => S.settings.pulpos.find((m) => m.id === id)?.nombre || id;
  const machineInfo = (m) => machineType(m) === "dtg" ? "DTG · 1 pieza a la vez" : machineType(m) === "bordado" ? `Bordado · ${m.cabezas || 6} cabezas` : `${m.paletas} paletas · ${m.colores} colores`;
  // Machine minutes of a line, per technique:
  //   screen printing: screens to set up per color, a transition, and the run;
  //   DTG: a setup and each garment printed one at a time (dark garments take pretreatment);
  //   embroidery: a setup and one cycle per round of heads (stitches ÷ speed, plus hooping).
  function lineMinutes(l) {
    const t = T(), pzs = +l.piezas || 0, out = { serigrafia: 0, dtg: 0, bordado: 0 };
    const heads = Math.max(1, ...machinesOf("bordado").map((m) => +m.cabezas || 6));
    for (const u of l.ubicaciones || []) {
      const tec = u.tecnica || "serigrafia";
      if (tec === "dtg") out.dtg += t.setupDTG + pzs * (u.oscura ? t.minDTGOscura : t.minDTG);
      else if (tec === "bordado") out.bordado += t.setupBordado + Math.ceil(pzs / heads) * ((+u.puntadas || 8000) / (t.rpmBordado * (t.efBordado / 100)) + t.minAro);
      else if (+u.colores > 0) out.serigrafia += (+u.colores) * t.minPantalla + t.transicion + (pzs / t.impHora) * 60;
    }
    return out;
  }
  function calcLinea(l) { const m = lineMinutes(l); return { minutos: m.serigrafia + m.dtg + m.bordado, porTec: m }; }
  const otMinutesBy = (ot) => (ot.lineas || []).reduce((a, l) => { const m = lineMinutes(l); for (const k in m) a[k] += m[k]; return a; }, { serigrafia: 0, dtg: 0, bordado: 0 });
  const ubText = (u) => `${u.nombre}: ${TECS[u.tecnica || "serigrafia"]}${(u.tecnica || "serigrafia") === "bordado" ? " · " + fmtN(+u.puntadas || 0) + " puntadas" : (u.tecnica || "serigrafia") === "dtg" ? (u.oscura ? " · prenda oscura" : "") : " · " + (+u.colores ? u.colores + " col." : "colores por definir")}${u.medida ? " · " + u.medida : ""}${u.tintas ? " (" + u.tintas + ")" : ""}`;
  function calcCot(q) { const c = CZ.calc(q); return { total: c.total, sub: c.base0, piezas: c.pcs, margen: c.margen }; }
  const otMinutes = (ot) => { const m = otMinutesBy(ot); return m.serigrafia + m.dtg + m.bordado; };
  const dayCapacity = () => S.settings.turno.horas * 60 * S.settings.turno.turnos * (S.settings.turno.uso / 100);
  const scoreOf = (o) => SCORE.reduce((a, s) => a + (o.score?.[s.id] ? s.pts : 0), 0);
  const oppValue = (o) => +o.valor || 0;
  const weighted = (o) => oppValue(o) * ((o.probabilidad ?? stageProb(o.etapa)) / 100);
  const stageProb = (id) => (OPP_STAGES.find((s) => s.id === id) || { p: 0 }).p;
  const workDays = (n, from = localDate()) => {
    const out = []; let d = from;
    while (out.length < n) { const wd = new Date(d + "T12:00").getDay(); if (S.settings.turno.dias.includes(wd)) out.push(d); d = addDays(d, 1); }
    return out;
  };
  // Which press fits a job: enough color heads for its biggest location, more pallets for longer runs.
  function suggestPress(ot, tec = "serigrafia") {
    const ms = machinesOf(tec); if (!ms.length) return null;
    if (tec !== "serigrafia") {   // the least loaded of its kind over the next two weeks
      const days = workDays(10), load = (m) => days.reduce((a, d) => a + loadOn(m.id, d, ot.id).reduce((x, y) => x + y.min, 0), 0);
      return [...ms].sort((a, b) => load(a) - load(b))[0];
    }
    const maxCol = Math.max(0, ...(ot.lineas || []).flatMap((l) => (l.ubicaciones || []).filter((u) => (u.tecnica || "serigrafia") === "serigrafia").map((u) => +u.colores || 0)));
    const pzs = (ot.lineas || []).reduce((a, l) => a + (+l.piezas || 0), 0);
    const fits = ms.filter((p) => p.colores >= maxCol);
    if (!fits.length) return ms[0];
    const want = pzs >= 5000 ? 28 : pzs >= 1500 ? 16 : 10;
    return fits.sort((a, b) => Math.abs(a.paletas - want) - Math.abs(b.paletas - want))[0];
  }
  // Techniques of an OT that still need a machine and a day.
  const tecOfEntry = (p) => p.tecnica || machineType(S.settings.pulpos.find((m) => m.id === p.pulpo) || {});
  function pendingTecs(ot) {
    const m = otMinutesBy(ot), done = new Set((ot.programacion || []).map(tecOfEntry));
    const need = Object.keys(m).filter((k) => m[k] > 0);
    if (!need.length) return (ot.programacion || []).length ? [] : ["serigrafia"];
    return need.filter((k) => !done.has(k));
  }
  function loadOn(pulpo, fecha, exceptOt) {
    return list("ots").filter((o) => o.id !== exceptOt && !["entregada", "embarcada"].includes(o.etapa))
      .flatMap((o) => (o.programacion || []).filter((p) => p.pulpo === pulpo && p.fecha === fecha).map((p) => ({ ot: o, min: +p.minutos || 0 })));
  }

  /* ---------------- modal ---------------- */
  function modal(title, body, onOpen) {
    const m = $("#modal"); $("#modal-title").textContent = title;
    const b = $("#modal-body"); b.replaceChildren(body);
    if (!m.open) m.showModal();
    onOpen?.(b);
    return m;
  }
  const closeModal = () => $("#modal").close();

  /* =========================== VIEWS =========================== */
  const ROUTES = {
    inicio: viewHome, avisos: viewAlerts, reportes: viewReports, solicitudes: viewInbox, pipeline: viewPipeline, oportunidad: viewOpp, cuentas: viewAccounts, cuenta: viewAccount,
    prospeccion: viewPlaybook, tareas: viewTasks, cotizaciones: viewQuotes, cotizacion: viewQuote, ots: viewOTs, ot: viewOT,
    programacion: viewSchedule, escaneo: viewScan, embarques: viewShipping, ajustes: viewSettings, equipo: viewTeam
  };
  const NAV = [
    ["inicio", "Tablero"], ["avisos", "Avisos"], ["group", "Ventas"], ["solicitudes", "Solicitudes"], ["pipeline", "Oportunidades"], ["tareas", "Tareas"], ["cuentas", "Cuentas"], ["prospeccion", "Prospección"],
    ["cotizaciones", "Cotizaciones"], ["reportes", "Reportes"], ["group", "Planta"], ["ots", "Órdenes de trabajo"], ["programacion", "Programación"], ["escaneo", "Escaneo"], ["embarques", "Embarques"],
    ["group", "Sistema"], ["equipo", "Equipo"], ["ajustes", "Ajustes"]
  ];
  const route = () => { const [r, ...rest] = (location.hash.slice(1) || "inicio").split("/"); return { r: ROUTES[r] ? r : "inicio", arg: decodeURIComponent(rest.join("/")) }; };
  const go = (hash) => { if (location.hash === "#" + hash) render(); else location.hash = hash; };

  function shell() {
    const newReq = list("solicitudes").filter((s) => s.estado === "nueva" || s.nuevoMensaje).length;
    const late = list("tareas").filter((t) => !t.hecha && t.fecha && t.fecha <= localDate() && (!t.asesor || t.asesor === S.name)).length;
    const counts = { solicitudes: newReq, tareas: late, avisos: unseenAlerts().length };
    const { r } = route(), parent = { oportunidad: "pipeline", cuenta: "cuentas", cotizacion: "cotizaciones", ot: "ots" }[r] || r;
    const side = h("aside", { class: "side", id: "side" },
      h("div", { class: "brand ch-logo", role: "img", "aria-label": "Chilian OS" }, h("img", { src: "/logos/chilian-logo-header.png", alt: "" }), h("div", {}, h("span", { class: "ch-word" }), h("span", { class: "ch-tag", text: "OS · pedidos" }))),
      h("button", { class: "side-search", type: "button", onclick: () => openSearch() }, h("span", { text: "Buscar o crear" }), h("kbd", { text: /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K" })),
      h("nav", { class: "nav", "aria-label": "Secciones" }, NAV.filter(([id]) => isAdmin() || (id !== "equipo" && id !== "ajustes")).filter(([id], i, a) => !(id === "group" && (!a[i + 1] || a[i + 1][0] === "group"))).map(([id, label]) => id === "group" ? h("div", { class: "group", text: label })
        : h("a", { href: "#" + id, class: parent === id ? "on" : "", onclick: () => $("#side").classList.remove("open") }, label, counts[id] ? h("span", { class: "count", text: counts[id] }) : null))),
      h("div", { class: "me" }, h("span", {}, S.name, h("span", { class: "muted small", text: " · " + S.usuario })), h("span", { class: "muted small", text: `Datos de ${fmtDT(new Date(S.loadedAt).toISOString())}` }),
        h("button", { type: "button", onclick: async () => { await loadAll(); render(); toast("Datos actualizados."); } }, "Actualizar datos"),
        h("button", { type: "button", onclick: () => myAccountModal() }, "Mi cuenta"),
        h("button", { type: "button", onclick: () => logout() }, "Salir")));
    return h("div", { class: "shell" }, side,
      h("div", {}, h("div", { class: "mobile-bar" }, h("button", { class: "btn sm ghost", style: "color:inherit;border-color:currentColor", type: "button", onclick: () => $("#side").classList.toggle("open") }, "Menú"), h("b", { text: "CHILIAN OS" }), h("button", { class: "btn sm ghost", style: "color:inherit;border-color:currentColor", type: "button", "aria-label": "Buscar o crear", onclick: () => openSearch() }, "Buscar")),
        h("main", { class: "main", id: "view" }),
        // phones: the five places used all day, one tap away
        h("nav", { class: "tabbar", "aria-label": "Accesos rápidos" }, [["inicio", "Inicio"], ["avisos", "Avisos"], ["solicitudes", "Solicitudes"], ["tareas", "Tareas"], ["ots", "Planta"]].map(([id, label]) =>
          h("a", { href: "#" + id, class: parent === id ? "on" : "" }, label, counts[id] ? h("b", { text: counts[id] }) : null)),
          h("button", { type: "button", onclick: () => openSearch(), "aria-label": "Buscar o crear" }, "＋"))));
  }
  function render() {
    if (!S.token) return renderLogin();
    const app = $("#app"), y = scrollY;
    app.replaceChildren(shell());
    const { r, arg } = route();
    const CRUMB = { oportunidad: ["pipeline", "Oportunidades"], cuenta: ["cuentas", "Cuentas"], cotizacion: ["cotizaciones", "Cotizaciones"], ot: ["ots", "Órdenes de trabajo"] }[r];
    try { $("#view").replaceChildren(...[CRUMB ? h("a", { class: "crumb", href: "#" + CRUMB[0], text: "← " + CRUMB[1] }) : null, ROUTES[r](arg)].filter(Boolean)); } catch (e) { console.error(e); $("#view").replaceChildren(h("div", { class: "empty", text: "Algo falló al mostrar esta vista: " + e.message })); }
    if (render.keepScroll) scrollTo(0, y); else scrollTo(0, 0);
    render.keepScroll = false;
  }
  const rerender = () => { render.keepScroll = true; render(); };
  const top = (sub, title, ...actions) => h("div", { class: "topbar" }, h("div", {}, h("div", { class: "sub", text: sub }), h("h1", { text: title })), h("div", { class: "actions" }, actions));

  /* ---------------- search everything + create anything (Ctrl/⌘ K) ---------------- */
  const QUICK = [
    ["Cotización", "Nueva cotización con su lead y origen", () => newQuoteModal()],
    ["Oportunidad", "Lead nuevo en el pipeline", () => newOppModal()],
    ["Tarea", "Para ti o para alguien del equipo", () => assignTaskModal({ asesor: S.name })],
    ["Cuenta", "Cliente o prospecto", () => accountModal()],
    ["Solicitud", "Llegó por teléfono, visita, feria, red social…", () => manualRequestModal()],
    ["OT sin cotización", "Orden directa a planta", () => manualOT()]
  ];
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function searchAll(q) {
    const k = norm(q).trim(); if (!k) return [];
    const words = k.split(/\s+/), hit = (txt) => { const n = norm(txt); return words.every((w) => n.includes(w)); };
    const out = [];
    for (const c of list("cuentas")) if (hit([c.nombre, c.ciudad, ...(c.contactos || []).map((x) => x.nombre + " " + x.contacto)].join(" "))) out.push(["Cuenta", c.nombre, `${segName(c.segmento)} · ${c.responsable || "sin responsable"}`, "cuenta/" + c.id]);
    for (const o of list("oportunidades")) if (hit(o.titulo + " " + cuentaName(o.cuentaId) + " " + (o.origen || ""))) out.push(["Oportunidad", o.titulo, `${cuentaName(o.cuentaId)} · ${stageName(OPP_STAGES, o.etapa)}`, "oportunidad/" + o.id]);
    for (const q2 of list("cotizaciones")) if (hit(q2.id + " " + CZ.clientOf(q2) + " " + (q2.lineas || []).map((l) => l.concepto).join(" "))) out.push(["Cotización", `${q2.id} · ${CZ.clientOf(q2) || "sin cliente"}`, `${q2.estado || "borrador"} · ${money(calcCot(q2).total)}`, "cotizacion/" + q2.id]);
    for (const ot of list("ots")) if (hit(ot.id + " " + (ot.clienteNombre || ""))) out.push(["OT", `${ot.id} · ${ot.clienteNombre || ""}`, `${ot.previa ? "previa" : stageName(OT_STAGES, ot.etapa)} · compromiso ${fmtDate(ot.fechaCompromiso)}`, "ot/" + ot.id]);
    for (const so of list("solicitudes")) if (hit(so.id + " " + so.nombre + " " + (so.empresa || "") + " " + (so.contacto || ""))) out.push(["Solicitud", `${so.id} · ${so.nombre}`, `${so.estado} · ${so.prenda || ""}`, "solicitudes"]);
    for (const t of list("tareas")) if (!t.hecha && hit(t.texto)) out.push(["Tarea", t.texto, `${fmtDate(t.fecha)} · ${t.asesor || "sin asignar"}`, t.oportunidadId ? "oportunidad/" + t.oportunidadId : "tareas"]);
    return out.slice(0, 40);
  }
  function openSearch() {
    if ($("#modal").open) closeModal();
    const input = h("input", { class: "i big", type: "text", enterkeyhint: "go", placeholder: "Buscar cliente, OT, cotización, oportunidad, tarea… o crear algo", autocomplete: "off" });
    const box = h("div", { class: "cmd-list", role: "listbox" });
    let items = [], at = 0;
    const paint = () => {
      const q = input.value, res = searchAll(q);
      const quick = QUICK.filter(([n]) => !q || norm("nueva nuevo crear " + n).includes(norm(q).trim()));
      items = [...res.map(([kind, title, sub, href]) => ({ kind, title, sub, run: () => go(href) })), ...quick.map(([n, sub, fn]) => ({ kind: "Crear", title: "+ " + n, sub, run: fn }))];
      at = Math.min(at, Math.max(0, items.length - 1));
      box.replaceChildren(...(items.length ? items.map((it, i) => h("button", { type: "button", class: "cmd-item" + (i === at ? " on" : ""), role: "option", onclick: () => { closeModal(); it.run(); } },
        h("span", { class: "pill " + (it.kind === "Crear" ? "p-acc" : "p-mut"), text: it.kind }), h("span", {}, h("b", { text: it.title }), h("small", { text: it.sub })))) : [h("p", { class: "muted small", text: "Nada con eso. Prueba con el nombre del cliente, el folio (COT-, OT-, SOL-) o una palabra del producto." })]));
      box.querySelector(".on")?.scrollIntoView({ block: "nearest" });
    };
    input.addEventListener("input", () => { at = 0; paint(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); at = Math.min(items.length - 1, at + 1); paint(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); at = Math.max(0, at - 1); paint(); }
      else if (e.key === "Enter" && items[at]) { e.preventDefault(); const it = items[at]; closeModal(); it.run(); }
    });
    modal("Buscar o crear", h("div", { class: "grid", style: "gap:.6rem" }, input, box, h("p", { class: "hint", text: "Atajos: Ctrl/⌘ K o / para abrir · ↑ ↓ para elegir · Enter para abrir." })));
    paint(); input.focus(); setTimeout(() => input.focus(), 30);
  }
  addEventListener("keydown", (e) => {
    if (!S.token) return;
    const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openSearch(); }
    else if (e.key === "/" && !typing && !$("#modal").open) { e.preventDefault(); openSearch(); }
  });

  /* ---------------- login ---------------- */
  function renderLogin(msg = "") {
    const err = h("p", { class: "err", text: msg });
    const form = h("form", { onsubmit: async (e) => {
      e.preventDefault(); err.textContent = "";
      const btn = form.querySelector("button"); btn.disabled = true;
      try {
        const r = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ usuario: $("#l-user").value, password: $("#l-pass").value }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "No se pudo entrar.");
        Object.assign(S, { token: j.token, name: j.name, usuario: j.usuario, role: j.role }); persistSession(); store.set("chilian-os-user", j.usuario);
        $("#app").replaceChildren(h("div", { class: "login" }, h("p", { class: "label", text: "Cargando datos…" })));
        await loadAll(); render();
      } catch (e2) { err.textContent = e2.message; btn.disabled = false; }
    } },
      h("div", { class: "ch-logo", role: "img", "aria-label": "Chilian" }, h("img", { src: "/logos/chilian-logo-header.png", alt: "" }), h("div", {}, h("span", { class: "ch-word" }), h("span", { class: "ch-tag", html: "Estampados <i>•</i> Textiles <i>•</i> Promocionales" }))),
      h("div", { class: "label", text: "Grupo Chilian · sistema interno" }), h("h1", { text: "Chilian OS" }),
      h("p", { class: "muted small", text: "Solicitudes, CRM, cotizaciones, órdenes de trabajo, programación por pulpo, escaneo y embarques." }),
      h("label", { class: "f" }, h("span", { text: "Usuario" }), h("input", { class: "i mono", id: "l-user", required: true, autocomplete: "username", autocapitalize: "none", spellcheck: "false", value: store.get("chilian-os-user") || "" })),
      h("label", { class: "f" }, h("span", { text: "Contraseña" }), h("input", { class: "i", id: "l-pass", type: "password", required: true, autocomplete: "current-password" })),
      err, h("button", { class: "btn accent", type: "submit" }, "Entrar"),
      h("p", { class: "hint", text: "¿Sin cuenta o sin contraseña? Pídela a la cuenta principal (admin1)." }));
    $("#app").replaceChildren(h("div", { class: "login" }, form));
  }
  function logout(msg) { Object.assign(S, { token: "", role: "", users: [] }); store.set("chilian-os", null); renderLogin(msg); }

  /* ---------------- home / dashboard ---------------- */
  /* ---------------- avisos: what needs attention, per person ---------------- */
  const seenKey = () => "chilian-os-vistos-" + S.usuario;
  const seenSet = () => { try { return new Set(JSON.parse(store.get(seenKey()) || "[]")); } catch { return new Set(); } };
  const saveSeen = (set) => store.set(seenKey(), JSON.stringify([...set].slice(-1500)));
  function alertsNow(scope) {
    const D = {}; for (const c of ["solicitudes", "cuentas", "oportunidades", "tareas", "cotizaciones", "ots"]) D[c] = list(c);
    return window.chilianAlerts ? window.chilianAlerts(D, { name: S.name, admin: isAdmin() }, { today: localDate(), scope: scope || "mine" }) : [];
  }
  const unseenAlerts = () => { const seen = seenSet(); return alertsNow().filter((a) => !seen.has(a.key)); };
  function viewAlerts() {
    const f = viewAlerts.f ||= { scope: "mine", cat: "", seen: false };
    const seen = seenSet(), all = alertsNow(f.scope);
    const rows = all.filter((a) => (!f.cat || a.cat === f.cat) && (f.seen || !seen.has(a.key)));
    const LV = { alta: "p-bad", media: "p-warn", baja: "p-mut" };
    const cats = window.CHILIAN_ALERT_CATS || [];
    const mark = (keys) => { const st = seenSet(); keys.forEach((k) => st.add(k)); saveSeen(st); rerender(); };
    return h("div", {}, top(`${all.filter((a) => !seen.has(a.key)).length} sin ver · ${all.length} en total`, "Avisos",
        isAdmin() ? h("select", { class: "i", style: "width:auto", onchange: (e) => { f.scope = e.target.value; rerender(); } }, [["mine", "Míos y sin asignar"], ["all", "Todo el equipo"]].map(([v, t]) => h("option", { value: v, text: t, selected: f.scope === v }))) : null,
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.cat = e.target.value; rerender(); } }, h("option", { value: "", text: "Todos los tipos" }), cats.map(([v, t]) => h("option", { value: v, text: `${t} (${all.filter((a) => a.cat === v).length})`, selected: f.cat === v }))),
        h("label", { class: "row small", style: "gap:.3rem" }, h("input", { type: "checkbox", checked: f.seen, onchange: (e) => { f.seen = e.target.checked; rerender(); } }), "Mostrar vistos"),
        rows.some((a) => !seen.has(a.key)) ? h("button", { class: "btn ghost", type: "button", onclick: () => mark(rows.map((a) => a.key)) }, "Marcar todo como visto") : null),
      pushCard(),
      rows.length ? h("div", { class: "grid", style: "gap:1rem" }, cats.filter(([id]) => rows.some((a) => a.cat === id)).map(([id, name]) => h("div", { class: "card" },
        h("h2", { text: `${name} · ${rows.filter((a) => a.cat === id).length}` }),
        h("ul", { style: "list-style:none;padding:0;margin:0;display:grid" }, rows.filter((a) => a.cat === id).map((a) => h("li", { style: "display:flex;justify-content:space-between;gap:1rem;padding:.6rem 0;border-bottom:1px solid var(--rule);align-items:start" + (seen.has(a.key) ? ";opacity:.55" : "") },
          h("a", { href: "#" + a.href, style: "color:inherit;text-decoration:none;min-width:0", onclick: () => mark([a.key]) }, h("span", { class: "pill " + LV[a.level], style: "margin-right:.5rem", text: a.level }), h("b", { text: a.title }), h("div", { class: "small muted", text: a.detail })),
          seen.has(a.key) ? null : h("button", { class: "btn sm ghost", type: "button", onclick: () => mark([a.key]) }, "Visto")))))))
        : h("div", { class: "empty", text: f.seen ? "Nada pendiente. Buen trabajo." : "Todo visto. Activa «Mostrar vistos» para ver los pendientes que siguen abiertos." }));
  }

  // Push to this phone or computer, even with the OS closed.
  const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const b64key = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map((c) => c.charCodeAt(0))); };
  const swReady = () => navigator.serviceWorker.register("/ops/sw.js", { scope: "/ops/" }).then(() => navigator.serviceWorker.ready);
  async function currentSub() { if (!pushSupported()) return null; try { const reg = await navigator.serviceWorker.getRegistration("/ops/"); return reg ? await reg.pushManager.getSubscription() : null; } catch { return null; } }
  function pushCard() {
    const box = h("div", { class: "card", style: "margin-bottom:1rem" }, h("p", { class: "small muted", text: "Revisando las notificaciones de este dispositivo…" }));
    (async () => {
      const head = h("h2", { text: "Notificaciones en este dispositivo" });
      if (!pushSupported()) return box.replaceChildren(head, h("p", { class: "small", text: isIOS() && !standalone()
        ? "En iPhone: abre este OS en Safari, toca Compartir → «Agregar a pantalla de inicio», ábrelo desde ese ícono y vuelve aquí para activar los avisos (iOS 16.4 o más reciente)."
        : "Este navegador no permite notificaciones push. Usa Chrome, Edge, Firefox o Safari actualizado." }));
      let info = {}; try { info = await api("GET", "/api/avisos?clave=1"); } catch {}
      const sub = await currentSub(), perm = Notification.permission;
      const state = sub ? "Activadas aquí" : perm === "denied" ? "Bloqueadas en este navegador" : "Apagadas aquí";
      box.replaceChildren(...[head,
        h("p", { class: "small", text: `${state}${info.devices ? ` · ${info.devices} dispositivo(s) tuyos reciben avisos` : ""}. Te llegan solicitudes y mensajes nuevos (sitio, WhatsApp, Instagram, Messenger), tareas y oportunidades que te asignan, aprobaciones del cliente y, cada mañana, el resumen de tus pendientes.` }),
        !info.ready ? h("p", { class: "small", style: "color:var(--bad,#D2452B)", text: "El servidor aún no tiene las llaves de notificaciones (VAPID). La cuenta principal las agrega en Vercel siguiendo el tutorial de Ajustes." }) : null,
        perm === "denied" ? h("p", { class: "small", text: "Las bloqueaste antes: actívalas en la configuración del sitio de tu navegador (candado junto a la dirección) y recarga." }) : null,
        h("div", { class: "row" },
          !sub && info.ready && perm !== "denied" ? h("button", { class: "btn accent", type: "button", onclick: async () => {
            try {
              if (await Notification.requestPermission() !== "granted") return toast("Sin permiso no se pueden mostrar avisos.", true);
              const reg = await swReady();
              const s2 = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64key(info.publicKey) });
              await api("POST", "/api/avisos", { accion: "suscribir", sub: s2.toJSON(), device: `${isIOS() ? "iPhone/iPad" : /Android/.test(navigator.userAgent) ? "Android" : "Computadora"} · ${new Date().toLocaleDateString("es-MX")}` });
              await api("POST", "/api/avisos", { accion: "probar" });
              toast("Avisos activados. Te mandamos uno de prueba."); rerender();
            } catch (err) { toast("No se pudieron activar: " + err.message, true); }
          } }, "Activar avisos aquí") : null,
          sub ? h("button", { class: "btn", type: "button", onclick: async () => { try { const r = await api("POST", "/api/avisos", { accion: "probar" }); toast(r.sent ? "Aviso de prueba enviado." : "No hay dispositivos activos."); } catch (err) { toast(err.message, true); } } }, "Mandar aviso de prueba") : null,
          sub ? h("button", { class: "btn ghost", type: "button", onclick: async () => { try { await api("POST", "/api/avisos", { accion: "quitar", endpoint: sub.endpoint }); await sub.unsubscribe(); toast("Avisos apagados en este dispositivo."); rerender(); } catch (err) { toast(err.message, true); } } }, "Apagar aquí") : null,
          isAdmin() && info.ready ? h("button", { class: "btn ghost", type: "button", onclick: async () => { try { const r = await api("POST", "/api/avisos", { accion: "resumen" }); toast(`Resumen enviado a ${r.sent} dispositivo(s).`); } catch (err) { toast(err.message, true); } } }, "Enviar el resumen de pendientes a todos ahora") : null)].filter(Boolean));
    })();
    return box;
  }
  // With the OS open and no push on this device: the browser's own notification for anything new.
  async function notifyLocal() {
    const key = "chilian-os-notificados-" + S.usuario;
    let done; try { done = new Set(JSON.parse(store.get(key) || "null")); } catch { done = null; }
    const now = alertsNow().filter((a) => a.level !== "baja");
    if (!done || !done.size) { store.set(key, JSON.stringify(now.map((a) => a.key))); return; }   // first time: no flood
    const fresh = now.filter((a) => !done.has(a.key)); if (!fresh.length) return;
    fresh.forEach((a) => done.add(a.key)); store.set(key, JSON.stringify([...done].slice(-2000)));
    if (!("Notification" in window) || Notification.permission !== "granted" || await currentSub()) return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration("/ops/");
      const show = (title, body, url) => (reg ? reg.showNotification(title, { body, icon: "/ops/icon-192.png", data: { url: "/ops/#" + url }, tag: url }) : new Notification(title, { body }));
      if (fresh.length > 3) show(`${fresh.length} avisos nuevos en Chilian OS`, fresh.slice(0, 3).map((a) => a.title).join(" · "), "avisos");
      else fresh.forEach((a) => show(a.title, a.detail, a.href));
    } catch {}
  }

  function viewReports() {
    const f = viewReports.f ||= { dias: "180" };
    const since = f.dias ? new Date(Date.now() - +f.dias * 864e5).toISOString() : "";
    const inRange = (d) => !since || String(d || "") >= since;
    const opps = list("oportunidades").filter((o) => inRange(o.createdAt)), quotes = list("cotizaciones").filter((q) => inRange(q.createdAt));
    const won = opps.filter((o) => o.etapa === "ganado"), lost = opps.filter((o) => o.etapa === "perdido");
    const pct = (a, b) => (b ? fmtN((a / b) * 100, 0) + " %" : "—");
    // by origin
    const srcRows = [...new Set([...SOURCES, ...opps.map(oppSource)])].map((src) => {
      const xs = opps.filter((o) => (oppSource(o) || "Sin especificar") === (src || "Sin especificar")), w = xs.filter((o) => o.etapa === "ganado"), l = xs.filter((o) => o.etapa === "perdido");
      return { src: src || "Sin especificar", n: xs.length, w: w.length, rate: pct(w.length, w.length + l.length), val: w.reduce((a, o) => a + oppValue(o), 0), open: xs.filter(OPEN_OPP).reduce((a, o) => a + oppValue(o), 0) };
    }).filter((r) => r.n).sort((a, b) => b.val - a.val || b.n - a.n);
    // funnel
    const sols = list("solicitudes").filter((x) => inRange(x.recibida || x.createdAt));
    const sent = quotes.filter((q) => ["enviada", "aceptada", "rechazada"].includes(q.estado)), acc = quotes.filter((q) => q.estado === "aceptada");
    // sales by month (accepted quotes)
    const months = {}; for (const q of list("cotizaciones").filter((q) => q.estado === "aceptada")) { const m = String(q.aceptadaEn || q.updatedAt).slice(0, 7); months[m] = (months[m] || 0) + calcCot(q).sub; }
    const monthRows = Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);
    // plant: on time and waste
    const shipped = list("ots").filter((o) => ["embarcada", "entregada"].includes(o.etapa) && inRange(o.createdAt));
    const shipDate = (o) => ((o.historial || []).find((x) => x.etapa === "embarcada") || (o.historial || []).find((x) => x.etapa === "entregada") || {}).fecha || o.updatedAt;
    const onTime = shipped.filter((o) => !o.fechaCompromiso || String(shipDate(o)).slice(0, 10) <= o.fechaCompromiso).length;
    const pzs = shipped.reduce((a, o) => a + o.lineas.reduce((x, l) => x + (+l.piezas || 0), 0), 0), merma = shipped.reduce((a, o) => a + (o.merma || []).reduce((x, m) => x + (+m.cantidad || 0), 0), 0);
    const cycle = won.filter((o) => o.cerradaEn).map((o) => (new Date(o.cerradaEn) - new Date(o.createdAt)) / 864e5);
    const reasons = {}; for (const o of lost) reasons[o.perdidaRazon || "Sin razón"] = (reasons[o.perdidaRazon || "Sin razón"] || 0) + 1;
    const kpi = (label, value, note) => h("div", { class: "kpi" }, h("span", { class: "label", text: label }), h("strong", { text: value }), note ? h("span", { class: "small muted", text: note }) : null);
    const table = (head, rows) => h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, head.map((x, i) => h("th", { class: i ? "r" : "", text: x })))), h("tbody", {}, rows.map((r) => h("tr", {}, r.map((v, i) => h("td", { class: i ? "r num" : "", text: v })))))));
    return h("div", {}, top("Ventas, origen de clientes y planta", "Reportes",
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.dias = e.target.value; rerender(); } }, [["30", "Últimos 30 días"], ["90", "Últimos 90 días"], ["180", "Últimos 6 meses"], ["365", "Último año"], ["", "Todo"]].map(([v, t]) => h("option", { value: v, text: t, selected: f.dias === v })))),
      h("div", { class: "kpis" }, kpi("Leads nuevos", fmtN(opps.length)), kpi("Tasa de cierre", pct(won.length, won.length + lost.length), `${won.length} ganadas · ${lost.length} perdidas`),
        kpi("Vendido (ganadas)", moneyK(won.reduce((a, o) => a + oppValue(o), 0))), kpi("Ciclo de venta", cycle.length ? fmtN(cycle.reduce((a, b) => a + b, 0) / cycle.length, 0) + " días" : "—", "de lead a ganado"),
        kpi("Entregas a tiempo", pct(onTime, shipped.length), `${shipped.length} OT embarcadas`), kpi("Merma", pzs ? fmtN((merma / pzs) * 100, 2) + " %" : "—", "meta 1.5 % o menos")),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "¿De dónde vienen los clientes?" }), srcRows.length ? table(["Origen", "Leads", "Ganadas", "Cierre", "Vendido", "Abierto"], srcRows.map((r) => [r.src, fmtN(r.n), fmtN(r.w), r.rate, moneyK(r.val), moneyK(r.open)])) : h("p", { class: "muted small", text: "Sin oportunidades en este periodo." })),
          h("div", { class: "card" }, h("h2", { text: "Embudo" }), table(["Paso", "Cantidad", "Conversión"], [["Solicitudes recibidas", fmtN(sols.length), "—"], ["Oportunidades (leads)", fmtN(opps.length), pct(opps.length, sols.length)], ["Cotizaciones enviadas", fmtN(sent.length), pct(sent.length, opps.length)], ["Cotizaciones aceptadas", fmtN(acc.length), pct(acc.length, sent.length)]]))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Venta por mes (cotizaciones aceptadas, sin IVA)" }), monthRows.length ? table(["Mes", "Venta"], monthRows.map(([m, v]) => [new Date(m + "-15").toLocaleDateString("es-MX", { month: "long", year: "numeric" }), money(v)])) : h("p", { class: "muted small", text: "Aún no hay cotizaciones aceptadas." })),
          h("div", { class: "card" }, h("h2", { text: "¿Por qué se pierden?" }), Object.keys(reasons).length ? table(["Razón", "Oportunidades"], Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => [r, fmtN(n)])) : h("p", { class: "muted small", text: "Ninguna perdida en este periodo." })))));
  }

  function viewHome() {
    const opps = list("oportunidades"), open = opps.filter((o) => !["ganado", "perdido"].includes(o.etapa));
    const ots = list("ots").filter((o) => !o.previa), active = ots.filter((o) => !["entregada"].includes(o.etapa));
    const lateOts = active.filter((o) => o.fechaCompromiso && o.fechaCompromiso < localDate() && o.etapa !== "embarcada");
    const quotes = list("cotizaciones"), sent = quotes.filter((c) => c.estado === "enviada");
    const won = opps.filter((o) => o.etapa === "ganado"), lost = opps.filter((o) => o.etapa === "perdido");
    const winRate = won.length + lost.length ? won.length / (won.length + lost.length) : 0;
    const newReq = list("solicitudes").filter((s) => s.estado === "nueva");
    const myTasks = list("tareas").filter((t) => !t.hecha && (!t.asesor || t.asesor === S.name)).sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
    const days = workDays(10), cap = dayCapacity() * S.settings.pulpos.length;
    const loadByDay = days.map((d) => S.settings.pulpos.reduce((a, p) => a + loadOn(p.id, d).reduce((x, y) => x + y.min, 0), 0));
    const kpi = (label, value, href, alert) => h("a", { class: "kpi" + (alert ? " alert" : ""), href: "#" + href }, h("span", { class: "label", text: label }), h("strong", { text: value }));
    const urgent = alertsNow().filter((a) => a.level === "alta");
    return h("div", {},
      urgent.length ? h("a", { class: "card", href: "#avisos", style: "display:flex;justify-content:space-between;gap:1rem;align-items:center;border-color:var(--accent,#C9922E);margin-bottom:1rem;text-decoration:none;color:inherit" },
        h("span", {}, h("b", { text: `${urgent.length} aviso${urgent.length > 1 ? "s" : ""} urgente${urgent.length > 1 ? "s" : ""}: ` }), urgent.slice(0, 2).map((a) => a.title).join(" · ") + (urgent.length > 2 ? "…" : "")),
        h("span", { class: "btn sm", text: "Ver avisos" })) : null,
      top(fmtDate(localDate()), `Hola, ${S.name.split(" ")[0]}`, h("a", { class: "btn accent", href: "#solicitudes" }, "Ver solicitudes"), h("button", { class: "btn ghost", type: "button", onclick: () => newOppModal() }, "+ Oportunidad")),
      h("div", { class: "kpis" },
        kpi("Solicitudes nuevas", fmtN(newReq.length), "solicitudes", newReq.length > 0),
        kpi("Pipeline abierto", moneyK(open.reduce((a, o) => a + oppValue(o), 0)), "pipeline"),
        kpi("Pipeline ponderado", moneyK(open.reduce((a, o) => a + weighted(o), 0)), "pipeline"),
        kpi("Cotizaciones enviadas", fmtN(sent.length), "cotizaciones"),
        kpi("Tasa de cierre", fmtN(winRate * 100) + " %", "pipeline"),
        kpi("OT en planta", fmtN(active.length), "ots"),
        kpi("OT atrasadas", fmtN(lateOts.length), "ots", lateOts.length > 0)),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Carga de planta, 10 días hábiles" }), h("a", { class: "link small", href: "#programacion" }, "Programación →")),
            h("p", { class: "hint", text: `Capacidad diaria: ${fmtN(cap)} min de máquina (${machinesOf("serigrafia").length} pulpos, ${machinesOf("dtg").length} DTG y ${machinesOf("bordado").length} bordadora; ${S.settings.turno.horas} h × ${S.settings.turno.turnos} turno(s) × ${S.settings.turno.uso} % de uso).` }),
            h("div", { class: "grid", style: "gap:.35rem" }, days.map((d, i) => {
              const pct = cap ? loadByDay[i] / cap : 0;
              return h("div", { class: "row", style: "gap:.6rem;flex-wrap:nowrap" }, h("span", { class: "num small", style: "width:6.5rem", text: new Date(d + "T12:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) }),
                h("div", { class: "load" + (pct > 1 ? " over" : pct > 0.85 ? " hi" : ""), style: "flex:1;height:10px" }, h("i", { style: `width:${Math.min(100, pct * 100)}%` })), h("span", { class: "num small", style: "width:3.5rem;text-align:right", text: fmtN(pct * 100) + " %" }));
            }))),
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Pipeline por etapa" }), h("a", { class: "link small", href: "#pipeline" }, "Tablero →")),
            h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", { text: "Etapa" }), h("th", { class: "r", text: "Oportunidades" }), h("th", { class: "r", text: "Valor" }), h("th", { class: "r", text: "Ponderado" }))),
              h("tbody", {}, OPP_STAGES.map((s) => { const xs = opps.filter((o) => o.etapa === s.id); return h("tr", {}, h("td", { text: s.name }), h("td", { class: "r num", text: fmtN(xs.length) }), h("td", { class: "r money", text: moneyK(xs.reduce((a, o) => a + oppValue(o), 0)) }), h("td", { class: "r money", text: moneyK(xs.reduce((a, o) => a + weighted(o), 0)) })); })))))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Mis tareas" }), h("a", { class: "link small", href: "#tareas" }, "Todas →")),
            myTasks.length ? h("ul", { class: "log" }, myTasks.slice(0, 8).map((t) => taskItem(t))) : h("p", { class: "muted small", text: "No tienes tareas pendientes." })),
          h("div", { class: "card" }, h("h2", { text: "Atención en planta" }),
            lateOts.length || active.some((o) => o.arte?.estado === "cambios") ? h("ul", { class: "log" },
              lateOts.map((o) => h("li", {}, h("time", { class: "due-late", text: fmtDate(o.fechaCompromiso) }), h("a", { href: "#ot/" + o.id }, `${o.id} · ${o.clienteNombre || cuentaName(o.cuentaId)} · ${stageName(OT_STAGES, o.etapa)}`))),
              active.filter((o) => o.arte?.estado === "cambios").map((o) => h("li", {}, h("time", { text: "Arte" }), h("a", { href: "#ot/" + o.id }, `${o.id}: el cliente pidió cambios`))))
              : h("p", { class: "muted small", text: "Nada atrasado. Las OT con fecha vencida o cambios de arte aparecen aquí." }))))
    );
  }
  function taskItem(t) {
    const o = t.oportunidadId ? byId("oportunidades", t.oportunidadId) : null;
    return h("li", {}, h("time", { class: dueClass(t.fecha), text: t.fecha ? fmtDate(t.fecha) : "Sin fecha" }),
      h("div", { class: "row between", style: "flex-wrap:nowrap;align-items:start" },
        h("div", {}, t.prioridad && t.prioridad !== "normal" ? h("span", { class: "pill p-bad", style: "margin-right:.35rem", text: t.prioridad }) : null, h("b", { text: t.tipo ? t.tipo + ": " : "" }), t.texto,
          o ? h("div", {}, h("a", { class: "small muted", href: "#oportunidad/" + o.id }, `${o.titulo} · ${cuentaName(o.cuentaId)}`)) : !o && t.cuentaId ? h("div", {}, h("a", { class: "small muted", href: "#cuenta/" + t.cuentaId }, cuentaName(t.cuentaId))) : null,
          t.asignadaPor && t.asignadaPor !== t.asesor ? h("div", { class: "small muted", text: `Asignada por ${t.asignadaPor}${t.asesor !== S.name ? " a " + t.asesor : ""}` }) : t.asesor && t.asesor !== S.name ? h("div", { class: "small muted", text: t.asesor }) : null),
        h("div", { class: "row", style: "gap:.3rem;flex-wrap:nowrap" },
          h("button", { class: "btn sm ghost", type: "button", onclick: async () => { await save("tareas", { ...t, hecha: true, hechaEn: new Date().toISOString() }, { quiet: true }); toast("Tarea hecha."); rerender(); } }, "Hecha"),
          h("button", { class: "btn sm ghost", type: "button", title: "Pasarla al siguiente día hábil", onclick: async () => { await save("tareas", { ...t, fecha: workDays(1, addDays(localDate(), 1))[0] }, { quiet: true }); toast("Tarea pospuesta al siguiente día hábil."); rerender(); } }, "Mañana"),
          h("button", { class: "x", type: "button", title: "Borrar tarea", "aria-label": "Borrar tarea", onclick: () => deleteTask(t) }, "×"))));
  }
  async function deleteTask(t) {
    if (!(await confirmBox(`¿Borrar la tarea «${t.texto}»? No se puede deshacer.`))) return;
    await remove("tareas", t.id); toast("Tarea borrada."); rerender();
  }

  // Where a request came from: the traffic source and the channel it was sent by.
  const FUENTES = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", google: "Google", whatsapp: "WhatsApp", directo: "Directo", "otro sitio": "Otro sitio",
    telefono: "Teléfono", correo: "Correo", visita: "Visita a planta", feria: "Feria o evento", referido: "Referido", distribuidor: "Distribuidor" };
  const fuenteName = (f) => FUENTES[f] || (f ? f.charAt(0).toUpperCase() + f.slice(1) : "Directo");
  const CANALES = { whatsapp: "enviada por WhatsApp", copiada: "copiada (WhatsApp o correo)", instagram: "Instagram Direct", manual: "registrada por el equipo", web: "sitio" };
  const HERR = { cotizador: "cotizador", catalogo: "catálogo", estudio: "Estampa tu idea" };
  const specific = (s) => !!(s.modelos && s.modelos.length);
  const waLine = (wa) => (S.settings.whatsapps || []).find((x) => x.wa === String(wa || "").replace(/\D/g, ""));
  const fmtWa = (wa) => { const d = String(wa || "").replace(/\D/g, "").replace(/^52/, ""); return d.length === 10 ? (/^(55|33|81)/.test(d) ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`) : d; };
  // "WhatsApp 222 692 5404 · Carlos Lecona" — the Chilian phone a request reached
  // older requests carry only the advisor: the site always sent them to that advisor's line
  const waOf = (s) => s.whatsapp?.wa ? s.whatsapp : (s.canal === "whatsapp" || s.canal === "copiada") && s.asesor
    ? ((l) => (l ? { wa: l.wa, numero: l.numero, asesor: s.asesor } : null))((S.settings.whatsapps || []).find((x) => x.linea.toLowerCase().includes(s.asesor.split(" ")[0].toLowerCase()))) : null;
  const waDest = (s) => { const w = waOf(s); if (!w || !w.wa) return ""; const line = waLine(w.wa); return `${w.numero || fmtWa(w.wa)}${line ? " · " + line.linea : w.asesor ? " · " + w.asesor : ""}`; };
  const fileHref = (p) => `/api/archivo?path=${encodeURIComponent(p)}&s=${encodeURIComponent(S.token)}`;
  function arrivedBy(s) {
    if (s.canal === "instagram") return "Instagram Direct (mensaje directo)";
    if (s.canal === "messenger") return "Facebook Messenger (mensaje a la página)";
    if (s.canal === "whatsapp" && s.waId) return `Mensaje de WhatsApp al ${waDest(s) || s.whatsapp?.numero || "número de Chilian"}`;
    if (s.canal === "manual") return `${fuenteName(s.fuente)}${s.whatsapp?.wa ? " al " + waDest(s) : ""} · registrada por ${s.registradaPor || "el equipo"}`;
    const tools = (s.herramientas && s.herramientas.length ? s.herramientas : ["cotizador"]).map((x) => HERR[x] || x).join(" + ");
    const sent = s.canal === "whatsapp" && waOf(s) ? `enviada por WhatsApp al ${waDest(s)}` : s.canal === "copiada" && waOf(s) ? `copiada (su asesor: WhatsApp ${waDest(s)})` : CANALES[s.canal] || s.canal || "sitio";
    return `${fuenteName(s.fuente)}${s.campana ? " (" + s.campana + ")" : ""} → sitio web · ${tools} · ${sent}`;
  }

  /* ---------------- inbox: requests from the website, Instagram and the team ---------------- */
  function viewInbox() {
    let filter = viewInbox.f || "nueva";
    const src = viewInbox.src || "";
    const all = list("solicitudes").sort((a, b) => (b.ultimoMensaje || b.recibida || b.createdAt || "").localeCompare(a.ultimoMensaje || a.recibida || a.createdAt || ""));
    const bySrc = all.filter((s) => !src || (src.startsWith("wa:") ? waOf(s)?.wa === src.slice(3) : src === "especifica" ? specific(s) : src === "general" ? !specific(s) : src === "instagram" ? s.fuente === "instagram" || s.canal === "instagram" : src === "manual" ? s.canal === "manual" : s.canal !== "manual" && s.canal !== "instagram"));
    const rows = bySrc.filter((s) => filter === "todas" || s.estado === filter || (filter === "nueva" && s.nuevoMensaje));
    const chip = (id, label) => h("button", { type: "button", class: "chip" + (filter === id ? " on" : ""), onclick: () => { viewInbox.f = id; rerender(); } }, `${label} (${id === "todas" ? bySrc.length : bySrc.filter((s) => s.estado === id || (id === "nueva" && s.nuevoMensaje)).length})`);
    return h("div", {},
      top("Del sitio, de Instagram y del equipo", "Solicitudes",
        h("select", { class: "i", style: "width:auto", "aria-label": "Fuente", onchange: (e) => { viewInbox.src = e.target.value; rerender(); } },
          [["", "Todas las fuentes"], ["web", "Sitio web"], ["instagram", "Instagram"], ["manual", "Registradas por el equipo"], ["especifica", "Con mercancía específica"], ["general", "Sin mercancía específica"],
            ...(S.settings.whatsapps || []).map((w) => ["wa:" + w.wa, `WhatsApp ${w.numero} · ${w.linea.split(" · ")[0]}`])].map(([v, t]) => h("option", { value: v, text: t, selected: src === v }))),
        h("div", { class: "chips" }, chip("nueva", "Nuevas"), chip("convertida", "Convertidas"), chip("descartada", "Descartadas"), chip("todas", "Todas")),
        h("button", { class: "btn accent", type: "button", onclick: () => manualRequestModal() }, "+ Solicitud")),
      rows.length ? h("div", { class: "grid" }, rows.map((s) => inboxCard(s)))
        : h("div", { class: "empty", text: filter === "nueva" ? "No hay solicitudes nuevas. Llegan del cotizador y el catálogo del sitio, de Instagram Direct y de las que registra el equipo (+ Solicitud)." : "Nada en esta vista." }));
  }
  function inboxCard(s) {
    const contact = s.contacto || "";
    const piezas = s.modelos?.length ? s.modelos.reduce((a, m) => a + (m.piezas || 0), 0) : s.piezas;
    const pre = s.preCotizacionId ? byId("cotizaciones", s.preCotizacionId) : null, preC = pre ? calcCot(pre) : null;
    const ig = s.canal === "instagram" || s.igId;
    const social = s.waId ? "whatsapp" : s.fbId ? "facebook" : null;
    return h("article", { class: "card" + (s.nuevoMensaje ? " flash" : "") },
      h("div", { class: "row between" }, h("div", { class: "row" }, h("span", { class: "num", text: s.id }), h("span", { class: "pill " + (s.estado === "nueva" ? "p-acc" : s.estado === "convertida" ? "p-ok" : "p-mut"), text: s.estado }),
          s.nuevoMensaje ? h("span", { class: "pill p-bad", text: "mensaje nuevo" }) : null, h("span", { class: "muted small", text: fmtDT(s.ultimoMensaje || s.recibida || s.createdAt) })),
        h("span", { class: "label", text: s.tipoNombre || segName(s.tipo) })),
      h("div", { class: "row", style: "gap:.4rem" },
        h("span", { class: "pill " + (s.fuente === "instagram" || ig ? "p-acc" : "p-info"), text: fuenteName(ig ? "instagram" : social || s.fuente) }),
        h("span", { class: "pill " + (specific(s) ? "p-ok" : "p-mut"), text: specific(s) ? `Mercancía específica · ${s.modelos.length} modelo(s)` : "Sin mercancía específica" }),
        (s.herramientas || []).includes("estudio") ? h("span", { class: "pill p-info", text: "Usó Estampa tu idea" }) : null,
        waOf(s) ? h("span", { class: "pill p-ok", title: waDest(s), text: `Llegó al WhatsApp ${waOf(s).numero || fmtWa(waOf(s).wa)}` }) : null,
        s.canal === "chat" ? h("span", { class: "pill p-info", text: "Chat del sitio" }) : null,
        s.bot ? h("span", { class: "pill p-info", text: "Cotizó con el asistente" }) : null,
        s.pagos?.length ? h("span", { class: "pill p-ok", text: `Pagó ${money(s.pagos.reduce((a, p) => a + (+p.monto || 0), 0))} en línea` }) : null),
      h("p", { class: "small muted", style: "margin:0" }, h("b", { text: "Llegó por: " }), arrivedBy(s)),
      h("div", { class: "grid g4" },
        h("div", {}, h("div", { class: "label", text: "Contacto" }), h("b", { text: s.nombre }), h("div", { class: "small", text: s.empresa }), h("div", { class: "small mono", text: contact })),
        h("div", {}, h("div", { class: "label", text: "Prenda" }), h("div", { text: s.prenda || "—" }), h("div", { class: "small muted", text: (s.tecnicas || []).join(", ") })),
        h("div", {}, h("div", { class: "label", text: "Piezas" }), h("b", { class: "num", text: piezas ? fmtN(piezas) : "—" })),
        h("div", {}, h("div", { class: "label", text: "Para el" }), h("div", { text: s.fechaNecesaria ? fmtDate(s.fechaNecesaria) : "Flexible" }), h("div", { class: "small muted", text: s.asesor ? "Asesora: " + s.asesor : "" }))),
      s.modelos?.length ? h("div", { class: "small" }, h("div", { class: "label", text: "Mercancía que pidió (catálogo)" }), h("ul", { style: "margin:.2rem 0 0;padding-left:1rem" }, s.modelos.map((m) => h("li", { text: `${m.titulo}${m.modelos?.length ? " (" + m.modelos.join(", ") + ")" : ""} — ${fmtN(m.piezas)} pzas${m.color ? " · " + m.color : ""}${m.catalogo ? " · " + m.catalogo + " p. " + m.pagina : ""}` })))) : null,
      s.estimados?.length ? h("div", { class: "small" }, h("div", { class: "label", text: s.estimados[0]?.origen === "asistente" ? "Lo que cotizó con el asistente (precios del sitio)" : "Lo que cotizó en el sitio (Cotiza en un minuto, precios de referencia)" }),
        h("ul", { style: "margin:.2rem 0 0;padding-left:1rem" }, s.estimados.map((e) => h("li", {}, e.resumen || `${fmtN(e.piezas)} × ${e.nombre}`, e.unitario ? h("span", { class: "muted" }, ` — ${money(e.unitario)}/pza · ${money(e.total)} + IVA · ${e.dias} días hábiles${e.origen === "estudio" ? " · desde Estampa tu idea" : ""}`) : null)))) : null,
      s.correo && s.correo !== s.contacto ? h("p", { class: "small", style: "margin:0" }, h("b", { text: "Correo: " }), h("a", { href: "mailto:" + s.correo, text: s.correo })) : null,
      pagosBox(s.pagos),
      s.otId && byId("ots", s.otId) ? h("div", { class: "row between", style: "background:var(--shade);padding:.55rem .7rem" }, h("span", { class: "small" }, h("b", { text: "Orden " + s.otId }), " · abierta con el pago en línea"), h("a", { class: "btn sm", href: "#ot/" + s.otId }, "Abrir OT")) : null,
      pre ? h("div", { class: "row between", style: "background:var(--shade);padding:.55rem .7rem" },
        h("span", { class: "small" }, h("b", { text: "Pre-cotización " + pre.id }), preC.total > 0 ? ` · ${money(preC.total)} estimado con precios anteriores` : " · lista para poner precios"),
        h("a", { class: "btn sm", href: "#cotizacion/" + pre.id }, "Abrir pre-cotización")) : specific(s) || s.estimados?.length ? h("p", { class: "small muted", text: "Preparando la pre-cotización…" }) : null,
      s.mockup ? h("p", { class: "small", style: "margin:0" }, h("b", { text: "Mockup: " }), s.mockup) : null,
      (s.adjuntos || []).length ? h("div", { class: "grid", style: "gap:.4rem" },
        h("div", { class: "thumbs" }, s.adjuntos.map((a) => h("a", { href: fileHref(a.path), target: "_blank", rel: "noopener" },
          a.type === "application/pdf" ? h("div", { style: "height:110px;display:grid;place-items:center;color:#333;font-weight:700", text: "PDF" }) : h("img", { src: fileHref(a.path), alt: a.name, loading: "lazy" }),
          h("span", { text: (a.tipo === "mockup" ? "Mockup · " : a.tipo === "grafico" ? `Gráfico de ${(s.modelos || []).find((m) => m.id === a.modelo)?.titulo || a.modelo || "un modelo"} · ` : "Diseño · ") + a.name })))),
        s.preOtId && byId("ots", s.preOtId) ? h("div", { class: "row between", style: "background:var(--shade);padding:.55rem .7rem" }, h("span", { class: "small" }, h("b", { text: "OT previa " + s.preOtId }), ` · ${s.adjuntos.some((a) => a.tipo === "mockup") ? "mockup y " : ""}${s.adjuntos.filter((a) => a.tipo !== "mockup").length} archivo(s) de diseño`),
          h("a", { class: "btn sm", href: "#ot/" + s.preOtId }, "Abrir OT previa")) : h("p", { class: "small muted", text: "Preparando la OT previa…" })) : null,
      ((n) => n && !ig ? h("p", { class: "small", style: "white-space:pre-wrap", text: n }) : null)((s.notas || "").split("\n").filter((l) => !(s.mockup && l.startsWith("Mockup: "))).join("\n").trim()),
      (s.mensajes || []).length ? igThread(s) : null,
      h("div", { class: "row" },
        s.estado === "nueva" ? h("button", { class: "btn accent", type: "button", onclick: () => convertRequest(s) }, "Convertir en oportunidad") : s.oportunidadId ? h("a", { class: "btn ghost", href: "#oportunidad/" + s.oportunidadId }, "Ver oportunidad") : null,
        isPhone(contact) ? h("a", { class: "btn ghost", href: waLink(contact, `Hola ${s.nombre.split(" ")[0]}, soy ${S.name} de Chilian. Recibimos tu solicitud ${s.id}. `), target: "_blank", rel: "noopener" }, "WhatsApp") : null,
        s.igUser ? h("a", { class: "btn ghost", href: "https://ig.me/m/" + encodeURIComponent(s.igUser), target: "_blank", rel: "noopener" }, "Abrir en Instagram") : null,
        isEmail(contact) ? h("button", { class: "btn ghost", type: "button", onclick: () => copy(contact) }, "Copiar correo") : null,
        s.estado !== "descartada" && !s.otId ? h("button", { class: "btn ghost", type: "button", onclick: () => { const e = s.estimados?.[0], anti = (S.settings.tarifas?.anticipo ?? 50) / 100;
          payLinkModal(s.id, e?.total ? e.total * iva() * anti : 0, e ? `Anticipo ${Math.round(anti * 100)} % · ${e.resumen || s.prenda || "pedido"}`.slice(0, 200) : `Pedido ${s.id}`, s); } }, "Link de pago") : null,
        s.nuevoMensaje ? h("button", { class: "btn ghost", type: "button", onclick: async () => { await save("solicitudes", { ...s, nuevoMensaje: false }, { quiet: true }); rerender(); } }, "Marcar leído") : null,
        s.estado === "nueva" ? h("button", { class: "btn ghost", type: "button", onclick: async () => { await save("solicitudes", { ...s, estado: "descartada", nuevoMensaje: false }); rerender(); } }, "Descartar")
          : s.estado === "descartada" ? h("button", { class: "btn ghost", type: "button", onclick: async () => { await save("solicitudes", { ...s, estado: "nueva" }); rerender(); } }, "Recuperar") : null));
  }
  // A payment link (Mercado Pago and/or Stripe) for a request or a quote; it can go straight into the conversation.
  async function payLinkModal(ref, monto, concepto, sol) {
    const amt = h("input", { class: "i num", type: "number", min: "1", step: "any", value: Math.round(monto * 100) / 100 || "", required: true });
    const what = h("input", { class: "i", value: concepto, maxlength: "200" });
    const out = h("div", { class: "grid", style: "gap:.5rem" });
    const f = h("form", { class: "grid", onsubmit: async (e) => {
      e.preventDefault(); const b = e.target.querySelector("button[type=submit]"); b.disabled = true;
      try {
        const { links } = await api("POST", "/api/venta", { accion: "link", ref, monto: +amt.value, concepto: what.value.trim() || `Pago ${ref}` });
        const text = `${what.value.trim() || "Pago " + ref}: ${money(+amt.value)}\n\n${links.map((l) => `${l.title}: ${l.url}`).join("\n\n")}`;
        const canSend = sol && (sol.igId || sol.fbId || sol.waId || sol.canal === "chat");
        out.replaceChildren(...links.map((l) => h("div", { class: "row between" }, h("span", { class: "small", text: l.title }), h("a", { class: "btn sm ghost", href: l.url, target: "_blank", rel: "noopener" }, "Abrir"))),
          h("div", { class: "row" }, h("button", { class: "btn ghost", type: "button", onclick: () => copy(text) }, "Copiar mensaje con links"),
            canSend ? h("button", { class: "btn accent", type: "button", onclick: async (ev) => { ev.currentTarget.disabled = true;
              try { const { doc } = await api("POST", "/api/meta", { accion: "responder", id: sol.id, texto: text }); S.data.solicitudes.set(doc.id, doc); toast("Link enviado al cliente."); closeModal(); rerender(); }
              catch (err) { if (err.message !== "401") toast(err.message, true); ev.currentTarget.disabled = false; } } }, "Enviar en la conversación") : null),
          h("p", { class: "hint", text: "Cuando el pago se acredita queda registrado solo: en la solicitud o cotización, y en su OT." }));
      } catch (err) { if (err.message !== "401") toast(err.message, true); }
      b.disabled = false;
    } },
      h("label", { class: "f" }, h("span", { text: "Monto a cobrar (MXN, con IVA)" }), amt),
      h("label", { class: "f" }, h("span", { text: "Concepto (lo ve el cliente)" }), what),
      h("div", { class: "row" }, h("button", { class: "btn accent", type: "submit" }, "Crear link de pago")), out);
    modal(`Link de pago · ${ref}`, f);
  }
  const iva = () => 1 + (+(S.settings.tarifas?.iva ?? 16)) / 100;
  const pagosBox = (pagos) => pagos?.length ? h("div", { class: "small" }, h("div", { class: "label", text: "Pagos en línea" }),
    h("ul", { style: "margin:.2rem 0 0;padding-left:1rem" }, pagos.map((p) => h("li", { text: `${fmtDate(p.fecha)} · ${money(p.monto)} · ${p.metodo}` })))) : null;

  // The Instagram conversation, with a reply box (works once Instagram is connected in Ajustes).
  function igThread(s) {
    const msgs = (s.mensajes || []).slice(-12);
    const via = s.waId ? "WhatsApp" : s.fbId ? "Messenger" : s.canal === "chat" ? "el chat del sitio" : "Instagram";
    const bot = s.bot, botOn = bot && !bot.pausado && bot.estado !== "asesora";
    const box = h("textarea", { class: "i", rows: "2", placeholder: `Responder por ${via}…` });
    return h("div", { class: "grid", style: "gap:.4rem" },
      h("div", { class: "label", text: `Conversación ${s.canal === "chat" && !s.waId ? "del chat del sitio" : "de " + via}${s.waId && s.whatsapp?.numero ? " (llegó al " + s.whatsapp.numero + ")" : ""} · ${(s.mensajes || []).length} mensaje(s)` }),
      bot ? h("div", { class: "row", style: "gap:.5rem" },
        h("span", { class: "pill " + (botOn ? "p-info" : bot.pausado ? "p-mut" : "p-bad"), text: botOn ? "El asistente está atendiendo" : bot.pausado ? "Asistente en pausa (atiende el equipo)" : "Pidió asesora: te toca" }),
        h("button", { class: "btn sm ghost", type: "button", onclick: async (e) => { e.currentTarget.disabled = true;
          try { const { doc } = await api("POST", "/api/meta", { accion: "asistente", id: s.id, activo: !botOn }); S.data.solicitudes.set(doc.id, doc); toast(botOn ? "Asistente en pausa en esta conversación." : "El asistente vuelve a atender esta conversación."); rerender(); }
          catch (err) { if (err.message !== "401") toast(err.message, true); } } }, botOn ? "Pausar asistente" : "Reanudar asistente")) : null,
      h("ul", { class: "log" }, msgs.map((m) => h("li", {}, h("time", { text: fmtDT(m.fecha) }), h("span", {}, h("b", { text: m.de === "cliente" ? (s.nombre === "Chat del sitio" ? "Cliente" : s.nombre) + ": " : m.de === "bot" ? "Asistente: " : (m.por || "Chilian") + ": " }), h("span", { style: "white-space:pre-wrap", text: m.texto }),
        (m.links || []).length ? h("span", { class: "small muted", text: " · link de pago enviado" }) : null, (m.botones || []).length ? h("span", { class: "small muted", text: ` · opciones: ${m.botones.map((b) => b.title).join(", ")}` }) : null)))),
      s.igId || s.fbId || s.waId || s.canal === "chat" ? h("form", { class: "row", style: "flex-wrap:nowrap;align-items:end", onsubmit: async (e) => {
        e.preventDefault(); const texto = box.value.trim(); if (!texto) return;
        const btn = e.target.querySelector("button"); btn.disabled = true;
        try { const { doc } = await api("POST", "/api/meta", { accion: "responder", id: s.id, texto }); S.data.solicitudes.set(doc.id, doc); toast(`Enviado por ${via}.`); rerender(); }
        catch (err) { if (err.message !== "401") toast(err.message, true); btn.disabled = false; }
      } }, box, h("button", { class: "btn", type: "submit" }, "Enviar")) : null);
  }
  // Requests that arrive by Instagram DM, phone, e-mail, a visit or a fair: the team files them here.
  async function manualRequestModal() {
    await CZ.ready();
    const garments = CZ.garments();
    const rowsBox = h("div", { class: "grid", style: "gap:.35rem" });
    const addRow = () => rowsBox.append(h("div", { class: "grid mrow", style: "grid-template-columns:minmax(0,1fr) 90px 120px 2rem;gap:.35rem" },
      h("select", { class: "i m-id", "aria-label": "Modelo" }, h("option", { value: "", text: "— Modelo del catálogo —" }), ["g-basica", "g-clasica", "g-premium"].map((c) => h("optgroup", { label: { "g-basica": "Línea básica", "g-clasica": "Línea clásica", "g-premium": "Línea premium" }[c] }, garments.filter((g) => g.cat === c).map((g) => h("option", { value: g.catId, text: g.name }))))),
      h("input", { class: "i m-q", type: "number", min: "1", placeholder: "Piezas", "aria-label": "Piezas" }), h("input", { class: "i m-c", placeholder: "Color", "aria-label": "Color" }),
      h("button", { class: "x", type: "button", "aria-label": "Quitar", onclick: (e) => e.currentTarget.parentNode.remove() }, "×")));
    const f = h("form", { class: "grid g2", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      const modelos = $$(".mrow", rowsBox).map((r) => { const id = $(".m-id", r).value, g = garments.find((x) => x.catId === id); return g ? { id, titulo: g.name.split(" · ")[0], modelos: [], piezas: +$(".m-q", r).value || 0, color: $(".m-c", r).value.trim(), catalogo: g.catalog, pagina: g.page, tipo: g.kind } : null; }).filter(Boolean);
      const seg = SEGMENTS.find((x) => x.id === fd.tipo);
      const saved = await save("solicitudes", { estado: "nueva", canal: "manual", fuente: fd.fuente, registradaPor: S.name, tipo: fd.tipo, tipoNombre: seg ? seg.name : "", asesor: fd.asesor,
        nombre: fd.nombre.trim(), empresa: fd.empresa.trim(), contacto: fd.contacto.trim(), prenda: fd.prenda.trim(), piezas: modelos.length ? modelos.reduce((a, m) => a + m.piezas, 0) : +fd.piezas || 0,
        fechaNecesaria: fd.fecha, notas: fd.notas.trim(), modelos, especifica: modelos.length > 0, herramientas: [], recibida: new Date().toISOString(),
        whatsapp: fd.waLinea ? { wa: fd.waLinea, numero: waLine(fd.waLinea)?.numero || fmtWa(fd.waLinea), asesor: "" } : null }, { quiet: true });
      closeModal(); toast(`Solicitud ${saved.id} registrada.`); await ensurePreQuotes(); rerender();
    } },
      h("label", { class: "f" }, h("span", { text: "Llegó por" }), h("select", { class: "i", name: "fuente" }, [["instagram", "Instagram Direct"], ["facebook", "Facebook / Messenger"], ["whatsapp", "WhatsApp"], ["telefono", "Teléfono"], ["correo", "Correo"], ["visita", "Visita a planta"], ["feria", "Feria o evento"], ["referido", "Referido"], ["distribuidor", "Distribuidor"]].map(([v, t]) => h("option", { value: v, text: t })))),
      h("label", { class: "f" }, h("span", { text: "Tipo de proyecto" }), h("select", { class: "i", name: "tipo" }, SEGMENTS.map((x) => h("option", { value: x.id, text: x.name })))),
      h("label", { class: "f full" }, h("span", { text: "Si llegó por WhatsApp: ¿a qué número de Chilian?" }), h("select", { class: "i", name: "waLinea" }, h("option", { value: "", text: "— No llegó por WhatsApp —" }), (S.settings.whatsapps || []).map((w) => h("option", { value: w.wa, text: `${w.numero} · ${w.linea}` })))),
      h("label", { class: "f" }, h("span", { text: "Nombre" }), h("input", { class: "i", name: "nombre", required: true })),
      h("label", { class: "f" }, h("span", { text: "Empresa o marca" }), h("input", { class: "i", name: "empresa" })),
      h("label", { class: "f" }, h("span", { text: "Contacto (@usuario, WhatsApp o correo)" }), h("input", { class: "i", name: "contacto", required: true })),
      h("label", { class: "f" }, h("span", { text: "Responsable" }), h("select", { class: "i", name: "asesor" }, team().map((n) => h("option", { value: n, text: n, selected: n === S.name })))),
      h("label", { class: "f" }, h("span", { text: "Prenda o producto" }), h("input", { class: "i", name: "prenda", placeholder: "Ej. Playeras con logo al frente" })),
      h("label", { class: "f" }, h("span", { text: "Piezas (si no eligió modelos)" }), h("input", { class: "i", name: "piezas", type: "number", min: "0" })),
      h("label", { class: "f" }, h("span", { text: "Para cuándo" }), h("input", { class: "i", name: "fecha", type: "date" })),
      h("div", { class: "full grid", style: "gap:.35rem" }, h("span", { class: "label", text: "Mercancía específica (opcional): crea la pre-cotización" }), rowsBox,
        h("button", { class: "btn sm ghost", type: "button", style: "justify-self:start", onclick: addRow }, "+ Modelo")),
      h("label", { class: "f full" }, h("span", { text: "Lo que pidió (pega el mensaje)" }), h("textarea", { class: "i", name: "notas" })),
      h("div", { class: "row full" }, h("button", { class: "btn accent", type: "submit" }, "Registrar solicitud")));
    modal("Nueva solicitud", f);
  }
  // A request for specific catalog merchandise gets a draft quote in the OS right away,
  // priced with what the team quoted before. One per request, even if two people are online.
  let preBusy = false;
  async function ensurePreQuotes() {
    if (preBusy || !S.token) return; preBusy = true;
    let made = 0;
    try {
      const todo = list("solicitudes").filter((s) => (specific(s) || s.estimados?.length) && !s.preCotizacionId && s.estado !== "descartada");
      for (const s of todo) {
        const doc = await CZ.newDoc({ cliente: s.cuentaId ? "" : s.empresa || s.nombre, cuentaId: s.cuentaId || "", oportunidadId: s.oportunidadId || "", solicitud: s });
        Object.assign(doc, { estado: "pre", solicitudId: s.id });
        const q = await save("cotizaciones", doc, { quiet: true });
        try { await save("solicitudes", { ...byId("solicitudes", s.id), preCotizacionId: q.id }, { quiet: true }); made++; }
        catch { await remove("cotizaciones", q.id).catch(() => {}); }
      }
    } catch (e) { console.error(e); }
    finally { preBusy = false; }
    made += await ensurePreOTs();
    made += await ensurePaid();
    if (made && !(window.__czDirty && window.__czDirty()) && ["solicitudes", "ots"].includes(route().r)) rerender();
  }
  // A request made with Estampa tu idea brings its mockup and design files: they become a draft
  // work order (OT previa) with the art attached and the print sizes per section, so the plant
  // can review it before the sale closes. It stays out of scheduling until it is confirmed.
  async function ensurePreOTs() {
    let made = 0;
    for (const s of list("solicitudes")) {
      const files = (s.adjuntos || []).map((a) => ({ path: a.path, name: a.name, type: a.type, size: a.size, tipo: a.tipo }));
      if (!files.length || s.estado === "descartada") continue;
      const ot = s.preOtId ? byId("ots", s.preOtId) : null;
      try {
        if (ot) {   // files that arrived after the draft was made join it
          const have = new Set((ot.arte?.archivos || []).map((a) => a.path)), add = files.filter((a) => !have.has(a.path));
          if (add.length) { await save("ots", { ...ot, arte: { ...(ot.arte || {}), archivos: [...(ot.arte?.archivos || []), ...add] } }, { quiet: true }); made++; }
          continue;
        }
        if (s.preOtId) continue;
        const est = s.estudio || {}, piezas = s.modelos?.length ? s.modelos.reduce((a, m) => a + (m.piezas || 0), 0) : est.piezas || s.piezas || 0;
        const ubic = (est.secciones || []).map((x) => ({ nombre: x.seccion + (x.lugar ? " (" + x.lugar + ")" : ""), tecnica: ["dtg", "bordado"].includes(est.tecnica) ? est.tecnica : "serigrafia", colores: 0, puntadas: est.tecnica === "bordado" ? 8000 : undefined, tintas: "", medida: x.medida, archivo: x.archivo }));
        const lineas = s.modelos?.length
          ? s.modelos.map((m) => ({ id: rid(), descripcion: m.titulo, modelo: (m.modelos || []).join(", "), color: m.color || est.color || "", piezas: m.piezas || 0, catId: m.id, ubicaciones: ubic.map((u) => ({ ...u })), tallas: Object.fromEntries(SIZES.map((z) => [z, 0])) }))
          : [{ id: rid(), descripcion: est.prenda || s.prenda || "Prenda", modelo: "", color: est.color || "", piezas, ubicaciones: ubic, tallas: Object.fromEntries(SIZES.map((z) => [z, 0])) }];
        const saved = await save("ots", {
          previa: true, solicitudId: s.id, cuentaId: s.cuentaId || "", oportunidadId: s.oportunidadId || "", cotizacionId: s.preCotizacionId || "",
          clienteNombre: s.empresa || s.nombre, etapa: "arte", prioridad: "normal", fechaCompromiso: s.fechaNecesaria || "",
          tokenCliente: crypto.getRandomValues(new Uint32Array(4)).join("").slice(0, 24) + rid(), lineas, estudio: s.estudio || null, mockup: s.mockup || "",
          arte: { estado: "pendiente", archivos: files }, programacion: [], merma: [],
          historial: [{ etapa: "arte", fecha: new Date().toISOString(), por: "Sitio web", nota: `OT previa desde ${s.estudio ? "Estampa tu idea" : "los gráficos que el cliente adjuntó"} (${s.id})` }]
        }, { quiet: true });
        try { await save("solicitudes", { ...byId("solicitudes", s.id), preOtId: saved.id }, { quiet: true }); made++; }
        catch { await remove("ots", saved.id).catch(() => {}); }
      } catch (e) { console.error(e); }
    }
    return made;
  }
  async function convertRequest(s) {
    const opp = await leadFromRequest(s);
    toast(`Oportunidad creada para ${cuentaName(opp.cuentaId)}.`);
    go("oportunidad/" + opp.id);
  }
  // The client origin of a request, in the CRM's terms.
  const solSource = (s) => s.waId ? "WhatsApp" : s.fbId || s.canal === "messenger" ? "Facebook" : s.canal === "instagram" ? "Instagram"
    : s.canal === "manual" ? ({ referido: "Referido", feria: "Feria o evento", telefono: "Llamada o visita", visita: "Llamada o visita", correo: "Llamada o visita", distribuidor: "Distribuidor", instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp" }[s.fuente] || "Otro")
    : ({ instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", google: "Google", whatsapp: "WhatsApp" }[s.fuente] || "Sitio web");
  async function leadFromRequest(s) {
    // Reuse the account if one already has this company or contact.
    const key = (s.empresa || s.nombre || "").trim().toLowerCase();
    const src = ["instagram", "messenger"].includes(s.canal) || s.fuente === "instagram" ? "Redes sociales" : s.canal === "manual" ? ({ referido: "Referido", feria: "Feria", distribuidor: "Distribuidor" }[s.fuente] || "Prospección") : "Sitio web";
    let cuenta = list("cuentas").find((c) => c.nombre.trim().toLowerCase() === key || (c.contactos || []).some((x) => x.contacto && x.contacto === s.contacto));
    if (!cuenta) cuenta = await save("cuentas", { nombre: s.empresa || s.nombre, segmento: s.tipo || "marca", fuente: src, responsable: s.asesor && team().includes(s.asesor) ? s.asesor : S.name, contactos: [{ nombre: s.nombre, puesto: "", contacto: s.contacto }], notas: "" }, { quiet: true });
    const piezas = s.modelos?.length ? s.modelos.reduce((a, m) => a + (m.piezas || 0), 0) : s.piezas;
    const pre = s.preCotizacionId ? byId("cotizaciones", s.preCotizacionId) : null, preC = pre ? calcCot(pre) : null;
    const opp = await save("oportunidades", {
      titulo: `${s.prenda || (specific(s) ? s.modelos[0].titulo : "Pedido")} · ${fmtN(piezas)} pzas`, cuentaId: cuenta.id, segmento: s.tipo || cuenta.segmento, etapa: "nuevo", probabilidad: stageProb("nuevo"),
      fuente: solSource(s), valor: preC && preC.sub > 0 ? Math.round(preC.sub) : estimateValue(piezas), piezasAnio: piezas, asesor: s.asesor && team().includes(s.asesor) ? s.asesor : S.name, origen: `${fuenteName(s.canal === "instagram" ? "instagram" : s.fuente)} · ${src}`, solicitudId: s.id, fechaNecesaria: s.fechaNecesaria,
      proximaAccion: { texto: "Contactar y calificar (volumen, fechas, quién decide)", fecha: localDate() }, score: { fecha: !!s.fechaNecesaria && s.fechaNecesaria <= addDays(localDate(), 90), volumen: piezas >= 10000 },
      actividad: [{ fecha: new Date().toISOString(), tipo: "Nota", texto: `Solicitud ${s.id}: ${arrivedBy(s)}.${pre ? " Pre-cotización " + pre.id + "." : ""}`, por: S.name }], solicitud: s
    }, { quiet: true });
    if (pre) await save("cotizaciones", { ...pre, oportunidadId: opp.id, cuentaId: cuenta.id, cliente: "" }, { quiet: true });
    await save("tareas", { tipo: s.canal === "instagram" ? "Instagram" : s.waId ? "WhatsApp" : "Llamada", texto: `Responder la solicitud ${s.id} de ${s.nombre}${pre ? " (revisar la pre-cotización " + pre.id + ")" : ""}`, fecha: localDate(), oportunidadId: opp.id, cuentaId: cuenta.id, asesor: opp.asesor, hecha: false }, { quiet: true });
    await save("solicitudes", { ...byId("solicitudes", s.id), estado: "convertida", nuevoMensaje: false, oportunidadId: opp.id, cuentaId: cuenta.id }, { quiet: true });
    return opp;
  }

  /* Every quote belongs to a lead. A quote without an opportunity gets one: from its website
     request when it has one, otherwise from the account (found by name or created). */
  const quoteTitle = (q, c) => {
    const ls = (q.lineas || []).filter((l) => !l.nopcs), first = ls[0]?.concepto || ls[0]?.descripcion || "Pedido";
    return `${first}${ls.length > 1 ? ` y ${ls.length - 1} más` : ""} · ${fmtN(c.piezas)} pzas`;
  };
  async function ensureLead(q, info = {}) {
    let o = q.oportunidadId ? byId("oportunidades", q.oportunidadId) : null;
    if (o) return { q, o };
    const sol = q.solicitudId ? byId("solicitudes", q.solicitudId) : null;
    if (sol) {
      o = (sol.oportunidadId && byId("oportunidades", sol.oportunidadId)) || await leadFromRequest(sol);
      q = await save("cotizaciones", { ...byId("cotizaciones", q.id), oportunidadId: o.id, cuentaId: o.cuentaId, cliente: "" }, { quiet: true });
      return { q, o };
    }
    const c = calcCot(q), name = (info.nombre || CZ.clientOf(q) || "").trim() || "Cliente sin nombre";
    let cuenta = q.cuentaId ? byId("cuentas", q.cuentaId) : list("cuentas").find((x) => x.nombre.trim().toLowerCase() === name.toLowerCase());
    info.fuente = info.fuente || q.origen || "";
    info.detalle = info.detalle ?? q.origenDetalle ?? "";
    if (!cuenta) cuenta = await save("cuentas", { nombre: name, segmento: info.segmento || "marca", fuente: info.fuente || "Prospección", responsable: S.name,
      contactos: info.contacto || info.persona ? [{ nombre: info.persona || "", puesto: "", contacto: info.contacto || "" }] : [], notas: "" }, { quiet: true });
    o = await save("oportunidades", {
      titulo: quoteTitle(q, c), tituloAuto: true, cuentaId: cuenta.id, segmento: info.segmento || cuenta.segmento || "marca", etapa: "calificado", probabilidad: stageProb("calificado"),
      valor: Math.round(c.sub) || 0, piezasAnio: c.piezas, asesor: cuenta.responsable && team().includes(cuenta.responsable) ? cuenta.responsable : S.name,
      fuente: info.fuente || srcOf(cuenta.fuente) || "", origen: `${info.fuente || srcOf(cuenta.fuente) || "Sin especificar"}${info.detalle ? " · " + info.detalle : ""} · cotización ${q.id}`, cotizacionId: q.id,
      proximaAccion: { texto: `Enviar la cotización ${q.id}`, fecha: localDate() },
      actividad: [{ fecha: new Date().toISOString(), tipo: "Nota", texto: `Lead creado con la cotización ${q.id}.`, por: S.name }]
    }, { quiet: true });
    q = await save("cotizaciones", { ...byId("cotizaciones", q.id), oportunidadId: o.id, cuentaId: cuenta.id, cliente: "", origen: info.fuente || q.origen || "", origenDetalle: info.detalle || "" }, { quiet: true });
    return { q, o };
  }
  // A first value from the pieces: an average decorated garment price, editable later.
  const estimateValue = (pzs) => Math.round((+pzs || 0) * 160);

  /* ---------------- pipeline (kanban) ---------------- */
  function viewPipeline() {
    const f = viewPipeline.f ||= { seg: "", asesor: "", q: "", src: "", stale: false };
    let opps = list("oportunidades");
    if (f.seg) opps = opps.filter((o) => o.segmento === f.seg);
    if (f.asesor) opps = opps.filter((o) => o.asesor === f.asesor);
    if (f.q) { const q = f.q.toLowerCase(); opps = opps.filter((o) => (o.titulo + " " + cuentaName(o.cuentaId)).toLowerCase().includes(q)); }
    if (f.src) opps = opps.filter((o) => oppSource(o) === f.src);
    if (f.stale) opps = opps.filter(stalled);
    const lanes = OPP_STAGES.map((s) => {
      const xs = opps.filter((o) => (o.etapa || "nuevo") === s.id).sort((a, b) => scoreOf(b) - scoreOf(a) || oppValue(b) - oppValue(a));
      const lane = h("section", { class: "lane", "data-stage": s.id },
        h("header", {}, h("b", { text: s.name }), h("span", { class: "num small muted", text: `${xs.length} · ${moneyK(xs.reduce((a, o) => a + oppValue(o), 0))}` })),
        xs.map((o) => {
          const sc = scoreOf(o), card = h("article", { class: "opp", draggable: "true", "data-id": o.id, onclick: () => go("oportunidad/" + o.id) },
            h("div", { class: "row between", style: "flex-wrap:nowrap;align-items:start" }, h("span", { class: "t", text: o.titulo }), h("span", { class: "tier " + tierOf(sc), title: `Ajuste high-ticket: ${sc}/100`, text: tierOf(sc) })),
            h("span", { class: "small", text: cuentaName(o.cuentaId) + (oppSource(o) ? " · " + oppSource(o) : "") }),
            OPEN_OPP(o) ? h("span", { class: "small " + (stalled(o) ? "due-late" : "muted"), text: `${daysIn(o)} día${daysIn(o) === 1 ? "" : "s"} en la etapa${stalled(o) ? " · estancada" : ""}` }) : null,
            h("div", { class: "m" }, h("span", { text: segName(o.segmento) }), h("span", { class: "money", text: moneyK(oppValue(o)) })),
            o.proximaAccion?.texto ? h("div", { class: "m" }, h("span", { class: dueClass(o.proximaAccion.fecha), text: (o.proximaAccion.fecha ? fmtDate(o.proximaAccion.fecha) + " · " : "") + o.proximaAccion.texto })) : null);
          card.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", o.id); card.classList.add("drag"); });
          card.addEventListener("dragend", () => card.classList.remove("drag"));
          return card;
        }));
      lane.addEventListener("dragover", (e) => { e.preventDefault(); lane.classList.add("drop"); });
      lane.addEventListener("dragleave", () => lane.classList.remove("drop"));
      lane.addEventListener("drop", async (e) => {
        e.preventDefault(); lane.classList.remove("drop");
        const o = byId("oportunidades", e.dataTransfer.getData("text/plain"));
        if (o && o.etapa !== s.id) await moveOpp(o, s.id);
      });
      return lane;
    });
    return h("div", {},
      top("CRM · arrastra para cambiar de etapa", "Oportunidades",
        h("input", { class: "i search", type: "search", placeholder: "Buscar oportunidad o cuenta", value: f.q, oninput: (e) => { f.q = e.target.value; clearTimeout(viewPipeline.t); viewPipeline.t = setTimeout(rerender, 250); } }),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.seg = e.target.value; rerender(); } }, h("option", { value: "", text: "Todos los segmentos" }), SEGMENTS.map((s) => h("option", { value: s.id, text: s.name, selected: f.seg === s.id }))),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.asesor = e.target.value; rerender(); } }, h("option", { value: "", text: "Todo el equipo" }), team().map((n) => h("option", { value: n, text: n, selected: f.asesor === n }))),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.src = e.target.value; rerender(); } }, h("option", { value: "", text: "Todos los orígenes" }), SOURCE_GROUPS.map(([g, xs]) => h("optgroup", { label: g }, xs.map((x) => h("option", { value: x, text: x, selected: f.src === x }))))),
        h("label", { class: "row small", style: "gap:.3rem" }, h("input", { type: "checkbox", checked: f.stale, onchange: (e) => { f.stale = e.target.checked; rerender(); } }), `Estancadas (${list("oportunidades").filter(stalled).length})`),
        h("button", { class: "btn accent", type: "button", onclick: () => newOppModal() }, "+ Oportunidad")),
      h("div", { class: "board" }, lanes));
  }
  // Stalled ("rotting") deals: too many days in a stage and no future next step. Days per stage, from sales practice.
  const STALE_DAYS = { nuevo: 1, contactado: 4, calificado: 7, cotizacion: 5, negociacion: 10 };
  const OPEN_OPP = (o) => !["ganado", "perdido"].includes(o.etapa || "nuevo");
  const daysIn = (o) => Math.max(0, Math.floor((Date.now() - new Date(o.etapaDesde || o.createdAt || Date.now()).getTime()) / 864e5));
  const stalled = (o) => OPEN_OPP(o) && daysIn(o) > (STALE_DAYS[o.etapa || "nuevo"] ?? 7) && !(o.proximaAccion?.fecha && o.proximaAccion.fecha >= localDate());
  const oppSource = (o) => o.fuente || srcOf(byId("cuentas", o.cuentaId)?.fuente) || "";
  async function moveOpp(o, etapa) {
    let extra = {};
    if (etapa === "perdido") {
      const why = await askText("¿Por qué se perdió?", ["Precio", "Tiempo de entrega", "Eligió a otro proveedor", "Cancelado por el cliente", "Sin respuesta", "Otra"]);
      if (why == null) return;
      extra = { perdidaRazon: why, cerradaEn: new Date().toISOString() };
    }
    if (etapa === "ganado") extra = { cerradaEn: new Date().toISOString() };
    await save("oportunidades", { ...o, etapa, probabilidad: stageProb(etapa), ...extra, actividad: [...(o.actividad || []), { fecha: new Date().toISOString(), tipo: "Nota", texto: `Etapa: ${stageName(OPP_STAGES, etapa)}${extra.perdidaRazon ? " (" + extra.perdidaRazon + ")" : ""}`, por: S.name }] }, { quiet: true });
    toast(`Movida a ${stageName(OPP_STAGES, etapa)}.`);
    rerender();
  }
  function askText(title, options) {
    return new Promise((resolve) => {
      let done = false;
      const sel = h("select", { class: "i" }, options.map((o) => h("option", { value: o, text: o })));
      const note = h("input", { class: "i", placeholder: "Detalle (opcional)" });
      const m = modal(title, h("form", { class: "grid", onsubmit: (e) => { e.preventDefault(); done = true; closeModal(); resolve(sel.value + (note.value ? ": " + note.value : "")); } },
        sel, note, h("div", { class: "row" }, h("button", { class: "btn accent", type: "submit" }, "Guardar"), h("button", { class: "btn ghost", type: "button", onclick: () => closeModal() }, "Cancelar"))));
      m.addEventListener("close", () => { if (!done) resolve(null); }, { once: true });
    });
  }

  function newOppModal(prefill = {}) {
    const f = h("form", { class: "grid g2", onsubmit: async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(f));
      let cuentaId = fd.cuentaId;
      if (!cuentaId) {
        if (!fd.nuevaCuenta.trim()) return toast("Elige una cuenta o escribe el nombre de una nueva.", true);
        cuentaId = (await save("cuentas", { nombre: fd.nuevaCuenta.trim(), segmento: fd.segmento, fuente: fd.origen, contactos: fd.contacto ? [{ nombre: fd.contactoNombre, puesto: "", contacto: fd.contacto }] : [] }, { quiet: true })).id;
      }
      const o = await save("oportunidades", { titulo: fd.titulo, cuentaId, segmento: fd.segmento, etapa: "nuevo", probabilidad: stageProb("nuevo"), valor: +fd.valor || 0, piezasAnio: +fd.piezasAnio || 0, asesor: fd.asesor, origen: fd.origen,
        proximaAccion: { texto: "Llamada de descubrimiento", fecha: localDate() }, score: {}, actividad: [{ fecha: new Date().toISOString(), tipo: "Nota", texto: "Oportunidad creada.", por: S.name }] }, { quiet: true });
      closeModal(); toast("Oportunidad creada."); go("oportunidad/" + o.id);
    } },
      h("label", { class: "f full" }, h("span", { text: "Qué se vende" }), h("input", { class: "i", name: "titulo", required: true, placeholder: "Ej. Programa anual de playeras para tiendas", value: prefill.titulo || "" })),
      h("label", { class: "f" }, h("span", { text: "Cuenta existente" }), h("select", { class: "i", name: "cuentaId" }, h("option", { value: "", text: "— Nueva cuenta —" }), list("cuentas").sort((a, b) => a.nombre.localeCompare(b.nombre)).map((c) => h("option", { value: c.id, text: c.nombre, selected: prefill.cuentaId === c.id })))),
      h("label", { class: "f" }, h("span", { text: "O nueva cuenta (empresa)" }), h("input", { class: "i", name: "nuevaCuenta" })),
      h("label", { class: "f" }, h("span", { text: "Contacto (nombre)" }), h("input", { class: "i", name: "contactoNombre" })),
      h("label", { class: "f" }, h("span", { text: "WhatsApp o correo" }), h("input", { class: "i", name: "contacto" })),
      h("label", { class: "f" }, h("span", { text: "Segmento" }), h("select", { class: "i", name: "segmento" }, SEGMENTS.map((s) => h("option", { value: s.id, text: s.name, selected: prefill.segmento === s.id })))),
      h("label", { class: "f" }, h("span", { text: "Origen" }), h("select", { class: "i", name: "origen" }, SOURCES.map((s) => h("option", { value: s, text: s, selected: s === "Prospección" })))),
      h("label", { class: "f" }, h("span", { text: "Valor estimado (MXN)" }), h("input", { class: "i", name: "valor", type: "number", min: "0", step: "100" })),
      h("label", { class: "f" }, h("span", { text: "Piezas al año" }), h("input", { class: "i", name: "piezasAnio", type: "number", min: "0", step: "100" })),
      h("label", { class: "f" }, h("span", { text: "Responsable" }), h("select", { class: "i", name: "asesor" }, team().map((n) => h("option", { value: n, text: n, selected: n === S.name })))),
      h("div", { class: "row full" }, h("button", { class: "btn accent", type: "submit" }, "Crear oportunidad")));
    modal("Nueva oportunidad", f);
  }

  /* ---------------- one opportunity ---------------- */
  function viewOpp(id) {
    const o = byId("oportunidades", id);
    if (!o) return h("div", { class: "empty", text: "No encontramos esta oportunidad." });
    const cuenta = byId("cuentas", o.cuentaId), sc = scoreOf(o), contact = cuenta?.contactos?.[0];
    const quotes = list("cotizaciones").filter((c) => c.oportunidadId === o.id);
    const tasks = list("tareas").filter((t) => t.oportunidadId === o.id).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
    const upd = async (patch, msg) => { await save("oportunidades", { ...o, ...patch }, { quiet: !msg }); if (msg) toast(msg); rerender(); };
    const vars = { n: contact?.nombre?.split(" ")[0] || "", e: cuenta?.nombre || "", a: S.name, c: quotes[0]?.id || "" };
    return h("div", {},
      top(`${segName(o.segmento)} · ${o.origen || ""}`, o.titulo,
        h("select", { class: "i", style: "width:auto", onchange: (e) => moveOpp(o, e.target.value) }, OPP_STAGES.map((s) => h("option", { value: s.id, text: s.name, selected: o.etapa === s.id }))),
        h("button", { class: "btn accent", type: "button", onclick: () => newQuote(o) }, "+ Cotización")),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Datos" }),
            h("div", { class: "grid g3" },
              field("Cuenta", h("a", { href: "#cuenta/" + o.cuentaId, text: cuenta?.nombre || "—" })),
              inputField("Valor estimado (MXN)", o.valor, "number", (v) => upd({ valor: +v || 0 })),
              inputField("Piezas al año", o.piezasAnio, "number", (v) => upd({ piezasAnio: +v || 0 })),
              selectField("Responsable", o.asesor, team(), (v) => upd({ asesor: v })),
              selectField("Segmento", o.segmento, SEGMENTS.map((s) => [s.id, s.name]), (v) => upd({ segmento: v })),
              h("label", { class: "f" }, h("span", { text: "¿De dónde viene?" }), sourceSelect({ onchange: (e) => upd({ fuente: e.target.value, origen: e.target.value + (o.origen && o.origen.includes(" · ") ? o.origen.slice(o.origen.indexOf(" · ")) : "") }, "Origen actualizado.") }, o.fuente || srcOf(cuenta?.fuente) || "")),
              inputField("Probabilidad (%)", o.probabilidad ?? stageProb(o.etapa), "number", (v) => upd({ probabilidad: Math.max(0, Math.min(100, +v || 0)) })),
              inputField("Fecha que lo necesita", o.fechaNecesaria, "date", (v) => upd({ fechaNecesaria: v })),
              field("Valor ponderado", h("span", { class: "money", text: money(weighted(o)) })),
              field("Contacto", contact ? h("span", {}, contact.nombre, h("br"), h("span", { class: "mono small", text: contact.contacto })) : "—"))),
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Siguiente paso" }), h("span", { class: dueClass(o.proximaAccion?.fecha), text: o.proximaAccion?.fecha ? fmtDate(o.proximaAccion.fecha) : "" })),
            h("form", { class: "grid g3", onsubmit: async (e) => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target)); await upd({ proximaAccion: { texto: fd.texto, fecha: fd.fecha } }, "Siguiente paso guardado."); } },
              h("label", { class: "f", style: "grid-column:span 2" }, h("span", { text: "Qué sigue" }), h("input", { class: "i", name: "texto", value: o.proximaAccion?.texto || "", required: true })),
              h("label", { class: "f" }, h("span", { text: "Cuándo" }), h("input", { class: "i", name: "fecha", type: "date", value: o.proximaAccion?.fecha || localDate(), required: true })),
              h("div", { class: "row full" }, h("button", { class: "btn", type: "submit" }, "Guardar siguiente paso"),
                h("button", { class: "btn ghost", type: "button", onclick: () => startCadence(o) }, "Iniciar cadencia de 21 días")))),
          h("div", { class: "card" }, h("h2", { text: "Actividad" }),
            h("form", { class: "grid g3", onsubmit: async (e) => {
              e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target));
              await upd({ actividad: [...(o.actividad || []), { fecha: new Date().toISOString(), tipo: fd.tipo, texto: fd.texto, por: S.name }], etapa: o.etapa === "nuevo" && fd.tipo !== "Nota" ? "contactado" : o.etapa }, "Actividad registrada.");
            } },
              h("select", { class: "i", name: "tipo" }, TIPOS_ACT.map((x) => h("option", { value: x, text: x }))),
              h("input", { class: "i", name: "texto", placeholder: "Qué pasó (resultado, acuerdo, objeción)", required: true, style: "grid-column:span 2" }),
              h("div", { class: "row full" }, h("button", { class: "btn", type: "submit" }, "Registrar"))),
            h("ul", { class: "log" }, [...(o.actividad || [])].reverse().map((a) => h("li", {}, h("time", { text: fmtDT(a.fecha) }), h("div", {}, h("b", { text: a.tipo + " · " }), a.texto, h("span", { class: "muted small", text: " — " + (a.por || "") })))))),
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Cotizaciones" }), h("button", { class: "btn sm", type: "button", onclick: () => newQuote(o) }, "+ Cotización")),
            quotes.length ? quoteTable(quotes) : h("p", { class: "muted small", text: "Aún no hay cotizaciones para esta oportunidad." }))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Ajuste high-ticket" }), h("span", { class: "row" }, h("span", { class: "tier " + tierOf(sc), text: tierOf(sc) }), h("b", { class: "num", text: sc + "/100" }))),
            h("p", { class: "hint", text: "A (70+): prioridad, propuesta de programa y visita a planta. B (40–69): cadencia completa. C: nutrir con contenido, sin descuentos." }),
            h("div", { class: "grid", style: "gap:.35rem" }, SCORE.map((s) => h("label", { class: "row", style: "flex-wrap:nowrap;gap:.5rem;cursor:pointer" },
              h("input", { type: "checkbox", checked: !!o.score?.[s.id], onchange: (e) => upd({ score: { ...(o.score || {}), [s.id]: e.target.checked } }) }),
              h("span", { class: "small", style: "flex:1", text: s.text }), h("span", { class: "num small muted", text: "+" + s.pts }))))),
          h("div", { class: "card" }, h("h2", { text: "Tareas" }),
            tasks.length ? h("ul", { class: "log" }, tasks.filter((t) => !t.hecha).map(taskItem)) : h("p", { class: "muted small", text: "Sin tareas. Inicia la cadencia o agrega una." }),
            h("form", { class: "grid g2", onsubmit: async (e) => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target)); await save("tareas", { tipo: fd.tipo, texto: fd.texto, fecha: fd.fecha, oportunidadId: o.id, cuentaId: o.cuentaId, asesor: fd.asesor || o.asesor || S.name, hecha: false, ...(fd.asesor && fd.asesor !== S.name ? { asignadaPor: S.name, asignadaEn: new Date().toISOString() } : {}) }); rerender(); } },
              h("select", { class: "i full", name: "asesor", "aria-label": "Para" }, team().map((n) => h("option", { value: n, text: "Para: " + n, selected: n === (o.asesor || S.name) }))),
              h("select", { class: "i", name: "tipo" }, TIPOS_ACT.map((x) => h("option", { value: x, text: x }))), h("input", { class: "i", name: "fecha", type: "date", value: addDays(localDate(), 2) }),
              h("input", { class: "i full", name: "texto", placeholder: "Nueva tarea", required: true }), h("button", { class: "btn sm full", type: "submit" }, "Agregar tarea"))),
          h("div", { class: "card" }, h("h2", { text: "Mensajes listos" }),
            h("p", { class: "hint", text: "Con el nombre del contacto, la empresa y tu nombre ya puestos." }),
            TEMPLATES.map((tp) => {
              const txt = fill(tp.text, vars);
              return h("details", {}, h("summary", { class: "small", style: "cursor:pointer", text: tp.name }), h("div", { class: "copybox", text: txt }),
                h("div", { class: "row", style: "margin-top:.4rem" }, h("button", { class: "btn sm ghost", type: "button", onclick: () => copy(txt) }, "Copiar"),
                  isPhone(contact?.contacto) ? h("a", { class: "btn sm ghost", href: waLink(contact.contacto, txt), target: "_blank", rel: "noopener" }, "Abrir WhatsApp") : null));
            })),
          o.solicitud ? h("div", { class: "card" }, h("h2", { text: "Solicitud original" }), h("div", { class: "copybox", text: requestText(o.solicitud) })) : null,
          h("button", { class: "btn danger", type: "button", onclick: async () => { if (!(await confirmBox("¿Borrar esta oportunidad? Sus tareas también se borran."))) return; for (const t of tasks) await remove("tareas", t.id); await remove("oportunidades", o.id); toast("Oportunidad borrada."); go("pipeline"); } }, "Borrar oportunidad")))
    );
  }
  const requestText = (s) => [`${s.id} · ${fmtDT(s.recibida)}`, waOf(s) ? `Llegó al WhatsApp ${waDest(s)}` : "", `${s.nombre} · ${s.empresa || ""} · ${s.contacto}${s.correo && s.correo !== s.contacto ? " · " + s.correo : ""}`, `Prenda: ${s.prenda} · ${fmtN(s.piezas)} pzas`, `Técnicas: ${(s.tecnicas || []).join(", ")}`, ...(s.estimados || []).map((e) => `– Estimado del sitio: ${e.resumen}${e.unitario ? ` · ${money(e.unitario)}/pza` : ""}`), ...(s.modelos || []).map((m) => `– ${m.titulo} (${(m.modelos || []).join(", ")}) · ${fmtN(m.piezas)} pzas · ${m.color || ""}`), s.notas || ""].filter(Boolean).join("\n");
  function confirmBox(text) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal("Confirmar", h("div", { class: "grid" }, h("p", { text }), h("div", { class: "row" },
        h("button", { class: "btn danger", type: "button", onclick: () => { done = true; closeModal(); resolve(true); } }, "Sí, continuar"),
        h("button", { class: "btn ghost", type: "button", onclick: () => closeModal() }, "Cancelar"))));
      m.addEventListener("close", () => { if (!done) resolve(false); }, { once: true });
    });
  }
  async function startCadence(o) {
    const start = localDate();
    for (const c of CADENCE) await save("tareas", { tipo: c.tipo, texto: c.texto, fecha: addDays(start, c.d), oportunidadId: o.id, cuentaId: o.cuentaId, asesor: o.asesor || S.name, hecha: false, cadencia: true }, { quiet: true });
    await save("oportunidades", { ...o, proximaAccion: { texto: CADENCE[0].texto, fecha: start }, actividad: [...(o.actividad || []), { fecha: new Date().toISOString(), tipo: "Nota", texto: "Cadencia de 8 toques en 21 días iniciada.", por: S.name }] }, { quiet: true });
    toast("Cadencia creada: 8 tareas en 21 días.");
    rerender();
  }
  const field = (label, value) => h("div", {}, h("div", { class: "label", text: label }), h("div", {}, value ?? "—"));
  function inputField(label, value, type, onSave) {
    return h("label", { class: "f" }, h("span", { text: label }), h("input", { class: "i", type, value: value ?? "", onchange: (e) => onSave(e.target.value) }));
  }
  function selectField(label, value, options, onSave) {
    return h("label", { class: "f" }, h("span", { text: label }), h("select", { class: "i", onchange: (e) => onSave(e.target.value) }, options.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return h("option", { value: v, text: t, selected: v === value }); })));
  }

  /* ---------------- tasks ---------------- */
  function quickTask(pre = {}) {
    const f = h("form", { class: "quick-task", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f)); if (!fd.texto.trim()) return;
      await save("tareas", { tipo: fd.tipo, texto: fd.texto.trim(), fecha: fd.fecha || localDate(), asesor: fd.asesor || S.name, asignadaPor: S.name, cuentaId: pre.cuentaId || "", oportunidadId: pre.oportunidadId || "", hecha: false }, { quiet: true });
      toast(fd.asesor && fd.asesor !== S.name ? `Tarea asignada a ${fd.asesor}.` : "Tarea agregada."); rerender();
    } },
      h("select", { class: "i", name: "tipo", "aria-label": "Tipo" }, TIPOS_ACT.filter((x) => x !== "Nota").map((x) => h("option", { value: x, text: x }))),
      h("input", { class: "i", name: "texto", placeholder: pre.placeholder || "Nueva tarea: ¿qué hay que hacer?", required: true, "aria-label": "Tarea" }),
      h("input", { class: "i", name: "fecha", type: "date", value: localDate(), "aria-label": "Fecha" }),
      h("select", { class: "i", name: "asesor", "aria-label": "Para" }, team().map((n) => h("option", { value: n, text: n === S.name ? "Para mí" : n, selected: n === (pre.asesor || S.name) }))),
      h("button", { class: "btn accent", type: "submit" }, "Agregar"));
    return f;
  }
  function viewTasks() {
    const f = viewTasks.f ||= { who: S.name, show: "pendientes" };
    let ts = list("tareas");
    if (f.who) ts = ts.filter((t) => t.asesor === f.who || !t.asesor);
    ts = ts.filter((t) => (f.show === "pendientes" ? !t.hecha : t.hecha)).sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
    const groups = [["Atrasadas", ts.filter((t) => t.fecha && t.fecha < localDate())], ["Hoy", ts.filter((t) => t.fecha === localDate())], ["Próximas", ts.filter((t) => !t.fecha || t.fecha > localDate())]];
    return h("div", {},
      top("Lo que sigue con cada cuenta", "Tareas", quickTask(),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.who = e.target.value; rerender(); } }, h("option", { value: "", text: "Todo el equipo" }), team().map((n) => h("option", { value: n, text: n, selected: f.who === n }))),
        h("div", { class: "chips" }, ["pendientes", "hechas"].map((x) => h("button", { type: "button", class: "chip" + (f.show === x ? " on" : ""), onclick: () => { f.show = x; rerender(); } }, x)))),
      f.show === "hechas" ? (ts.length ? h("div", { class: "card" }, h("ul", { class: "log" }, ts.slice(0, 200).map((t) => h("li", {}, h("time", { text: fmtDate(t.fecha) }), h("div", { class: "row between", style: "flex-wrap:nowrap" }, h("span", { text: `${t.tipo}: ${t.texto}` }), h("button", { class: "x", type: "button", title: "Borrar tarea", "aria-label": "Borrar tarea", onclick: () => deleteTask(t) }, "×")))))) : h("div", { class: "empty", text: "No hay tareas hechas aún." }))
        : h("div", { class: "grid g3" }, groups.map(([name, xs]) => h("div", { class: "card" }, h("h2", { text: `${name} (${xs.length})` }), xs.length ? h("ul", { class: "log" }, xs.map(taskItem)) : h("p", { class: "muted small", text: "Nada aquí." })))));
  }

  /* ---------------- accounts ---------------- */
  function viewAccounts() {
    const f = viewAccounts.f ||= { q: "", seg: "", who: "" };
    let cs = list("cuentas");
    if (f.who) cs = cs.filter((c) => (f.who === "-" ? !c.responsable : c.responsable === f.who));
    if (f.seg) cs = cs.filter((c) => c.segmento === f.seg);
    if (f.q) { const q = f.q.toLowerCase(); cs = cs.filter((c) => [c.nombre, c.ciudad, ...(c.contactos || []).map((x) => x.nombre + " " + x.contacto)].join(" ").toLowerCase().includes(q)); }
    cs.sort((a, b) => a.nombre.localeCompare(b.nombre));
    const oppsOf = (id) => list("oportunidades").filter((o) => o.cuentaId === id);
    return h("div", {},
      top(`${list("cuentas").length} cuentas`, "Cuentas",
        h("input", { class: "i search", type: "search", placeholder: "Buscar empresa, ciudad o contacto", value: f.q, oninput: (e) => { f.q = e.target.value; clearTimeout(viewAccounts.t); viewAccounts.t = setTimeout(rerender, 250); } }),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.seg = e.target.value; rerender(); } }, h("option", { value: "", text: "Todos los segmentos" }), SEGMENTS.map((s) => h("option", { value: s.id, text: s.name, selected: f.seg === s.id }))),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.who = e.target.value; rerender(); } }, [["", "Todos los responsables"], [S.name, "Mis clientes"], ["-", "Sin responsable"], ...team().filter((n) => n !== S.name).map((n) => [n, n])].map(([v, t]) => h("option", { value: v, text: t, selected: f.who === v }))),
        h("button", { class: "btn ghost", type: "button", onclick: importModal }, "Importar CSV"),
        isAdmin() ? h("button", { class: "btn ghost", type: "button", onclick: () => assignFollowModal() }, "Asignar seguimiento") : null,
        h("button", { class: "btn accent", type: "button", onclick: () => accountModal() }, "+ Cuenta")),
      cs.length ? h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, ["Empresa", "Segmento", "Responsable", "Contacto principal", "Oportunidades", "Valor abierto"].map((x, i) => h("th", { class: i > 3 ? "r" : "", text: x })))),
        h("tbody", {}, cs.map((c) => { const os = oppsOf(c.id), open = os.filter((o) => !["ganado", "perdido"].includes(o.etapa)); return h("tr", { class: "click", onclick: () => go("cuenta/" + c.id) },
          h("td", {}, h("b", { text: c.nombre })), h("td", { text: segName(c.segmento) }), h("td", { class: c.responsable ? "" : "muted", text: c.responsable || "Sin asignar" }),
          h("td", { class: "small", text: c.contactos?.[0] ? `${c.contactos[0].nombre} · ${c.contactos[0].contacto}` : "—" }), h("td", { class: "r num", text: os.length }), h("td", { class: "r money", text: moneyK(open.reduce((a, o) => a + oppValue(o), 0)) })); }))))
        : h("div", { class: "empty", text: "Aún no hay cuentas. Agrega prospectos uno por uno o importa una lista en CSV desde Prospección." }));
  }
  function accountModal(c = {}) {
    const contacts = c.contactos?.length ? c.contactos : [{ nombre: "", puesto: "", contacto: "" }];
    const f = h("form", { class: "grid g2", onsubmit: async (e) => {
      e.preventDefault(); const fd = new FormData(f);
      const cts = $$(".ct", f).map((row) => ({ nombre: $(".cn", row).value.trim(), puesto: $(".cp", row).value.trim(), contacto: $(".cc", row).value.trim() })).filter((x) => x.nombre || x.contacto);
      const saved = await save("cuentas", { ...c, nombre: fd.get("nombre").trim(), segmento: fd.get("segmento"), ciudad: fd.get("ciudad"), pais: fd.get("pais"), sitio: fd.get("sitio"), fuente: fd.get("fuente"), notas: fd.get("notas"), responsable: fd.get("responsable"), contactos: cts });
      closeModal(); go("cuenta/" + saved.id);
    } },
      h("label", { class: "f full" }, h("span", { text: "Empresa" }), h("input", { class: "i", name: "nombre", required: true, value: c.nombre || "" })),
      h("label", { class: "f" }, h("span", { text: "Segmento" }), h("select", { class: "i", name: "segmento" }, SEGMENTS.map((s) => h("option", { value: s.id, text: s.name, selected: c.segmento === s.id })))),
      h("label", { class: "f" }, h("span", { text: "¿De dónde viene?" }), sourceSelect({ name: "fuente" }, c.fuente || "")),
      h("label", { class: "f" }, h("span", { text: "Ciudad" }), h("input", { class: "i", name: "ciudad", value: c.ciudad || "" })),
      h("label", { class: "f" }, h("span", { text: "País" }), h("input", { class: "i", name: "pais", value: c.pais || "México" })),
      h("label", { class: "f" }, h("span", { text: "Sitio o red social" }), h("input", { class: "i", name: "sitio", value: c.sitio || "" })),
      h("label", { class: "f" }, h("span", { text: "Responsable" }), h("select", { class: "i", name: "responsable" }, h("option", { value: "", text: "— Sin asignar —" }), team().map((n) => h("option", { value: n, text: n, selected: (c.id ? c.responsable : S.name) === n })))),
      h("div", { class: "full grid", style: "gap:.4rem" }, h("span", { class: "label", text: "Contactos" }), h("div", { class: "grid", id: "cts", style: "gap:.4rem" }, contacts.map(contactRow)),
        h("button", { class: "btn sm ghost", type: "button", style: "justify-self:start", onclick: () => $("#cts").append(contactRow({})) }, "+ Contacto")),
      h("label", { class: "f full" }, h("span", { text: "Notas" }), h("textarea", { class: "i", name: "notas", text: c.notas || "" })),
      h("div", { class: "row full" }, h("button", { class: "btn accent", type: "submit" }, "Guardar cuenta")));
    modal(c.id ? "Editar cuenta" : "Nueva cuenta", f);
  }
  const contactRow = (x) => h("div", { class: "ct grid g3" }, h("input", { class: "i cn", placeholder: "Nombre", value: x.nombre || "" }), h("input", { class: "i cp", placeholder: "Puesto", value: x.puesto || "" }), h("input", { class: "i cc", placeholder: "WhatsApp o correo", value: x.contacto || "" }));
  // Everything that happened with a client, newest first: requests, deals, quotes, orders, tasks.
  function clientTimeline(c, os, qs, ots) {
    const ev = [];
    for (const so of list("solicitudes").filter((x) => x.cuentaId === c.id)) ev.push([so.recibida || so.createdAt, "Solicitud", `${so.id} · ${arrivedBy(so)}`, "solicitudes"]);
    for (const o of os) { ev.push([o.createdAt, "Oportunidad", `${o.titulo} · ${oppSource(o) || "origen sin especificar"}`, "oportunidad/" + o.id]); for (const a of o.actividad || []) ev.push([a.fecha, a.tipo || "Nota", `${a.texto}${a.por ? " · " + a.por : ""}`, "oportunidad/" + o.id]); }
    for (const q of qs) { ev.push([q.createdAt, "Cotización", `${q.id} creada · ${money(calcCot(q).total)}`, "cotizacion/" + q.id]); if (q.enviadaEn) ev.push([q.enviadaEn, "Cotización", `${q.id} enviada`, "cotizacion/" + q.id]); if (q.aceptadaEn) ev.push([q.aceptadaEn, "Cotización", `${q.id} aceptada`, "cotizacion/" + q.id]); }
    for (const ot of ots) for (const x of ot.historial || []) ev.push([x.fecha, "OT", `${ot.id} → ${stageName(OT_STAGES, x.etapa)}${x.nota ? " · " + x.nota : ""}`, "ot/" + ot.id]);
    for (const t of list("tareas").filter((t) => t.hecha && t.cuentaId === c.id)) ev.push([t.hechaEn || t.updatedAt, "Tarea", `Hecha: ${t.texto}`, "tareas"]);
    ev.sort((a, b) => String(b[0] || "").localeCompare(String(a[0] || "")));
    if (!ev.length) return h("p", { class: "muted small", text: "Aún no hay movimientos." });
    const show = h("ul", { class: "log timeline" }, ev.slice(0, 25).map(([f, k, t, href]) => h("li", {}, h("time", { text: f ? fmtDT(f) : "—" }), h("a", { href: "#" + href, style: "color:inherit;text-decoration:none" }, h("span", { class: "pill p-mut", style: "margin-right:.4rem", text: k }), t))));
    return ev.length > 25 ? h("div", {}, show, h("p", { class: "muted small", text: `y ${ev.length - 25} movimientos más antiguos.` })) : show;
  }
  function viewAccount(id) {
    const c = byId("cuentas", id);
    if (!c) return h("div", { class: "empty", text: "No encontramos esta cuenta." });
    const os = list("oportunidades").filter((o) => o.cuentaId === id), qs = list("cotizaciones").filter((q) => q.cuentaId === id), ots = list("ots").filter((o) => o.cuentaId === id);
    return h("div", {},
      top(`${segName(c.segmento)} · ${srcOf(c.fuente) || "origen sin especificar"} · ${c.responsable ? "Responsable: " + c.responsable : "Sin responsable"}`, c.nombre, h("button", { class: "btn ghost", type: "button", onclick: () => accountModal(c) }, "Editar"),
        isAdmin() ? h("button", { class: "btn danger", type: "button", onclick: () => deleteAccount(c) }, "Borrar cuenta") : null,
        isAdmin() ? h("button", { class: "btn ghost", type: "button", onclick: () => assignFollowModal({ cuentaId: c.id, asesor: c.responsable }) }, "Asignar seguimiento") : null,
        h("button", { class: "btn ghost", type: "button", onclick: () => assignTaskModal({ cuentaId: c.id, asesor: c.responsable || S.name }) }, "+ Tarea"), h("button", { class: "btn accent", type: "button", onclick: () => newOppModal({ cuentaId: c.id, segmento: c.segmento }) }, "+ Oportunidad")),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Oportunidades" }), os.length ? h("div", { class: "tbl" }, h("table", {}, h("tbody", {}, os.map((o) => h("tr", { class: "click", onclick: () => go("oportunidad/" + o.id) }, h("td", { text: o.titulo }), h("td", { text: stageName(OPP_STAGES, o.etapa) }), h("td", { class: "r money", text: moneyK(oppValue(o)) })))))) : h("p", { class: "muted small", text: "Sin oportunidades." })),
          h("div", { class: "card" }, h("h2", { text: "Cotizaciones" }), qs.length ? quoteTable(qs) : h("p", { class: "muted small", text: "Sin cotizaciones." })),
          h("div", { class: "card" }, h("h2", { text: "Órdenes de trabajo" }), ots.length ? otTable(ots) : h("p", { class: "muted small", text: "Sin órdenes." })),
          ((ts) => h("div", { class: "card" }, h("h2", { text: `Tareas pendientes (${ts.length})` }), quickTask({ cuentaId: c.id, asesor: c.responsable || S.name, placeholder: `Tarea para ${c.nombre}…` }),
            ts.length ? h("ul", { class: "log", style: "margin-top:.6rem" }, ts.map(taskItem)) : null))(list("tareas").filter((t) => !t.hecha && (t.cuentaId === c.id || os.some((o) => o.id === t.oportunidadId))).sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"))),
          h("div", { class: "card" }, h("h2", { text: "Historial del cliente" }), clientTimeline(c, os, qs, ots))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Contactos" }), (c.contactos || []).length ? h("ul", { class: "log" }, c.contactos.map((x) => h("li", {}, h("time", { text: x.puesto || "Contacto" }), h("div", {}, h("b", { text: x.nombre }), h("div", { class: "mono small", text: x.contacto }),
            h("div", { class: "row", style: "margin-top:.3rem" }, isPhone(x.contacto) ? h("a", { class: "btn sm ghost", href: waLink(x.contacto, `Hola ${x.nombre.split(" ")[0]}, soy ${S.name} de Chilian.`), target: "_blank", rel: "noopener" }, "WhatsApp") : null, h("button", { class: "btn sm ghost", type: "button", onclick: () => copy(x.contacto) }, "Copiar")))))) : h("p", { class: "muted small", text: "Sin contactos." })),
          h("div", { class: "card" }, h("h2", { text: "Datos" }), field("Ciudad", [c.ciudad, c.pais].filter(Boolean).join(", ") || "—"), field("Sitio", c.sitio ? h("a", { href: /^https?:/.test(c.sitio) ? c.sitio : "https://" + c.sitio, target: "_blank", rel: "noopener", text: c.sitio }) : "—"), c.notas ? h("p", { class: "small", style: "white-space:pre-wrap", text: c.notas }) : null))));
  }
  function importModal() {
    const ta = h("textarea", { class: "i", style: "min-height:180px", placeholder: "empresa,segmento,ciudad,contacto,puesto,whatsapp_o_correo,sitio\nMarca Uno,marca,CDMX,Ana López,Compras,5512345678,marcauno.mx" });
    const out = h("p", { class: "hint" });
    const f = h("form", { class: "grid", onsubmit: async (e) => {
      e.preventDefault();
      const rows = parseCSV(ta.value).filter((r) => r.some(Boolean));
      if (!rows.length) return toast("Pega al menos una fila.", true);
      const head = rows[0].map((x) => x.toLowerCase());
      const hasHead = head.includes("empresa");
      const idx = (name, def) => (hasHead ? head.findIndex((x) => x.startsWith(name)) : def);
      const I = { e: idx("empresa", 0), s: idx("segmento", 1), c: idx("ciudad", 2), n: idx("contacto", 3), p: idx("puesto", 4), w: idx("whats", 5), x: idx("sitio", 6) };
      let n = 0;
      for (const r of rows.slice(hasHead ? 1 : 0)) {
        const nombre = (r[I.e] || "").trim(); if (!nombre) continue;
        const seg = SEGMENTS.find((s) => s.id === (r[I.s] || "").trim().toLowerCase() || s.name.toLowerCase() === (r[I.s] || "").trim().toLowerCase())?.id || "marca";
        await save("cuentas", { nombre, segmento: seg, ciudad: r[I.c] || "", pais: "México", sitio: r[I.x] || "", fuente: "Prospección", contactos: r[I.n] || r[I.w] ? [{ nombre: r[I.n] || "", puesto: r[I.p] || "", contacto: r[I.w] || "" }] : [] }, { quiet: true });
        n++; out.textContent = `Importando… ${n}`;
      }
      closeModal(); toast(`${n} cuentas importadas.`); go("cuentas");
    } }, h("p", { class: "small", text: "Pega filas en CSV (exportadas de Excel, Google Sheets, LinkedIn o un directorio). Columnas: empresa, segmento, ciudad, contacto, puesto, WhatsApp o correo, sitio. La primera fila puede ser el encabezado." }), ta, out,
      h("div", { class: "row" }, h("button", { class: "btn accent", type: "submit" }, "Importar")));
    modal("Importar prospectos", f);
  }
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    const sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { row.push(cell.trim()); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
  }

  /* ---------------- prospecting playbook ---------------- */
  function viewPlaybook() {
    const counts = SEGMENTS.map((s) => ({ s, n: list("cuentas").filter((c) => c.segmento === s.id).length, open: list("oportunidades").filter((o) => o.segmento === s.id && !["ganado", "perdido"].includes(o.etapa)) }));
    return h("div", {},
      top("Cómo conseguir cuentas que llenen la planta", "Prospección", h("button", { class: "btn ghost", type: "button", onclick: importModal }, "Importar lista CSV"), h("button", { class: "btn accent", type: "button", onclick: () => accountModal() }, "+ Prospecto")),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Cuenta high-ticket" }),
            h("p", { text: "Una cuenta que vale la pena perseguir compra volumen y repite. Califícala con los 7 puntos del ajuste (en cada oportunidad): A va primero, con propuesta de programa y visita a planta." }),
            h("ul", { style: "margin:0;padding-left:1.1rem;display:grid;gap:.3rem" }, SCORE.map((s) => h("li", { class: "small", text: `${s.text} · ${s.pts} pts` })))),
          h("div", { class: "card" }, h("h2", { text: "Dónde encontrarlas" }),
            h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", { text: "Segmento" }), h("th", { text: "Fuentes" }))), h("tbody", {}, PROSPECT_SOURCES.map((p) => h("tr", {}, h("td", {}, h("b", { text: p.seg })), h("td", { class: "small", text: p.where }))))))),
          h("div", { class: "card" }, h("h2", { text: "Cadencia de 21 días" }), h("p", { class: "hint", text: "Se crea sola en cada oportunidad con el botón «Iniciar cadencia». Ocho toques; ninguno pide el pedido antes de la muestra." }),
            h("ul", { class: "log" }, CADENCE.map((c) => h("li", {}, h("time", { text: "Día " + c.d }), h("span", {}, h("b", { text: c.tipo + ": " }), c.texto)))))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Cobertura por segmento" }),
            h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", { text: "Segmento" }), h("th", { class: "r", text: "Cuentas" }), h("th", { class: "r", text: "Abiertas" }), h("th", { class: "r", text: "Valor" }))),
              h("tbody", {}, counts.map(({ s, n, open }) => h("tr", {}, h("td", { text: s.name }), h("td", { class: "r num", text: n }), h("td", { class: "r num", text: open.length }), h("td", { class: "r money", text: moneyK(open.reduce((a, o) => a + oppValue(o), 0)) }))))))),
          h("div", { class: "card" }, h("h2", { text: "Reglas del juego" }), h("ul", { style: "margin:0;padding-left:1.1rem;display:grid;gap:.35rem", class: "small" },
            h("li", { text: "Toda solicitud recibe respuesta el mismo día hábil." }), h("li", { text: "Ninguna oportunidad sin siguiente paso con fecha." }),
            h("li", { text: "Cuentas A: visita o videollamada desde la planta antes de cotizar." }), h("li", { text: "Distribuidores: nunca venderle directo a su cliente." }),
            h("li", { text: "Campañas 2027: anticipo de 50–100 % y mismas condiciones para todas las fuerzas." }), h("li", { text: "Cada cotización enviada tiene seguimiento a los 2 días." }))))));
  }

  /* ---------------- quotes (the quoter itself lives in cotizador.js) ---------------- */
  const CZ = window.makeCotizador({
    h, settings: () => S.settings, list, byId, cuentaName, me: () => S.name, isPhone, waLink, copy, toast,
    lineMinutes, machinesOf, dayCapacity: () => dayCapacity(), TECS,
    save: async (col, doc, o) => {
      if (col === "cotizaciones" && doc.id) {   // the open quoter does not know about links made meanwhile: keep them
        const prev = byId("cotizaciones", doc.id);
        if (prev) for (const k of ["oportunidadId", "origen", "origenDetalle", "solicitudId"]) if (!doc[k] && prev[k]) doc[k] = prev[k];
        if (prev && !doc.cuentaId && prev.cuentaId && doc.oportunidadId) doc.cuentaId = prev.cuentaId;
      }
      const saved = await save(col, doc, o);
      if (col === "cotizaciones" && !saved.oportunidadId && !leadBusy.has(saved.id)) {
        leadBusy.add(saved.id);
        ensureLead(saved).then(({ o: opp }) => toast(`${saved.id} quedó en el CRM como oportunidad: ${opp.titulo}.`)).catch((e) => console.error(e)).finally(() => leadBusy.delete(saved.id));
      }
      return saved;
    }, rerender: () => rerender(),
    onSent: (q) => markSent(q), onAccept: (q) => acceptQuote(q), onDuplicate: (q) => duplicateQuote(q), onDelete: (q) => deleteQuote(q),
    onPayLink: (q) => { const c = calcCot(q), paid = (q.pagos || []).reduce((a, p) => a + (+p.monto || 0), 0), anti = (+q.anticipo || S.settings.tarifas?.anticipo || 50) / 100;
      const sol = q.solicitudId ? byId("solicitudes", q.solicitudId) : null;
      payLinkModal(q.id, paid ? c.total - paid : c.total * anti, `${paid ? "Saldo" : `Anticipo ${Math.round(anti * 100)} %`} · cotización ${q.id}`, sol); }
  });
  const leadBusy = new Set();
  function quoteTable(qs) {
    return h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, ["Folio", "Cliente", "Estado", "Piezas", "Total", "Margen", ""].map((x, i) => h("th", { class: i > 2 ? "r" : "", text: x })))),
      h("tbody", {}, qs.sort((a, b) => b.id.localeCompare(a.id)).map((q) => { const c = calcCot(q); return h("tr", { class: "click", onclick: () => go("cotizacion/" + q.id) },
        h("td", { class: "num", text: q.id }), h("td", { text: CZ.clientOf(q) || "—" }), h("td", {}, quotePill(q.estado)), h("td", { class: "r num", text: fmtN(c.piezas) }), h("td", { class: "r money", text: money(c.total) }),
        h("td", { class: "r num", text: c.margen == null ? "—" : fmtN(c.margen * 100) + " %" }),
        h("td", { class: "r" }, h("button", { class: "x", type: "button", title: "Borrar cotización", "aria-label": "Borrar " + q.id, onclick: (e) => { e.stopPropagation(); deleteQuote(q, true); } }, "×"))); }))));
  }
  const quotePill = (e) => h("span", { class: "pill " + ({ pre: "p-acc", borrador: "p-mut", enviada: "p-info", aceptada: "p-ok", rechazada: "p-bad" }[e] || "p-mut"), text: e === "pre" ? "pre-cotización" : e || "borrador" });
  function viewQuotes() {
    const f = viewQuotes.f ||= { estado: "", q: "" };
    let qs = list("cotizaciones");
    if (f.estado) qs = qs.filter((q) => (q.estado || "borrador") === f.estado);
    if (f.q) { const k = f.q.toLowerCase(); qs = qs.filter((q) => (q.id + " " + CZ.clientOf(q) + " " + (q.lineas || []).map((l) => l.concepto || l.descripcion).join(" ")).toLowerCase().includes(k)); }
    return h("div", {}, top(`${list("cotizaciones").length} cotizaciones · solo equipo`, "Cotizaciones",
      h("input", { class: "i search", type: "search", placeholder: "Buscar folio, cliente o producto", value: f.q, oninput: (e) => { f.q = e.target.value; clearTimeout(viewQuotes.t); viewQuotes.t = setTimeout(rerender, 250); } }),
      h("select", { class: "i", style: "width:auto", onchange: (e) => { f.estado = e.target.value; rerender(); } }, [["", "Todas"], ["pre", "Pre-cotizaciones"], ["borrador", "Borrador"], ["enviada", "Enviadas"], ["aceptada", "Aceptadas"], ["rechazada", "Rechazadas"]].map(([v, t]) => h("option", { value: v, text: t, selected: f.estado === v }))),
      h("button", { class: "btn accent", type: "button", onclick: () => newQuoteModal() }, "+ Cotización")),
      qs.length ? quoteTable(qs) : h("div", { class: "empty", text: "Crea una cotización aquí o desde una oportunidad. Cada cotización guardada enseña sus precios al cotizador." }));
  }
  function newQuoteModal() {
    const cs = list("cuentas").sort((a, b) => a.nombre.localeCompare(b.nombre));
    const sel = h("select", { class: "i", name: "cuenta" }, h("option", { value: "", text: "— Cliente nuevo —" }), cs.map((c) => h("option", { value: c.id, text: c.nombre })));
    const oppSel = h("select", { class: "i" });
    const fresh = h("div", { class: "grid g2" },
      h("label", { class: "f" }, h("span", { text: "Empresa o cliente" }), h("input", { class: "i", name: "nombre", required: true, placeholder: "Ej. Cervecería del Valle" })),
      h("label", { class: "f" }, h("span", { text: "Contacto" }), h("input", { class: "i", name: "persona", placeholder: "Nombre de quien compra" })),
      h("label", { class: "f" }, h("span", { text: "WhatsApp o correo" }), h("input", { class: "i", name: "contacto" })),
      h("label", { class: "f" }, h("span", { text: "Segmento" }), h("select", { class: "i", name: "segmento" }, SEGMENTS.map((x) => h("option", { value: x.id, text: x.name })))));
    let srcSel = sourceSelect({ name: "fuente", required: true }, "");
    const origin = h("div", { class: "grid g2" },
      h("label", { class: "f" }, h("span", { text: "¿De dónde viene el cliente?" }), srcSel),
      h("label", { class: "f" }, h("span", { text: "Detalle (opcional)" }), h("input", { class: "i", name: "detalle", placeholder: "Quién lo refirió, qué feria, campaña…" })));
    const oppBox = h("label", { class: "f" }, h("span", { text: "Oportunidad" }), oppSel);
    const paint = () => {
      const open = list("oportunidades").filter((o) => o.cuentaId === sel.value && !["ganado", "perdido"].includes(o.etapa));
      oppSel.replaceChildren(h("option", { value: "", text: "+ Nueva oportunidad (lead) con esta cotización" }), ...open.map((o) => h("option", { value: o.id, text: `${o.titulo} · ${stageName(OPP_STAGES, o.etapa)}` })));
      fresh.hidden = !!sel.value; fresh.querySelector("[name=nombre]").required = !sel.value; oppBox.hidden = !sel.value;
      const c = sel.value && byId("cuentas", sel.value);   // an existing client: its known origin, or "already retained" if it has bought before
      const known = c ? srcOf(c.fuente) || (list("ots").some((o) => o.cuentaId === c.id) ? "Cliente actual (ya retenido)" : "") : "";
      srcSel.replaceWith(srcSel = sourceSelect({ name: "fuente", required: true }, known));
    };
    sel.addEventListener("change", paint); paint();
    modal("Nueva cotización", h("form", { class: "grid", onsubmit: async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target)); closeModal();
      const opp = oppSel.value && byId("oportunidades", oppSel.value);
      const doc = await CZ.newDoc({ cuentaId: sel.value, oportunidadId: opp ? opp.id : "", cliente: sel.value ? "" : (fd.nombre || "").trim() });
      Object.assign(doc, { origen: fd.fuente, origenDetalle: (fd.detalle || "").trim() });
      let q = await save("cotizaciones", doc, { quiet: true });
      if (opp) await leadQuoted(opp, q);
      else q = (await ensureLead(q, { nombre: fd.nombre, persona: (fd.persona || "").trim(), contacto: (fd.contacto || "").trim(), segmento: fd.segmento, fuente: fd.fuente, detalle: (fd.detalle || "").trim() })).q;
      const c = sel.value && byId("cuentas", sel.value);
      if (c && !c.fuente) await save("cuentas", { ...c, fuente: fd.fuente }, { quiet: true });
      toast(`Cotización ${q.id} creada y su lead en Oportunidades.`);
      go("cotizacion/" + q.id);
    } }, h("label", { class: "f" }, h("span", { text: "Cuenta" }), sel), fresh, oppBox, origin,
      h("p", { class: "hint", text: "Cada cotización entra al pipeline: crea o usa la oportunidad de la cuenta, y al marcarla enviada su etapa, valor y seguimiento se actualizan solos." }), h("button", { class: "btn accent", type: "submit" }, "Crear cotización")));
  }
  // A quote started on an existing opportunity: the opportunity is at least "qualified" and logs it.
  async function leadQuoted(o, q) {
    o = byId("oportunidades", o.id) || o;
    const early = ["nuevo", "contactado"].includes(o.etapa || "nuevo");
    await save("oportunidades", { ...o, ...(early ? { etapa: "calificado", probabilidad: stageProb("calificado") } : {}), cotizacionId: o.cotizacionId || q.id,
      proximaAccion: early || !o.proximaAccion?.texto ? { texto: `Enviar la cotización ${q.id}`, fecha: localDate() } : o.proximaAccion,
      actividad: [...(o.actividad || []), { fecha: new Date().toISOString(), tipo: "Nota", texto: `Cotización ${q.id} creada.`, por: S.name }] }, { quiet: true });
  }
  async function newQuote(o) {
    const doc = await CZ.newDoc({ oportunidadId: o.id, cuentaId: o.cuentaId, solicitud: o.solicitud || null });
    const q = await save("cotizaciones", doc, { quiet: true });
    await leadQuoted(o, q);
    toast(`Cotización ${q.id} creada.`);
    go("cotizacion/" + q.id);
  }
  function viewQuote(id) {
    const q0 = byId("cotizaciones", id);
    if (!q0) return h("div", { class: "empty", text: "No encontramos esta cotización." });
    const o = q0.oportunidadId ? byId("oportunidades", q0.oportunidadId) : null, sol = q0.solicitudId ? byId("solicitudes", q0.solicitudId) : null;
    const cur = q0.origen || o?.fuente || srcOf(byId("cuentas", q0.cuentaId)?.fuente) || (sol ? solSource(sol) : "");
    const setOrigin = async (fuente, detalle) => {
      let q = byId("cotizaciones", id);
      q = await save("cotizaciones", { ...q, origen: fuente, origenDetalle: detalle }, { quiet: true });
      const opp = q.oportunidadId && byId("oportunidades", q.oportunidadId);
      if (opp) await save("oportunidades", { ...opp, fuente, origen: `${fuente}${detalle ? " · " + detalle : ""}${opp.solicitudId ? " · solicitud " + opp.solicitudId : " · cotización " + q.id}` }, { quiet: true });
      const c = q.cuentaId && byId("cuentas", q.cuentaId);
      if (c && srcOf(c.fuente) !== fuente) await save("cuentas", { ...c, fuente }, { quiet: true });
      toast("Origen del cliente actualizado en la cotización, la oportunidad y la cuenta.");
    };
    const srcSel = sourceSelect({ onchange: (e) => setOrigin(e.target.value, det.value.trim()) }, cur);
    const det = h("input", { class: "i", value: q0.origenDetalle || "", placeholder: "Quién lo refirió, qué feria…", onchange: (e) => setOrigin(srcSel.value, e.target.value.trim()) });
    const bar = h("div", { class: "card crm-bar" },
      h("div", { class: "grid g3", style: "align-items:end" },
        h("div", {}, h("div", { class: "label", text: "En el CRM" }), o ? h("a", { href: "#oportunidad/" + o.id, text: `${o.titulo} · ${stageName(OPP_STAGES, o.etapa)}` })
          : h("span", { class: "small" }, q0.estado === "pre" ? "Pre-cotización del sitio: entra al CRM en cuanto la trabajes. " : "Aún no está en el CRM. ",
            h("button", { class: "btn sm", type: "button", onclick: async () => { if (!srcSel.value) { toast("Elige de dónde viene el cliente.", true); srcSel.focus(); return; } const { o: opp } = await ensureLead({ ...byId("cotizaciones", id), origen: srcSel.value, origenDetalle: det.value.trim() }); toast(`Agregada al CRM: ${opp.titulo}.`); rerender(); } }, "Agregar al CRM"))),
        h("label", { class: "f" }, h("span", { text: "¿De dónde viene el cliente?" }), srcSel),
        h("label", { class: "f" }, h("span", { text: `Detalle${sol ? " · llegó por " + arrivedBy(sol) : ""}` }), det)));
    return h("div", {}, bar, CZ.view(q0, { pill: quotePill(q0.estado) }));
  }
  async function markSent(q) {
    const wasSent = q.estado === "enviada";
    let o; ({ q, o } = await ensureLead(q));   // a quote sent without a lead gets one now
    const c = calcCot(q), now = new Date().toISOString(), follow = addDays(localDate(), 2);
    q = await save("cotizaciones", { ...q, estado: "enviada", enviadaEn: now }, { quiet: true });
    o = byId("oportunidades", o.id) || o;
    // stage: up to "quote sent" (never backwards from negotiation; a lost deal re-quoted comes back)
    const stage = ["nuevo", "contactado", "calificado", "cotizacion", "perdido"].includes(o.etapa || "nuevo") ? "cotizacion" : o.etapa;
    if (o.etapa !== "ganado") await save("oportunidades", {
      ...o, ...(o.tituloAuto ? { titulo: quoteTitle(q, c) } : {}), etapa: stage, probabilidad: stage === o.etapa ? o.probabilidad ?? stageProb(stage) : stageProb(stage), valor: Math.round(c.sub), piezasAnio: Math.max(+o.piezasAnio || 0, c.piezas),
      cotizacionId: q.id, cotizacionEnviada: now, ...(o.etapa === "perdido" ? { motivoPerdida: "", cerradaEn: "" } : {}),
      proximaAccion: { texto: `Seguimiento a la cotización ${q.id}`, fecha: follow },
      actividad: [...(o.actividad || []), { fecha: now, tipo: "Nota", texto: `${wasSent ? "Cotización reenviada" : "Cotización enviada"}: ${q.id} · ${money(c.total)} con IVA · ${fmtN(c.piezas)} pzas.${stage !== o.etapa ? ` Pasó a ${stageName(OPP_STAGES, stage)}.` : ""}`, por: S.name }]
    }, { quiet: true });
    if (!wasSent) await save("tareas", { tipo: "WhatsApp", texto: `Seguimiento a la cotización ${q.id}`, fecha: follow, oportunidadId: o.id, cuentaId: o.cuentaId, asesor: o.asesor || S.name, hecha: false }, { quiet: true });
    toast(`Enviada. ${o.titulo} está en ${stageName(OPP_STAGES, o.etapa === "ganado" ? "ganado" : stage)} por ${moneyK(c.sub)}; seguimiento en 2 días.`);
    rerender();
  }
  async function acceptQuote(q, { silent = false, pagos = [] } = {}) {
    const nq = CZ.normalize(q);
    let lineas = nq.lineas;
    if (nq.opciones && lineas.length > 1 && !silent) {   // options: the client picked one
      const labels = lineas.map((l, i) => `${String.fromCharCode(65 + i)} · ${l.concepto}`);
      const pick = await askText("¿Qué opción eligió el cliente?", labels);
      if (pick == null) return;
      lineas = [lineas[Math.max(0, labels.findIndex((x) => pick.startsWith(x)))]];
    }
    const c = calcCot(nq.opciones ? { ...nq, opciones: false, lineas } : nq);
    const due = nq.ent === "fecha" && nq.fechaEnt ? nq.fechaEnt : workDays(parseInt(nq.dias, 10) || 15).pop();
    const opp0 = byId("oportunidades", q.oportunidadId), solId = q.solicitudId || opp0?.solicitudId;
    const draft = list("ots").find((o) => o.previa && ((solId && o.solicitudId === solId) || o.cotizacionId === q.id));
    const ot = await save("ots", {
      ...(draft || {}), previa: false,
      cotizacionId: q.id, oportunidadId: q.oportunidadId, cuentaId: q.cuentaId, clienteNombre: CZ.clientOf(q) || "Cliente", etapa: "arte", prioridad: nq.expressOn ? "urgente" : "normal",
      fechaCompromiso: due, tokenCliente: crypto.getRandomValues(new Uint32Array(4)).join("").slice(0, 24) + rid(),
      lineas: lineas.filter((l) => !l.nopcs).map((l, i) => ({ id: l.id, descripcion: l.concepto, modelo: "", color: l.color, piezas: +l.piezas || 0, catId: l.catId,
        ubicaciones: (l.ubicaciones || []).length ? l.ubicaciones : (draft?.lineas?.[Math.min(i, draft.lineas.length - 1)]?.ubicaciones || []), tallas: Object.fromEntries(SIZES.map((s) => [s, 0])) })),
      total: c.total, anticipo: +nq.anticipo || 0, notas: nq.notas,
      pagos: mergePagos(draft?.pagos, q.pagos, pagos),
      arte: draft?.arte || { estado: "pendiente", archivos: [] }, programacion: draft?.programacion || [], merma: draft?.merma || [],
      historial: [...(draft?.historial || []), { etapa: draft?.etapa || "arte", fecha: new Date().toISOString(), por: S.name, nota: draft ? `OT previa confirmada con ${q.id}` : `Creada desde ${q.id}` }]
    }, { quiet: true });
    await save("cotizaciones", { ...q, estado: "aceptada", aceptadaEn: new Date().toISOString(), otId: ot.id }, { quiet: true });
    const o = byId("oportunidades", q.oportunidadId);
    if (o) await save("oportunidades", { ...o, etapa: "ganado", probabilidad: 100, valor: c.sub, cerradaEn: new Date().toISOString(), actividad: [...(o.actividad || []), { fecha: new Date().toISOString(), tipo: "Nota", texto: `${q.id} aceptada. ${ot.id} creada.`, por: S.name }] }, { quiet: true });
    if (silent) return ot;
    toast(draft ? `${ot.id} confirmada con el mockup del cliente.` : `${ot.id} creada.`);
    go("ot/" + ot.id);
  }
  // Online payments (Mercado Pago, Stripe) land on the request or the quote; the work order carries them, once each.
  const mergePagos = (...lists) => { const out = [], seen = new Set(); for (const p of lists.flat().filter(Boolean)) { const k = p.pid || `${p.monto}|${p.fecha}|${p.metodo}|${p.nota}`; if (!seen.has(k)) { seen.add(k); out.push(p); } } return out; };
  let paidBusy = false;
  async function ensurePaid() {
    if (paidBusy) return 0; paidBusy = true; let made = 0;
    try {
      // a paid request with no order yet: lead, accept its pre-quote (the price the assistant gave) and open the OT
      for (const s of list("solicitudes").filter((x) => x.pagos?.length && x.preCotizacionId && !x.otId && x.estado !== "descartada")) {
        let q = byId("cotizaciones", s.preCotizacionId); if (!q) continue;
        if (q.otId) { await save("solicitudes", { ...byId("solicitudes", s.id), otId: q.otId }, { quiet: true }); continue; }
        if (!q.oportunidadId) { await leadFromRequest(s); q = byId("cotizaciones", q.id); }
        const ot = await acceptQuote(q, { silent: true, pagos: s.pagos });
        await save("solicitudes", { ...byId("solicitudes", s.id), otId: ot.id }, { quiet: true });
        await save("tareas", { tipo: "Llamada", texto: `${s.nombre} pagó en línea (${s.id}). Confirmar arte, tallas y fecha de ${ot.id}`, fecha: localDate(), cuentaId: ot.cuentaId || "", oportunidadId: ot.oportunidadId || "", asesor: S.name, hecha: false }, { quiet: true });
        made++;
      }
      // a paid quote that was not accepted yet: paying is accepting
      for (const q of list("cotizaciones").filter((x) => x.pagos?.length && !x.otId && x.estado !== "pre")) { await acceptQuote(q, { silent: true }); made++; }
      // later payments (a balance) reach the order that already exists
      for (const src of [...list("solicitudes"), ...list("cotizaciones")].filter((x) => x.pagos?.length && x.otId)) {
        const ot = byId("ots", src.otId); if (!ot) continue;
        const all = mergePagos(ot.pagos, src.pagos);
        if (all.length !== (ot.pagos || []).length) { await save("ots", { ...ot, pagos: all }, { quiet: true }); made++; }
      }
    } catch (e) { console.error(e); }
    finally { paidBusy = false; }
    return made;
  }
  async function duplicateQuote(q) {
    const d = structuredClone(q);
    for (const k of ["id", "createdAt", "createdBy", "updatedAt", "updatedBy", "otId", "enviadaEn", "aceptadaEn"]) delete d[k];
    Object.assign(d, { estado: "borrador", fecha: localDate() });
    let saved = await save("cotizaciones", d, { quiet: true });
    if (saved.oportunidadId && byId("oportunidades", saved.oportunidadId)) await leadQuoted(byId("oportunidades", saved.oportunidadId), saved);
    else saved = (await ensureLead(saved)).q;
    toast(`Copia creada: ${saved.id}.`);
    go("cotizacion/" + saved.id);
  }
  async function deleteQuote(q, stay) {
    const ot = q.otId && byId("ots", q.otId);
    if (!(await confirmBox(`¿Borrar la cotización ${q.id}${CZ.clientOf(q) ? " de " + CZ.clientOf(q) : ""}?${ot ? ` Su orden ${ot.id} se queda en planta.` : ""} No se puede deshacer.`))) return;
    await remove("cotizaciones", q.id);
    const o = q.oportunidadId && byId("oportunidades", q.oportunidadId);
    if (o) await save("oportunidades", { ...o, ...(o.cotizacionId === q.id ? { cotizacionId: "" } : {}), actividad: [...(o.actividad || []), { fecha: new Date().toISOString(), tipo: "Nota", texto: `Cotización ${q.id} borrada.`, por: S.name }] }, { quiet: true });
    for (const s of list("solicitudes").filter((x) => x.preCotizacionId === q.id)) await save("solicitudes", { ...s, preCotizacionId: "" , preCotizacionBorrada: q.id }, { quiet: true });
    toast(`Cotización ${q.id} borrada.`);
    if (stay) rerender(); else go(q.oportunidadId ? "oportunidad/" + q.oportunidadId : "cotizaciones");
  }
  // An account and, if chosen, everything sales-side that hangs from it. Work orders stay (production history).
  async function deleteAccount(c) {
    const os = list("oportunidades").filter((o) => o.cuentaId === c.id), qs = list("cotizaciones").filter((q) => q.cuentaId === c.id || os.some((o) => o.id === q.oportunidadId));
    const ts = list("tareas").filter((t) => t.cuentaId === c.id || os.some((o) => o.id === t.oportunidadId)), ots = list("ots").filter((o) => o.cuentaId === c.id);
    const all = h("input", { type: "checkbox", checked: true });
    const ok = await new Promise((res) => {
      modal(`Borrar la cuenta ${c.nombre}`, h("div", { class: "grid" },
        h("p", { text: `Tiene ${os.length} oportunidad(es), ${qs.length} cotización(es) y ${ts.length} tarea(s).${ots.length ? ` Sus ${ots.length} orden(es) de trabajo se quedan en planta con el nombre del cliente.` : ""}` }),
        os.length + qs.length + ts.length ? h("label", { class: "row small", style: "gap:.4rem" }, all, "Borrar también sus oportunidades, cotizaciones y tareas") : null,
        h("p", { class: "small muted", text: "No se puede deshacer." }),
        h("div", { class: "row" }, h("button", { class: "btn danger", type: "button", onclick: () => { closeModal(); res(true); } }, "Borrar cuenta"), h("button", { class: "btn ghost", type: "button", onclick: () => { closeModal(); res(false); } }, "Cancelar"))));
      $("#modal").addEventListener("close", () => res(false), { once: true });
    });
    if (!ok) return;
    try {
      if (all.checked) { for (const t of ts) await remove("tareas", t.id); for (const q of qs) await remove("cotizaciones", q.id); for (const o of os) await remove("oportunidades", o.id); }
      await remove("cuentas", c.id);
      toast(`Cuenta ${c.nombre} borrada.`); go("cuentas");
    } catch (e) { if (e.message !== "401") toast(e.message, true); await loadAll(true); rerender(); }
  }
  /* ---------------- work orders ---------------- */
  const otPill = (e) => h("span", { class: "pill " + ({ entregada: "p-ok", embarcada: "p-ok", impresion: "p-acc", calidad: "p-info", empaque: "p-info", aprobacion: "p-warn", arte: "p-warn" }[e] || "p-mut"), text: stageName(OT_STAGES, e) });
  function otTable(ots) {
    return h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, ["OT", "Cliente", "Etapa", "Arte", "Piezas", "Máquinas", "Compromiso"].map((x, i) => h("th", { class: i === 4 ? "r" : "", text: x })))),
      h("tbody", {}, ots.sort((a, b) => (a.fechaCompromiso || "9").localeCompare(b.fechaCompromiso || "9")).map((o) => h("tr", { class: "click", onclick: () => go("ot/" + o.id) },
        h("td", { class: "num", text: o.id }), h("td", { text: o.clienteNombre || cuentaName(o.cuentaId) }), h("td", {}, o.previa ? h("span", { class: "pill p-acc", text: "previa" }) : otPill(o.etapa), !o.previa && otPending(o).length ? h("span", { class: "pill p-warn", title: otPending(o).map((x) => x.txt).join("\n"), style: "margin-left:.3rem", text: `⚠ ${otPending(o).length}` }) : null),
        h("td", {}, h("span", { class: "pill " + ({ aprobada: "p-ok", cambios: "p-bad", enviada: "p-info" }[o.arte?.estado] || "p-mut"), text: o.arte?.estado || "pendiente" })),
        h("td", { class: "r num", text: fmtN((o.lineas || []).reduce((a, l) => a + (+l.piezas || 0), 0)) }),
        h("td", { class: "small", text: (o.programacion || []).map((p) => `${S.settings.pulpos.find((x) => x.id === p.pulpo)?.nombre || p.pulpo} · ${fmtDate(p.fecha)}`).join("; ") || "—" }),
        h("td", { class: o.etapa !== "entregada" && o.etapa !== "embarcada" ? dueClass(o.fechaCompromiso) : "", text: fmtDate(o.fechaCompromiso) }))))));
  }
  function viewOTs() {
    const f = viewOTs.f ||= { etapa: "activas", q: "", vista: store.get("chilian-os-otvista") || "tablero" };
    let ots = list("ots");
    if (f.etapa === "activas") ots = ots.filter((o) => o.etapa !== "entregada" && !o.previa); else if (f.etapa === "previas") ots = ots.filter((o) => o.previa); else if (f.etapa) ots = ots.filter((o) => o.etapa === f.etapa && !o.previa);
    if (f.q) { const q = f.q.toLowerCase(); ots = ots.filter((o) => (o.id + " " + (o.clienteNombre || "")).toLowerCase().includes(q)); }
    return h("div", {},
      top(`${list("ots").filter((o) => o.etapa !== "entregada" && !o.previa).length} activas · ${list("ots").filter((o) => o.previa).length} previas`, "Órdenes de trabajo",
        h("input", { class: "i search", type: "search", placeholder: "Buscar OT o cliente", value: f.q, oninput: (e) => { f.q = e.target.value; clearTimeout(viewOTs.t); viewOTs.t = setTimeout(rerender, 250); } }),
        h("select", { class: "i", style: "width:auto", onchange: (e) => { f.etapa = e.target.value; rerender(); } }, h("option", { value: "activas", text: "Activas" }), h("option", { value: "previas", text: `Previas (${list("ots").filter((o) => o.previa).length})`, selected: f.etapa === "previas" }), h("option", { value: "", text: "Todas", selected: f.etapa === "" }), OT_STAGES.map((s) => h("option", { value: s.id, text: s.name, selected: f.etapa === s.id }))),
        h("div", { class: "seg" }, [["tablero", "Tablero"], ["lista", "Lista"]].map(([v, t]) => h("button", { type: "button", class: f.vista === v ? "on" : "", onclick: () => { f.vista = v; store.set("chilian-os-otvista", v); rerender(); } }, t))),
        h("button", { class: "btn ghost", type: "button", onclick: () => manualOT() }, "+ OT sin cotización")),
      (() => { const n = list("ots").filter((o) => !o.previa && o.etapa !== "entregada" && otPending(o).length).length;
        return n ? h("p", { class: "pend sm", style: "margin:0 0 .8rem" }, h("b", { text: `⚠ ${n} OT con procesos sin terminar.` }), h("span", { text: " Arrastra cada tarjeta a su siguiente etapa (en el teléfono, usa «Mover a…»); si le falta algo, el sistema te dice qué antes de moverla." })) : null; })(),
      f.vista === "tablero"
        ? (ots.length || f.etapa !== "activas" ? otBoard(f.etapa === "activas" || f.etapa === "" ? ots : ots) : h("div", { class: "empty", text: "No hay órdenes activas. Una OT nace cuando se acepta una cotización." }))
        : h("div", {}, h("div", { class: "kpis" }, OT_STAGES.map((s) => h("a", { class: "kpi", href: "#ots", onclick: () => { f.etapa = s.id; } }, h("span", { class: "label", text: s.name }), h("strong", { text: list("ots").filter((o) => o.etapa === s.id).length })))),
          ots.length ? otTable(ots) : h("div", { class: "empty", text: "No hay órdenes en esta vista. Una OT nace cuando se acepta una cotización." })));
  }
  async function manualOT() {
    const cs = list("cuentas");
    if (!cs.length) return toast("Primero crea la cuenta del cliente.", true);
    const sel = h("select", { class: "i", name: "cuenta" }, cs.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((c) => h("option", { value: c.id, text: c.nombre })));
    modal("OT sin cotización", h("form", { class: "grid", onsubmit: async (e) => {
      e.preventDefault(); closeModal();
      const ot = await save("ots", { cuentaId: sel.value, clienteNombre: cuentaName(sel.value), etapa: "arte", prioridad: "normal", fechaCompromiso: workDays(15).pop(), tokenCliente: rid() + rid() + rid(),
        lineas: [{ id: rid(), descripcion: "Playera", piezas: 0, costoPrenda: 0, ubicaciones: [{ nombre: "Frente", colores: 1, tintas: "" }], tallas: Object.fromEntries(SIZES.map((s) => [s, 0])) }],
        arte: { estado: "pendiente", archivos: [] }, programacion: [], merma: [], historial: [{ etapa: "arte", fecha: new Date().toISOString(), por: S.name, nota: "Creada sin cotización" }] }, { quiet: true });
      go("ot/" + ot.id);
    } }, h("label", { class: "f" }, h("span", { text: "Cliente" }), sel), h("button", { class: "btn accent", type: "submit" }, "Crear OT")));
  }
  /* Processes that should be finished before an OT is in (or moves to) a stage.
     Returns [{ txt, etapa }] — etapa is where that process belongs, to show it in the legend. */
  const stageIdx = (id) => OT_STAGES.findIndex((s) => s.id === id);
  function otPending(ot, target = ot.etapa) {
    const t = stageIdx(target), out = [], add = (etapa, txt) => { if (t >= stageIdx(etapa)) out.push({ etapa, txt }); };
    const piezas = (ot.lineas || []).reduce((a, l) => a + (+l.piezas || 0), 0);
    if (ot.previa) out.push({ etapa: "arte", txt: "Es una OT previa: confírmala antes de moverla en planta" });
    if (!piezas) add("arte", "Las partidas no tienen piezas");
    if (!ot.fechaCompromiso) add("arte", "Sin fecha compromiso");
    if (!(ot.arte?.archivos || []).length) add("aprobacion", "No hay arte ni mockup subido");
    if (ot.arte?.estado !== "aprobada") add("compra", ot.arte?.estado === "cambios" ? "El cliente pidió cambios al arte y no se ha vuelto a aprobar" : "El arte no está aprobado por el cliente");
    const sinTallas = (ot.lineas || []).filter((l) => +l.piezas > 0 && Object.values(l.tallas || {}).reduce((a, b) => a + (+b || 0), 0) !== +l.piezas).length;
    if (sinTallas) add("compra", `Tallas incompletas en ${sinTallas} partida(s)`);
    if (+ot.total > 0 && +ot.anticipo > 0 && paidOf(ot) < depositDue(ot) - 0.5) add("compra", `Anticipo sin cubrir (${money(Math.max(0, depositDue(ot) - paidOf(ot)))} por recibir)`);
    if (+ot.total > 0 && paidOf(ot) < +ot.total - 0.5) add("entregada", `Saldo pendiente de ${money(+ot.total - paidOf(ot))}`);
    const falta = pendingTecs(ot);
    if (falta.length) add("programada", `Falta programar máquina (${falta.map((k) => TECS[k] || k).join(", ")})`);
    if (t >= stageIdx("empaque") && (ot.merma || []).length === 0 && !(ot.historial || []).some((hh) => hh.etapa === "calidad")) add("empaque", "No pasó por revisión de calidad");
    if (!ot.embarque?.paqueteria && !ot.embarque?.guia) add("embarcada", "Sin datos de embarque (paquetería o guía)");
    // stages jumped over: never recorded in the history
    const seen = new Set((ot.historial || []).map((hh) => hh.etapa));
    const skipped = OT_STAGES.slice(stageIdx(ot.etapa) + 1, t).filter((st) => !seen.has(st.id)).map((st) => st.name);
    if (skipped.length && t > stageIdx(ot.etapa) + 1) out.push({ etapa: target, txt: `Se brinca ${skipped.join(", ")} sin registrarse` });
    return out;
  }
  // Move an OT to another stage; if processes are unfinished, say which and ask before moving.
  async function moveOT(ot, etapa, nota = "Movida en el tablero") {
    ot = byId("ots", ot.id) || ot;
    if (ot.etapa === etapa) return;
    const forward = stageIdx(etapa) > stageIdx(ot.etapa);
    const pend = forward ? otPending(ot, etapa) : [];
    if (pend.length) {
      const ok = await new Promise((res) => {
        modal(`${ot.id}: hay procesos sin terminar`, h("div", { class: "grid" },
          h("p", { text: `Para pasar a ${stageName(OT_STAGES, etapa)} falta:` }),
          h("ul", { class: "pend-list" }, pend.map((p) => h("li", {}, h("b", { text: stageName(OT_STAGES, p.etapa) + ": " }), p.txt))),
          h("p", { class: "small muted", text: "Si la mueves de todos modos, queda anotado en su historial con tu nombre." }),
          h("div", { class: "row" },
            h("button", { class: "btn accent", type: "button", onclick: () => { closeModal(); res(true); } }, "Mover de todos modos"),
            h("button", { class: "btn ghost", type: "button", onclick: () => { closeModal(); res(false); } }, "Cancelar"),
            h("a", { class: "btn ghost", href: "#ot/" + ot.id, onclick: () => { closeModal(); res(false); } }, "Abrir la OT y completarla"))));
        $("#modal").addEventListener("close", () => res(false), { once: true });
      });
      if (!ok) { rerender(); return; }
    }
    await save("ots", setStage(ot, etapa, pend.length ? `${nota} con pendientes: ${pend.map((p) => p.txt).join("; ")}` : nota), { quiet: true });
    toast(`${ot.id} → ${stageName(OT_STAGES, etapa)}${pend.length ? " (con pendientes)" : ""}.`);
    rerender();
  }
  // The legend on a card or an OT: what of the current stage (and before) is unfinished.
  const pendLegend = (ot, compact) => {
    const p = otPending(ot); if (!p.length) return null;
    return h("div", { class: "pend" + (compact ? " sm" : "") }, h("b", { text: `⚠ ${p.length} proceso${p.length > 1 ? "s" : ""} sin terminar` }),
      compact ? h("span", { text: p.slice(0, 2).map((x) => x.txt).join(" · ") + (p.length > 2 ? "…" : "") }) : h("ul", {}, p.map((x) => h("li", {}, h("b", { text: stageName(OT_STAGES, x.etapa) + ": " }), x.txt))));
  };
  function otBoard(ots) {
    const lanes = OT_STAGES.map((st) => {
      const xs = ots.filter((o) => (o.etapa || "arte") === st.id).sort((a, b) => (a.fechaCompromiso || "9").localeCompare(b.fechaCompromiso || "9"));
      const lane = h("section", { class: "lane", "data-stage": st.id },
        h("header", {}, h("b", { text: st.name }), h("span", { class: "num small muted", text: `${xs.length} · ${fmtN(xs.reduce((a, o) => a + o.lineas.reduce((x, l) => x + (+l.piezas || 0), 0), 0))} pzas` })),
        xs.map((o) => {
          const pz = o.lineas.reduce((a, l) => a + (+l.piezas || 0), 0), late = o.fechaCompromiso && o.fechaCompromiso < localDate() && !["embarcada", "entregada"].includes(o.etapa);
          const card = h("article", { class: "opp otc" + (otPending(o).length ? " warn" : ""), draggable: "true", "data-id": o.id, onclick: (e) => { if (!e.target.closest("select")) go("ot/" + o.id); } },
            h("div", { class: "row between", style: "flex-wrap:nowrap;align-items:start" }, h("span", { class: "t num", text: o.id }), o.prioridad === "urgente" ? h("span", { class: "pill p-bad", text: "urgente" }) : null),
            h("span", { class: "small", text: o.clienteNombre || cuentaName(o.cuentaId) }),
            h("div", { class: "m" }, h("span", { text: fmtN(pz) + " pzas" }), h("span", { class: late ? "due-late" : "", text: o.fechaCompromiso ? (late ? "atrasada · " : "") + fmtDate(o.fechaCompromiso) : "sin fecha" })),
            pendLegend(o, true),
            h("select", { class: "i sm mover", "aria-label": "Mover a otra etapa", onchange: (e) => { const v = e.target.value; e.target.value = ""; if (v) moveOT(o, v, "Movida en el tablero"); } },
              h("option", { value: "", text: "Mover a…" }), OT_STAGES.filter((x) => x.id !== o.etapa).map((x) => h("option", { value: x.id, text: x.name }))));
          card.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", o.id); e.dataTransfer.effectAllowed = "move"; card.classList.add("drag"); });
          card.addEventListener("dragend", () => card.classList.remove("drag"));
          return card;
        }));
      lane.addEventListener("dragover", (e) => { e.preventDefault(); lane.classList.add("drop"); });
      lane.addEventListener("dragleave", (e) => { if (!lane.contains(e.relatedTarget)) lane.classList.remove("drop"); });
      lane.addEventListener("drop", async (e) => {
        e.preventDefault(); lane.classList.remove("drop");
        const o = byId("ots", e.dataTransfer.getData("text/plain"));
        if (o && o.etapa !== st.id) await moveOT(o, st.id);
      });
      return lane;
    });
    return h("div", { class: "board ot-board" }, lanes);
  }
  const paidOf = (ot) => (ot.pagos || []).reduce((a, p) => a + (+p.monto || 0), 0);
  const depositDue = (ot) => (+ot.total || 0) * (+ot.anticipo || 0) / 100;
  function paymentsCard(ot, persist) {
    const total = +ot.total || 0, paid = paidOf(ot), dep = depositDue(ot);
    const f = h("form", { class: "grid g3", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f)); if (!(+fd.monto > 0)) return toast("Escribe el monto.", true);
      await persist({ pagos: [...(ot.pagos || []), { monto: +fd.monto, metodo: fd.metodo, fecha: fd.fecha || localDate(), nota: fd.nota || "", por: S.name }] }, "Pago registrado.");
    } },
      h("input", { class: "i", name: "monto", type: "number", min: "0", step: "any", placeholder: "Monto (MXN)", value: !paid && dep ? dep.toFixed(2) : "" }),
      h("select", { class: "i", name: "metodo" }, ["Transferencia", "Depósito", "Efectivo", "Tarjeta", "Cheque", "Crédito"].map((x) => h("option", { value: x, text: x }))),
      h("input", { class: "i", name: "fecha", type: "date", value: localDate() }),
      h("input", { class: "i", name: "nota", placeholder: "Referencia o folio de factura", style: "grid-column:span 2" }),
      h("button", { class: "btn", type: "submit" }, "Registrar pago"));
    return h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Pagos" }), total ? h("span", { class: "pill " + (paid >= total - 0.5 ? "p-ok" : paid >= dep - 0.5 && dep ? "p-info" : "p-warn"), text: paid >= total - 0.5 ? "pagada" : paid >= dep - 0.5 && dep ? "anticipo cubierto" : "pendiente" }) : null),
      total ? h("div", { class: "grid g3" }, field("Total", h("b", { class: "money", text: money(total) })), field(`Anticipo ${ot.anticipo || 0} %`, money(dep)), field("Saldo", h("b", { class: "money " + (total - paid > 0.5 ? "due-late" : ""), text: money(Math.max(0, total - paid)) })))
        : h("p", { class: "small muted", text: "Esta OT no viene de una cotización: registra los pagos aquí y el total en Fechas y prioridad." }),
      (ot.pagos || []).length ? h("ul", { class: "log" }, ot.pagos.map((p, i) => h("li", {}, h("time", { text: fmtDate(p.fecha) }), h("div", { class: "row between", style: "flex-wrap:nowrap" }, h("span", { text: `${money(p.monto)} · ${p.metodo}${p.nota ? " · " + p.nota : ""} · ${p.por}` }),
        h("button", { class: "x", type: "button", "aria-label": "Quitar pago", onclick: async () => { if (await confirmBox(`¿Quitar el pago de ${money(p.monto)}?`)) persist({ pagos: ot.pagos.filter((_, j) => j !== i) }, "Pago quitado."); } }, "×"))))) : null,
      f);
  }
  function setStage(ot, etapa, nota, por = S.name) {
    return { ...ot, etapa, historial: [...(ot.historial || []), { etapa, fecha: new Date().toISOString(), por, nota }] };
  }
  function viewOT(id) {
    const ot0 = byId("ots", id);
    if (!ot0) return h("div", { class: "empty", text: "No encontramos esta OT." });
    const ot = structuredClone(ot0), cuenta = byId("cuentas", ot.cuentaId), idx = OT_STAGES.findIndex((s) => s.id === ot.etapa);
    const piezas = ot.lineas.reduce((a, l) => a + (+l.piezas || 0), 0), minutos = otMinutes(ot);
    const mermaTotal = (ot.merma || []).reduce((a, m) => a + (+m.cantidad || 0), 0);
    const base = location.origin, linkAprob = `${base}/aprobar?t=${ot.tokenCliente}`, linkSeg = `${base}/pedido?t=${ot.tokenCliente}`;
    const contact = cuenta?.contactos?.find((x) => isPhone(x.contacto)) || cuenta?.contactos?.[0];
    const persist = async (patch, msg) => { await save("ots", { ...ot, ...patch }, { quiet: !msg }); if (msg) toast(msg); rerender(); };
    let dirty = false;
    const saveLines = h("button", { class: "btn sm accent", type: "button", hidden: true, onclick: () => persist({ lineas: ot.lineas }, "Partidas guardadas.") }, "Guardar partidas");
    const mark = () => { if (!dirty) { dirty = true; saveLines.hidden = false; } };
    const files = ot.arte?.archivos || [];
    const fileUrl = (p) => `/api/archivo?path=${encodeURIComponent(p)}&s=${encodeURIComponent(S.token)}`;
    return h("div", {},
      top(`${ot.clienteNombre || cuentaName(ot.cuentaId)}${ot.cotizacionId ? " · " + ot.cotizacionId : ""}`, `Orden ${ot.id}`, otPill(ot.etapa),
        h("button", { class: "btn ghost", type: "button", onclick: () => printTraveler(ot) }, "Hoja viajera"),
        h("button", { class: "btn ghost", type: "button", onclick: () => printPacking(ot) }, "Lista de empaque")),
      ot.previa ? h("div", { class: "card", style: "border-color:var(--magenta);margin-bottom:1rem" },
        h("div", { class: "row between" }, h("div", {}, h("h2", { text: "OT previa" }),
          h("p", { class: "small", style: "margin:0", text: `Nació de ${ot.solicitudId || "una solicitud"} con ${ot.estudio ? "el mockup y el diseño que el cliente armó en Estampa tu idea" : "los gráficos que el cliente adjuntó a los modelos del catálogo"}. No entra a programación ni a planta hasta confirmarla; se confirma sola al aceptar su cotización.` })),
          h("div", { class: "row" }, ot.solicitudId ? h("a", { class: "btn ghost", href: "#solicitudes" }, "Ver solicitud") : null,
            h("button", { class: "btn accent", type: "button", onclick: async () => { if (!(await confirmBox(`¿Confirmar ${ot.id} como orden de trabajo? Pasará a planta en la etapa ${stageName(OT_STAGES, ot.etapa)}.`))) return; await persist({ previa: false, fechaCompromiso: ot.fechaCompromiso || workDays(15).pop(), historial: [...(ot.historial || []), { etapa: ot.etapa, fecha: new Date().toISOString(), por: S.name, nota: "OT previa confirmada" }] }, "OT confirmada."); } }, "Confirmar OT")))) : null,
      ot.estudio && (ot.estudio.secciones || []).length ? h("div", { class: "card", style: "margin-bottom:1rem" }, h("h2", { text: "Diseño del cliente (Estampa tu idea)" }),
        h("p", { class: "small muted", text: `${ot.estudio.prenda || ""} ${ot.estudio.color ? "· " + ot.estudio.color : ""} · ${ot.estudio.modo === "full" ? "estampado completo" : "serigrafía por posición"}${ot.estudio.piezas ? " · " + fmtN(ot.estudio.piezas) + " piezas" : ""}` }),
        h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, ["Sección", "Posición", "Medida", "Archivo"].map((x) => h("th", { text: x })))),
          h("tbody", {}, ot.estudio.secciones.map((x) => h("tr", {}, h("td", { text: x.seccion }), h("td", { text: x.lugar || "—" }), h("td", { class: "num", text: x.medida || "—" }), h("td", { class: "small", text: x.archivo || "—" }))))))) : null,
      h("div", { class: "steps", style: "margin-bottom:1rem" }, ((seen) => OT_STAGES.map((s, i) => { const skip = i < idx && i > 0 && !seen.has(s.id); return h("button", { type: "button", class: skip ? "skip" : i < idx ? "done" : i === idx ? "now" : "", title: skip ? `${s.name}: no se registró (se brincó)` : "Mover a " + s.name, onclick: () => moveOT(ot0, s.id, "Cambio manual") }, (skip ? "! " : i < idx ? "✓ " : "") + s.name); }))(new Set((ot.historial || []).map((x) => x.etapa)))),
      ot.previa ? null : pendLegend(ot0),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Partidas y tallas" }), saveLines),
            ...ot.lineas.map((l) => h("div", { class: "lineitem" },
              h("div", { class: "row between" }, h("b", { text: `${l.descripcion}${l.modelo ? " · " + l.modelo : ""}${l.color ? " · " + l.color : ""}` }), h("span", { class: "num", text: fmtN(l.piezas) + " pzas" })),
              h("div", { class: "small muted", text: (l.ubicaciones || []).map(ubText).join(" · ") }),
              h("div", { class: "grid", style: `grid-template-columns:repeat(${SIZES.length},minmax(0,1fr));gap:.35rem` }, SIZES.map((sz) => h("label", { class: "f" }, h("span", { text: sz }), h("input", { class: "i", type: "number", min: "0", step: "1", value: l.tallas?.[sz] || "", oninput: (e) => { (l.tallas ||= {})[sz] = +e.target.value || 0; mark(); sumNote.textContent = tallaNote(l); } })))),
              ((sumNote) => sumNote)(h("p", { class: "small", text: tallaNote(l) }))))),
          h("div", { class: "card" }, h("div", { class: "row between" }, h("h2", { text: "Arte y aprobación del cliente" }), h("span", { class: "pill " + ({ aprobada: "p-ok", cambios: "p-bad", enviada: "p-info" }[ot.arte?.estado] || "p-mut"), text: ot.arte?.estado || "pendiente" })),
            files.length ? h("div", { class: "thumbs" }, files.map((a) => h("a", { href: fileUrl(a.path), target: "_blank", rel: "noopener" }, a.type?.startsWith("image/") ? h("img", { src: fileUrl(a.path), alt: a.name, loading: "lazy" }) : h("div", { style: "height:110px;display:grid;place-items:center;color:#333", text: "PDF" }), h("span", { text: a.name })))) : h("p", { class: "muted small", text: "Sube el mockup (desde Estampa tu idea) y las separaciones para que el cliente las apruebe." }),
            h("label", { class: "btn ghost", style: "justify-self:start" }, "Subir arte o mockup", h("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf", multiple: true, hidden: true, onchange: async (e) => {
              const added = [];
              for (const file of e.target.files) {
                if (file.size > 4_200_000) { toast(`${file.name} pasa de 4 MB.`, true); continue; }
                try { added.push(await api("POST", `/api/archivo?ot=${encodeURIComponent(ot.id)}&name=${encodeURIComponent(file.name)}`, undefined, { body: file, type: file.type || "application/octet-stream" })); } catch (err) { if (err.message !== "401") toast(err.message, true); }
              }
              if (added.length) await persist({ arte: { ...(ot.arte || {}), archivos: [...files, ...added] } }, `${added.length} archivo(s) subido(s).`);
            } })),
            ot.arte?.aprobadoPor ? h("p", { class: "small", text: `${ot.arte.estado === "aprobada" ? "Aprobado" : "Cambios pedidos"} por ${ot.arte.aprobadoPor} · ${fmtDT(ot.arte.fecha)}${ot.arte.comentario ? " · “" + ot.arte.comentario + "”" : ""}` }) : null,
            h("div", { class: "grid", style: "gap:.4rem" }, h("span", { class: "label", text: "Enlace de aprobación para el cliente" }), h("div", { class: "copybox", text: linkAprob }),
              h("div", { class: "row" }, h("button", { class: "btn sm ghost", type: "button", onclick: () => copy(linkAprob) }, "Copiar enlace"),
                isPhone(contact?.contacto) ? h("a", { class: "btn sm ghost", href: waLink(contact.contacto, `Hola ${contact.nombre?.split(" ")[0] || ""}, aquí puedes revisar y aprobar el arte de tu pedido ${ot.id}: ${linkAprob}`), target: "_blank", rel: "noopener", onclick: () => { if (ot.arte?.estado === "pendiente") persist({ ...setStage(ot, ot.etapa === "arte" ? "aprobacion" : ot.etapa, "Arte enviado al cliente"), arte: { ...(ot.arte || {}), estado: "enviada", enviadaEn: new Date().toISOString() } }); } }, "Enviar por WhatsApp") : null,
                ot.arte?.estado !== "aprobada" ? h("button", { class: "btn sm ghost", type: "button", onclick: async () => { const who = await askText("¿Quién aprobó el arte?", [contact?.nombre || "El cliente", "Por WhatsApp", "En persona"]); if (who) persist({ ...setStage(ot, idx < 2 ? "compra" : ot.etapa, "Arte aprobado (registrado por el equipo)"), arte: { ...(ot.arte || {}), estado: "aprobada", aprobadoPor: who, fecha: new Date().toISOString() } }, "Aprobación registrada."); } }, "Registrar aprobación manual") : null))),
          h("div", { class: "card" }, h("h2", { text: "Calidad y merma" }),
            h("p", { class: "small", text: `Merma registrada: ${fmtN(mermaTotal)} piezas (${piezas ? fmtN((mermaTotal / piezas) * 100, 2) : 0} %). Meta: 1.5 % o menos.` }),
            (ot.merma || []).length ? h("ul", { class: "log" }, ot.merma.map((m) => h("li", {}, h("time", { text: fmtDT(m.fecha) }), h("span", { text: `${m.cantidad} pzas · ${m.causa}${m.nota ? " · " + m.nota : ""} · ${m.por}` })))) : null,
            mermaForm(ot, persist)),
          h("div", { class: "card" }, h("h2", { text: "Historial" }), h("ul", { class: "log" }, [...(ot.historial || [])].reverse().map((x) => h("li", {}, h("time", { text: fmtDT(x.fecha) }), h("span", {}, h("b", { text: stageName(OT_STAGES, x.etapa) }), ` · ${x.por || ""}${x.nota ? " · " + x.nota : ""}`)))))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Código de la orden" }), h("div", { class: "barcode", html: code128svg(ot.id) }), h("p", { class: "num small", text: ot.id + " · escanéalo en cada estación" })),
          paymentsCard(ot, persist),
          h("div", { class: "card" }, h("h2", { text: "Fechas y prioridad" }),
            h("div", { class: "grid g2" }, inputField("Compromiso de entrega", ot.fechaCompromiso, "date", (v) => persist({ fechaCompromiso: v }, "Fecha guardada.")),
              selectField("Prioridad", ot.prioridad || "normal", [["normal", "Normal"], ["alta", "Alta"], ["urgente", "Urgente"]], (v) => persist({ prioridad: v }, "Prioridad guardada."))),
            h("p", { class: "small muted", text: `${fmtN(piezas)} piezas · ${fmtN(minutos)} min estimados de máquina` })),
          ot.previa ? null : h("div", { class: "card" }, h("h2", { text: "Programación" }), scheduleForm(ot, minutos, persist)),
          ot.previa ? null : h("div", { class: "card" }, h("h2", { text: "Embarque" }), shipForm(ot, persist, contact, linkSeg)),
          h("div", { class: "card" }, h("h2", { text: "Seguimiento del cliente" }), h("p", { class: "small", text: "El cliente ve la etapa de su pedido y la guía de envío en este enlace." }), h("div", { class: "copybox", text: linkSeg }),
            h("div", { class: "row" }, h("button", { class: "btn sm ghost", type: "button", onclick: () => copy(linkSeg) }, "Copiar"), h("a", { class: "btn sm ghost", href: linkSeg, target: "_blank", rel: "noopener" }, "Ver como cliente"))),
          h("button", { class: "btn danger", type: "button", onclick: async () => { if (!(await confirmBox(`¿Borrar la orden ${ot.id}? No se puede deshacer.`))) return; await remove("ots", ot.id); go("ots"); } }, "Borrar OT"))));
  }
  const tallaNote = (l) => { const sum = Object.values(l.tallas || {}).reduce((a, b) => a + (+b || 0), 0); return sum === (+l.piezas || 0) ? `Tallas completas: ${fmtN(sum)}` : `Tallas: ${fmtN(sum)} de ${fmtN(l.piezas)} piezas`; };
  function mermaForm(ot, persist) {
    return h("form", { class: "grid g3", onsubmit: async (e) => { e.preventDefault(); const fd = Object.fromEntries(new FormData(e.target)); if (!(+fd.cantidad > 0)) return toast("Escribe cuántas piezas.", true);
      await persist({ merma: [...(ot.merma || []), { cantidad: +fd.cantidad, causa: fd.causa, nota: fd.nota, fecha: new Date().toISOString(), por: S.name }] }, "Merma registrada."); } },
      h("input", { class: "i", name: "cantidad", type: "number", min: "1", placeholder: "Piezas" }), h("select", { class: "i", name: "causa" }, MERMA_CAUSAS.map((c) => h("option", { value: c, text: c }))),
      h("input", { class: "i", name: "nota", placeholder: "Nota (opcional)" }), h("button", { class: "btn sm full", type: "submit" }, "Registrar merma"));
  }
  function scheduleForm(ot, minutos, persist) {
    const by = otMinutesBy(ot), tecs = Object.keys(by).filter((k) => by[k] > 0);
    if (!tecs.length) tecs.push("serigrafia");
    const cap = dayCapacity();
    const rows = tecs.map((tec) => {
      const cur = (ot.programacion || []).filter((p) => tecOfEntry(p) === tec), sug = suggestPress(ot, tec), ms = machinesOf(tec);
      if (!ms.length) return { tec, el: h("p", { class: "small due-late", text: `No hay máquinas de ${TECS[tec]} en Ajustes.` }), entries: () => [] };
      const sel = h("select", { class: "i" }, ms.map((m) => h("option", { value: m.id, text: `${m.nombre} · ${machineInfo(m)}`, selected: (cur[0]?.pulpo || sug?.id) === m.id })));
      const date = h("input", { class: "i", type: "date", value: cur[0]?.fecha || workDays(3).pop() });
      const total = Math.round(by[tec] || minutos);
      const mins = h("input", { class: "i", type: "number", min: "1", value: Math.round(cur.reduce((a, x) => a + (+x.minutos || 0), 0) || total) });
      const split = tec === "dtg" && ms.length > 1 ? h("input", { type: "checkbox", checked: cur.length > 1 }) : null;
      const info = h("p", { class: "small muted" });
      const paint = () => {
        const used = loadOn(sel.value, date.value, ot.id).reduce((a, x) => a + x.min, 0), m = (+mins.value || 0) / (split?.checked ? ms.length : 1);
        info.textContent = `${TECS[tec]}: ${fmtN(total)} min estimados (${fmtN(total / cap, 1)} días de máquina). Ese día ${machineName(sel.value)} ya tiene ${fmtN(used)} de ${fmtN(cap)} min; con esta OT quedaría al ${fmtN(((used + m) / cap) * 100)} %.`;
      };
      [sel, date, mins, split].filter(Boolean).forEach((x) => x.addEventListener("input", paint)); paint();
      return { tec, el: h("div", { class: "grid", style: "gap:.4rem;border-top:1px solid var(--rule);padding-top:.5rem" },
        h("b", { class: "small", text: TECS[tec] + (sug ? ` · sugerido: ${sug.nombre}` : "") }),
        h("label", { class: "f" }, h("span", { text: "Máquina" }), sel),
        h("div", { class: "grid g2" }, h("label", { class: "f" }, h("span", { text: "Día" }), date), h("label", { class: "f" }, h("span", { text: "Minutos" }), mins)),
        split ? h("label", { class: "row small", style: "gap:.4rem" }, split, `Repartir entre las ${ms.length} DTG (mitad en cada una)`) : null, info),
        entries: () => split?.checked ? ms.map((m) => ({ pulpo: m.id, fecha: date.value, minutos: Math.round((+mins.value || total) / ms.length), tecnica: tec })) : [{ pulpo: sel.value, fecha: date.value, minutos: +mins.value || total, tecnica: tec }] };
    });
    const has = (ot.programacion || []).length;
    return h("div", { class: "grid", style: "gap:.5rem" }, ...rows.map((r) => r.el),
      h("div", { class: "row" }, h("button", { class: "btn sm", type: "button", onclick: () => persist({ ...(["arte", "aprobacion", "compra", "pantallas"].includes(ot.etapa) && ot.arte?.estado === "aprobada" ? setStage(ot, "programada", "Programada: " + rows.map((r) => TECS[r.tec]).join(", ")) : {}), programacion: rows.flatMap((r) => r.entries()) }, "Programación guardada.") }, has ? "Reprogramar" : "Programar"),
        has ? h("button", { class: "btn sm ghost", type: "button", onclick: () => persist({ programacion: [] }, "Programación quitada.") }, "Quitar") : null));
  }
  function shipForm(ot, persist, contact, linkSeg) {
    const e = ot.embarque || {};
    const CARRIERS = { Estafeta: "https://www.estafeta.com/Herramientas/Rastreo", DHL: "https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=", FedEx: "https://www.fedex.com/fedextrack/?trknbr=", UPS: "https://www.ups.com/track?tracknum=", Paquetexpress: "https://www.paquetexpress.com.mx/rastreo/", "Flete propio": "", "Recoge en planta": "" };
    const f = h("form", { class: "grid g2", onsubmit: async (ev) => {
      ev.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      const base = CARRIERS[fd.paqueteria] || "", rastreoUrl = fd.rastreoUrl || (base && fd.guia ? (base.endsWith("=") ? base + encodeURIComponent(fd.guia) : base) : "");
      const emb = { paqueteria: fd.paqueteria, guia: fd.guia, rastreoUrl, cajas: +fd.cajas || 0, fecha: fd.fecha, destino: fd.destino };
      const next = fd.marcar ? setStage(ot, "embarcada", `${fd.paqueteria}${fd.guia ? " · guía " + fd.guia : ""}`) : ot;
      await persist({ ...next, embarque: emb }, fd.marcar ? "Embarque registrado." : "Datos de envío guardados.");
    } },
      h("label", { class: "f" }, h("span", { text: "Paquetería" }), h("select", { class: "i", name: "paqueteria" }, Object.keys(CARRIERS).map((c) => h("option", { value: c, text: c, selected: e.paqueteria === c })))),
      h("label", { class: "f" }, h("span", { text: "Número de guía" }), h("input", { class: "i", name: "guia", value: e.guia || "" })),
      h("label", { class: "f" }, h("span", { text: "Cajas" }), h("input", { class: "i", name: "cajas", type: "number", min: "0", value: e.cajas || "" })),
      h("label", { class: "f" }, h("span", { text: "Fecha de envío" }), h("input", { class: "i", name: "fecha", type: "date", value: e.fecha || localDate() })),
      h("label", { class: "f full" }, h("span", { text: "Destino" }), h("input", { class: "i", name: "destino", value: e.destino || "" })),
      h("label", { class: "f full" }, h("span", { text: "Enlace de rastreo (si la paquetería no lo arma sola)" }), h("input", { class: "i", name: "rastreoUrl", value: e.rastreoUrl || "" })),
      h("label", { class: "row small full", style: "gap:.4rem" }, h("input", { type: "checkbox", name: "marcar", checked: ot.etapa !== "embarcada" && ot.etapa !== "entregada" }), "Marcar la OT como embarcada"),
      h("div", { class: "row full" }, h("button", { class: "btn sm", type: "submit" }, "Guardar envío"),
        e.guia && isPhone(contact?.contacto) ? h("a", { class: "btn sm ghost", href: waLink(contact.contacto, `Hola ${contact.nombre?.split(" ")[0] || ""}, tu pedido ${ot.id} salió por ${e.paqueteria} con la guía ${e.guia}. Sigue el estado aquí: ${linkSeg}`), target: "_blank", rel: "noopener" }, "Avisar al cliente") : null));
    return f;
  }
  function printTraveler(ot) {
    $("#print").replaceChildren(h("div", { class: "doc" },
      h("div", { class: "hdr" }, h("div", {}, h("h1", { text: "Hoja viajera" }), h("div", { style: "font-size:16pt;font-weight:700", text: ot.id }), h("div", { text: `${ot.clienteNombre || ""} · compromiso ${fmtDate(ot.fechaCompromiso)} · prioridad ${ot.prioridad || "normal"}` })),
        h("div", { style: "width:70mm", html: code128svg(ot.id) })),
      h("table", {}, h("thead", {}, h("tr", {}, ["Prenda", "Ubicaciones y tintas", ...SIZES, "Total"].map((x) => h("th", { text: x })))),
        h("tbody", {}, ot.lineas.map((l) => h("tr", {}, h("td", {}, h("b", { text: l.descripcion }), l.modelo ? " · " + l.modelo : "", l.color ? h("div", { text: l.color }) : null),
          h("td", { text: (l.ubicaciones || []).map(ubText).join("; ") }), ...SIZES.map((s) => h("td", { text: l.tallas?.[s] || "" })), h("td", { text: fmtN(l.piezas) }))))),
      h("table", { style: "margin-top:10pt" }, h("thead", {}, h("tr", {}, ["Estación", "Inicio", "Fin", "Firma", "Notas"].map((x) => h("th", { text: x })))), h("tbody", {}, STATIONS.slice(0, 5).map((s) => h("tr", { style: "height:22pt" }, h("td", { text: s.name }), h("td"), h("td"), h("td"), h("td")))))));
    setTimeout(() => print(), 50);
  }
  function printPacking(ot) {
    $("#print").replaceChildren(h("div", { class: "doc" },
      h("div", { class: "hdr" }, h("div", {}, h("h1", { text: "Lista de empaque" }), h("div", { text: `${ot.id} · ${ot.clienteNombre || ""}` }), ot.embarque?.guia ? h("div", { text: `${ot.embarque.paqueteria} · guía ${ot.embarque.guia} · ${ot.embarque.cajas || ""} caja(s)` }) : null), h("div", { style: "width:60mm", html: code128svg(ot.id) })),
      h("table", {}, h("thead", {}, h("tr", {}, ["Prenda", ...SIZES, "Total"].map((x) => h("th", { text: x })))),
        h("tbody", {}, ot.lineas.map((l) => h("tr", {}, h("td", { text: `${l.descripcion}${l.color ? " · " + l.color : ""}` }), ...SIZES.map((s) => h("td", { text: l.tallas?.[s] || "" })), h("td", { text: fmtN(l.piezas) }))))),
      h("p", { class: "foot", text: "Revisado, doblado y empacado por Chilian Screen Printing. Recibí completo: ____________________  Fecha: ________" })));
    setTimeout(() => print(), 50);
  }

  /* ---------------- press schedule ---------------- */
  function viewSchedule() {
    const days = workDays(viewSchedule.n || 10, viewSchedule.from || localDate()), cap = dayCapacity();
    const queue = list("ots").filter((o) => !o.previa && pendingTecs(o).length && !["embarcada", "entregada", "impresion", "calidad", "empaque"].includes(o.etapa)).sort((a, b) => (a.fechaCompromiso || "9").localeCompare(b.fechaCompromiso || "9"));
    const dragJob = (el, otId) => { el.draggable = true; el.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", otId)); };
    const cell = (p, d) => {
      const jobs = loadOn(p.id, d), used = jobs.reduce((a, x) => a + x.min, 0), pct = cap ? used / cap : 0;
      const slot = h("div", { class: "slot" }, h("div", { class: "load" + (pct > 1 ? " over" : pct > 0.85 ? " hi" : "") }, h("i", { style: `width:${Math.min(100, pct * 100)}%` })),
        h("span", { class: "num small muted", text: used ? `${fmtN(used)}/${fmtN(cap)} min` : "" }),
        jobs.map(({ ot, min }) => { const j = h("div", { class: "job" + (ot.fechaCompromiso && ot.fechaCompromiso < d ? " late" : ""), title: `${ot.id} · ${ot.clienteNombre} · ${fmtN(min)} min · compromiso ${fmtDate(ot.fechaCompromiso)}`, onclick: () => go("ot/" + ot.id) }, `${ot.id} · ${ot.clienteNombre || ""}`); dragJob(j, ot.id); return j; }));
      slot.addEventListener("dragover", (e) => { e.preventDefault(); slot.classList.add("drop"); });
      slot.addEventListener("dragleave", () => slot.classList.remove("drop"));
      slot.addEventListener("drop", async (e) => {
        e.preventDefault(); slot.classList.remove("drop");
        const id = e.dataTransfer.getData("text/plain"); if (!byId("ots", id)) return;
        const ot = await fresh("ots", id), tec = machineType(p), by = otMinutesBy(ot);
        const anyTec = by.serigrafia + by.dtg + by.bordado > 0;
        if (anyTec && !(by[tec] > 0)) return toast(`${ot.id} no lleva ${TECS[tec]}. Lleva: ${Object.keys(by).filter((k) => by[k] > 0).map((k) => TECS[k]).join(", ")}.`, true);
        const min = Math.round(by[tec] || (ot.programacion || []).find((x) => tecOfEntry(x) === tec)?.minutos || 60);
        const staged = ["arte", "aprobacion", "compra", "pantallas"].includes(ot.etapa) && ot.arte?.estado === "aprobada" ? setStage(ot, "programada", `Programada en ${p.nombre}`) : ot;
        await save("ots", { ...staged, programacion: [...(ot.programacion || []).filter((x) => tecOfEntry(x) !== tec), { pulpo: p.id, fecha: d, minutos: min, tecnica: tec }] }, { quiet: true });
        toast(`${ot.id} → ${p.nombre}, ${fmtDate(d)}.`); rerender();
      });
      return h("td", {}, slot);
    };
    return h("div", {},
      top(`Capacidad por máquina y día: ${fmtN(cap)} min · pulpos, DTG y bordado`, "Programación",
        h("button", { class: "btn ghost", type: "button", onclick: () => { viewSchedule.from = addDays(days[0], -7); rerender(); } }, "← Semana"),
        h("button", { class: "btn ghost", type: "button", onclick: () => { viewSchedule.from = localDate(); rerender(); } }, "Hoy"),
        h("button", { class: "btn ghost", type: "button", onclick: () => { viewSchedule.from = addDays(days[0], 7); rerender(); } }, "Semana →")),
      h("div", { class: "cols", style: "grid-template-columns:minmax(0,1fr) 260px" },
        h("div", { class: "sched" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", { text: "Máquina" }), days.map((d) => { const dt = new Date(d + "T12:00"); return h("th", { class: d === localDate() ? "today" : "" }, dt.toLocaleDateString("es-MX", { weekday: "short" }), h("br"), h("b", { class: "num", text: dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) })); }))),
          h("tbody", {}, Object.keys(TECS).filter((tec) => machinesOf(tec).length).flatMap((tec) => [
            h("tr", {}, h("td", { colspan: String(days.length + 1), class: "label grp", style: "background:var(--shade);padding:.35rem .5rem", text: tec === "serigrafia" ? "Serigrafía · pulpos automáticos" : tec === "dtg" ? "DTG · impresión directa, pieza por pieza" : "Bordado" })),
            ...machinesOf(tec).map((p) => h("tr", {}, h("td", {}, h("b", { class: "small", text: p.nombre }), h("div", { class: "num small muted", text: machineInfo(p) })), days.map((d) => cell(p, d))))])))),
        h("div", { class: "card" }, h("h2", { text: `Por programar (${queue.length})` }), h("p", { class: "hint", text: "Arrastra cada OT a una máquina y día; cada técnica de la OT se programa en su máquina (pulpo, DTG o bordadora). Rojo: arte sin aprobar o después del compromiso." }),
          queue.length ? h("div", { class: "queue" }, queue.map((o) => { const j = h("div", { class: "job" + (o.arte?.estado === "aprobada" ? "" : " late"), onclick: () => go("ot/" + o.id) }, h("b", { text: o.id }), h("div", { text: o.clienteNombre }), h("div", { class: "muted", text: `Falta: ${pendingTecs(o).map((k) => TECS[k] + " " + fmtN(otMinutesBy(o)[k]) + " min").join(" · ")} · ${fmtDate(o.fechaCompromiso)} · arte ${o.arte?.estado || "pendiente"}` })); dragJob(j, o.id); return j; }))
            : h("p", { class: "muted small", text: "Todas las OT activas están programadas." }))));
  }

  /* ---------------- scan station ---------------- */
  function viewScan() {
    const st = store.get("chilian-os-station") || "impresion";
    const result = h("div", {});
    const input = h("input", { class: "i big", id: "scan-in", placeholder: "Escanea o escribe la OT", autocomplete: "off", autocapitalize: "characters", spellcheck: "false" });
    const station = h("select", { class: "i", onchange: (e) => { store.set("chilian-os-station", e.target.value); input.focus(); } }, STATIONS.map((s) => h("option", { value: s.id, text: s.name, selected: s.id === st })));
    async function handle(code) {
      code = code.trim().toUpperCase(); if (!code) return;
      await loadAll(true);   // the freshest status before moving anything
      const ot = byId("ots", code) || list("ots").find((o) => o.id.toUpperCase() === code);
      if (!ot) { result.replaceChildren(h("div", { class: "card", style: "border-color:var(--bad)" }, h("h2", { text: "No se encontró " + code }), h("p", { class: "small", text: "Revisa que la etiqueta sea de una OT activa." }))); return; }
      if (ot.previa) { result.replaceChildren(h("div", { class: "card", style: "border-color:var(--warn)" }, h("h2", { text: ot.id + " es una OT previa" }), h("p", { class: "small", text: "Confírmala (o acepta su cotización) antes de moverla en planta." }), h("a", { class: "link small", href: "#ot/" + ot.id }, "Abrir la OT"))); return; }
      const sid = station.value, name = stageName(STATIONS, sid);
      const pend = stageIdx(sid) > stageIdx(ot.etapa) ? otPending(ot, sid) : [];
      const saved = await save("ots", setStage(ot, sid, `Escaneo en ${name}${pend.length ? " con pendientes: " + pend.map((p) => p.txt).join("; ") : ""}`), { quiet: true });
      const card = h("div", { class: "card flash" }, h("div", { class: "row between" }, h("h2", { text: `${saved.id} → ${stageName(OT_STAGES, sid)}` }), otPill(saved.etapa)),
        h("p", { text: `${saved.clienteNombre || ""} · ${fmtN(saved.lineas.reduce((a, l) => a + (+l.piezas || 0), 0))} piezas · compromiso ${fmtDate(saved.fechaCompromiso)}` }),
        pend.length ? h("div", { class: "pend" }, h("b", { text: `⚠ Llegó a ${name} con ${pend.length} proceso${pend.length > 1 ? "s" : ""} sin terminar` }), h("ul", {}, pend.map((x) => h("li", {}, h("b", { text: stageName(OT_STAGES, x.etapa) + ": " }), x.txt)))) : null,
        sid === "calidad" ? mermaForm(saved, async (patch, msg) => { await save("ots", { ...saved, ...patch }, { quiet: true }); toast(msg); }) : null,
        h("a", { class: "link small", href: "#ot/" + saved.id }, "Abrir la OT"));
      result.replaceChildren(card);
      toast(`${saved.id}: ${name} ✓`);
    }
    input.addEventListener("keydown", async (e) => { if (e.key === "Enter") { e.preventDefault(); const v = input.value; input.value = ""; await handle(v); input.focus(); } });
    const camBox = h("div", {});
    const camBtn = "BarcodeDetector" in window ? h("button", { class: "btn ghost", type: "button", onclick: () => startCamera(camBox, (code) => handle(code)) }, "Usar la cámara") : null;
    setTimeout(() => input.focus(), 50);
    return h("div", {}, top("Lector de código de barras o cámara", "Escaneo"),
      h("div", { class: "scan" },
        h("div", { class: "card" }, h("label", { class: "f" }, h("span", { text: "Estación" }), station), h("label", { class: "f" }, h("span", { text: "Código de la OT" }), input),
          h("p", { class: "hint", text: "Un lector USB o Bluetooth escribe el código y presiona Enter solo. Cada escaneo mueve la OT a esta estación y queda en su historial con tu nombre." }), camBtn, camBox),
        result));
  }
  async function startCamera(box, onCode) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = h("video", { class: "cam", autoplay: true, playsinline: true, muted: true }); video.srcObject = stream;
      const stop = h("button", { class: "btn sm ghost", type: "button", onclick: () => { stream.getTracks().forEach((t) => t.stop()); box.replaceChildren(); } }, "Apagar cámara");
      box.replaceChildren(video, stop);
      const det = new BarcodeDetector({ formats: ["code_128"] });
      let last = "", lastAt = 0;
      const tick = async () => {
        if (!video.isConnected) { stream.getTracks().forEach((t) => t.stop()); return; }
        try { const codes = await det.detect(video); const c = codes[0]?.rawValue; if (c && (c !== last || Date.now() - lastAt > 4000)) { last = c; lastAt = Date.now(); await onCode(c); } } catch {}
        setTimeout(tick, 350);
      };
      video.addEventListener("loadeddata", tick, { once: true });
    } catch { toast("No se pudo abrir la cámara. Usa el lector o escribe la OT.", true); }
  }

  /* ---------------- shipping ---------------- */
  function viewShipping() {
    const ready = list("ots").filter((o) => !o.previa && ["empaque", "calidad"].includes(o.etapa));
    const sent = list("ots").filter((o) => o.etapa === "embarcada").sort((a, b) => (b.embarque?.fecha || "").localeCompare(a.embarque?.fecha || ""));
    return h("div", {}, top("Listas para salir y en camino", "Embarques"),
      h("div", { class: "grid" },
        h("div", { class: "card" }, h("h2", { text: `Por embarcar (${ready.length})` }), ready.length ? otTable(ready) : h("p", { class: "muted small", text: "Nada en calidad o empaque." })),
        h("div", { class: "card" }, h("h2", { text: `En camino (${sent.length})` }), sent.length ? h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, ["OT", "Cliente", "Paquetería", "Guía", "Enviado", ""].map((x) => h("th", { text: x })))),
          h("tbody", {}, sent.map((o) => h("tr", {}, h("td", {}, h("a", { href: "#ot/" + o.id, class: "num", text: o.id })), h("td", { text: o.clienteNombre }), h("td", { text: o.embarque?.paqueteria || "—" }), h("td", { class: "num", text: o.embarque?.guia || "—" }), h("td", { text: fmtDate(o.embarque?.fecha) }),
            h("td", {}, o.embarque?.rastreoUrl ? h("a", { class: "btn sm ghost", href: o.embarque.rastreoUrl, target: "_blank", rel: "noopener" }, "Rastrear") : null, h("button", { class: "btn sm", type: "button", onclick: async () => { await save("ots", setStage(o, "entregada", "Entrega confirmada"), { quiet: true }); toast(`${o.id} entregada.`); rerender(); } }, "Entregada"))))))) : h("p", { class: "muted small", text: "Nada en camino." }))));
  }

  /* ---------------- team: accounts, assignments and follow-ups (admin1 and admins) ---------------- */
  const isAdmin = () => S.role === "admin";
  const userByName = (name) => S.users.find((u) => u.name === name);
  function newPassword() {
    const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint32Array(12));
    return [...r].map((x) => abc[x % abc.length]).join("").replace(/(.{4})(?=.)/g, "$1-");
  }
  const credText = (u, pw) => `Tu cuenta de Chilian OS\n${location.origin}/ops\nUsuario: ${u.username}\nContraseña: ${pw}\n\nAl entrar, cámbiala en «Mi cuenta».`;
  function showCredentials(u, pw, title) {
    const txt = credText(u, pw);
    modal(title, h("div", { class: "grid" },
      h("p", { class: "small", text: "Compártelos por un canal privado. La contraseña no se vuelve a mostrar; si se pierde, restablécela." }),
      h("div", { class: "copybox", text: txt }),
      h("div", { class: "row" }, h("button", { class: "btn accent", type: "button", onclick: () => copy(txt) }, "Copiar datos de acceso"), h("button", { class: "btn ghost", type: "button", onclick: () => closeModal() }, "Listo"))));
  }
  async function loadUsers() {
    try { S.users = (await api("GET", "/api/usuarios")).users || []; } catch (e) { if (e.message !== "401") S.users = S.users || []; }
  }
  async function saveUser(data) {
    const { user } = await api("POST", "/api/usuarios", { accion: "guardar", ...data });
    await loadUsers();
    return user;
  }
  function userModal(u = null) {
    const pwIn = h("input", { class: "i mono", name: "password", value: u ? "" : newPassword(), placeholder: u ? "Déjala vacía para no cambiarla" : "", autocomplete: "new-password" });
    const nameIn = h("input", { class: "i", name: "name", required: true, value: u?.name || "" });
    const userIn = h("input", { class: "i mono", name: "username", required: true, value: u?.username || "", readonly: !!u, pattern: "[a-zA-Z0-9._\\-]{3,40}", title: "3 a 40 letras, números, punto o guion", autocapitalize: "none" });
    if (!u) nameIn.addEventListener("input", () => { if (!userIn.dataset.touched) userIn.value = nameIn.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).join("."); });
    userIn.addEventListener("input", () => { userIn.dataset.touched = "1"; });
    const main = u?.username === "admin1";
    const f = h("form", { class: "grid g2", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      try {
        const saved = await saveUser({ nuevo: !u, username: fd.username, name: fd.name, puesto: fd.puesto, role: main ? "admin" : fd.role, active: u ? u.active : true, password: fd.password || undefined });
        if (u && u.name !== saved.name) await renameEverywhere(u.name, saved.name);
        if (u && saved.username === S.usuario) { S.name = saved.name; persistSession(); }
        if (fd.password) showCredentials(saved, fd.password, u ? "Contraseña nueva" : "Cuenta creada"); else { closeModal(); toast("Cuenta guardada."); }
        rerender();
      } catch (err) { toast(err.message, true); }
    } },
      h("label", { class: "f" }, h("span", { text: "Nombre" }), nameIn),
      h("label", { class: "f" }, h("span", { text: "Usuario para entrar" }), userIn),
      h("label", { class: "f" }, h("span", { text: "Puesto" }), h("input", { class: "i", name: "puesto", value: u?.puesto || "", placeholder: "Ej. Ventas uniformes" })),
      h("label", { class: "f" }, h("span", { text: "Permisos" }), h("select", { class: "i", name: "role", disabled: main },
        h("option", { value: "equipo", text: "Equipo (ventas, planta)", selected: u?.role !== "admin" }), h("option", { value: "admin", text: "Administrador (cuentas y ajustes)", selected: u?.role === "admin" }))),
      h("label", { class: "f full" }, h("span", { text: u ? "Contraseña nueva (opcional)" : "Contraseña inicial" }),
        h("div", { class: "row", style: "flex-wrap:nowrap" }, pwIn, h("button", { class: "btn sm ghost", type: "button", onclick: () => { pwIn.value = newPassword(); } }, "Generar"))),
      h("p", { class: "hint full", text: "Mínimo 8 caracteres. Al cambiarla, la persona sale de sus otros dispositivos." }),
      h("div", { class: "row full" }, h("button", { class: "btn accent", type: "submit" }, u ? "Guardar cambios" : "Crear cuenta")));
    modal(u ? `Editar ${u.name}` : "Nueva cuenta del equipo", f);
  }
  // Tasks, opportunities and accounts point to people by name: keep them when a name changes.
  async function renameEverywhere(from, to) {
    for (const t of list("tareas").filter((x) => x.asesor === from)) await save("tareas", { ...t, asesor: to }, { quiet: true });
    for (const o of list("oportunidades").filter((x) => x.asesor === from)) await save("oportunidades", { ...o, asesor: to }, { quiet: true });
    for (const c of list("cuentas").filter((x) => x.responsable === from)) await save("cuentas", { ...c, responsable: to }, { quiet: true });
  }
  function myAccountModal() {
    const f = h("form", { class: "grid", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      if (fd.nueva !== fd.otra) return toast("Las dos contraseñas nuevas no coinciden.", true);
      try { const { token } = await api("POST", "/api/usuarios", { accion: "mi-clave", actual: fd.actual, nueva: fd.nueva }); S.token = token; persistSession(); closeModal(); toast("Contraseña cambiada."); }
      catch (err) { if (err.message !== "401") toast(err.message, true); }
    } },
      h("p", { class: "small" }, "Usuario: ", h("b", { class: "mono", text: S.usuario }), ` · ${S.name}${isAdmin() ? " · administrador" : ""}`),
      h("label", { class: "f" }, h("span", { text: "Contraseña actual" }), h("input", { class: "i", type: "password", name: "actual", required: true, autocomplete: "current-password" })),
      h("label", { class: "f" }, h("span", { text: "Contraseña nueva (8 o más)" }), h("input", { class: "i", type: "password", name: "nueva", required: true, minlength: "8", autocomplete: "new-password" })),
      h("label", { class: "f" }, h("span", { text: "Repite la nueva" }), h("input", { class: "i", type: "password", name: "otra", required: true, minlength: "8", autocomplete: "new-password" })),
      h("button", { class: "btn accent", type: "submit" }, "Cambiar contraseña"));
    modal("Mi cuenta", f);
  }

  // Assign one task to a person (optionally about a client and one of its opportunities).
  function assignTaskModal(pre = {}) {
    const people = team();
    const cuentaSel = h("select", { class: "i", name: "cuentaId" }, h("option", { value: "", text: "— Sin cliente —" }), list("cuentas").sort((a, b) => a.nombre.localeCompare(b.nombre)).map((c) => h("option", { value: c.id, text: c.nombre, selected: pre.cuentaId === c.id })));
    const oppSel = h("select", { class: "i", name: "oportunidadId" });
    const paintOpps = () => oppSel.replaceChildren(h("option", { value: "", text: "— Ninguna —" }), list("oportunidades").filter((o) => o.cuentaId === cuentaSel.value && !["ganado", "perdido"].includes(o.etapa)).map((o) => h("option", { value: o.id, text: o.titulo, selected: pre.oportunidadId === o.id })));
    cuentaSel.addEventListener("change", paintOpps); paintOpps();
    const f = h("form", { class: "grid g2", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      await save("tareas", { tipo: fd.tipo, texto: fd.texto.trim(), fecha: fd.fecha, prioridad: fd.prioridad, asesor: fd.asesor, cuentaId: fd.cuentaId, oportunidadId: fd.oportunidadId, hecha: false, asignadaPor: S.name, asignadaEn: new Date().toISOString() }, { quiet: true });
      closeModal(); toast(`Tarea asignada a ${fd.asesor}.`); rerender();
    } },
      h("label", { class: "f" }, h("span", { text: "Para" }), h("select", { class: "i", name: "asesor", required: true }, people.map((n) => h("option", { value: n, text: n, selected: (pre.asesor || "") === n })))),
      h("label", { class: "f" }, h("span", { text: "Tipo" }), h("select", { class: "i", name: "tipo" }, TIPOS_ACT.concat(["Seguimiento", "Cotizar", "Cobranza", "Producción"]).map((x) => h("option", { value: x, text: x, selected: pre.tipo === x })))),
      h("label", { class: "f full" }, h("span", { text: "Qué hay que hacer" }), h("input", { class: "i", name: "texto", required: true, value: pre.texto || "", placeholder: "Ej. Llamar para confirmar tallas y fecha de entrega" })),
      h("label", { class: "f" }, h("span", { text: "Para cuándo" }), h("input", { class: "i", type: "date", name: "fecha", required: true, value: pre.fecha || addDays(localDate(), 1) })),
      h("label", { class: "f" }, h("span", { text: "Prioridad" }), h("select", { class: "i", name: "prioridad" }, [["normal", "Normal"], ["alta", "Alta"], ["urgente", "Urgente"]].map(([v, t]) => h("option", { value: v, text: t })))),
      h("label", { class: "f" }, h("span", { text: "Cliente (opcional)" }), cuentaSel),
      h("label", { class: "f" }, h("span", { text: "Oportunidad (opcional)" }), oppSel),
      h("div", { class: "row full" }, h("button", { class: "btn accent", type: "submit" }, "Asignar tarea")));
    modal("Asignar tarea", f);
  }
  // Give a person a client to follow: they become its owner and get the follow-ups on their list.
  function assignFollowModal(pre = {}) {
    const cs = list("cuentas").sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (!cs.length) return toast("Primero crea la cuenta del cliente (Cuentas → + Cuenta).", true);
    const f = h("form", { class: "grid g2", onsubmit: async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f));
      const c = byId("cuentas", fd.cuentaId), veces = Math.max(1, Math.min(12, +fd.veces || 1)), cada = +fd.cada || 0;
      const texto = fd.texto.trim() || `Seguimiento a ${c.nombre}: pedidos, cotizaciones y próximas fechas`;
      for (let i = 0; i < (cada ? veces : 1); i++) await save("tareas", { tipo: "Seguimiento", texto: cada && veces > 1 ? `${texto} (${i + 1}/${veces})` : texto, fecha: addDays(fd.fecha, i * cada), asesor: fd.asesor, cuentaId: c.id, hecha: false, seguimiento: true, asignadaPor: S.name, asignadaEn: new Date().toISOString() }, { quiet: true });
      if (fd.responsable) await save("cuentas", { ...c, responsable: fd.asesor }, { quiet: true });
      if (fd.opps) for (const o of list("oportunidades").filter((x) => x.cuentaId === c.id && !["ganado", "perdido"].includes(x.etapa))) await save("oportunidades", { ...o, asesor: fd.asesor }, { quiet: true });
      closeModal(); toast(`${c.nombre} quedó con ${fd.asesor}: ${cada ? veces : 1} seguimiento(s).`); rerender();
    } },
      h("label", { class: "f" }, h("span", { text: "Cliente" }), h("select", { class: "i", name: "cuentaId", required: true }, cs.map((c) => h("option", { value: c.id, text: c.nombre + (c.responsable ? ` · ${c.responsable}` : ""), selected: pre.cuentaId === c.id })))),
      h("label", { class: "f" }, h("span", { text: "Lo sigue" }), h("select", { class: "i", name: "asesor", required: true }, team().map((n) => h("option", { value: n, text: n, selected: pre.asesor === n })))),
      h("label", { class: "f" }, h("span", { text: "Primer seguimiento" }), h("input", { class: "i", type: "date", name: "fecha", required: true, value: addDays(localDate(), 1) })),
      h("label", { class: "f" }, h("span", { text: "Repetir" }), h("select", { class: "i", name: "cada" }, [["0", "Solo una vez"], ["7", "Cada semana"], ["14", "Cada 2 semanas"], ["30", "Cada mes"]].map(([v, t]) => h("option", { value: v, text: t })))),
      h("label", { class: "f" }, h("span", { text: "Cuántas veces" }), h("input", { class: "i", type: "number", name: "veces", min: "1", max: "12", value: "4" })),
      h("label", { class: "f full" }, h("span", { text: "Indicación (opcional)" }), h("input", { class: "i", name: "texto", placeholder: "Ej. Revisar reorden de uniformes y cobrar saldo pendiente" })),
      h("label", { class: "cz-check full" }, h("input", { type: "checkbox", name: "responsable", value: "1", checked: true }), h("span", { text: "Hacerla responsable de la cuenta" })),
      h("label", { class: "cz-check full" }, h("input", { type: "checkbox", name: "opps", value: "1" }), h("span", { text: "Pasarle también las oportunidades abiertas de este cliente" })),
      h("div", { class: "row full" }, h("button", { class: "btn accent", type: "submit" }, "Asignar seguimiento")));
    modal("Asignar seguimiento de cliente", f);
  }

  function viewTeam() {
    if (!isAdmin()) return h("div", { class: "empty", text: "Esta sección es solo para la cuenta principal." });
    const tasks = list("tareas").filter((t) => !t.hecha), today = localDate();
    const statsOf = (name) => { const ts = tasks.filter((t) => t.asesor === name); return { pend: ts.length, late: ts.filter((t) => t.fecha && t.fecha < today).length, cuentas: list("cuentas").filter((c) => c.responsable === name).length, opps: list("oportunidades").filter((o) => o.asesor === name && !["ganado", "perdido"].includes(o.etapa)).length, ts }; };
    const rows = S.users.map((u) => {
      const st = statsOf(u.name), main = u.username === "admin1";
      return h("tr", {},
        h("td", {}, h("b", { text: u.name }), h("div", { class: "small muted", text: u.puesto || "" })),
        h("td", { class: "mono small", text: u.username }),
        h("td", {}, h("span", { class: "pill " + (u.role === "admin" ? "p-acc" : "p-mut"), text: main ? "principal" : u.role === "admin" ? "admin" : "equipo" })),
        h("td", {}, h("span", { class: "pill " + (u.active ? "p-ok" : "p-bad"), text: u.active ? "activa" : "desactivada" })),
        h("td", { class: "small", text: u.lastLogin ? fmtDT(u.lastLogin) : "Nunca" }),
        h("td", { class: "r num", text: st.pend }), h("td", { class: "r num " + (st.late ? "due-late" : ""), text: st.late }), h("td", { class: "r num", text: st.cuentas }),
        h("td", {}, h("div", { class: "row", style: "gap:.3rem" },
          h("button", { class: "btn sm ghost", type: "button", onclick: () => userModal(u) }, "Editar"),
          h("button", { class: "btn sm ghost", type: "button", onclick: async () => { const pw = newPassword(); try { const saved = await saveUser({ username: u.username, name: u.name, puesto: u.puesto, role: u.role, active: u.active, password: pw }); showCredentials(saved, pw, "Contraseña restablecida"); rerender(); } catch (err) { toast(err.message, true); } } }, "Restablecer contraseña"),
          !main ? h("button", { class: "btn sm ghost", type: "button", onclick: async () => { try { await saveUser({ username: u.username, name: u.name, puesto: u.puesto, role: u.role, active: !u.active }); toast(u.active ? `${u.name} ya no puede entrar.` : `${u.name} puede entrar de nuevo.`); rerender(); } catch (err) { toast(err.message, true); } } }, u.active ? "Desactivar" : "Activar") : null,
          !main ? h("button", { class: "btn sm danger", type: "button", onclick: async () => { if (!(await confirmBox(`¿Borrar la cuenta de ${u.name}? Sus tareas y clientes se quedan; reasígnalos antes si hace falta.`))) return; try { await api("DELETE", "/api/usuarios?u=" + encodeURIComponent(u.username)); await loadUsers(); toast("Cuenta borrada."); rerender(); } catch (err) { toast(err.message, true); } } }, "Borrar") : null)));
    });
    const people = S.users.filter((u) => u.active);
    return h("div", {},
      top("Solo la cuenta principal ve esta sección", "Equipo",
        h("button", { class: "btn ghost", type: "button", onclick: () => assignFollowModal() }, "Asignar seguimiento de cliente"),
        h("button", { class: "btn ghost", type: "button", onclick: () => assignTaskModal() }, "Asignar tarea"),
        h("button", { class: "btn accent", type: "button", onclick: () => userModal() }, "+ Cuenta")),
      h("div", { class: "card" }, h("h2", { text: "Cuentas de acceso" }),
        h("p", { class: "hint", text: "Cada persona entra con su usuario y su contraseña. Desactivar una cuenta la saca de inmediato de todos sus dispositivos." }),
        h("div", { class: "tbl" }, h("table", {}, h("thead", {}, h("tr", {}, ["Persona", "Usuario", "Permisos", "Estado", "Último acceso", "Pendientes", "Atrasadas", "Clientes", ""].map((x, i) => h("th", { class: i >= 5 && i <= 7 ? "r" : "", text: x })))), h("tbody", {}, rows)))),
      h("h2", { class: "label", style: "margin:1.4rem 0 .6rem", text: "Carga de trabajo" }),
      h("div", { class: "grid g3" }, people.map((u) => {
        const st = statsOf(u.name), next = st.ts.sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9")).slice(0, 5);
        return h("div", { class: "card" },
          h("div", { class: "row between" }, h("h2", { text: u.name }), h("span", { class: "small muted", text: `${st.pend} pendientes · ${st.opps} oportunidades` })),
          st.late ? h("p", { class: "small due-late", text: `${st.late} atrasada(s)` }) : null,
          next.length ? h("ul", { class: "log" }, next.map((t) => h("li", {}, h("time", { class: dueClass(t.fecha), text: t.fecha ? fmtDate(t.fecha) : "Sin fecha" }),
            h("span", {}, h("b", { text: (t.tipo || "Tarea") + ": " }), t.texto, t.cuentaId ? h("span", { class: "muted small", text: " · " + cuentaName(t.cuentaId) }) : null))))
            : h("p", { class: "muted small", text: "Sin tareas pendientes." }),
          h("div", { class: "row" },
            h("button", { class: "btn sm", type: "button", onclick: () => assignTaskModal({ asesor: u.name }) }, "Asignar tarea"),
            h("button", { class: "btn sm ghost", type: "button", onclick: () => assignFollowModal({ asesor: u.name }) }, "Asignar cliente"),
            h("a", { class: "btn sm ghost", href: "#tareas", onclick: () => { viewTasks.f = { who: u.name, show: "pendientes" }; } }, "Ver todas")));
      })));
  }

  // The prices the website's "Cotiza en un minuto" shows (sale prices before VAT, per piece).
  // The sales assistant (website chat, WhatsApp, Instagram, Messenger) and online payments. Saved in ajustes/asistente.
  function assistantCard() {
    const DEF = { activo: { web: false, whatsapp: false, instagram: false, messenger: false }, limite: 6000, anticipo: 50, horario: { dias: [1, 2, 3, 4, 5], desde: 9, hasta: 19 } };
    const cur = byId("ajustes", "asistente") || {};
    const a = { ...DEF, ...cur, activo: { ...DEF.activo, ...(cur.activo || {}) }, horario: { ...DEF.horario, ...(cur.horario || {}) } };
    const prices = byId("ajustes", "precios-web"), example = !prices || prices.ejemplo !== false;
    const status = h("div", { class: "grid", style: "gap:.35rem" }, h("p", { class: "muted small", text: "Revisando pagos e IA…" }));
    api("GET", "/api/venta?accion=estado").then((j) => {
      const ok = (b, t) => h("div", { class: "row", style: "flex-wrap:nowrap" }, h("span", { class: "pill " + (b ? "p-ok" : "p-warn"), text: b ? "listo" : "falta" }), h("span", { class: "small", style: "min-width:0", text: t }));
      status.replaceChildren(ok(j.pagos.mp, "Mercado Pago (MP_ACCESS_TOKEN): SPEI, OXXO, tarjeta y meses"), ok(j.pagos.stripe, "Stripe (STRIPE_SECRET_KEY): tarjetas, EE. UU."),
        ok(j.pagos.stripeHook, "Stripe confirma pagos (STRIPE_WEBHOOK_SECRET)"), ok(j.ia, "Entiende mensajes libres con IA (ANTHROPIC_API_KEY, opcional)"),
        h("p", { class: "small", style: "margin:.3rem 0 0" }, "Webhook de Mercado Pago: ", h("code", { class: "mono", text: j.webhooks.mp })),
        h("p", { class: "small", style: "margin:0" }, "Webhook de Stripe (checkout.session.completed): ", h("code", { class: "mono", text: j.webhooks.stripe })),
        h("a", { class: "btn sm ghost", style: "justify-self:start", href: "/ops/conectar.html#pagos", target: "_blank", rel: "noopener" }, "Cómo conectar los pagos"));
    }).catch(() => status.replaceChildren(h("p", { class: "small muted", text: "No se pudo revisar el estado." })));
    const chk = (k, label) => h("label", { class: "row small", style: "gap:.4rem" }, h("input", { type: "checkbox", checked: !!a.activo[k], onchange: (e) => { a.activo[k] = e.target.checked; } }), label);
    const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return h("div", { class: "card" }, h("h2", { text: "Asistente de ventas" }),
      h("p", { class: "hint", text: "Cotiza por mensaje con botones, con los mismos precios del sitio, manda links de pago y pasa a una asesora en pedidos grandes, licencias, paquete completo o quejas. Lo que platica queda en Solicitudes; si alguien del equipo responde, el asistente se calla en esa conversación." }),
      example ? h("p", { class: "small", style: "background:var(--shade);padding:.5rem .7rem;margin:0" }, h("b", { text: "Antes de activarlo: " }), "los precios del sitio siguen marcados como ejemplo. Captura los reales en «Precios del sitio» y desmarca «ejemplo»; el asistente cotiza con ellos.") : null,
      h("div", { class: "label", text: "Dónde atiende" }),
      h("div", { class: "grid g2", style: "gap:.3rem" }, chk("web", "Chat del sitio"), chk("whatsapp", "WhatsApp"), chk("instagram", "Instagram Direct"), chk("messenger", "Messenger")),
      h("p", { class: "small muted", style: "margin:0" }, "Para probarlo sin publicarlo: abre el sitio con ", h("a", { href: "/?asistente=1", target: "_blank", rel: "noopener", text: "?asistente=1" }), "."),
      h("div", { class: "grid g3" },
        h("label", { class: "f" }, h("span", { text: "Pasa a asesora arriba de (MXN con IVA)" }), h("input", { class: "i", type: "number", min: "0", step: "100", value: a.limite, oninput: (e) => { a.limite = +e.target.value; } })),
        h("label", { class: "f" }, h("span", { text: "Anticipo que cobra (%)" }), h("input", { class: "i", type: "number", min: "0", max: "100", value: a.anticipo, oninput: (e) => { a.anticipo = +e.target.value; } })),
        h("label", { class: "f" }, h("span", { text: "Horario de asesoras (hora CDMX)" }), h("div", { class: "row", style: "flex-wrap:nowrap;gap:.3rem" },
          h("input", { class: "i", type: "number", min: "0", max: "23", value: a.horario.desde, "aria-label": "Desde", oninput: (e) => { a.horario.desde = +e.target.value; } }), "a",
          h("input", { class: "i", type: "number", min: "1", max: "24", value: a.horario.hasta, "aria-label": "Hasta", oninput: (e) => { a.horario.hasta = +e.target.value; } })))),
      h("div", { class: "row", style: "gap:.6rem" }, DIAS.map((n, i) => h("label", { class: "row small", style: "gap:.25rem" }, h("input", { type: "checkbox", checked: a.horario.dias.includes(i), onchange: (e) => { a.horario.dias = e.target.checked ? [...new Set([...a.horario.dias, i])].sort() : a.horario.dias.filter((x) => x !== i); } }), n))),
      h("button", { class: "btn accent", type: "button", style: "justify-self:start", onclick: async () => {
        if ((a.activo.web || a.activo.whatsapp || a.activo.instagram || a.activo.messenger) && example && !(await confirmBox("Los precios del sitio siguen marcados como ejemplo: el asistente cotizaría con ellos. ¿Activarlo de todos modos?"))) return;
        await save("ajustes", { ...(byId("ajustes", "asistente") || {}), ...a, id: "asistente" }); toast("Asistente guardado. Los cambios aplican en un minuto.");
      } }, "Guardar asistente"),
      h("div", { class: "label", text: "Pagos en línea" }), status);
  }

  // Saved apart from the rest of the settings (ajustes/precios-web) because the site reads them publicly.
  function webPricesCard() {
    const box = h("div", { class: "grid", style: "gap:.6rem" }, h("p", { class: "small muted", text: "Cargando…" }));
    (async () => {
      let base;
      try { base = (await (await fetch("/api/precios", { cache: "no-store" })).json()).precios; } catch { box.replaceChildren(h("p", { class: "small", text: "No se pudieron cargar los precios del sitio." })); return; }
      const doc = byId("ajustes", "precios-web");
      const P = structuredClone(base), ej = { v: doc ? doc.ejemplo !== false : true };
      const n = (arr, i, w = "5.2rem") => h("input", { class: "i num", type: "number", step: "any", min: "0", style: `width:${w}`, value: arr[i], oninput: (e) => { arr[i] = +e.target.value; } });
      const rowOf = (label, arr) => h("tr", {}, h("td", { text: label }), ...arr.map((_, i) => h("td", {}, n(arr, i))));
      const head = (tramos) => h("tr", {}, h("th", { text: "Piezas desde →" }), ...tramos.map((_, i) => h("th", {}, n(tramos, i, "5.2rem"))));
      const one = (obj, key, label) => h("label", { class: "f" }, h("span", { text: label }), h("input", { class: "i", type: "number", step: "any", min: "0", value: obj[key], oninput: (e) => { obj[key] = +e.target.value; } }));
      const prodRows = h("tbody");
      const paintProds = () => prodRows.replaceChildren(...P.productos.map((p, k) => h("tr", {},
        h("td", {}, h("input", { class: "i", style: "min-width:11rem", value: p.nombre, oninput: (e) => { p.nombre = e.target.value; } }),
          h("div", { class: "row small", style: "gap:.5rem;margin-top:.2rem" },
            h("input", { class: "i", style: "width:10rem", placeholder: "Plural (ej. playeras)", value: p.plural || "", oninput: (e) => { p.plural = e.target.value; } }),
            h("button", { class: "x", type: "button", "aria-label": "Quitar producto", onclick: () => { if (confirm(`¿Quitar ${p.nombre} del cotizador del sitio?`)) { P.productos.splice(k, 1); paintProds(); } } }, "×"))),
        ...p.precios.map((_, i) => h("td", {}, n(p.precios, i))))));
      paintProds();
      box.replaceChildren(
        h("label", { class: "row small", style: "gap:.4rem" }, h("input", { type: "checkbox", checked: !ej.v, onchange: (e) => { ej.v = !e.target.checked; } }), "Estos precios ya están revisados (el sitio deja de decir “precios de ejemplo”)"),
        h("div", { class: "label", text: "Prenda o artículo, por pieza" }),
        h("div", { class: "tbl" }, h("table", {}, h("thead", {}, head(P.tramos)), prodRows)),
        h("button", { class: "btn sm ghost", type: "button", style: "justify-self:start", onclick: () => { P.productos.push({ id: "p" + Date.now().toString(36), nombre: "Nuevo producto", plural: "", precios: P.tramos.map(() => 0) }); paintProds(); } }, "+ Producto"),
        h("div", { class: "label", text: "Impresión, por pieza (mismas escalas)" }),
        h("div", { class: "tbl" }, h("table", {}, h("tbody", {},
          rowOf("Serigrafía: por tinta y ubicación", P.tinta), rowOf("Serigrafía: base por ubicación", P.baseUbicacion), rowOf("DTG: por ubicación", P.dtg),
          rowOf("Bordado chico (≤ 7 cm)", P.bordado.chico), rowOf("Bordado mediano (≤ 12 cm)", P.bordado.mediano), rowOf("Bordado grande (≤ 25 cm)", P.bordado.grande)))),
        h("div", { class: "label", text: "Chilian Sport full print (prenda + sublimación, por pieza)" }),
        h("div", { class: "tbl" }, h("table", {}, h("thead", {}, head(P.fullprint.tramos)), h("tbody", {}, rowOf("Precio por pieza", P.fullprint.precios)))),
        h("div", { class: "label", text: "Extra por ubicación en tintas especiales" }),
        h("div", { class: "grid g3" }, ...Object.keys(P.especiales).map((k) => one(P.especiales, k, ({ plastisol: "Plastisol", waterbase: "Base agua", discharge: "Discharge", hd: "HD", puff: "Puff", glitter: "Glitter", gitd: "Brilla en la oscuridad" })[k] || k))),
        h("div", { class: "label", text: "Cargos, mínimos y tiempos" }),
        h("div", { class: "grid g3" }, one(P, "pantalla", "Pantalla (MXN, se prorratea)"), one(P, "ponchado", "Ponchado (MXN por ubicación)"), one(P, "express", "Cargo express (%)"),
          one(P, "diasExpress", "Días que ahorra express"), one(P, "iva", "IVA (%)"),
          one(P.minimos, "serigrafia", "Mínimo serigrafía (pzas)"), one(P.minimos, "dtg", "Mínimo DTG (pzas)"), one(P.minimos, "bordado", "Mínimo bordado (pzas)"), one(P.minimos, "full", "Mínimo full print (pzas)")),
        h("p", { class: "hint", text: "Los días hábiles por volumen (serigrafía 8/10/15, DTG 4/6/9, bordado 8/12/18, full print 12/15/20) se ajustan en el código si cambian." }),
        h("div", { class: "row" },
          h("button", { class: "btn accent", type: "button", onclick: async () => {
            for (const p of P.productos) p.id = p.id || "p" + Date.now().toString(36);
            await save("ajustes", { ...(byId("ajustes", "precios-web") || {}), id: "precios-web", precios: P, ejemplo: ej.v }); toast("Precios del sitio guardados. El sitio los muestra en unos minutos.");
          } }, "Guardar precios del sitio"),
          h("a", { class: "btn sm ghost", href: "/#cotizar", target: "_blank", rel: "noopener" }, "Ver el cotizador del sitio ↗")));
    })();
    return h("div", { class: "card" }, h("h2", { text: "Precios del cotizador web" }),
      h("p", { class: "hint", text: "Lo que ve el cliente en “Cotiza en un minuto”: precio de venta antes de IVA, por pieza, según piezas. Son de referencia: la cotización formal se hace aquí en el OS." }), box);
  }
  // The keys for push notifications and the morning summary, made here in the browser (they never
  // pass through the server); the main account pastes them in Vercel → Environment Variables.
  function keysBox() {
    const out = h("div", { class: "grid", style: "gap:.35rem" });
    const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const row = (k, v) => h("div", { class: "grid", style: "gap:.2rem" }, h("div", { class: "label", text: k }), h("div", { class: "copybox mono", style: "overflow-wrap:anywhere", text: v }), h("button", { class: "btn sm ghost", type: "button", style: "justify-self:start", onclick: () => copy(v) }, "Copiar " + k));
    return h("div", { class: "grid", style: "gap:.5rem;margin-top:.6rem" },
      h("p", { class: "small", text: "Faltan las llaves de los avisos. Genéralas aquí y pégalas en Vercel → Settings → Environment Variables (Production), luego haz Redeploy. No las compartas por chat ni correo." }),
      h("button", { class: "btn sm", type: "button", style: "justify-self:start", onclick: async () => {
        const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
        const pub = b64u(await crypto.subtle.exportKey("raw", kp.publicKey)), jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
        out.replaceChildren(row("VAPID_PUBLIC_KEY", pub), row("VAPID_PRIVATE_KEY", jwk.d), row("VAPID_SUBJECT", "mailto:ventas@grupochilian.com.mx"), row("CRON_SECRET", b64u(crypto.getRandomValues(new Uint8Array(32)))));
      } }, "Generar llaves de avisos"), out);
  }
  function instagramCard() {
    const status = h("div", { class: "grid", style: "gap:.35rem" }, h("p", { class: "muted small", text: "Revisando la conexión…" }));
    const link = (medium) => `${location.origin}/?utm_source=instagram&utm_medium=${medium}#cotizar`;
    api("GET", "/api/meta?estado=1").then((j) => {
      const ok = (b) => h("span", { class: "pill " + (b ? "p-ok" : "p-warn"), text: b ? "listo" : "falta" });
      status.replaceChildren(...[
        h("div", { class: "row" }, ok(j.verify), h("span", { class: "small", text: "Token de verificación (META_VERIFY_TOKEN o IG_VERIFY_TOKEN)" })),
        h("div", { class: "row" }, ok(j.secret), h("span", { class: "small", text: "Secreto de la app de Meta (META_APP_SECRET)" })),
        h("div", { class: "row" }, ok(j.whatsapp), h("span", { class: "small", text: "WhatsApp: token del usuario del sistema (WA_ACCESS_TOKEN)" })),
        h("div", { class: "row" }, ok(j.instagram), h("span", { class: "small", text: "Instagram: token de la cuenta (IG_ACCESS_TOKEN)" })),
        h("div", { class: "row" }, ok(j.messenger), h("span", { class: "small", text: "Messenger: token de la página de Facebook (META_PAGE_TOKEN)" })),
        h("div", { class: "row" }, ok(j.push), h("span", { class: "small", text: "Notificaciones push (VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY)" })),
        h("div", { class: "row" }, ok(j.cron), h("span", { class: "small", text: "Resumen de cada mañana (CRON_SECRET)" })),
        !j.push || !j.cron ? keysBox() : null,
        h("div", { class: "label", text: "URL del webhook (Callback URL) para WhatsApp, Instagram y Messenger" }), h("div", { class: "copybox", text: j.webhook }),
        j.verifyToken ? h("div", { class: "label", text: "Verify token" }) : null, j.verifyToken ? h("div", { class: "copybox", text: j.verifyToken }) : null].filter(Boolean));
    }).catch(() => status.replaceChildren(h("p", { class: "small", text: "No se pudo revisar la conexión." })));
    return h("div", { class: "card" }, h("h2", { text: "WhatsApp, Instagram, Messenger y avisos" }),
      h("p", { class: "small" }, "Paso a paso para conectar todo: ", h("a", { href: "/ops/conectar", target: "_blank", rel: "noopener", text: "abrir el tutorial ↗" }), ". Un solo webhook recibe los tres canales; cada conversación llega a Solicitudes y avisa al equipo."),
      h("p", { class: "small", text: "1. Enlace de la bio y de historias: las solicitudes que llegan por aquí salen marcadas como Instagram." }),
      h("div", { class: "label", text: "Bio" }), h("div", { class: "copybox", text: link("bio") }), h("button", { class: "btn sm ghost", type: "button", onclick: () => copy(link("bio")) }, "Copiar enlace de la bio"),
      h("div", { class: "label", text: "Historias y anuncios" }), h("div", { class: "copybox", text: link("historia") }), h("button", { class: "btn sm ghost", type: "button", onclick: () => copy(link("historia")) }, "Copiar enlace de historias"),
      h("p", { class: "small", text: "2. Mensajes: mientras un canal no esté conectado, registra sus conversaciones en Solicitudes → + Solicitud (Llegó por). Ya conectado, cada mensaje entra solo y se responde desde la solicitud (dentro de las 24 h que da Meta)." }),
      status);
  }

  /* ---------------- settings ---------------- */
  function viewSettings() {
    if (!isAdmin()) return h("div", { class: "empty", text: "Los ajustes los cambia la cuenta principal." });
    const st = structuredClone(S.settings);
    const saveAll = async () => { const saved = await save("ajustes", { ...st, id: "general" }); S.settings = mergeSettings(saved); toast("Ajustes guardados."); rerender(); };
    const num = (obj, key, label, step = "any") => h("label", { class: "f" }, h("span", { text: label }), h("input", { class: "i", type: "number", step, value: obj[key], oninput: (e) => { obj[key] = +e.target.value; } }));
    const root = h("div", {}, top("Valores que usa todo el sistema", "Ajustes", h("button", { class: "btn accent", type: "button", onclick: saveAll }, "Guardar ajustes")),
      h("div", { class: "cols" },
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Cotizador" }),
            h("p", { class: "hint", text: "Valores con los que arranca cada cotización. Los precios de cada producto se aprenden solos de las cotizaciones guardadas." }),
            h("div", { class: "grid g3" }, num(st.tarifas, "factor", "Factor costo → precio"), num(st.tarifas, "margenPrenda", "Margen prenda, tintas (%)"), num(st.tarifas, "margenEstampado", "Margen estampado, tintas (%)"),
              num(st.tarifas, "expressPct", "Cargo express (%)"), num(st.tarifas, "costoPantalla", "Pantalla (MXN por color)"), num(st.tarifas, "iva", "IVA (%)"),
              num(st.tarifas, "anticipo", "Anticipo (%)"), num(st.tarifas, "vigencia", "Vigencia (días)"), num(st.tarifas, "ajusteTabla", "Ajuste a la tabla de tintas (%)"))),
          h("div", { class: "card" }, h("h2", { text: "Descuento por volumen" }),
            h("p", { class: "hint", text: "Se aplica por renglón según sus piezas, cuando la cotización lo activa." }),
            ((box) => { const paint = () => box.replaceChildren(...st.tarifas.descVol.map((t, i) => h("div", { class: "grid", style: "grid-template-columns:minmax(0,1fr) minmax(0,1fr) 2rem;gap:.4rem;align-items:end" },
              h("label", { class: "f" }, h("span", { text: "Desde (piezas)" }), h("input", { class: "i", type: "number", min: "1", value: t[0], oninput: (e) => { t[0] = +e.target.value; } })),
              h("label", { class: "f" }, h("span", { text: "Descuento (%)" }), h("input", { class: "i", type: "number", step: "any", value: t[1], oninput: (e) => { t[1] = +e.target.value; } })),
              h("button", { class: "x", type: "button", "aria-label": "Quitar escala", onclick: () => { st.tarifas.descVol.splice(i, 1); paint(); } }, "×"))),
              h("button", { class: "btn sm ghost", type: "button", style: "justify-self:start", onclick: () => { st.tarifas.descVol.push([(st.tarifas.descVol.at(-1)?.[0] || 0) * 2 || 100, 0]); paint(); } }, "+ Escala"));
              paint(); return box; })(h("div", { class: "grid", style: "gap:.4rem" }))),
          h("div", { class: "card" }, h("h2", { text: "Tabla de costos por tintas" }),
            h("p", { class: "hint", text: "Costo por pieza (MXN) por tamaño en cm² (100, 300, 600, 1200, 1800) y escala (100, 250, 500, 1,000, 10,000 y 100,000 pz). Columnas: 1, 2–3, 4–5, 6–7, 8–9 y 10–11 tintas, prenda de color, antimigrante, HD/puff, fleece, glitter y calidad exportación. Para un cambio parejo usa el ajuste en %." }),
            ((ta) => h("div", { class: "grid", style: "gap:.4rem" }, ta, h("div", { class: "row" },
              h("button", { class: "btn sm", type: "button", onclick: () => { try { const v = JSON.parse(ta.value); if (!["100", "300", "600", "1200", "1800"].every((k) => Array.isArray(v[k]) && v[k].length === 6 && v[k].every((r) => r.length === 12 && r.every((x) => typeof x === "number")))) throw 0; st.tarifas.tablaTintas = v; toast("Tabla lista; guarda los ajustes."); } catch { toast("La tabla no tiene el formato esperado (5 tamaños × 6 escalas × 12 columnas).", true); } } }, "Usar esta tabla"),
              h("button", { class: "btn sm ghost", type: "button", onclick: () => { st.tarifas.tablaTintas = null; ta.value = JSON.stringify(window.CZ_DEFAULT_TABLE); toast("Tabla base restablecida; guarda los ajustes."); } }, "Restablecer la tabla base"))))(
              h("textarea", { class: "i mono", style: "min-height:140px;font-size:.72rem", spellcheck: "false", value: JSON.stringify(st.tarifas.tablaTintas || window.CZ_DEFAULT_TABLE) }))),
          h("div", { class: "card" }, h("h2", { text: "Tiempos de planta" }),
            h("div", { class: "grid g3" }, num(st.tarifas, "minPantalla", "Minutos por pantalla"), num(st.tarifas, "transicion", "Minutos entre trabajos"), num(st.tarifas, "impHora", "Impresiones por hora"),
              num(st.turno, "horas", "Horas por turno"), num(st.turno, "turnos", "Turnos", "1"), num(st.turno, "uso", "Tiempo disponible usado (%)")),
            h("div", { class: "chips" }, ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d, i) => h("button", { type: "button", class: "chip" + (st.turno.dias.includes(i) ? " on" : ""), onclick: (e) => { st.turno.dias = st.turno.dias.includes(i) ? st.turno.dias.filter((x) => x !== i) : [...st.turno.dias, i].sort(); e.target.classList.toggle("on"); } }, d))))),
        h("div", { class: "grid" },
          h("div", { class: "card" }, h("h2", { text: "Máquinas" }), h("p", { class: "hint", text: "Pulpos de serigrafía, impresoras DTG y bordadoras. Cada una tiene su fila en Programación." }),
            ((box) => { const paint = () => box.replaceChildren(...st.pulpos.map((p, i) => { const tec = machineType(p);
              return h("div", { class: "grid", style: "grid-template-columns:minmax(0,1fr) 112px 64px 64px 2rem;gap:.35rem;align-items:end" },
                h("label", { class: "f" }, h("span", { text: "Nombre" }), h("input", { class: "i", value: p.nombre, oninput: (e) => { p.nombre = e.target.value; } })),
                h("label", { class: "f" }, h("span", { text: "Tipo" }), h("select", { class: "i", onchange: (e) => { p.tipo = e.target.value; if (p.tipo !== "serigrafia" && !p.cabezas) p.cabezas = p.tipo === "bordado" ? 6 : 1; paint(); } }, Object.entries(TECS).map(([v, t]) => h("option", { value: v, text: t, selected: tec === v })))),
                tec === "serigrafia" ? num(p, "paletas", "Paletas", "1") : num(p, "cabezas", tec === "dtg" ? "Piezas" : "Cabezas", "1"),
                tec === "serigrafia" ? num(p, "colores", "Colores", "1") : h("span"),
                h("button", { class: "x", type: "button", "aria-label": "Quitar máquina", onclick: () => { st.pulpos.splice(i, 1); paint(); } }, "×")); }),
              h("div", { class: "row" },
                h("button", { class: "btn sm ghost", type: "button", onclick: () => { st.pulpos.push({ id: "p" + rid(), nombre: "Pulpo nuevo", tipo: "serigrafia", paletas: 12, colores: 8 }); paint(); } }, "+ Pulpo"),
                h("button", { class: "btn sm ghost", type: "button", onclick: () => { st.pulpos.push({ id: "d" + rid(), nombre: "DTG nueva", tipo: "dtg", cabezas: 1 }); paint(); } }, "+ DTG"),
                h("button", { class: "btn sm ghost", type: "button", onclick: () => { st.pulpos.push({ id: "b" + rid(), nombre: "Bordadora nueva", tipo: "bordado", cabezas: 6 }); paint(); } }, "+ Bordadora")));
              paint(); return box; })(h("div", { class: "grid", style: "gap:.4rem" }))),
          h("div", { class: "card" }, h("h2", { text: "DTG y bordado" }),
            h("p", { class: "hint", text: "Tiempos para programar y costos para cotizar. Los costos iniciales son ejemplos: cámbialos por los de Chilian." }),
            h("div", { class: "label", text: "DTG" }),
            h("div", { class: "grid g3" }, num(st.tarifas, "minDTG", "Min por pieza (prenda clara)"), num(st.tarifas, "minDTGOscura", "Min por pieza (oscura, con pretratado)"), num(st.tarifas, "setupDTG", "Min de preparación"),
              ...[100, 300, 600, 1200].map((k) => h("label", { class: "f" }, h("span", { text: `Costo ${({ 100: "escudo", 300: "media carta", 600: "carta", 1200: "doble carta" })[k]} (MXN)` }), h("input", { class: "i", type: "number", step: "any", value: (st.tarifas.dtgCostos || {})[k], oninput: (e) => { st.tarifas.dtgCostos = { ...(st.tarifas.dtgCostos || {}), [k]: +e.target.value }; } }))),
              num(st.tarifas, "dtgOscura", "Extra prenda oscura (MXN)"), num(st.tarifas, "margenDTG", "Margen DTG (%)")),
            h("div", { class: "label", text: "Bordado" }),
            h("div", { class: "grid g3" }, num(st.tarifas, "rpmBordado", "Puntadas por minuto"), num(st.tarifas, "efBordado", "Eficiencia (%)"), num(st.tarifas, "minAro", "Min por ciclo (enmarcar y cambiar)"),
              num(st.tarifas, "setupBordado", "Min de preparación"), num(st.tarifas, "costoMilPuntadas", "Costo por 1,000 puntadas (MXN)"), num(st.tarifas, "costoPonchado", "Ponchado (MXN por diseño)"), num(st.tarifas, "margenBordado", "Margen bordado (%)")),
            h("label", { class: "row small", style: "gap:.4rem" }, h("input", { type: "checkbox", checked: !st.tarifas.ejemploDB, onchange: (e) => { st.tarifas.ejemploDB = !e.target.checked; } }), "Estos costos ya son los reales de Chilian")),
          h("div", { class: "card" }, h("h2", { text: "Números de WhatsApp" }),
            h("p", { class: "hint", text: "Las líneas de Chilian a las que llegan los mensajes del sitio. Cada solicitud muestra a cuál llegó." }),
            ((box) => { const paint = () => box.replaceChildren(...st.whatsapps.map((w, i) => h("div", { class: "grid", style: "grid-template-columns:150px minmax(0,1fr) 2rem;gap:.35rem;align-items:end" },
              h("label", { class: "f" }, h("span", { text: "Número (10 dígitos)" }), h("input", { class: "i mono", value: w.numero, oninput: (e) => { const d = e.target.value.replace(/\D/g, "").slice(-10); w.numero = e.target.value; w.wa = d.length === 10 ? "52" + d : w.wa; } })),
              h("label", { class: "f" }, h("span", { text: "De quién / para qué" }), h("input", { class: "i", value: w.linea, oninput: (e) => { w.linea = e.target.value; } })),
              h("button", { class: "x", type: "button", "aria-label": "Quitar número", onclick: () => { st.whatsapps.splice(i, 1); paint(); } }, "×"))),
              h("button", { class: "btn sm ghost", type: "button", style: "justify-self:start", onclick: () => { st.whatsapps.push({ wa: "", numero: "", linea: "" }); paint(); } }, "+ Número"));
              paint(); return box; })(h("div", { class: "grid", style: "gap:.4rem" }))),
          instagramCard(),
          webPricesCard(),
          assistantCard(),
          h("div", { class: "card" }, h("h2", { text: "Equipo y acceso" }), h("p", { class: "small", text: "Cada persona entra con su propia cuenta. Créalas, restablece contraseñas y asigna tareas y clientes en Equipo." }),
            h("a", { class: "btn sm", href: "#equipo" }, "Ir a Equipo")))));
    const toc = h("nav", { class: "toc", "aria-label": "Secciones de ajustes" }, [...root.querySelectorAll(".card > h2")].map((h2) => h("button", { type: "button", onclick: () => h2.scrollIntoView({ behavior: "smooth", block: "start" }) }, h2.textContent)));
    root.firstChild.after(toc);
    return root;
  }

  /* ---------------- start ---------------- */
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeModal(); });
  // Other people (and clients approving art) change records too: refresh before
  // showing a view when what we hold is more than a few seconds old.
  addEventListener("hashchange", async () => { if ($("#modal").open) closeModal(); if (S.token && Date.now() - S.loadedAt > 8000) await loadAll(true); render(); });
  addEventListener("unhandledrejection", (e) => { if (e.reason?.shown) e.preventDefault(); });
  // keep data fresh while the app is open (other people are working too)
  setInterval(async () => { if (S.token && document.visibilityState === "visible" && !$("#modal").open && !document.activeElement?.matches("input, textarea, select") && !(window.__czDirty && window.__czDirty())) { await loadAll(true); rerender(); notifyLocal(); } }, 90_000);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/ops/sw.js", { scope: "/ops/" }).catch(() => {});
    navigator.serviceWorker.addEventListener("message", (e) => { if (e.data?.go) location.href = e.data.go; });
  }
  (async () => {
    try { const s = JSON.parse(store.get("chilian-os") || "null"); if (s?.token && s.usuario) Object.assign(S, { token: s.token, name: s.name, usuario: s.usuario, role: s.role }); } catch {}
    if (!S.token) return renderLogin();
    $("#app").replaceChildren(h("div", { class: "login" }, h("p", { class: "label", text: "Cargando datos…" })));
    try { await loadAll(); render(); notifyLocal(); } catch { /* 401 handled in api() */ }
  })();
})();
