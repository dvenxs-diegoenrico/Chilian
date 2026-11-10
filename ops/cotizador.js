/* =====================================================================
   CHILIAN OS · cotizador interno (solo equipo)
   ---------------------------------------------------------------------
   - Catálogo de Chilian: las prendas de los 8 catálogos (una por modelo) y los servicios
     de la planta (serigrafía, bordado, DTF/DTG, sublimación, etiquetas,
     empaque, pantallas, muestras, envío).
   - Precios aprendidos: cada renglón trae lo que el equipo ya cotizó de ese
     producto (piezas, precio, cliente, fecha); al escribir la cantidad se
     sugiere el precio de volumen más cercano.
   - Descuento general y por volumen, cargo express, cuatro formas de IVA,
     anticipo, entrega, condiciones, escenarios de cantidad, opciones a elegir.
   - Costeo interno (costo × factor, margen) que nunca sale en la hoja.
   - La hoja tal como la recibe el cliente, en vivo, imprimible a PDF, y el
     texto listo para WhatsApp.
   - Cotizador de serigrafía por tintas: posiciones, tamaño, tintas, efectos
     y, si se quiere, la prenda del catálogo con su costo.
   Todo se guarda en la cotización (Chilian OS), no en el navegador.
   ===================================================================== */
(() => {
  "use strict";

  // Precio de lista por pieza (MXN, antes de IVA) por tamaño de impresión (cm²) y escala de piezas (100, 250, 500, 1k, 10k, 100k).
  // Columnas: 0–5 tintas (1, 2–3, 4–5, 6–7, 8–9, 10–11) · 6 prenda de color · 7 antimigrante · 8 HD/puff ·
  // 9 fleece · 10 glitter · 11 calidad exportación. Tabla base editable en Ajustes.
  const DEFAULT_TABLE = {"100":[[9.13,15.97,20.53,25.1,29.66,34.22,1.76,3.51,3.51,3.51,1.76,7.02],[7.3,12.78,16.43,20.08,23.73,27.38,1.4,2.81,2.81,2.81,1.4,5.62],[5.93,10.38,13.35,16.31,19.28,22.24,1.14,2.28,2.28,2.28,1.14,4.56],[4.56,7.99,10.27,12.55,14.83,17.11,0.88,1.76,1.76,1.76,0.88,3.51],[4.11,7.19,9.24,11.29,13.35,15.4,0.79,1.58,1.58,1.58,0.79,3.16],[3.65,6.39,8.21,10.04,11.86,13.69,0.7,1.4,1.4,1.4,0.7,2.81]],"300":[[15.97,20.53,25.1,29.66,34.22,38.79,3.51,5.27,3.51,5.27,3.51,12.29],[12.78,16.43,20.08,23.73,27.38,31.03,2.81,4.21,2.81,4.21,2.81,9.83],[10.38,13.35,16.31,19.28,22.24,25.21,2.28,3.42,2.28,3.42,2.28,7.99],[7.99,10.27,12.55,14.83,17.11,19.39,1.76,2.63,1.76,2.63,1.76,6.14],[7.19,9.24,11.29,13.35,15.4,17.45,1.58,2.37,1.58,2.37,1.58,5.53],[6.39,8.21,10.04,11.86,13.69,15.51,1.4,2.11,1.4,2.11,1.4,4.91]],"600":[[18.25,22.82,27.38,31.94,36.5,41.07,5.27,7.02,5.27,7.02,7.02,14.04],[14.6,18.25,21.9,25.55,29.2,32.85,4.21,5.62,4.21,5.62,5.62,11.23],[11.86,14.83,17.8,20.76,23.73,26.69,3.42,4.56,3.42,4.56,4.56,9.13],[9.13,11.41,13.69,15.97,18.25,20.53,2.63,3.51,2.63,3.51,3.51,7.02],[8.21,10.27,12.32,14.37,16.43,18.48,2.37,3.16,2.37,3.16,3.16,6.32],[7.3,9.13,10.95,12.78,14.6,16.43,2.11,2.81,2.11,2.81,2.81,5.62]],"1200":[[22.82,27.38,31.94,36.5,41.07,45.63,10.53,14.04,10.53,8.78,14.04,17.55],[18.25,21.9,25.55,29.2,32.85,36.5,8.42,11.23,8.42,7.02,11.23,14.04],[14.83,17.8,20.76,23.73,26.69,29.66,6.84,9.13,6.84,5.7,9.13,11.41],[11.41,13.69,15.97,18.25,20.53,22.82,5.27,7.02,5.27,4.39,7.02,8.78],[10.27,12.32,14.37,16.43,18.48,20.53,4.74,6.32,4.74,3.95,6.32,7.9],[9.13,10.95,12.78,14.6,16.43,18.25,4.21,5.62,4.21,3.51,5.62,7.02]],"1800":[[25.1,34.22,38.79,43.35,47.91,52.47,14.04,19.31,15.8,10.53,19.31,19.31],[20.08,27.38,31.03,34.68,38.33,41.98,11.23,15.44,12.64,8.42,15.44,15.44],[16.31,22.24,25.21,28.18,31.14,34.11,9.13,12.55,10.27,6.84,12.55,12.55],[12.55,17.11,19.39,21.67,23.96,26.24,7.02,9.65,7.9,5.27,9.65,9.65],[11.29,15.4,17.45,19.51,21.56,23.61,6.32,8.69,7.11,4.74,8.69,8.69],[10.04,13.69,15.51,17.34,19.16,20.99,5.62,7.72,6.32,4.21,7.72,7.72]]};
  /* Serigrafía de 6 a 99 piezas (lista de Chilian «0–100 pz»): precio por pieza y por posición, por número exacto de tintas (1 a 8).
     chico = media carta (también escudo); grande = carta hasta doble carta (también extra grande). Desde 100 pz manda la tabla LN1.
     Cuatro celdas de la hoja impresa rompían la secuencia y se tomaron de la secuencia (hoja → aquí):
     grande 12 pz 7 tintas 233.47 → 332.38 · grande 50 pz 4 tintas 61.43 → 59.22 · chico 20 pz 6 tintas 192.09 → 162.38 · chico 50 pz 4 tintas 58.18 → 52.99.
     El renglón de 100 pz de la hoja no se usa (a 100 pz se cotiza con LN1). */
  const CHICA_QT = [6, 12, 20, 30, 50, 100];
  const CHICA = {
    chico: [[117.82, 193.66, 269.52, 345.36, 421.21, 497.05, 572.9, 648.75], [61.09, 100.48, 139.86, 179.24, 218.62, 258, 297.39, 336.77], [38.41, 63.2, 88, 112.79, 137.59, 162.38, 187.18, 211.98],
      [27.06, 44.57, 62.07, 79.57, 97.07, 114.57, 132.08, 149.58], [17.98, 29.65, 41.32, 52.99, 64.66, 76.32, 88, 99.67], [11.18, 18.48, 25.77, 33.06, 40.35, 47.65, 54.94, 62.23]],
    grande: [[131.68, 216.45, 301.22, 385.99, 470.76, 555.53, 640.31, 725.07], [68.28, 112.29, 156.32, 200.33, 244.35, 288.36, 332.38, 376.39], [42.93, 70.64, 98.35, 126.07, 153.78, 181.5, 209.2, 236.91],
      [30.25, 49.8, 69.37, 88.93, 108.5, 128.06, 147.62, 167.18], [20.1, 33.14, 46.18, 59.22, 72.27, 85.31, 98.35, 111.39], [12.49, 20.64, 28.79, 36.94, 45.1, 53.25, 61.4, 69.55]]
  };
  const SIZES = [[100, "Escudo", "≈ 10 × 10 cm"], [300, "Media carta", "≈ 21.5 × 14 cm"], [600, "Carta", "≈ 21.5 × 28 cm"], [1200, "Doble carta", "≈ 28 × 43 cm"], [1800, "Extra grande", "≈ 30 × 60 cm"]];
  const QT = [100, 250, 500, 1000, 10000, 100000];
  const INKS = ["1", "2–3", "4–5", "6–7", "8–9", "10–11"];
  const INK_MAX = [1, 3, 5, 7, 9, 11];
  const FX = [[7, "Antimigrante (barrier base)", "antimigrante"], [8, "HD / Puff", "HD/puff"], [10, "Glitter", "glitter"], [11, "Calidad exportación", "calidad exportación"]];
  const POSN = ["Frente", "Espalda", "Pecho izquierdo", "Manga izquierda", "Manga derecha", "Nuca", "Cuello / etiqueta", "Otra"];
  const UB_NAMES = ["Frente", "Pecho izquierdo", "Espalda", "Nuca", "Manga derecha", "Manga izquierda", "Full print", "Otra"];

  const CATS = [
    ["lp", "Lista de precios · playera cuello redondo", "LP"],
    ["g-basica", "Prendas · línea básica", "BAS"], ["g-clasica", "Prendas · línea clásica", "CLA"], ["g-premium", "Prendas · línea premium", "PRE"],
    ["ser", "Serigrafía", "SER"], ["bor", "Bordado", "BOR"], ["dtf", "DTF y DTG", "DTF"], ["sub", "Sublimación · Chilian Sport", "SUB"],
    ["eti", "Etiquetas y empaque", "ETI"], ["otr", "Servicios y cargos", "SRV"], ["apr", "Aprendidos de cotizaciones", "COT"]
  ];
  const catOf = Object.fromEntries(CATS.map((c) => [c[0], c]));
  const SERVICES = [
    ["srv-serigrafia", "ser", "Estampado serigrafía", "Cotizado por tintas, tamaño y efectos.", { hidden: true }],
    ["srv-seri-pos", "ser", "Serigrafía por posición", "Plastisol, una posición, sobre prenda del cliente."],
    ["srv-bordado", "bor", "Bordado por posición", "Bordado tamaño escudo, por pieza."],
    ["srv-bordado3d", "bor", "Bordado 3D", "Bordado con relieve, por pieza."],
    ["srv-ponchado", "bor", "Ponchado (digitalización del logotipo)", "Archivo de bordado del logotipo, pago único.", { nopcs: true, nodisc: true }],
    ["srv-dtf", "dtf", "Estampado DTF", "Transfer de película a todo color, por posición."],
    ["srv-dtg", "dtf", "Impresión DTG", "Impresión digital directa sobre la prenda."],
    ["srv-sub", "sub", "Prenda sublimada full print", "Sublimación de costura a costura, confección incluida."],
    ["srv-etiq-tej", "eti", "Etiqueta tejida de marca", "Etiqueta tejida cosida en cuello."],
    ["srv-etiq-imp", "eti", "Etiqueta impresa en cuello", "Impresión de etiqueta interior (talla, marca, composición)."],
    ["srv-tag", "eti", "Hang tag con colocación", "Tag impreso colocado con plastiflecha."],
    ["srv-polybag", "eti", "Empaque individual", "Doblado y bolsa individual con etiqueta de talla."],
    ["srv-pantalla", "otr", "Pantalla (por color)", "Grabado de pantalla, pago único por color.", { nopcs: true, nodisc: true }],
    ["srv-muestra", "otr", "Muestra física", "Muestra aprobada por el cliente antes de producir.", { nopcs: true, nodisc: true }],
    ["srv-envio", "otr", "Envío", "Paquetería o flete al destino.", { nopcs: true, nodisc: true, noexp: true }],
    ["libre", "otr", "Concepto libre", "", {}]
  ].map((a) => Object.assign({ key: a[0], cat: a[1], name: a[2], desc: a[3] }, a[4] || {}));

  const FLAGS = [
    ["aprobacion", "Arte aprobado antes de producir"], ["incMuestra", "Muestra física antes de producir"], ["tecnica", "Nota de técnica de serigrafía"],
    ["auditoria", "Planta auditada (FAMA, SMETA, WRAP…)"], ["incDiseno", "Diseño incluido"], ["incPonchado", "Ponchado incluido"],
    ["incEnvio", "Envío incluido"], ["fletes", "No incluye fletes foráneos"], ["existencias", "Venta en firme sobre existencias"]
  ];
  const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  window.CZ_DEFAULT_TABLE = DEFAULT_TABLE;

  window.makeCotizador = function (X) {
    const { h } = X;
    const n = (v) => { const x = parseFloat(String(v ?? "").replace(/[,$\s]/g, "")); return Number.isFinite(x) ? x : 0; };
    const r2 = (v) => Math.round(v * 100) / 100;
    const money = (v) => "$" + (v || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const int = (v) => Number(v || 0).toLocaleString("es-MX");
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    const longDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return `${d} de ${MES[m - 1]} de ${y}`; };
    const capDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return `${String(d).padStart(2, "0")} · ${MES[m - 1].toUpperCase()} · ${y}`; };
    const letter = (i) => String.fromCharCode(65 + i);
    const rid = () => Math.random().toString(36).slice(2, 10);
    const slug = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    const T = () => X.settings().tarifas;
    const ivaPct = () => (n(T().iva) || 16) / 100;
    const table = () => T().tablaTintas || DEFAULT_TABLE;
    const tiers = () => (T().descVol && T().descVol.length ? T().descVol : [[1, 0], [100, 0], [500, 3], [1000, 5], [5000, 8], [20000, 10]]);
    const volPct = (q) => { let p = 0; tiers().forEach(([m, pct]) => { if (q >= n(m)) p = n(pct); }); return p; };

    /* ---------- catalog ---------- */
    let GARMENTS = null, BYKEY = Object.fromEntries(SERVICES.map((s) => [s.key, s]));
    /* Lista de precios de Chilian (playera cuello redondo, /api/precios): precio por pieza antes de IVA por escala
       de 12, 50, 100, 300 y 1,000 pz. Con menos de 12 pz se usa la escala de 12. */
    let LTRAMOS = [12, 50, 100, 300, 1000];
    const lpTier = (q) => { let i = 0; LTRAMOS.forEach((m, j) => { if (q >= m) i = j; }); return i; };
    const listPrice = (it, q) => (it && it.lp ? n(it.lp.precios[lpTier(q)]) : 0);
    const loadLista = () => fetch("/api/precios").then((r) => r.json()).then((d) => {
      const P = d.precios || {}, seen = {};
      if (Array.isArray(P.listaTramos) && P.listaTramos.length) LTRAMOS = P.listaTramos;
      for (const r of P.lista || []) {
        let key = "lp:" + slug(`${r.codigo}-${r.color}-${r.tallas}-${r.genero}`);
        if (seen[key]) key += "-" + ++seen[key]; else seen[key] = 1;
        const lc = (t) => String(t || "").toLowerCase();
        BYKEY[key] = { key, cat: "lp", garment: true, kind: "playera", colors: [], catId: "", lp: r,
          name: `Playera ${r.marca} ${r.codigo} · ${lc(r.genero)} · ${lc(r.color)}${r.tallas ? " · " + r.tallas : ""}`,
          desc: [r.tela, r.tallas ? "tallas " + r.tallas : "", r.iva === "SIN IVA" ? "la lista dice SIN IVA" : ""].filter(Boolean).join(" · ") };
      }
    }).catch(() => {});
    const LISTA = () => Object.values(BYKEY).filter((x) => x.lp);
    function ready() {
      if (ready.p) return ready.p;
      ready.p = Promise.all([loadLista(), fetch("/catalogo/catalogo.json").then((r) => r.json()).then((d) => {
        GARMENTS = d.map((e) => ({
          key: "cat:" + e.id, cat: "g-" + (e.line || "basica"), garment: true, kind: e.kind, catId: e.id, catalog: e.cat, page: e.page, colors: e.colors || [],
          name: `${e.title} · ${e.cat}${e.models && e.models.length ? " " + e.models.slice(0, 3).join("/") : ""}`,
          desc: [e.comp, e.weight ? e.weight + " g/m²" : "", e.sizes ? "tallas " + e.sizes.trim() : ""].filter((x) => x && String(x).trim()).join(" · ")
        }));
        for (const g of GARMENTS) BYKEY[g.key] = g;
      }).catch(() => { GARMENTS = []; })]);
      return ready.p;
    }
    function itemOf(key, line) {
      if (BYKEY[key]) return BYKEY[key];
      if (String(key).startsWith("u:")) return { key, cat: "apr", name: (line && line.concepto) || key.slice(2), desc: (line && line.desc) || "", learned: true };
      return BYKEY.libre;
    }
    const clientOf = (q) => (q.cuentaId ? X.cuentaName(q.cuentaId) : (q.cliente || "").trim()) || "";

    // Everything the team has quoted: the memory behind the price references.
    function history(exceptId) {
      const out = [];
      for (const q of X.list("cotizaciones")) {
        if (q.id === exceptId) continue;
        const ts = Date.parse(q.updatedAt || q.createdAt || "") || 0, cl = clientOf(q), f = q.fecha || (q.createdAt || "").slice(0, 10);
        for (const l of q.lineas || []) {
          const key = l.key || (l.catId ? "cat:" + l.catId : "");
          const p = n(l.precio ?? l.precioManual);
          if (!key || key === "libre" || l.fromCalc || !(p > 0)) continue;
          out.push({ k: key, q: n(l.piezas), p, c: n(l.costo), cl, f, ts, n: l.concepto || l.descripcion || "", d: l.desc || "", fo: q.id, estado: q.estado });
        }
      }
      return out;
    }
    let H = [];
    const refsOf = (it) => H.filter((x) => x.k === it.key).map((x) => [x.q, x.p, `${x.cl || "Sin cliente"} · ${x.f ? x.f.slice(8, 10) + "/" + x.f.slice(5, 7) : ""}${x.estado === "aceptada" ? " · aceptada" : ""}`, x.ts, x.c]);
    const lastCost = (it) => { const r = H.filter((x) => x.k === it.key && x.c > 0).sort((a, b) => b.ts - a.ts)[0]; return r ? r.c : 0; };
    function suggest(it, qty) {
      const refs = refsOf(it).sort((a, b) => a[0] - b[0]);
      if (!refs.length) return null;
      let pick = refs[0];
      refs.forEach((r) => { if (qty >= r[0]) pick = r; });
      const same = refs.filter((r) => r[0] === pick[0]).sort((a, b) => b[3] - a[3]);
      return { p: same[0][1], ref: same[0] };
    }
    function learnedItems() {
      const seen = {};
      H.forEach((x) => { if (x.k.startsWith("u:")) seen[x.k] = x; });
      return Object.values(seen).map((x) => ({ key: x.k, cat: "apr", name: x.n || x.k.slice(2), desc: x.d, learned: true }));
    }
    const allItems = () => SERVICES.filter((s) => !s.hidden).concat(LISTA(), GARMENTS || [], learnedItems());
    function frequent(max) {
      const score = {}, now = Date.now();
      H.forEach((x) => { const age = (now - x.ts) / 864e5; score[x.k] = (score[x.k] || 0) + (age < 90 ? 3 : 2) + (x.estado === "aceptada" ? 2 : 0); });
      let list = Object.entries(score).sort((a, b) => b[1] - a[1]).map(([k]) => (BYKEY[k] || learnedItems().find((i) => i.key === k))).filter((it) => it && !it.hidden);
      if (list.length < max) {   // a new system starts from the usual suspects
        const base = ["cat:PLT-3", "cat:OPT-14", "srv-seri-pos", "srv-bordado", "srv-dtf", "srv-sub", "srv-etiq-imp", "srv-polybag", "srv-pantalla", "srv-envio"].map((k) => BYKEY[k]).filter(Boolean);
        for (const b of base) if (!list.includes(b)) list.push(b);
      }
      return list.slice(0, max);
    }

    function mkLine(key, qty, extra = {}) {
      const it = itemOf(key), rf = refsOf(it);
      const q = qty ?? (rf.length && rf[0][0] > 0 ? rf[0][0] : it.garment ? 100 : 1);
      const s = suggest(it, q), c = lastCost(it), lp = it.lp ? listPrice(it, q) : 0;
      return Object.assign({
        id: rid(), key, concepto: key === "libre" ? "" : it.name, desc: it.desc || "", piezas: String(q), precio: lp ? String(lp) : s ? String(s.p) : "", manual: false, ...(lp ? { auto: true } : {}),
        costo: c ? String(c) : "", factor: String(T().factor || 1.4), color: "", ubicaciones: [], catId: it.catId || "",
        nopcs: !!it.nopcs, nodisc: !!it.nodisc, noexp: !!it.noexp, fromCalc: false,
        ...(key === "srv-dtg" ? { ubicaciones: [{ nombre: "Frente", tecnica: "dtg", colores: 0, tintas: "" }] }
          : key === "srv-bordado" || key === "srv-bordado3d" ? { ubicaciones: [{ nombre: "Pecho izquierdo", tecnica: "bordado", puntadas: 8000, colores: 0, tintas: "" }] }
          : key === "srv-seri-pos" ? { ubicaciones: [{ nombre: "Frente", tecnica: "serigrafia", colores: 1, tintas: "" }] } : {})
      }, extra);
    }

    /* ---------- the document ---------- */
    function normalize(q) {
      const t = T();
      q.lineas = (q.lineas || []).map((l) => ({
        id: l.id || rid(), key: l.key || (l.catId ? "cat:" + l.catId : "libre"), concepto: l.concepto ?? l.descripcion ?? "",
        desc: l.desc ?? [l.modelo, l.color ? "Color " + l.color : ""].filter(Boolean).join(" · "), piezas: String(l.piezas ?? ""),
        precio: String(l.precio ?? l.precioManual ?? ""), manual: !!l.manual, costo: String(l.costo ?? l.costoPrenda ?? ""), factor: String(l.factor ?? t.factor ?? 1.4),
        color: l.color || "", ubicaciones: l.ubicaciones || [], catId: l.catId || "", nopcs: !!l.nopcs, nodisc: !!l.nodisc, noexp: !!l.noexp, fromCalc: !!l.fromCalc,
        ...(l.calc ? { calc: l.calc } : {}), ...(l.auto !== undefined ? { auto: !!l.auto } : {})
      }));
      const d = {
        fecha: (q.createdAt || "").slice(0, 10) || today(), titulo: "", subtitulo: "", tallas: "", intro: "", cliente: "",
        descMan: "", volOn: false, expressOn: false, expressPct: String(t.expressPct ?? 30), expressTxt: "1 semana", dm: "int",
        iva: q.sinIva ? "sin" : "mas", anticipo: String(t.anticipo ?? 50), formaPago: "", ent: "dias", dias: String(q.entregaDias || 15), fechaEnt: "",
        vigencia: String(t.vigencia ?? 15), escenarios: "", notas: "", cierre: "", opciones: false
      };
      for (const [k, v] of Object.entries(d)) if (q[k] === undefined || q[k] === null) q[k] = v;
      q.flags = Object.assign({ aprobacion: true, auditoria: true }, q.flags || {});
      return q;
    }
    function toDoc(q) {
      const doc = structuredClone(q);
      doc.lineas = doc.lineas.map((l) => (l.key === "libre" && String(l.concepto).trim() ? { ...l, key: "u:" + slug(l.concepto) } : l));
      const c = calc(doc);
      Object.assign(doc, { total: r2(c.total), subtotal: r2(c.base0), piezas: c.pcs, entregaDias: n(doc.dias) || doc.entregaDias || 15, sinIva: doc.iva === "sin" || doc.iva === "efe" });
      return doc;
    }

    function calc(q) {
      const md = Math.min(100, Math.max(0, n(q.descMan))) / 100, iv = ivaPct();
      const rows = (q.lineas || []).map((l, i) => {
        const qty = n(l.piezas), unit = n(l.precio);
        const vd = q.volOn && !l.nodisc ? volPct(qty) / 100 : 0;
        const dp = l.nodisc ? 0 : 1 - (1 - vd) * (1 - md);
        const gross = qty * unit, disc = gross * dp, net = gross - disc;
        const expr = q.expressOn && !l.noexp ? (net * n(q.expressPct)) / 100 : 0;
        return { l, i, qty, unit, dp, vd, gross, disc, net, expr, priced: String(l.precio).trim() !== "", unitNet: unit * (1 - dp) };
      });
      const pcs = rows.filter((x) => !x.l.nopcs).reduce((a, x) => a + x.qty, 0);
      const integ = q.dm === "int";
      const goods = rows.reduce((a, x) => a + (integ ? x.net : x.gross), 0);
      const disc = integ ? 0 : rows.reduce((a, x) => a + x.disc, 0);
      const expr = rows.reduce((a, x) => a + x.expr, 0);
      const ant = Math.min(100, Math.max(0, n(q.anticipo)));
      const taxed = (sub) => {
        if (q.iva === "mas") { const iva = sub * iv; return { base: sub, iva, total: sub + iva }; }
        if (q.iva === "incl") { const base = sub / (1 + iv); return { base, iva: sub - base, total: sub }; }
        return { base: sub, iva: 0, total: sub };
      };
      const sub = goods - disc + expr, t = taxed(sub);
      const opts = rows.map((x) => { const s = x.net + x.expr, tt = taxed(s); return { x, sub: s, ...tt, antAmt: (tt.total * ant) / 100, rest: tt.total - (tt.total * ant) / 100 }; });
      const cost = rows.reduce((a, x) => a + n(x.l.costo) * x.qty, 0);
      const base0 = q.iva === "incl" ? t.base : sub;
      return { rows, pcs, goods, disc, expr, sub, ...t, ant, antAmt: (t.total * ant) / 100, rest: t.total - (t.total * ant) / 100, opts, cost, hasCost: rows.some((x) => n(x.l.costo) > 0), base0,
        margen: rows.some((x) => n(x.l.costo) > 0) && base0 > 0 ? (base0 - cost) / base0 : null };
    }
    const scenarios = (q) => String(q.escenarios || "").split(/[,;\s]+/).map(n).filter((x) => x > 0).slice(0, 4);

    function entregaTxt(q) {
      if (q.ent === "no") return "";
      if (q.ent === "conf") return "Por confirmar";
      if (q.ent === "fecha") return q.fechaEnt ? longDate(q.fechaEnt) : "Por confirmar";
      const d = String(q.dias || "").trim();
      return d ? `${d} días hábiles a partir del anticipo y el arte aprobado` : "Por confirmar";
    }
    function entregaCorta(q) {
      if (q.expressOn && q.expressTxt) return q.expressTxt + " (express)";
      if (q.ent === "dias" && String(q.dias || "").trim()) return q.dias + " días hábiles";
      if (q.ent === "fecha" && q.fechaEnt) { const [y, m, d] = q.fechaEnt.split("-").map(Number); return `${d} ${MES[m - 1].slice(0, 3)} ${y}`; }
      return "";
    }
    const ivaNote = (q) => ({ mas: `Precios más IVA (${n(T().iva) || 16} %) en pesos mexicanos (MXN)`, incl: "Precios con IVA incluido, en pesos mexicanos (MXN)", sin: "Precios sin IVA, en pesos mexicanos (MXN)",
      efe: `Pago en efectivo sin factura. Si requieres factura se agrega el IVA (${n(T().iva) || 16} %)` }[q.iva]);
    const payTxt = (t) => (t.ant >= 100 ? "100 % de anticipo para iniciar producción" : t.ant <= 0 ? "Pago contra entrega" : `${t.ant} % de anticipo para iniciar producción · ${100 - t.ant} % contra entrega`);
    function introTxt(q, t) {
      if (String(q.intro || "").trim()) return q.intro.trim();
      if (!t.rows.length) return "";
      if (q.opciones) return `Se presentan ${t.rows.length} opciones para tu pedido. Cada una muestra su inversión y su esquema de pago; eliges una para la producción.`;
      const list = t.rows.filter((x) => !x.l.nopcs).map((x) => `${int(x.qty)} ${(x.l.concepto || "").split(" · ")[0].toLowerCase()}`);
      return `Cotización para la fabricación de ${list.length ? list.join(", ").replace(/, ([^,]*)$/, " y $1") : "los conceptos siguientes"}, conforme al arte aprobado por el cliente.`;
    }
    function condiciones(q, t) {
      const rows = [], f = q.flags;
      const qty = t.rows.filter((x) => !x.l.nopcs).map((x) => `${int(x.qty)} ${(x.l.concepto || "").split(" · ")[0].toLowerCase()}`);
      if (qty.length && q.opciones) rows.push(["Cantidad", qty.join(" · ") + " (según la opción elegida)"]);
      if (String(q.tallas || "").trim()) rows.push(["Tallas", q.tallas.trim()]);
      rows.push(["Precios", ivaNote(q)]);
      rows.push(["Condiciones de pago", payTxt(t) + (String(q.formaPago || "").trim() ? " · " + q.formaPago.trim() : "")]);
      const e = entregaTxt(q);
      if (q.expressOn) rows.push(["Tiempo de entrega", `Express: ${q.expressTxt || "por confirmar"}${e ? " · Normal: " + e : ""}`]);
      else if (e) rows.push(["Tiempo de entrega", e]);
      if (n(q.vigencia) > 0) rows.push(["Vigencia", `${n(q.vigencia)} días naturales`]);
      if (q.opciones) rows.push(["Elección", "Una opción para toda la producción"]);
      const inc = [];
      if (f.incDiseno) inc.push("diseño"); if (f.incPonchado) inc.push("ponchado"); if (f.incEnvio) inc.push("envío");
      if (inc.length) rows.push(["Incluye", inc.join(", ").replace(/^./, (c) => c.toUpperCase()).replace(/, ([^,]*)$/, " y $1")]);
      if (f.tecnica) rows.push(["Técnica", "Plastisol con base en prenda de color. En prenda 100 % algodón puede cambiarse a base agua, soft hand o descarga al mismo precio"]);
      if (f.incMuestra) rows.push(["Muestra", "Muestra física aprobada por el cliente antes de producir"]);
      if (f.aprobacion) rows.push(["Aprobación", "Arte y prueba de color confirmados por el cliente antes de producir"]);
      if (f.existencias) rows.push(["Venta", "En firme sobre existencias disponibles"]);
      if (f.fletes) rows.push(["No incluye", "Fletes foráneos y maniobras especiales (se cotizan según destino)"]);
      if (f.auditoria) rows.push(["Planta", "Auditada por Disney FAMA, SMETA, Walmart, WRAP, VF y C&A"]);
      if (q.iva === "mas" || q.iva === "incl") rows.push(["Facturación", "Enviar comprobante de pago, constancia de situación fiscal y uso de CFDI"]);
      return rows;
    }
    function autoTitle(q) {
      const L = q.lineas.filter((l) => !l.nopcs && String(l.concepto || "").trim());
      if (!L.length) return { t: "Cotización", s: "" };
      const short = (c) => String(c).split(" · ")[0].split(",")[0].trim();
      const low = (x) => x.charAt(0).toLowerCase() + x.slice(1);
      const uniq = (a) => a.filter((x, i) => x && a.indexOf(x) === i);
      const shorts = uniq(L.map((l) => short(l.concepto))), pcs = L.reduce((a, l) => a + n(l.piezas), 0);
      const opt = q.opciones ? L.length + " opciones" : "";
      if (shorts.length === 1) { const it = itemOf(L[0].key, L[0]); return { t: shorts[0], s: opt || int(pcs) + " piezas" + (it && catOf[it.cat] && !it.garment ? "" : "") }; }
      const both = shorts[0] + " y " + low(shorts[1]);
      if (shorts.length === 2 && both.length <= 62) return { t: both, s: opt || int(pcs) + " piezas" };
      const cl = clientOf(q);
      return { t: cl ? "Pedido " + cl : "Pedido mixto", s: opt || `${shorts.length} productos · ${int(pcs)} piezas` };
    }
    const titleOf = (q) => String(q.titulo || "").trim() || autoTitle(q).t;
    const subtitleOf = (q) => (String(q.titulo || "").trim() ? String(q.subtitulo || "").trim() : String(q.subtitulo || "").trim() || autoTitle(q).s);
    const closingTitle = (q) => { const c = clientOf(q), first = c ? c.split(" ")[0] : ""; return String(q.cierre || "").trim() || `Quedo atento a tu confirmación${first ? ", " + first : ""}.`; };
    const closingText = (q, t) => (q.opciones ? "Con la opción elegida y el anticipo cubierto, apartamos capacidad en planta y arrancamos la producción." : `Con el arte aprobado y el anticipo cubierto, apartamos capacidad en planta y arrancamos la producción${t.pcs ? " de las " + int(t.pcs) + " piezas." : "."}`);

    /* ---------- the sheet the client receives ---------- */
    function sheet(q) {
      const t = calc(q), integ = q.dm === "int", cl = clientOf(q) || "A quien corresponda";
      const td = (cls, text) => h("td", { class: cls || null, text });
      const tableOf = (heads, rows) => h("div", { class: "tbox" }, h("table", { class: "data" }, h("tr", {}, heads.map(([x, c]) => h("th", { class: c || null, scope: "col", text: x }))), rows));
      const sec = (label, sub, ...kids) => h("div", {}, h("div", { class: "sl" }, label + " ", sub ? h("span", { text: sub }) : null), ...kids);
      const meta = [["Cliente", cl], ["Cantidad", t.pcs ? int(t.pcs) + " piezas" : "—"], ["Anticipo", t.ant + " %"],
        q.opciones ? ["Opciones", String(t.rows.length)] : entregaCorta(q) && q.iva !== "mas" ? ["Entrega", entregaCorta(q)] : ["Total", money(t.total)]];
      const st = subtitleOf(q);
      const invRows = t.rows.length ? t.rows.map((x, i) => h("tr", {}, h("td", { class: "l" }, h("div", { class: "c", text: (q.opciones ? letter(i) + " · " : "") + (x.l.concepto || "Concepto") }),
        x.l.desc || x.l.color ? h("div", { class: "d", text: [x.l.desc, x.l.color ? "Color: " + x.l.color : ""].filter(Boolean).join(" · ") }) : null),
        td(null, x.priced ? money(integ ? x.unitNet : x.unit) : "A cotizar"), td(null, int(x.qty)), td(null, x.priced ? money(integ ? x.net : x.gross) : "—")))
        : [h("tr", {}, h("td", { class: "empty", colspan: "4", text: "Sin conceptos todavía." }))];
      const trow = (k, v, cls) => h("tr", { class: cls }, h("td", { class: "l", colspan: "3", text: k }), td(null, v));
      const totals = [];
      if (!q.opciones && t.rows.length) {
        const showSub = (!integ && t.disc > 0) || t.expr > 0 || q.iva === "mas" || q.iva === "incl";
        if (showSub) totals.push(trow(q.iva === "incl" ? "Subtotal sin IVA" : "Subtotal", money(q.iva === "incl" ? t.base : t.goods), "sub"));
        if (!integ && t.disc > 0 && q.iva !== "incl") totals.push(trow("Descuento", "- " + money(t.disc), "sub"));
        if (t.expr > 0 && q.iva !== "incl") totals.push(trow(`Cargo express +${n(q.expressPct)} % (entrega ${q.expressTxt || "express"})`, money(t.expr), "sub"));
        if (q.iva === "mas" || q.iva === "incl") totals.push(trow(`IVA ${n(T().iva) || 16} %`, money(t.iva), "sub"));
        totals.push(h("tr", { class: "total" }, h("td", { class: "l", colspan: "2", text: "TOTAL" }), td(null, int(t.pcs)), td(null, money(t.total))));
      }
      const hasIva = q.iva === "mas" || q.iva === "incl";
      const optSec = q.opciones && t.rows.length ? sec("Inversión por opción", "/ " + (q.iva === "mas" ? "con IVA" : q.iva === "incl" ? "IVA incluido" : "sin IVA"),
        tableOf([["Opción", "l"], ["Subtotal"], ...(hasIva ? [["IVA"]] : []), ["Total"], ["Anticipo " + t.ant + " %"], ...(t.ant < 100 ? [["Saldo"]] : [])],
          t.opts.map((o, i) => h("tr", {}, td("l", letter(i) + " · " + (o.x.l.concepto || "Opción")), td(null, money(o.base)), hasIva ? td(null, money(o.iva)) : null, td(null, money(o.total)), td(null, money(o.antAmt)), t.ant < 100 ? td(null, money(o.rest)) : null)))) : null;
      const sc = scenarios(q);
      let scSec = null;
      if (sc.length && !q.opciones && t.rows.length) {
        const tot = sc.map(() => 0);
        const rows = t.rows.filter((x) => !x.l.nopcs).map((x) => h("tr", {}, td("l", x.l.concepto || "Concepto"), sc.map((qq, i) => { const v = x.unitNet * qq; tot[i] += v; return td(null, money(v)); })));
        scSec = sec("Inversión por volumen", `/ ${sc.length} escenarios · sin IVA`, tableOf([["Concepto", "l"], ...sc.map((qq) => [int(qq) + " pz"])], [...rows, h("tr", { class: "total" }, td("l", "TOTAL"), tot.map((v) => td(null, money(v))))]));
      }
      const pay = !q.opciones && t.rows.length ? sec("Esquema de pago", t.ant >= 100 ? "/ 100 % anticipo" : `/ ${t.ant} % anticipo · ${100 - t.ant} % contra entrega`,
        h("div", { class: "pay" }, h("div", {}, h("div", { class: "pk", text: "Anticipo " + t.ant + " %" }), h("div", { class: "pv", text: money(t.antAmt) }), h("div", { class: "pn", text: "Para iniciar producción." })),
          t.ant < 100 ? h("div", {}, h("div", { class: "pk", text: "Saldo " + (100 - t.ant) + " %" }), h("div", { class: "pv", text: money(t.rest) }), h("div", { class: "pn", text: "Contra entrega." }))
            : h("div", {}, h("div", { class: "pk", text: "Total" }), h("div", { class: "pv", text: money(t.total) }), h("div", { class: "pn", text: q.iva === "mas" ? "IVA incluido en el total." : ivaNote(q) + "." })))) : null;
      const me = X.me();
      return h("article", { class: "qsheet", "aria-label": "Vista previa de la cotización" },
        h("div", { class: "mh" },
          h("div", { class: "mh-row" }, h("div", { class: "mh-brand" }, h("img", { class: "mh-logo", src: "/logos/chilian-logo-header.png", alt: "" }), h("div", {}, h("div", { class: "mh-name", role: "img", "aria-label": "CHILIAN" }), h("div", { class: "mh-sub", text: "ESTAMPADOS • TEXTILES • PROMOCIONALES" }))),
            h("div", { class: "mh-doc" }, h("b", { text: "COTIZACIÓN" }), h("br"), "FOLIO " + (q.id || ""), h("br"), capDate(q.fecha))),
          h("div", { class: "mh-title" }, titleOf(q), st ? h("span", { text: " / " + st }) : null),
          h("div", { class: "mh-meta" }, meta.map(([k, v]) => h("div", {}, h("span", { class: "mk", text: k }), h("span", { class: "mv", text: v }))))),
        h("div", { class: "sb" },
          introTxt(q, t) ? h("p", { class: "intro", text: introTxt(q, t) }) : null,
          sec("Inversión", "/ precios en MXN", tableOf([["Concepto", "l"], ["Unitario"], ["Cantidad"], ["Importe"]], [...invRows, ...totals])),
          optSec, scSec, pay,
          sec("Condiciones comerciales", null, h("table", { class: "cond" }, condiciones(q, t).map(([k, v]) => h("tr", {}, h("td", { class: "k", text: k }), h("td", { class: "v", text: v }))))),
          String(q.notas || "").trim() ? sec("Notas", null, h("p", { class: "intro", text: q.notas.trim() })) : null,
          h("div", { class: "closing" }, h("div", { class: "ct", text: closingTitle(q) }), h("div", { class: "cc", text: closingText(q, t) }),
            h("div", { class: "co", text: `${me ? me.toUpperCase() + " · " : ""}GRUPO CHILIAN · SANTA ISABEL CHOLULA, PUEBLA · WHATSAPP 222 692 5404 · GRUPOCHILIAN.COM.MX` })),
          h("div", { class: "foot" }, h("span", { text: "CHILIAN SCREEN PRINTING · PLANTA AUDITADA" }), h("span", { text: "Cotización " + (q.id || "") }))));
    }

    function asText(q) {
      const t = calc(q), integ = q.dm === "int", o = [];
      o.push(`COTIZACIÓN ${q.id || ""} · ${longDate(q.fecha)}`, "Chilian Screen Printing · Grupo Chilian", "Cliente: " + (clientOf(q) || "A quien corresponda"), "");
      t.rows.forEach((x, i) => o.push(`• ${q.opciones ? "Opción " + letter(i) + ": " : ""}${x.l.concepto || "Concepto"}${x.l.color ? " (" + x.l.color + ")" : ""} · ${int(x.qty)} pz × ${money(integ ? x.unitNet : x.unit)} = ${money(integ ? x.net : x.gross)}`));
      o.push("");
      if (q.opciones) t.opts.forEach((x, i) => o.push(`Opción ${letter(i)}: total ${money(x.total)} · anticipo ${t.ant} % ${money(x.antAmt)}`));
      else {
        if (!integ && t.disc > 0) o.push("Descuento: -" + money(t.disc));
        if (t.expr > 0) o.push(`Cargo express +${n(q.expressPct)} %: ${money(t.expr)}`);
        if (q.iva === "mas") { o.push("Subtotal: " + money(t.sub)); o.push(`IVA ${n(T().iva) || 16} %: ${money(t.iva)}`); }
        o.push("Total: " + money(t.total) + ({ incl: " (IVA incluido)", sin: " (sin IVA)", efe: " (efectivo, sin factura)" }[q.iva] || ""));
        o.push(t.ant >= 100 ? `Pago: 100 % de anticipo (${money(t.antAmt)})` : `Pago: ${t.ant} % de anticipo (${money(t.antAmt)}) y ${100 - t.ant} % contra entrega (${money(t.rest)})`);
      }
      const e = q.expressOn ? "Express: " + (q.expressTxt || "") : entregaTxt(q);
      if (e) o.push("Entrega: " + e);
      if (String(q.tallas || "").trim()) o.push("Tallas: " + q.tallas.trim());
      if (n(q.vigencia) > 0) o.push(`Vigencia: ${n(q.vigencia)} días`);
      if (String(q.notas || "").trim()) o.push("", q.notas.trim());
      o.push("", `${X.me() || "Grupo Chilian"} · WhatsApp 222 692 5404`);
      return o.join("\n");
    }

    function printSheet(q) {
      const box = document.getElementById("print");
      box.replaceChildren(sheet(normalize(structuredClone(q))));
      box.classList.add("print-sheet");
      const old = document.title; document.title = `Cotización ${q.id || ""} ${clientOf(q)}`.trim();
      setTimeout(() => { print(); document.title = old; box.classList.remove("print-sheet"); }, 60);
    }

    /* ---------- ink calculator state (per person, this browser) ---------- */
    const TQK = "chilian-os-tintas-v2";   // v2: the LN1 table is the price list (margin 0), older saved sessions are dropped
    const loadTQ = () => { try { const v = JSON.parse(localStorage.getItem(TQK) || "null"); if (v && Array.isArray(v.pos)) return v; } catch {} return null; };
    let TQ = loadTQ() || { mkP: String(T().margenEstampado ?? 0), mkG: String(T().margenPrenda ?? 20), qty: "500", tec: "Plastisol", prenda: "color", fleece: false, garment: "", gcost: "", screens: false,
      pos: [{ name: "Frente", size: 300, ink: 1, n: 2, fx: [], w: "", hh: "" }, { name: "Espalda", size: 600, ink: 1, n: 2, fx: [], w: "", hh: "" }] };
    for (const p of TQ.pos) if (!p.n) p.n = INK_MAX[p.ink] || 1;
    const saveTQ = () => { try { localStorage.setItem(TQK, JSON.stringify(TQ)); } catch {} };
    const tierIdx = (q) => { let i = 0; QT.forEach((m, j) => { if (q >= m) i = j; }); return i; };
    const sizeFor = (w, hh) => { const a = n(w) * n(hh); if (!(a > 0)) return null; const s = SIZES.find((x) => x[0] >= a); return { a, s: s ? s[0] : null }; };
    const sizeName = (cm) => { const s = SIZES.find((x) => x[0] === cm); return s ? `${s[1].toLowerCase()} (${int(cm)} cm²)` : int(cm) + " cm²"; };
    const inkN = (p) => Math.min(11, Math.max(1, Math.round(n(p.n)) || INK_MAX[p.ink] || 1));   // exact number of inks (older sessions only kept the bucket)
    const inkBucket = (k) => (k <= 1 ? 0 : k <= 3 ? 1 : k <= 5 ? 2 : k <= 7 ? 3 : k <= 9 ? 4 : 5);
    const chicaIdx = (q) => { let i = 0; CHICA_QT.forEach((m, j) => { if (q >= m) i = j; }); return i; };
    /* Price per piece of a screen-printing spec (the calculator's state, or the one saved on a quote line) at a quantity.
       Under 100 pz: the 6–99 pz table by exact inks; from 100 pz: LN1 by ink bucket. Garment color, fleece and effects come
       from LN1 (its first scale under 100 pz). A garment from the price list takes its price at that quantity. */
    function tqCalcOf(S, qtyIn) {
      const qty = Math.max(1, n(qtyIn ?? S.qty)), small = qty < 100, ti = tierIdx(qty), ci = chicaIdx(qty), adj = 1 + n(T().ajusteTabla) / 100, tb = table(), warn = [];
      const rows = S.pos.map((p) => {
        const r = (tb[p.size] || tb[String(p.size)])[ti].map((v) => v * adj), k = inkN(p), add = [];
        let base;
        if (small) {
          const t = CHICA[p.size >= 600 ? "grande" : "chico"][ci];
          base = (k <= 8 ? t[k - 1] : t[7] + (t[7] - t[6]) * (k - 8)) * adj;
          if (k > 8) warn.push(`${p.name}: la tabla de 6–99 pz llega a 8 tintas; ${k} tintas se estimaron con el mismo aumento por tinta.`);
          if (p.size > 1200) warn.push(`${p.name}: extra grande no viene en la tabla de 6–99 pz; se cotizó como grande (doble carta).`);
        } else base = r[inkBucket(k)];
        if (S.prenda === "color") add.push(["Prenda de color", r[6]]);
        if (S.fleece) add.push(["Fleece", r[9]]);
        (p.fx || []).forEach((i) => { const f = FX.find((x) => x[0] === i); if (f) add.push([f[1], r[i]]); });
        return { p, k, base, add, cost: base + add.reduce((a, x) => a + x[1], 0) };
      });
      if (qty < 6) warn.push("La tabla de serigrafía empieza en 6 pz: menos piezas se cotizan con la escala de 6.");
      const printCost = rows.reduce((a, x) => a + x.cost, 0), g = S.garment ? BYKEY[S.garment] : null;
      const gList = !!(g && g.lp && S.gAuto !== false), gcost = !S.garment ? 0 : gList ? listPrice(g, qty) : n(S.gcost);
      const sale = r2(printCost * (1 + n(S.mkP) / 100) + gcost * (1 + n(S.mkG) / 100));
      const screens = S.pos.reduce((a, p) => a + inkN(p) + (S.prenda === "color" ? 1 : 0), 0);
      return { qty, ti, tier: small ? CHICA_QT[ci] : QT[ti], small, rows, printCost, g, gList, gTier: gList ? LTRAMOS[lpTier(qty)] : 0, gcost, cost: printCost + gcost, sale, total: sale * qty, screens, warn };
    }
    const tqCalc = () => tqCalcOf(TQ);
    // What a line priced by scale costs at its quantity: a garment of the price list, or a calculator line (its spec is saved on the line)
    function autoPrice(l, it, qty) {
      if (l.calc) { const c = tqCalcOf(l.calc, qty); return { precio: c.sale, costo: r2(c.cost) }; }
      if (it && it.lp) return { precio: listPrice(it, qty) };
      return null;
    }
    const isAuto = (l, it) => !!(l.calc || (it && it.lp)) && l.auto !== false;
    // The prices of a line at each scale, to show them on the line
    function scaleOf(l, it) {
      if (l.calc) return [6, 12, 20, 30, 50, 100, 250, 500, 1000, 10000].map((q) => [q, tqCalcOf(l.calc, q).sale]);
      if (it && it.lp) return LTRAMOS.map((q, i) => [q, n(it.lp.precios[i])]);
      return null;
    }

    /* =========================== VIEW =========================== */
    function view(q0, ctx) {
      if (!GARMENTS) { ready().then(() => X.rerender()); return h("div", { class: "empty", text: "Cargando catálogo de Chilian…" }); }
      const q = normalize(structuredClone(q0));
      H = history(q.id);
      const cuenta = q.cuentaId ? X.byId("cuentas", q.cuentaId) : null, opp = q.oportunidadId ? X.byId("oportunidades", q.oportunidadId) : null;
      const contact = cuenta && ((cuenta.contactos || []).find((x) => X.isPhone(x.contacto)) || (cuenta.contactos || [])[0]);

      /* autosave: a second after the last change; saves run one after another */
      let timer = null, dirty = false, chain = Promise.resolve();
      const status = h("span", { class: "cz-status", text: "Todo guardado" });
      const flush = () => {
        clearTimeout(timer);
        if (!dirty) return chain;
        dirty = false; status.textContent = "Guardando…";
        chain = chain.then(async () => {
          try { const saved = await X.save("cotizaciones", toDoc(q), { quiet: true }); q.updatedAt = saved.updatedAt; q.id = saved.id; status.textContent = "Guardado " + new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); }
          catch (e) { status.textContent = "No se guardó"; }
        });
        return chain;
      };
      window.__czDirty = () => dirty;
      addEventListener("hashchange", () => flush(), { once: true });
      const touch = () => { dirty = true; status.textContent = "Cambios sin guardar…"; clearTimeout(timer); timer = setTimeout(flush, 1100); };

      const sheetBox = h("div", { class: "cz-sheet-box" }), internal = h("span", { class: "cz-internal" });
      function refresh() {
        sheetBox.replaceChildren(sheet(q));
        const t = calc(q);
        internal.textContent = t.hasCost && !q.opciones ? `Interno: costo ${money(t.cost)} · margen ${money(t.base0 - t.cost)}${t.base0 > 0 ? " (" + Math.round(((t.base0 - t.cost) / t.base0) * 100) + " %)" : ""}` : "";
        const at = autoTitle(q); tituloIn.placeholder = "Automático: " + at.t; subIn.placeholder = String(q.titulo || "").trim() ? "Opcional" : at.s ? "Automático: " + at.s : "Opcional";
        touch();
      }

      /* small builders */
      const field = (label, input, cls) => h("label", { class: "cz-f" + (cls ? " " + cls : "") }, h("span", { text: label }), input);
      const txt = (key, attrs = {}) => h("input", { class: "i", value: q[key] ?? "", ...attrs, oninput: (e) => { q[key] = e.target.value; refresh(); } });
      const num = (key, attrs = {}) => txt(key, { class: "i num", inputmode: "decimal", ...attrs });
      const seg = (label, key, options, after) => h("div", { class: "cz-segrow" }, h("span", { text: label }),
        h("div", { class: "cz-seg", role: "group", "aria-label": label }, options.map(([v, t]) => h("button", { type: "button", "aria-pressed": String(String(q[key]) === String(v)),
          onclick: (e) => { q[key] = v; e.currentTarget.parentNode.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === e.currentTarget))); after && after(); refresh(); } }, t))));
      const check = (label, get, set) => h("label", { class: "cz-check" }, h("input", { type: "checkbox", checked: get(), onchange: (e) => { set(e.target.checked); refresh(); } }), h("span", { text: label }));

      /* --- header group: client, title, date --- */
      const cuentas = X.list("cuentas").sort((a, b) => a.nombre.localeCompare(b.nombre));
      const clientIn = h("input", { class: "i", list: "cz-clients", value: clientOf(q), placeholder: "A quien corresponda", oninput: (e) => {
        const v = e.target.value.trim(), c = cuentas.find((x) => x.nombre.toLowerCase() === v.toLowerCase());
        q.cuentaId = c ? c.id : ""; q.cliente = c ? "" : v; clientHint(); refresh();
      } });
      const tituloIn = txt("titulo"), subIn = txt("subtitulo");
      const hint = h("div", { class: "cz-clienthint full", hidden: true });
      function lastFor() {
        const mine = X.list("cotizaciones").filter((x) => x.id !== q.id && ((q.cuentaId && x.cuentaId === q.cuentaId) || (!q.cuentaId && q.cliente && (x.cliente || "").toLowerCase() === q.cliente.toLowerCase())));
        return mine.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0];
      }
      function clientHint() {
        const last = lastFor();
        if (!last) { hint.hidden = true; return; }
        const l = normalize(structuredClone(last)), iv = { mas: "más IVA", incl: "IVA incluido", sin: "sin IVA", efe: "efectivo sin factura" }[l.iva];
        hint.replaceChildren(h("span", { text: `Última vez (${last.id}): anticipo ${l.anticipo} %, ${iv}${l.ent === "dias" && l.dias ? ", " + l.dias + " días hábiles" : ""}${l.formaPago ? ", " + l.formaPago : ""}.` }),
          h("button", { type: "button", class: "btn sm", onclick: () => {
            for (const k of ["iva", "dm", "ent", "anticipo", "dias", "formaPago", "expressPct", "vigencia"]) q[k] = l[k];
            q.flags = { ...l.flags }; dirty = true; flush().then(() => X.rerender()); } }, "Usar sus condiciones"));
        hint.hidden = false;
      }
      clientHint();
      const gHead = h("section", { class: "cz-group" }, h("h2", { text: "Cotización" }),
        h("div", { class: "cz-fields" },
          field("Cliente", clientIn), h("datalist", { id: "cz-clients" }, cuentas.map((c) => h("option", { value: c.nombre }))),
          field("Fecha", txt("fecha", { type: "date" })),
          field("Título (se arma solo; escribe para cambiarlo)", tituloIn), field("Subtítulo", subIn),
          field("Tallas / distribución", txt("tallas", { placeholder: "Ej. S–XL, distribución a confirmar" })), field("Vigencia (días)", num("vigencia")),
          hint,
          field("Introducción (opcional)", h("textarea", { class: "i", placeholder: "Si la dejas vacía se escribe sola a partir de los conceptos.", value: q.intro, oninput: (e) => { q.intro = e.target.value; refresh(); } }), "full")));

      /* --- lines --- */
      const linesBox = h("div", { class: "cz-lines" });
      const freqBox = h("div", { class: "cz-freq" });
      const search = h("input", { class: "i", placeholder: "Buscar en el catálogo de Chilian: playera, polo, sudadera, bordado, etiqueta…", "aria-label": "Buscar producto" });
      const addSel = h("select", { class: "i", "aria-label": "Producto para agregar" });
      function fillAdd() {
        const qq = search.value.trim().toLowerCase(), keep = addSel.value;
        addSel.replaceChildren();
        for (const c of CATS) {
          const items = allItems().filter((p) => p.cat === c[0] && (!qq || `${p.name} ${p.desc} ${c[1]} ${p.kind || ""} ${p.catId || ""}`.toLowerCase().includes(qq)));
          if (!items.length) continue;
          addSel.append(h("optgroup", { label: c[1] }, items.map((p) => { const rf = refsOf(p); return h("option", { value: p.key, text: p.name + (rf.length ? " · desde " + money(Math.min(...rf.map((r) => r[1]))) : "") }); })));
        }
        if (!addSel.options.length) addSel.append(h("option", { value: "libre", text: "Sin resultados: agrega un concepto libre" }));
        if ([...addSel.options].some((o) => o.value === keep)) addSel.value = keep;
      }
      search.addEventListener("input", fillAdd);
      function addItem(k, qty, extra) {
        q.lineas.push(mkLine(k, qty, extra)); paintLines(); refresh();
        const last = linesBox.querySelector(".cz-line:last-child input.qty"); if (last) { last.focus(); last.select(); }
      }
      function paintFreq() {
        freqBox.replaceChildren(...frequent(10).map((it) => {
          const rf = refsOf(it).sort((a, b) => b[3] - a[3]);
          return h("button", { type: "button", "aria-label": "Agregar " + it.name, onclick: () => addItem(it.key) }, it.name.split(" · ")[0] + (it.catalog ? " · " + it.catalog : ""), rf.length ? h("b", { text: money(rf[0][1]) }) : null);
        }));
      }
      function paintLines() {
        if (!q.lineas.length) { linesBox.replaceChildren(h("p", { class: "hint", text: "Agrega un producto frecuente, búscalo en el catálogo o usa el cotizador por tintas de abajo." })); return; }
        linesBox.replaceChildren(...q.lineas.map((l, idx) => lineEl(l, idx)));
      }
      function lineEl(l, idx) {
        const it = itemOf(l.key, l);
        const refs = h("div", { class: "cz-refs full" });
        const priceIn = h("input", { class: "i num", inputmode: "decimal", placeholder: "A cotizar", value: l.precio, "aria-label": "Precio unitario" });
        const marginOut = h("span", { class: "cz-internal" });
        const paintRefs = () => {
          refs.replaceChildren();
          const RF = refsOf(it).sort((a, b) => a[0] - b[0] || b[3] - a[3]).slice(0, 10);
          const SC = scaleOf(l, it);
          if (SC) {
            const at = n(l.piezas), cur = SC.reduce((a, x, i) => (at >= x[0] ? i : a), 0);
            refs.append(h("span", { text: l.calc ? "Por escala:" : "Lista por escala:" }), ...SC.map((x, i) => h("button", { type: "button", class: i === cur && isAuto(l, it) ? "on" : "", title: "Usar " + int(x[0]) + " pz",
              onclick: () => { l.piezas = String(x[0]); qtyIn.value = l.piezas; l.auto = true; applyAuto(); paintRefs(); paintM(); refresh(); } }, `${int(x[0])} pz · ${money(x[1])}`)));
            if (!isAuto(l, it)) refs.append(h("button", { type: "button", onclick: () => { l.auto = true; applyAuto(); paintRefs(); paintM(); refresh(); } }, "Volver al precio por escala"));
          }
          if (RF.length) refs.append(h("span", { text: "Cotizado:" }), ...RF.map((r) => h("button", { type: "button", class: n(l.precio) === r[1] ? "on" : "", title: r[4] ? "Costo registrado: " + money(r[4]) : "",
            onclick: () => { l.precio = String(r[1]); l.manual = true; l.auto = false; priceIn.value = l.precio; paintRefs(); paintM(); refresh(); } }, `${r[0] > 0 ? int(r[0]) + " pz · " : ""}${money(r[1])} · ${r[2]}`)));
          else if (!l.fromCalc && !SC) refs.append(h("span", { text: it.garment ? "Sin precios previos de esta prenda: usa el costeo interno o escribe el precio." : "Sin precios previos: escribe el precio; la próxima vez aparecerá aquí." }));
          const vd = q.volOn && !l.nodisc ? volPct(n(l.piezas)) : 0;
          if (vd > 0) refs.append(h("span", { class: "flag", text: "Volumen: −" + vd + " %" }));
        };
        const paintM = () => { const c = n(l.costo), p = n(l.precio); marginOut.textContent = c > 0 && p > 0 ? `Margen ${Math.round(((p - c) / p) * 100)} % · ${money(p - c)}/pz` : ""; };
        priceIn.addEventListener("input", () => { l.precio = priceIn.value; l.manual = true; if (l.calc || it.lp) l.auto = false; paintRefs(); paintM(); refresh(); });
        const applyAuto = () => { const a = isAuto(l, it) && autoPrice(l, it, n(l.piezas)); if (!a) return false;
          l.precio = String(a.precio); priceIn.value = l.precio; if (a.costo !== undefined) { l.costo = String(a.costo); costIn.value = l.costo; } return true; };
        const qtyIn = h("input", { class: "i num qty", inputmode: "numeric", value: l.piezas, "aria-label": "Piezas", oninput: (e) => {
          l.piezas = e.target.value;
          if (!applyAuto() && !l.manual && !l.fromCalc) { const s = suggest(it, n(l.piezas)); if (s) { l.precio = String(s.p); priceIn.value = l.precio; } }
          paintRefs(); paintM(); refresh();
        } });
        const costIn = h("input", { class: "i num", inputmode: "decimal", value: l.costo, oninput: (e) => { l.costo = e.target.value; paintM(); refresh(); } });
        const factIn = h("input", { class: "i num", inputmode: "decimal", value: l.factor, oninput: (e) => { l.factor = e.target.value; touch(); } });
        // Production: print locations and colors, for press minutes and the work order.
        const ubBox = h("div", { class: "cz-ubs" });
        const ubSum = () => (l.ubicaciones || []).length ? l.ubicaciones.map((u) => `${u.nombre} ${({ dtg: "DTG", bordado: "bordado " + Math.round((+u.puntadas || 0) / 1000) + "k" })[u.tecnica] || (u.colores || 0) + "c"}`).join(", ") : "sin ubicaciones";
        const ubTitle = h("summary");
        const paintUb = () => {
          const m = X.lineMinutes ? X.lineMinutes(l) : null, cap = X.dayCapacity ? X.dayCapacity() : 0;
          ubTitle.textContent = `Impresión para planta (${ubSum()})`;
          ubBox.replaceChildren(...(l.ubicaciones || []).map((u, ui) => {
            const tec = u.tecnica || "serigrafia";
            return h("div", { class: "cz-ub", style: "grid-template-columns:minmax(0,1fr) 110px 96px 2.2rem" },
              h("select", { class: "i", "aria-label": "Ubicación", onchange: (e) => { u.nombre = e.target.value; paintUb(); touch(); } }, UB_NAMES.concat(UB_NAMES.includes(u.nombre) ? [] : [u.nombre]).map((x) => h("option", { value: x, text: x, selected: x === u.nombre }))),
              h("select", { class: "i", "aria-label": "Técnica", onchange: (e) => { u.tecnica = e.target.value; if (u.tecnica === "bordado" && !u.puntadas) u.puntadas = 8000; paintUb(); touch(); } }, [["serigrafia", "Serigrafía"], ["dtg", "DTG"], ["bordado", "Bordado"]].map(([v, t]) => h("option", { value: v, text: t, selected: tec === v }))),
              tec === "bordado" ? h("input", { class: "i num", type: "number", min: "500", step: "500", value: u.puntadas, "aria-label": "Puntadas", title: "Puntadas", oninput: (e) => { u.puntadas = +e.target.value || 0; touch(); } })
                : tec === "dtg" ? h("label", { class: "cz-check", style: "font-size:.78rem" }, h("input", { type: "checkbox", checked: !!u.oscura, onchange: (e) => { u.oscura = e.target.checked; paintUb(); touch(); } }), h("span", { text: "Oscura" }))
                  : h("input", { class: "i num", type: "number", min: "0", max: "14", value: u.colores, "aria-label": "Colores", title: "Colores", oninput: (e) => { u.colores = +e.target.value || 0; touch(); } }),
              h("button", { type: "button", class: "x", "aria-label": "Quitar ubicación", onclick: () => { l.ubicaciones.splice(ui, 1); paintUb(); touch(); } }, "×"));
          }),
          h("button", { type: "button", class: "btn sm ghost", onclick: () => { (l.ubicaciones ||= []).push({ nombre: "Frente", tecnica: "serigrafia", colores: 1, tintas: "" }); paintUb(); touch(); } }, "+ Ubicación"),
          m && cap ? h("p", { class: "hint", text: Object.entries(m).filter(([, v]) => v > 0).map(([k, v]) => `${({ serigrafia: "Pulpo", dtg: "DTG", bordado: "Bordadora" })[k]}: ${Math.round(v)} min (${(v / cap / Math.max(1, X.machinesOf(k).length)).toFixed(1)} días con ${X.machinesOf(k).length} máquina${X.machinesOf(k).length === 1 ? "" : "s"})`).join(" · ") || "Agrega colores, puntadas o DTG para calcular el tiempo de máquina." }) : null);
        };
        paintUb(); paintRefs(); paintM();
        return h("div", { class: "cz-line" },
          h("div", { class: "tag full", text: (q.opciones ? "Opción " + letter(idx) + " · " : "") + (catOf[it.cat] ? catOf[it.cat][1] : "Concepto") + (l.fromCalc ? " · cotizador por tintas" : "") }),
          h("label", { class: "cz-f" }, h("span", { text: "Concepto" }), h("input", { class: "i", value: l.concepto, oninput: (e) => { l.concepto = e.target.value; refresh(); } })),
          h("label", { class: "cz-f" }, h("span", { text: "Piezas" }), qtyIn),
          h("label", { class: "cz-f" }, h("span", { text: "Precio unitario" }), priceIn),
          h("button", { type: "button", class: "x del", "aria-label": "Quitar " + (l.concepto || "concepto"), onclick: () => { q.lineas = q.lineas.filter((x) => x !== l); paintLines(); refresh(); } }, "×"),
          h("label", { class: "cz-f full" }, h("span", { text: "Descripción para el cliente" }), h("input", { class: "i", value: l.desc, oninput: (e) => { l.desc = e.target.value; refresh(); } })),
          !l.nopcs ? h("label", { class: "cz-f" }, h("span", { text: "Color de la prenda" }), h("input", { class: "i", value: l.color, list: (it.colors || []).length ? "czc-" + l.id : null, placeholder: (it.colors || []).length ? it.colors.slice(0, 3).join(", ") + "…" : "Ej. negro, marino", oninput: (e) => { l.color = e.target.value; refresh(); } }),
            (it.colors || []).length ? h("datalist", { id: "czc-" + l.id }, it.colors.map((c) => h("option", { value: c }))) : null) : null,
          refs,
          h("details", { class: "cz-cost full" }, h("summary", { text: "Costeo interno (no sale en la hoja)" }),
            h("div", { class: "crow" }, field("Costo por pieza", costIn), field("Factor", factIn), marginOut,
              h("button", { type: "button", class: "btn sm", onclick: () => { if (n(l.costo) > 0) { l.precio = String(r2(n(l.costo) * (n(l.factor) || 1.4))); l.manual = true; priceIn.value = l.precio; paintRefs(); paintM(); refresh(); } } }, "Usar costo × factor"))),
          !l.nopcs ? h("details", { class: "cz-cost full", open: (l.ubicaciones || []).length ? null : null }, ubTitle,
            h("p", { class: "hint", text: "Ubicación, técnica y colores o puntadas: calculan el tiempo de pulpo, DTG o bordadora y pasan a la orden de trabajo. No salen en la hoja." }), ubBox) : null);
      }
      const gLines = h("section", { class: "cz-group" }, h("h2", { text: "Conceptos" }),
        h("div", { class: "cz-freqbox" }, h("div", { class: "cz-freqhead" }, h("span", { text: "Productos frecuentes" }), h("span", { class: "hint", text: H.length ? `Aprendido de ${new Set(H.map((x) => x.fo)).size} cotizaciones del equipo` : "Se ajustan solos con cada cotización guardada" })), freqBox),
        h("div", { class: "cz-add" }, search, addSel, h("button", { type: "button", class: "btn", onclick: () => addItem(addSel.value || "libre") }, "Agregar")),
        h("p", { class: "hint", text: "Cada producto trae los precios que el equipo ya cotizó. Al escribir la cantidad se sugiere el de volumen más cercano; toca una referencia para usarla o escribe tu precio." }),
        linesBox,
        h("div", { class: "row" }, check("Las líneas son opciones a elegir (no se suman)", () => q.opciones, (v) => { q.opciones = v; paintLines(); }),
          h("button", { type: "button", class: "btn sm ghost", onclick: () => document.getElementById("cz-tq").scrollIntoView({ behavior: "smooth", block: "start" }) }, "Cotizador por tintas ↓"),
          h("button", { type: "button", class: "btn sm ghost", onclick: () => document.getElementById("cz-db").scrollIntoView({ behavior: "smooth", block: "start" }) }, "Bordado y DTG ↓")));

      /* --- discounts, IVA, payment, delivery, conditions --- */
      const gDisc = h("section", { class: "cz-group" }, h("h2", { text: "Descuentos y cargos" }),
        h("div", { class: "cz-fields three" }, field("Descuento general (%)", num("descMan", { placeholder: "0" })), field("Cargo express (%)", num("expressPct")), field("Entrega express en", txt("expressTxt"))),
        h("div", { class: "cz-checks" }, check("Aplicar descuento por volumen", () => q.volOn, (v) => { q.volOn = v; paintLines(); }), check("Agregar cargo express desglosado", () => q.expressOn, (v) => { q.expressOn = v; })),
        seg("Cómo se ve el descuento en la hoja", "dm", [["int", "Ya incluido en el precio unitario"], ["des", "Renglón de descuento"]]),
        h("p", { class: "hint", text: "Escala por volumen: " + tiers().filter((x) => n(x[1]) > 0).map(([m, p]) => `${int(m)}+ pz −${p} %`).join(" · ") + ". Se edita en Ajustes." }));
      const antIn = num("anticipo", { inputmode: "numeric" });
      const gPay = h("section", { class: "cz-group" }, h("h2", { text: "IVA y pago" }),
        seg("IVA", "iva", [["mas", `Más IVA ${n(T().iva) || 16} %`], ["incl", "IVA incluido"], ["sin", "Sin IVA (exportación)"], ["efe", "Efectivo sin factura"]]),
        seg("Anticipo", "anticipo", [["50", "50 %"], ["60", "60 %"], ["70", "70 %"], ["100", "100 %"]], () => { antIn.value = q.anticipo; }),
        h("div", { class: "cz-fields" }, field("Anticipo exacto (%)", antIn), field("Forma de pago (opcional)", txt("formaPago", { placeholder: "Ej. transferencia SPEI" }))));
      const diasWrap = field("Días hábiles", txt("dias", { placeholder: "Ej. 15 o 12–15" })), fechaWrap = field("Fecha de entrega", txt("fechaEnt", { type: "date" }));
      const syncEnt = () => { diasWrap.hidden = q.ent !== "dias"; fechaWrap.hidden = q.ent !== "fecha"; };
      syncEnt();
      const gEnt = h("section", { class: "cz-group" }, h("h2", { text: "Entrega y condiciones" }),
        seg("Tiempo de entrega", "ent", [["dias", "Días hábiles"], ["fecha", "Fecha"], ["conf", "Por confirmar"], ["no", "No mostrar"]], syncEnt),
        h("div", { class: "cz-fields" }, diasWrap, fechaWrap),
        h("div", { class: "cz-checks" }, FLAGS.map(([k, label]) => check(label, () => !!q.flags[k], (v) => { q.flags[k] = v; }))),
        h("div", { class: "cz-fields" },
          field("Escenarios de cantidad (opcional)", txt("escenarios", { placeholder: "Ej. 1000, 3000, 5000" }), "full"),
          field("Notas para el cliente", h("textarea", { class: "i", value: q.notas, placeholder: "Ej. Distribución por talla a confirmar con la orden.", oninput: (e) => { q.notas = e.target.value; refresh(); } }), "full"),
          field("Mensaje de cierre", txt("cierre", { placeholder: closingTitle({ ...q, cierre: "" }) }), "full")));

      /* --- ink calculator --- */
      const tqBox = h("section", { class: "cz-tq", id: "cz-tq" });
      function paintTQ() {
        const res = h("div", { class: "cz-tq-res", "aria-live": "polite" });
        const garments = (GARMENTS || []);
        const gSel = h("select", { class: "i", onchange: (e) => { TQ.garment = e.target.value; const it = BYKEY[TQ.garment];
          if (it && it.lp) { TQ.gAuto = true; TQ.mkG = "0"; TQ.gcost = String(listPrice(it, n(TQ.qty)));
            const col = String(it.lp.color).toLowerCase(); if (/blanc/.test(col) && !/colo/.test(col)) TQ.prenda = "clara"; else if (/colo|jaspe|neon|graphite/.test(col) && !/blanc/.test(col)) TQ.prenda = "color"; } else { TQ.gAuto = false; TQ.gcost = it ? String(lastCost(it) || "") : ""; } paintTQ(); } },
          h("option", { value: "", text: "Ninguna (servicio sobre prenda del cliente)", selected: !TQ.garment }),
          h("optgroup", { label: catOf.lp[1] + " (precio por escala)" }, LISTA().map((g) => h("option", { value: g.key, text: g.name, selected: TQ.garment === g.key }))),
          ["g-basica", "g-clasica", "g-premium"].map((c) => h("optgroup", { label: catOf[c][1] }, garments.filter((g) => g.cat === c).map((g) => h("option", { value: g.key, text: g.name, selected: TQ.garment === g.key })))));
        const tqIn = (key, attrs = {}) => h("input", { class: "i num", inputmode: "decimal", value: TQ[key], ...attrs, oninput: (e) => { TQ[key] = e.target.value; paintRes(); } });
        const gcostIn = h("input", { class: "i num", inputmode: "decimal", value: TQ.gcost, "aria-label": "Precio de la prenda", oninput: (e) => { TQ.gcost = e.target.value; TQ.gAuto = false; paintRes(); } });
        const posBox = h("div", { class: "cz-tq-pos" }, TQ.pos.map((p, i) => {
          const note = h("div", { class: "note" });
          const paintNote = () => { const r = sizeFor(p.w, p.hh); note.className = "note";
            if (!r) note.textContent = "O escribe la medida del arte y se elige el tamaño que la cubre.";
            else if (!r.s) { note.className = "note warn"; note.textContent = `${int(Math.round(r.a))} cm² pasa del tamaño más grande (1,800 cm²). Cotízalo aparte.`; }
            else note.textContent = `${int(Math.round(r.a))} cm² → se cotiza como ${sizeName(r.s)}.`; };
          paintNote();
          const sizeBtns = SIZES.map((sv) => h("button", { type: "button", "aria-pressed": String(p.size === sv[0]), onclick: () => { p.size = sv[0]; p.w = ""; p.hh = ""; paintTQ(); } }, `${sv[1]} · ${int(sv[0])} cm²`, h("small", { text: sv[2] })));
          const dim = (label, key) => h("label", { class: "cz-f" }, h("span", { text: label }), h("input", { class: "i num", inputmode: "decimal", value: p[key], oninput: (e) => {
            p[key] = e.target.value; const r = sizeFor(p.w, p.hh); if (r && r.s) p.size = r.s;
            sizeBtns.forEach((b, j) => b.setAttribute("aria-pressed", String(SIZES[j][0] === p.size))); paintNote(); paintRes(); } }));
          return h("div", { class: "pos" },
            h("div", { class: "pos-top" }, h("label", { class: "cz-f" }, h("span", { text: "Posición " + (i + 1) }),
              h("select", { class: "i", onchange: (e) => { p.name = e.target.value; paintRes(); } }, POSN.map((x) => h("option", { value: x, text: x, selected: x === p.name })))),
              h("button", { type: "button", class: "x", disabled: TQ.pos.length < 2, "aria-label": "Quitar posición " + (i + 1), onclick: () => { TQ.pos.splice(i, 1); paintTQ(); } }, "×")),
            h("div", { class: "sub-k", text: "Tamaño" }), h("div", { class: "sizes", role: "group", "aria-label": "Tamaño" }, sizeBtns),
            h("div", { class: "dims" }, dim("Ancho (cm)", "w"), dim("Alto (cm)", "hh"), note),
            h("div", { class: "sub-k", text: "Número de tintas" }),
            h("div", { class: "inks", role: "group", "aria-label": "Número de tintas" }, Array.from({ length: 11 }, (_, j) => j + 1).map((k) => h("button", { type: "button", "aria-pressed": String(inkN(p) === k), onclick: () => { p.n = k; p.ink = inkBucket(k); paintTQ(); } }, String(k)))),
            h("div", { class: "sub-k", text: "Efectos" }),
            h("div", { class: "fx" }, FX.map((f) => h("label", { class: "cz-check" }, h("input", { type: "checkbox", checked: p.fx.includes(f[0]), onchange: (e) => { p.fx = e.target.checked ? p.fx.concat(f[0]) : p.fx.filter((x) => x !== f[0]); paintRes(); } }), h("span", { text: f[1] })))));
        }));
        function paintRes() {
          saveTQ();
          const c = tqCalc(), g = BYKEY[TQ.garment];
          if (c.gList) { TQ.gcost = String(c.gcost); if (document.activeElement !== gcostIn) gcostIn.value = TQ.gcost; }
          res.replaceChildren(...[
            h("div", { class: "cz-big" }, h("div", {}, h("div", { class: "k", text: "Precio de venta por pieza" }), h("div", { class: "v", text: money(c.sale) })), h("div", {}, h("div", { class: "k", text: `Total ${int(c.qty)} pz` }), h("div", { class: "v", text: money(c.total) }))),
            h("table", {}, h("tr", {}, h("th", { text: "Concepto" }), h("th", { class: "r", text: c.small ? "Tabla 6–99 pz" : "Tabla LN1" }), h("th", { class: "r", text: "Precio" })),
              c.rows.map((x) => h("tr", {}, h("td", {}, `${x.p.name} · ${sizeName(x.p.size)} · ${x.k} ${x.k === 1 ? "tinta" : "tintas"}`, h("div", { class: "muted", text: "Base " + money(x.base) + (x.add.length ? " + " + x.add.map((y) => y[0] + " " + money(y[1])).join(" + ") : "") })),
                h("td", { class: "r", text: money(x.cost) }), h("td", { class: "r", text: money(x.cost * (1 + n(TQ.mkP) / 100)) }))),
              g ? h("tr", {}, h("td", {}, "Prenda: " + g.name.split(" · ")[0], h("div", { class: "muted", text: (c.gList ? `Lista de precios, escala de ${int(c.gTier)} pz · ` : "") + `Margen prenda ${n(TQ.mkG)} %` })), h("td", { class: "r", text: money(c.gcost) }), h("td", { class: "r", text: money(c.gcost * (1 + n(TQ.mkG) / 100)) })) : null,
              h("tr", { class: "tot" }, h("td", { text: "Por pieza" }), h("td", { class: "r", text: money(c.cost) }), h("td", { class: "r", text: money(c.sale) }))),
            h("p", { class: "hint", text: `${c.small ? `Tabla de 6 a 99 pz, escala de ${int(c.tier)} pz (chico = escudo y media carta; grande = carta a doble carta). Prenda de color y efectos con la primera escala de LN1` : `Tabla LN1, escala de ${int(c.tier)} pz`}. Pantallas estimadas: ${c.screens}${TQ.prenda === "color" ? " (incluye la base blanca por posición)" : ""}. En la hoja sale el precio con el margen que pongas (0 % = el precio de la tabla).${TQ.tec !== "Plastisol" ? " " + TQ.tec + " aplica solo en prenda 100 % algodón." : ""}` }),
            ...c.warn.map((w) => h("p", { class: "hint warn", text: w })),
            g && !(c.gcost > 0) ? h("p", { class: "hint warn", text: "Escribe el costo de la prenda para sumarla al precio." }) : null,
            h("label", { class: "cz-check" }, h("input", { type: "checkbox", checked: !!TQ.screens, onchange: (e) => { TQ.screens = e.target.checked; saveTQ(); } }), h("span", { text: `Agregar las ${c.screens} pantallas como renglón aparte (${money(n(T().costoPantalla))} c/u)` })),
            h("button", { type: "button", class: "btn accent", style: "width:100%", onclick: () => {
              const names = c.rows.map((x) => x.p.name.toLowerCase()), nm = names.length > 1 ? names.slice(0, -1).join(", ") + " y " + names[names.length - 1] : names[0];
              const parts = c.rows.map((x) => `${x.p.name}: ${sizeName(x.p.size)}, ${x.k} ${x.k === 1 ? "tinta" : "tintas"}${x.p.fx.length ? ", " + x.p.fx.map((i) => FX.find((f) => f[0] === i)[2]).join(" y ") : ""}`);
              const desc = parts.join(" · ") + `. ${TQ.tec}${TQ.prenda === "color" ? " sobre prenda de color" : " sobre prenda clara"}${TQ.fleece ? ", prenda afelpada" : ""}.` + (g ? " " + g.desc : "");
              const line = mkLine(g ? g.key : "srv-serigrafia", c.qty, {
                concepto: g ? `${g.name.split(" · ")[0]} con serigrafía en ${nm}` : "Estampado serigrafía · " + nm, desc, precio: String(c.sale), manual: true, fromCalc: true,
                costo: String(r2(c.cost)), factor: String(r2(c.cost ? c.sale / c.cost : 1.4)), catId: g ? g.catId : "",
                calc: (({ pos, prenda, fleece, garment, gcost, gAuto, mkP, mkG, tec }) => structuredClone({ pos, prenda, fleece, garment, gcost, gAuto, mkP, mkG, tec }))(TQ), auto: true,   // the price follows the scale if the pieces change
                ubicaciones: c.rows.map((x) => ({ nombre: UB_NAMES.includes(x.p.name) ? x.p.name : x.p.name === "Cuello / etiqueta" ? "Nuca" : "Otra", tecnica: "serigrafia", colores: x.k + (TQ.prenda === "color" ? 1 : 0), tintas: "" }))
              });
              q.lineas.push(line);
              if (TQ.screens) q.lineas.push(mkLine("srv-pantalla", c.screens, { precio: String(n(T().costoPantalla)), manual: true, desc: `Grabado de ${c.screens} pantallas, pago único.` }));
              paintLines(); refresh(); X.toast(`Agregado: ${int(c.qty)} pz a ${money(c.sale)} por pieza.`);
              linesBox.scrollIntoView({ behavior: "smooth", block: "end" });
            } }, "Agregar a la cotización")].filter(Boolean));
        }
        tqBox.replaceChildren(
          h("div", { class: "cz-tq-head" }, h("div", {}, h("h2", { text: "Cotizador de serigrafía por tintas" }),
            h("p", { class: "hint", text: "Elige piezas, posiciones, tamaño, tintas y efectos, y si quieres la prenda. Estampado: de 6 a 99 pz con la tabla de Chilian por tintas; desde 100 pz con la tabla LN1. Prendas de la lista de precios: precio de su escala (12, 50, 100, 300, 1,000 pz). Todo cambia solo con las piezas, también en la cotización. Margen 0 % = precio de lista." })),
            h("div", { class: "cz-fields" }, field("Margen estampado (%)", tqIn("mkP")), field("Margen prenda (%)", tqIn("mkG")))),
          h("div", { class: "cz-tq-grid" },
            h("div", { class: "cz-tq-form" },
              h("div", { class: "cz-fields three" }, field("Piezas", tqIn("qty", { inputmode: "numeric" })),
                field("Técnica", h("select", { class: "i", onchange: (e) => { TQ.tec = e.target.value; paintRes(); } }, ["Plastisol", "Base agua", "Soft hand", "Descarga"].map((x) => h("option", { value: x, text: x === "Plastisol" ? x : x + " (100 % algodón)", selected: TQ.tec === x })))),
                field("Prenda", h("select", { class: "i", onchange: (e) => { TQ.prenda = e.target.value; paintRes(); } }, [["clara", "Clara (blanca o pastel)"], ["color", "De color u oscura"]].map(([v, t]) => h("option", { value: v, text: t, selected: TQ.prenda === v }))))),
              h("label", { class: "cz-check" }, h("input", { type: "checkbox", checked: TQ.fleece, onchange: (e) => { TQ.fleece = e.target.checked; paintRes(); } }), h("span", { text: "Prenda afelpada (fleece, sudadera o hoodie)" })),
              h("div", { class: "cz-fields" }, field("Prenda del catálogo (opcional)", gSel, "full"), TQ.garment ? field(BYKEY[TQ.garment]?.lp && TQ.gAuto !== false ? "Precio de lista por pieza (cambia con las piezas)" : "Costo de la prenda por pieza (MXN)", gcostIn) : null),
              posBox,
              h("button", { type: "button", class: "btn ghost", onclick: () => { const used = TQ.pos.map((p) => p.name); TQ.pos.push({ name: POSN.find((x) => !used.includes(x)) || "Otra", size: 100, ink: 0, n: 1, fx: [], w: "", hh: "" }); paintTQ(); } }, "+ Posición")),
            res));
        paintRes();
      }

      /* --- top actions --- */
      const sendText = () => asText(q);
      const actions = [
        status,
        h("button", { class: "btn ghost", type: "button", onclick: () => X.copy(sendText()) }, "Copiar texto"),
        X.isPhone(contact && contact.contacto) ? h("a", { class: "btn ghost", href: X.waLink(contact.contacto, sendText()), target: "_blank", rel: "noopener" }, "WhatsApp") : null,
        h("button", { class: "btn ghost", type: "button", onclick: async () => { await flush(); printSheet(q); } }, "PDF"),
        X.onPayLink && q.estado !== "pre" ? h("button", { class: "btn ghost", type: "button", onclick: async () => { await flush(); X.onPayLink(byIdFresh()); } }, "Link de pago") : null,
        q.estado !== "aceptada" ? h("button", { class: "btn", type: "button", onclick: async () => { await flush(); await X.onSent(byIdFresh()); } }, q.estado === "enviada" ? "Enviada ✓" : "Marcar enviada") : null,
        q.estado !== "aceptada" ? h("button", { class: "btn accent", type: "button", onclick: async () => { await flush(); await X.onAccept(byIdFresh()); } }, "Aceptada → crear OT")
          : q.otId ? h("a", { class: "btn accent", href: "#ot/" + q.otId }, "Ver " + q.otId) : null
      ];
      const byIdFresh = () => X.byId("cotizaciones", q.id) || toDoc(q);

      /* --- embroidery and DTG calculator --- */
      const DBK = "chilian-os-bordado-dtg-v1";
      let DB = (() => { try { const v = JSON.parse(localStorage.getItem(DBK) || "null"); if (v && v.pos) return v; } catch {} return null; })()
        || { tec: "bordado", qty: "100", garment: "", gcost: "", mkG: String(T().margenPrenda ?? 20), ponchado: true, oscura: false, pos: [{ name: "Pecho izquierdo", puntadas: 8000, size: 300 }] };
      const saveDB = () => { try { localStorage.setItem(DBK, JSON.stringify(DB)); } catch {} };
      const dbBox = h("section", { class: "cz-tq", id: "cz-db" });
      const DTG_SIZES = [[100, "Escudo"], [300, "Media carta"], [600, "Carta"], [1200, "Doble carta"]];
      function dbCalc() {
        const t = T(), qty = Math.max(1, n(DB.qty)), bord = DB.tec === "bordado";
        const rows = DB.pos.map((p) => {
          const cost = bord ? (n(p.puntadas) / 1000) * n(t.costoMilPuntadas) : n((t.dtgCostos || {})[p.size]) + (DB.oscura ? n(t.dtgOscura) : 0);
          return { p, cost, sale: cost * (1 + n(bord ? t.margenBordado : t.margenDTG) / 100) };
        });
        const g = BYKEY[DB.garment], gList = !!(g && g.lp && DB.gAuto !== false), gcost = !g ? 0 : gList ? listPrice(g, qty) : n(DB.gcost);
        if (gList) DB.gcost = String(gcost);
        const sale = r2(rows.reduce((a, x) => a + x.sale, 0) + gcost * (1 + n(DB.mkG) / 100));
        const line = { piezas: qty, ubicaciones: DB.pos.map((p) => bord ? { nombre: p.name, tecnica: "bordado", puntadas: n(p.puntadas), colores: 0 } : { nombre: p.name, tecnica: "dtg", oscura: !!DB.oscura, colores: 0 }) };
        const mins = X.lineMinutes ? X.lineMinutes(line)[DB.tec] : 0, machines = X.machinesOf ? X.machinesOf(DB.tec).length : 1, cap = X.dayCapacity ? X.dayCapacity() : 459;
        return { qty, bord, rows, g, gcost, cost: rows.reduce((a, x) => a + x.cost, 0) + gcost, sale, total: sale * qty, mins, machines, days: mins / cap / Math.max(1, machines), line };
      }
      function paintDB() {
        saveDB();
        const c = dbCalc(), t = T();
        const res = h("div", { class: "cz-tq-res", "aria-live": "polite" },
          h("div", { class: "cz-big" }, h("div", {}, h("div", { class: "k", text: "Precio de venta por pieza" }), h("div", { class: "v", text: money(c.sale) })),
            h("div", {}, h("div", { class: "k", text: `Tiempo de ${c.bord ? "bordadora" : "DTG"}` }), h("div", { class: "v", text: `${c.days.toFixed(1)} días` }))),
          h("p", { class: "hint", text: c.bord
            ? `${Math.round(c.mins)} min en ${c.machines} bordadora(s): ${Math.ceil(c.qty / Math.max(1, ...((X.machinesOf && X.machinesOf("bordado")) || [{ cabezas: 6 }]).map((m) => +m.cabezas || 6)))} ciclos a ${t.rpmBordado} puntadas/min, ${t.efBordado} % de eficiencia.`
            : `${Math.round(c.mins)} min repartidos en ${c.machines} DTG (una pieza a la vez, ${DB.oscura ? t.minDTGOscura + " min con pretratado" : t.minDTG + " min"} por pieza y posición). Sin pantallas: conviene desde 1 pieza y en tirajes cortos a todo color.` }),
          h("table", {}, h("tr", {}, h("th", { text: "Concepto" }), h("th", { class: "r", text: "Costo" }), h("th", { class: "r", text: "Venta" })),
            c.rows.map((x) => h("tr", {}, h("td", { text: c.bord ? `${x.p.name} · ${int(x.p.puntadas)} puntadas` : `${x.p.name} · ${(DTG_SIZES.find((z) => z[0] === +x.p.size) || [0, ""])[1]}${DB.oscura ? " · oscura" : ""}` }), h("td", { class: "r", text: money(x.cost) }), h("td", { class: "r", text: money(x.sale) }))),
            c.g ? h("tr", {}, h("td", { text: "Prenda: " + c.g.name.split(" · ")[0] }), h("td", { class: "r", text: money(c.gcost) }), h("td", { class: "r", text: money(c.gcost * (1 + n(DB.mkG) / 100)) })) : null,
            h("tr", { class: "tot" }, h("td", { text: "Por pieza" }), h("td", { class: "r", text: money(c.cost) }), h("td", { class: "r", text: money(c.sale) }))),
          t.ejemploDB !== false ? h("p", { class: "hint warn", text: "Costos de ejemplo: ajústalos en Ajustes → DTG y bordado." }) : null,
          c.bord ? h("label", { class: "cz-check" }, h("input", { type: "checkbox", checked: !!DB.ponchado, onchange: (e) => { DB.ponchado = e.target.checked; saveDB(); } }), h("span", { text: `Agregar ponchado (${DB.pos.length} diseño(s) × ${money(n(t.costoPonchado))})` })) : null,
          h("button", { type: "button", class: "btn accent", style: "width:100%", onclick: () => {
            const names = DB.pos.map((p) => p.name.toLowerCase()), nm = names.length > 1 ? names.slice(0, -1).join(", ") + " y " + names[names.length - 1] : names[0], tecN = c.bord ? "bordado" : "DTG";
            const desc = c.bord ? DB.pos.map((p) => `${p.name}: ${int(p.puntadas)} puntadas`).join(" · ") + ". Bordado en máquina de 6 cabezas." : DB.pos.map((p) => `${p.name}: ${(DTG_SIZES.find((z) => z[0] === +p.size) || [0, ""])[1].toLowerCase()}`).join(" · ") + `. Impresión DTG a todo color${DB.oscura ? " sobre prenda oscura (con pretratado)" : ""}.`;
            q.lineas.push(mkLine(c.g ? c.g.key : c.bord ? "srv-bordado" : "srv-dtg", c.qty, { concepto: c.g ? `${c.g.name.split(" · ")[0]} con ${tecN} en ${nm}` : `${c.bord ? "Bordado" : "Impresión DTG"} · ${nm}`, desc: desc + (c.g ? " " + c.g.desc : ""),
              precio: String(c.sale), manual: true, fromCalc: true, costo: String(r2(c.cost)), factor: String(r2(c.cost ? c.sale / c.cost : 1.4)), catId: c.g ? c.g.catId : "", ubicaciones: c.line.ubicaciones }));
            if (c.bord && DB.ponchado) q.lineas.push(mkLine("srv-ponchado", DB.pos.length, { precio: String(n(t.costoPonchado)), manual: true }));
            paintLines(); refresh(); X.toast(`Agregado: ${int(c.qty)} pz a ${money(c.sale)} por pieza.`); linesBox.scrollIntoView({ behavior: "smooth", block: "end" });
          } }, "Agregar a la cotización"));
        const gSel = h("select", { class: "i", onchange: (e) => { DB.garment = e.target.value; const it = BYKEY[DB.garment];
          if (it && it.lp) { DB.gAuto = true; DB.mkG = "0"; DB.gcost = String(listPrice(it, n(DB.qty))); } else { DB.gAuto = false; DB.gcost = it ? String(lastCost(it) || "") : ""; } paintDB(); } },
          h("option", { value: "", text: "Ninguna (servicio sobre prenda del cliente)", selected: !DB.garment }),
          h("optgroup", { label: catOf.lp[1] + " (precio por escala)" }, LISTA().map((g) => h("option", { value: g.key, text: g.name, selected: DB.garment === g.key }))),
          ["g-basica", "g-clasica", "g-premium"].map((cc) => h("optgroup", { label: catOf[cc][1] }, (GARMENTS || []).filter((g) => g.cat === cc).map((g) => h("option", { value: g.key, text: g.name, selected: DB.garment === g.key })))));
        const dbIn = (key, attrs = {}) => h("input", { class: "i num", inputmode: "decimal", value: DB[key], ...attrs, oninput: (e) => { DB[key] = e.target.value; paintDB.soon(); } });
        dbBox.replaceChildren(
          h("div", { class: "cz-tq-head" }, h("div", {}, h("h2", { text: "Cotizador de bordado y DTG" }),
            h("p", { class: "hint", text: "Bordadora de 6 cabezas (6 prendas por ciclo) y 2 impresoras DTG (una pieza a la vez). Calcula el precio y cuántos días de máquina ocupa el pedido." })),
            h("div", { class: "cz-seg", role: "group", "aria-label": "Técnica" }, [["bordado", "Bordado"], ["dtg", "DTG"]].map(([v, tt]) => h("button", { type: "button", "aria-pressed": String(DB.tec === v), onclick: () => { DB.tec = v; DB.pos = v === "bordado" ? [{ name: "Pecho izquierdo", puntadas: 8000, size: 300 }] : [{ name: "Frente", puntadas: 8000, size: 600 }]; paintDB(); } }, tt)))),
          h("div", { class: "cz-tq-grid" },
            h("div", { class: "cz-tq-form" },
              h("div", { class: "cz-fields three" }, field("Piezas", dbIn("qty", { inputmode: "numeric" })), field("Margen prenda (%)", dbIn("mkG")),
                DB.tec === "dtg" ? h("label", { class: "cz-check", style: "align-self:end" }, h("input", { type: "checkbox", checked: !!DB.oscura, onchange: (e) => { DB.oscura = e.target.checked; paintDB(); } }), h("span", { text: "Prenda oscura (pretratado)" })) : h("span")),
              h("div", { class: "cz-fields" }, field("Prenda del catálogo (opcional)", gSel, "full"), DB.garment ? field(BYKEY[DB.garment]?.lp && DB.gAuto !== false ? "Precio de lista por pieza (cambia con las piezas)" : "Costo de la prenda por pieza (MXN)", h("input", { class: "i num", inputmode: "decimal", value: DB.gcost, oninput: (e) => { DB.gcost = e.target.value; DB.gAuto = false; paintDB.soon(); } })) : null),
              ...DB.pos.map((p, i) => h("div", { class: "pos" },
                h("div", { class: "pos-top" }, h("label", { class: "cz-f" }, h("span", { text: "Posición " + (i + 1) }), h("select", { class: "i", onchange: (e) => { p.name = e.target.value; paintDB(); } }, POSN.map((x) => h("option", { value: x, text: x, selected: x === p.name })))),
                  h("button", { type: "button", class: "x", disabled: DB.pos.length < 2, "aria-label": "Quitar posición", onclick: () => { DB.pos.splice(i, 1); paintDB(); } }, "×")),
                DB.tec === "bordado"
                  ? h("div", { class: "grid", style: "gap:.35rem" }, h("div", { class: "sub-k", text: "Puntadas" }),
                    h("div", { class: "inks" }, [3000, 6000, 8000, 12000, 20000].map((v) => h("button", { type: "button", "aria-pressed": String(+p.puntadas === v), onclick: () => { p.puntadas = v; paintDB(); } }, int(v)))),
                    h("input", { class: "i num", type: "number", min: "500", step: "500", value: p.puntadas, "aria-label": "Puntadas", oninput: (e) => { p.puntadas = +e.target.value || 0; paintDB.soon(); } }),
                    h("p", { class: "note", text: "Referencia: logo de pecho 5,000–9,000 · gorra 6,000–10,000 · espalda grande 20,000–40,000." }))
                  : h("div", { class: "grid", style: "gap:.35rem" }, h("div", { class: "sub-k", text: "Tamaño" }),
                    h("div", { class: "sizes" }, DTG_SIZES.map(([v, tt]) => h("button", { type: "button", "aria-pressed": String(+p.size === v), onclick: () => { p.size = v; paintDB(); } }, `${tt} · ${int(v)} cm²`)))))),
              h("button", { type: "button", class: "btn ghost", onclick: () => { const used = DB.pos.map((x) => x.name); DB.pos.push({ name: POSN.find((x) => !used.includes(x)) || "Otra", puntadas: 6000, size: 300 }); paintDB(); } }, "+ Posición")),
            res));
      }
      paintDB.soon = () => { clearTimeout(paintDB.t); paintDB.t = setTimeout(() => { const a = document.activeElement, ix = a && [...dbBox.querySelectorAll("input")].indexOf(a); paintDB(); if (ix >= 0) { const nIn = dbBox.querySelectorAll("input")[ix]; if (nIn) { nIn.focus(); try { nIn.setSelectionRange(nIn.value.length, nIn.value.length); } catch {} } } }, 400); };

      paintFreq(); fillAdd(); paintLines(); paintTQ(); paintDB();
      sheetBox.replaceChildren(sheet(q)); refresh(); dirty = false; status.textContent = "Todo guardado"; clearTimeout(timer);

      return h("div", { class: "cz" },
        h("div", { class: "topbar" }, h("div", {}, h("div", { class: "sub", text: [clientOf(q) || "Sin cliente", opp ? opp.titulo : ""].filter(Boolean).join(" · ") }), h("h1", { text: "Cotización " + (q.id || "") })),
          h("div", { class: "actions" }, ctx.pill, ...actions)),
        h("div", { class: "cz-grid" },
          h("div", { class: "cz-panel" }, gHead, gLines, gDisc, gPay, gEnt,
            h("div", { class: "row" },
              h("button", { class: "btn ghost", type: "button", onclick: async () => { await flush(); await X.onDuplicate(byIdFresh()); } }, "Duplicar cotización"),
              h("button", { class: "btn danger", type: "button", onclick: async () => { clearTimeout(timer); dirty = false; await X.onDelete(q); } }, "Borrar cotización"))),
          h("div", { class: "cz-sheet-wrap" }, h("p", { class: "cz-sheet-label" }, "Así sale la hoja para el cliente ", internal), sheetBox)),
        tqBox, dbBox);
    }

    async function newDoc({ oportunidadId = "", cuentaId = "", cliente = "", solicitud = null } = {}) {
      await ready();
      H = history("");
      const lineas = [];
      if (solicitud && solicitud.modelos && solicitud.modelos.length) for (const m of solicitud.modelos) lineas.push(mkLine(BYKEY["cat:" + m.id] ? "cat:" + m.id : "libre", m.piezas || 0, { color: m.color || "", ...(BYKEY["cat:" + m.id] ? {} : { concepto: m.titulo }) }));
      // what the customer priced in the website's "Cotiza en un minuto": one line each, at the price they saw
      if (solicitud && solicitud.estimados && solicitud.estimados.length) for (const e of solicitud.estimados) {
        const tec = e.tecnica === "dtg" ? "dtg" : e.tecnica === "embroidery" ? "bordado" : e.tecnica === "fullprint" ? "" : "serigrafia";
        const names = ["Frente", "Espalda", "Manga", "Nuca"];
        lineas.push(mkLine("libre", e.piezas || 0, { concepto: `${e.nombre} · ${e.tecnicaNombre}${e.entrega === "express" ? " · express" : ""}`, desc: `Estimado del sitio: ${e.resumen}`,
          ...(e.unitario ? { precio: String(e.unitario), manual: true } : {}),
          ubicaciones: tec ? Array.from({ length: Math.max(1, e.ubicaciones || 1) }, (_, i) => ({ nombre: (e.ubic && e.ubic[i] && e.ubic[i].lugar) || names[i] || "Ubicación " + (i + 1), tecnica: tec, colores: tec === "serigrafia" ? e.tintas || 1 : 0, tintas: "", ...(tec === "bordado" ? { puntadas: e.bordado === "grande" ? 20000 : e.bordado === "chico" ? 5000 : 9000 } : {}) })) : [] }));
      }
      if (solicitud && !lineas.length) lineas.push(mkLine("libre", solicitud.piezas || 0, { concepto: solicitud.prenda || "Playera" }));
      const q = normalize({ oportunidadId, cuentaId, cliente, estado: "borrador", lineas, fecha: today(),
        notas: solicitud && (solicitud.tecnicas || []).length ? "Técnica solicitada: " + solicitud.tecnicas.join(", ") + "." : "" });
      if (solicitud && solicitud.fechaNecesaria) { q.ent = "fecha"; q.fechaEnt = solicitud.fechaNecesaria; }
      return toDoc(q);
    }

    return { ready, garments: () => GARMENTS || [], view, calc: (q) => calc(normalize(structuredClone(q))), normalize: (q) => normalize(structuredClone(q)), print: printSheet, text: (q) => asText(normalize(structuredClone(q))), newDoc, clientOf };
  };
})();
