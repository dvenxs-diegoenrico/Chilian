/* Candados de tela × técnica: qué sistema de impresión aplica en cada prenda.
   One file for the website (index.html), the assistant (api/_pricing.js, api/_bot.js) and Chilian OS (ops/cotizador.js):
   a classic script that leaves its functions in globalThis.CHILIAN_REGLAS (the API imports it for that side effect).

   Rules (confirmed by Chilian, November 2026):
   · Plastisol and its effects (HD, puff, glitter, brilla en la oscuridad): any fabric. On polyester and blends of a
     colored garment the antimigrant barrier base is mandatory ("siempre base"); on white ones it is not added.
   · Base agua: cotton and blends; never on 100 % polyester.
   · Discharge: only 100 % cotton, and only on colored garments (there is no dye to discharge on white).
   · DTG: only cotton (90 % or more); never on blends or polyester.
   · Full print / sublimación: only polyester, and only as the Chilian Sport tee.
   · Bordado and DTF: any fabric.
   The public quoters block what does not apply; Chilian OS warns and lets the advisor go on. */
(function (root) {
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/co.on\b/g, "cotton");
  const FIBRAS = [["alg", /algodon|cotton/g], ["pol", /poliester|polyester|poliest\b|\bpet\b|microfibra|micro ?pique|dry ?fit|sublimable/g], ["otro", /elastano|spandex|lycra|viscosa|rayon|nylon|modal/g]];

  /* The fabric of a garment from its text ("Peso medio 50% algodón 50% poliéster (155 gr)", "100 % Poliéster", "Tela micropiqué"):
     { alg, pol, otro (percent), clase: "algodon" | "mezcla" | "poliester" | "" (not known), puro (100 % cotton) }. */
  function tela(texto) {
    if (texto && typeof texto === "object") return texto;
    const s = norm(texto), out = { alg: 0, pol: 0, otro: 0, clase: "", puro: false, texto: String(texto || "") };
    if (!s) return out;
    const pcts = [...s.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => ({ a: m.index, b: m.index + m[0].length, v: +m[1], used: false }));
    const words = [];
    for (const [f, rx] of FIBRAS) for (const m of s.matchAll(rx)) words.push({ f, a: m.index, b: m.index + m[0].length, v: null });
    words.sort((x, y) => x.a - y.a);
    for (const w of words) { const p = pcts.filter((x) => !x.used && x.b <= w.a && w.a - x.b <= 5).pop(); if (p) { p.used = true; w.v = p.v; } }   // "50 % algodón"
    for (const w of words) if (w.v === null) { const p = pcts.find((x) => !x.used && x.a >= w.b && x.a - w.b <= 2); if (p) { p.used = true; w.v = p.v; } }   // "Algodón 45%"
    let sum = 0;
    for (const w of words) if (w.v !== null && sum < 100) { const v = Math.min(w.v, 100 - sum); out[w.f] += v; sum += v; }
    const loose = [...new Set(words.filter((w) => w.v === null).map((w) => w.f))].filter((f) => !out[f]);   // fibers named without a percent take what is left
    if (loose.length === 1 && sum < 100 && (sum > 0 || !pcts.length)) { out[loose[0]] += 100 - sum; sum = 100; }
    if (!sum) return out;
    out.clase = out.pol >= 95 ? "poliester" : out.alg >= 90 ? "algodon" : "mezcla";
    out.puro = out.alg >= 99;
    return out;
  }
  const CLASES = { algodon: { es: "algodón", en: "cotton" }, mezcla: { es: "mezcla", en: "blend" }, poliester: { es: "poliéster", en: "polyester" } };
  const SERI = ["plastisol", "serigrafia", "hd", "puff", "glitter", "gitd", "waterbase", "discharge"];

  /* Does this technique apply? c: { tec, tela (text or tela()), color: "blanca" | "color" | "", prod: { fullprint, nodtg } }
     -> { ok, motivo: { es, en } (why not), extras: [ids added by rule], aviso: { es, en } (applies, with a note), tela } */
  function check(c) {
    const T = tela(c.tela), k = T.clase, tec = c.tec === "bordado" ? "embroidery" : c.tec, prod = c.prod || {}, color = c.color === "blanca" || c.color === "color" ? c.color : "";
    const no = (es, en) => ({ ok: false, motivo: { es, en }, extras: [], aviso: null, tela: T });
    if (tec === "fullprint") {
      if (c.prod && !prod.fullprint) return no("El full print (sublimación) solo existe en la playera deportiva Chilian Sport, de poliéster.", "Full print (sublimation) only exists on the polyester Chilian Sport tee.");
      if (k && k !== "poliester") return no("La sublimación solo agarra en poliéster: no aplica en algodón ni en mezclas.", "Sublimation only bonds to polyester: it does not apply to cotton or blends.");
    }
    if (tec === "dtg") {
      if (prod.nodtg) return no("DTG no se imprime en este producto; elige serigrafía o bordado.", "DTG can't print on this product; pick screen printing or embroidery.");
      if (k && k !== "algodon") return no(k === "poliester" ? "DTG no aplica en poliéster: la tinta digital solo fija en algodón. Usa serigrafía con base antimigrante, o sublimación en la Chilian Sport." : "DTG solo aplica en prendas de algodón (90 % o más): en mezclas el color se lava. Usa serigrafía o elige una prenda de algodón.",
        k === "poliester" ? "DTG does not apply to polyester: digital ink only bonds to cotton. Use screen printing with a barrier base, or sublimation on the Chilian Sport." : "DTG only applies to cotton garments (90% or more): on blends the color washes out. Use screen printing or pick a cotton garment.");
    }
    if (tec === "discharge") {
      if (k && !T.puro) return no(k === "poliester" ? "Discharge no aplica en poliéster: solo descarga el tinte del algodón. Usa plastisol con base antimigrante." : "Discharge solo aplica en 100 % algodón: en mezclas no descarga parejo. Usa plastisol o base agua.",
        k === "poliester" ? "Discharge does not apply to polyester: it only removes cotton dye. Use plastisol with a barrier base." : "Discharge only applies to 100% cotton: on blends it does not discharge evenly. Use plastisol or water-based ink.");
      if (color === "blanca") return no("Discharge no aplica en prenda blanca: no hay tinte que descargar. Usa base agua para el mismo tacto suave.", "Discharge does not apply to white garments: there is no dye to remove. Use water-based ink for the same soft hand.");
    }
    if (tec === "waterbase" && k === "poliester") return no("La tinta base agua no aplica en poliéster: no fija en la fibra. Usa plastisol con base antimigrante.", "Water-based ink does not apply to polyester: it does not bond to the fiber. Use plastisol with a barrier base.");
    const extras = [];
    let aviso = null;
    if (SERI.includes(tec) && (k === "poliester" || k === "mezcla") && color === "color") {
      extras.push("antimigrante");
      aviso = { es: `Prenda de ${CLASES[k].es} de color: lleva base antimigrante para que el tinte no manche la tinta.`, en: `Colored ${CLASES[k].en} garment: it takes a barrier base so the dye doesn't bleed into the ink.` };
    }
    return { ok: true, motivo: null, extras, aviso, tela: T };
  }

  /* The fabric of what is being quoted on the website and by the assistant. P: the price list (/api/precios), prod: its
     product, c: { linea, color, pod, tela (what the customer said of their own garment) }. Text, or "" when it is not known. */
  function telaDe(P, prod, c) {
    c = c || {};
    if (!prod) return "";
    if (prod.id === "propia") return ({ algodon: "100% algodón", mezcla: "50% algodón 50% poliéster", poliester: "100% poliéster" })[c.tela] || "";
    const white = c.color === "blanca", row = (code) => (P.lista || []).find((r) => r.codigo === code && (white ? /blanc/i.test(r.color) : !/^blanc/i.test(r.color))) || (P.lista || []).find((r) => r.codigo === code);
    const ln = c.linea && P.lineas && P.lineas[c.linea] ? c.linea : "clasica";
    let r = null;
    if (prod.pod && P.pod) r = row(((P.pod.opciones[c.pod] || P.pod.opciones.regular).codigos || {})[white ? "blanca" : "color"]);
    else if (prod.lista && P.lineas) r = row((P.lineas[ln].codigos || {})[white ? "blanca" : "color"]);
    else if (prod.listaCodigo) r = row(prod.listaCodigo);
    if (r && r.tela) return r.tela;
    if (P.specs && P.specs[prod.id] && P.specs[prod.id][ln]) return P.specs[prod.id][ln];
    return prod.tela || "";
  }

  // A catalog model (catalogo.json): its composition, or what its title says when the catalog page gave none.
  const telaCat = (g) => { const t = tela(g && g.comp); return t.clase ? t : tela(g && g.title); };

  root.CHILIAN_REGLAS = { tela, check, telaDe, telaCat, CLASES, SERI };
})(typeof globalThis !== "undefined" ? globalThis : this);
