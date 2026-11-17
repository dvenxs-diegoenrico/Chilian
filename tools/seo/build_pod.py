"""Print on Demand landing page (Spanish and English): animated, with a live price calculator, packs,
free designs and shipping. Prices come from the site's own engine (api/_pricing.js), so the page never drifts from the quoter.

Run after build_seo.py and build_landings.py:   python3 tools/seo/build_pod.py
Writes print-on-demand-playeras-dtg.html (es) and print-on-demand-t-shirts-mexico.html (en).
"""
import html, json, pathlib, subprocess, sys, importlib.util
ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("bl", ROOT / "tools/seo/build_landings.py"); bl = importlib.util.module_from_spec(spec); spec.loader.exec_module(bl)
E, SITE, CSS, WA, AUDITS, AUDITS_EN = bl.E, bl.SITE, bl.CSS, bl.WA, bl.AUDITS, bl.AUDITS_EN

PRICES = json.loads(subprocess.check_output(["node", str(ROOT / "tools/seo/podprices.mjs")], cwd=ROOT))
DESIGNS = json.loads((ROOT / "disenos/disenos.json").read_text()) if (ROOT / "disenos/disenos.json").exists() else []
mx = lambda v: f"${v:,.0f}"

T = {
  "es": dict(
    lang="es", slug="print-on-demand-playeras-dtg", alt="print-on-demand-t-shirts-mexico", home="/",
    title="Print on Demand en México: playeras con tu diseño desde 1 pieza, con envío · Chilian",
    desc=f"Diseña tu playera y recíbela en casa: DTG a todo color desde 1 pieza, oversized, regular o económica. Desde {mx(PRICES['opciones']['regular']['blanca']['1']['unitFinal'])} con IVA, packs con descuento y envío fijo a todo México. Planta auditada en Puebla.",
    kicker="Print on Demand · DTG", h1a="Tu diseño,", h1b="en una playera real.", h1c="Desde 1 pieza.",
    lead="Sube tu arte o elige un diseño libre, ve cómo queda y recíbela en casa. Impresión DTG a todo color en una planta auditada de Puebla, con precio claro y envío fijo a todo México.",
    cta1="Diseña tu playera", cta2="Ver precios", from_="desde", vat="con IVA",
    how_k="Cómo funciona", how_h="Cuatro pasos, sin mínimos",
    steps=[("Elige tu playera", "Oversized, regular o económica, blanca o de color."), ("Sube tu diseño", "O elige un diseño libre de dominio público. Lo ves sobre la prenda antes de pagar."), ("Imprimimos en DTG", "A todo color, sin pantallas: fotos, degradados, un diseño distinto en cada pieza."), ("Te lo enviamos", "Tarifa fija a todo México; gratis desde pedidos grandes. Fuera de México lo cotiza una asesora.")],
    pick_k="Elige tu playera", pick_h="Tres opciones, una calidad de planta",
    opts={"regular": ("Regular", "100 % algodón, 155 g. La que más se vende: corte clásico y excelente para DTG.", "La favorita"), "oversized": ("Oversized", "Corte amplio, 100 % algodón. Para moda y marcas de calle.", "Precio por confirmar"), "economica": ("Económica", "50 % algodón, 50 % poliéster. Para regalos y eventos; mejor con diseños claros.", "La más económica")},
    pick_note="Precio de 1 pieza, blanca, con un estampado de hasta 27 cm. IVA, comisión de pago y servicio incluidos.", white="Blanca", color="De color",
    packs_k="Packs", packs_h="Más piezas, menos por pieza",
    packs={"duo": ("Pack Dúo", "2 playeras, mismo diseño o distintos"), "creador": ("Pack Creador", "3 diseños distintos, uno de cada uno"), "equipo": ("Pack Equipo", "6 playeras para tu equipo"), "evento": ("Pack Evento", "12 playeras con envío gratis")},
    perpc="por pieza", pcs="piezas", ship_free="Envío gratis", ship_in="Envío", ship_quote="envío a cotizar", off="de descuento", choose="Elegir pack",
    calc_k="Calculadora", calc_h="Tu precio en segundos", c_tee="Playera", c_color="Prenda", c_size="Tamaño del estampado", c_qty="Piezas", c_pack="Pack", c_dest="Envío a", c_mx="México", c_intl="Otro país",
    c_unit="Por pieza", c_total="Total estimado", c_ship="Envío", c_free="Gratis", c_quote="A cotizar con tu asesora", c_note="IVA y comisión de pago incluidos. El precio final lo confirma tu asesora al revisar tu arte.", c_go="Diseñar con este precio",
    sizes=[(6, "Hasta 6 cm · etiqueta"), (11, "Hasta 11 cm · logo de pecho"), (20, "Hasta 20 cm · media carta"), (27, "Hasta 27 cm · carta"), (40, "Hasta 40 cm · doble carta"), (53, "Hasta 53 cm · máximo")],
    designs_k="Diseños libres", designs_h="Arte famoso, listo para estampar", designs_p="Obras de dominio público: puedes estamparlas sin pagar derechos. Elige una y ábrela en el estudio.", d_use="Estampar", d_pd="Dominio público",
    ship_k="Envíos y tiempos", ship_h="Claro desde el primer día",
    ship_rows=[("Producción", "Hasta 4 días hábiles después de aprobar tu arte."), ("Envío en México", "3 a 5 días hábiles. Tarifa fija por piezas, con IVA incluido."), ("Fuera de México", "Tu asesora cotiza flete y documentos de exportación."), ("Pedidos grandes", "Desde 25 piezas conviene la serigrafía: el cotizador te muestra el ahorro.")],
    ship_table_h=("Piezas", "Envío en México"), ship_upto="hasta", ship_over="Gratis desde",
    trust_k="Por qué Chilian", trust=[("Planta auditada", AUDITS), ("Desde 1990", "Más de 35 años estampando para marcas, empresas y campañas."), ("Hasta 20,000 piezas al día", "Cuando tu pedido crece, pasa a serigrafía con precio de volumen."), ("Un precio, sin sorpresas", "El cotizador, el asistente y el equipo ven siempre el mismo precio.")],
    faq_k="Preguntas", faq_h="Lo que más preguntan",
    faq=[("¿Cuál es el mínimo?", "Una pieza. No hay mínimo en Print on Demand."), ("¿Qué incluye el precio?", "La playera, un estampado DTG a todo color de hasta el tamaño que elijas, el servicio de preparación, control de calidad y empaque individual, IVA y comisión de pago. Un estampado adicional suma su precio; el envío va aparte."), ("¿Qué archivo necesito?", "PNG de 300 DPI con fondo transparente es lo ideal. También aceptamos JPG, SVG y WebP, y te avisamos si la resolución es baja."), ("¿Puedo pedir diseños distintos en un mismo pedido?", "Sí. El precio por pieza baja con el total de piezas, aunque cada una lleve un diseño distinto."), ("¿Puedo usar los diseños libres?", "Sí. Son obras de dominio público tomadas de Wikimedia Commons; tú eres responsable de no combinarlas con marcas o textos protegidos."), ("¿Hacen envíos al extranjero?", "Sí, enviamos nacional e internacionalmente. Fuera de México tu asesora cotiza el flete y los documentos de exportación; el precio se confirma en pesos.")],
    final_h="Tu primera playera, hoy", final_p="Sin mínimos, con precio claro y envío a todo México.", wa_msg="Hola Chilian, vi la página de Print on Demand y quiero hacer mi playera.",
    foot_hours="Lun–Vie 9:00–18:00", motion="Animación", studio="/?studio=1", quoter="/?prod=pod#cotizar", home_label="Grupo Chilian", nav=("Catálogo", "Técnicas", "Cotizar"),
  ),
  "en": dict(
    lang="en", slug="print-on-demand-t-shirts-mexico", alt="print-on-demand-playeras-dtg", home="/en",
    title="Print on demand T-shirts from Mexico: your design from 1 piece, shipped · Chilian",
    desc=f"Design your T-shirt and get it delivered: full-color DTG from 1 piece, oversized, regular or budget. From {mx(PRICES['opciones']['regular']['blanca']['1']['unitFinal'])} MXN with VAT, discount packs and flat-rate shipping across Mexico. Audited plant in Puebla.",
    kicker="Print on demand · DTG", h1a="Your design,", h1b="on a real T-shirt.", h1c="From 1 piece.",
    lead="Upload your art or pick a free design, see how it looks and get it delivered. Full-color DTG printing in an audited plant in Puebla, with clear pricing and flat-rate shipping across Mexico.",
    cta1="Design your T-shirt", cta2="See prices", from_="from", vat="with VAT",
    how_k="How it works", how_h="Four steps, no minimums",
    steps=[("Pick your T-shirt", "Oversized, regular or budget, white or colored."), ("Upload your design", "Or pick a free public-domain design. You see it on the garment before you pay."), ("We print in DTG", "Full color, no screens: photos, gradients, a different design on every piece."), ("We ship it", "Flat rate across Mexico, free on larger orders. Abroad, an advisor quotes it.")],
    pick_k="Pick your T-shirt", pick_h="Three options, one plant-grade quality",
    opts={"regular": ("Regular", "100% cotton, 155 g. The best seller: classic cut, great for DTG.", "Best seller"), "oversized": ("Oversized", "Relaxed cut, 100% cotton. For fashion and streetwear brands.", "Price to be confirmed"), "economica": ("Budget", "50% cotton, 50% polyester. For gifts and events; best with light designs.", "Lowest price")},
    pick_note="Price for 1 piece, white, with one print up to 27 cm. VAT, payment fee and service included. Prices in Mexican pesos (MXN).", white="White", color="Colored",
    packs_k="Packs", packs_h="More pieces, less per piece",
    packs={"duo": ("Duo pack", "2 tees, same design or different ones"), "creador": ("Creator pack", "3 different designs, one of each"), "equipo": ("Team pack", "6 tees for your team"), "evento": ("Event pack", "12 tees with free shipping")},
    perpc="per piece", pcs="pieces", ship_free="Free shipping", ship_in="Shipping", ship_quote="shipping quoted", off="off", choose="Choose pack",
    calc_k="Calculator", calc_h="Your price in seconds", c_tee="T-shirt", c_color="Garment", c_size="Print size", c_qty="Pieces", c_pack="Pack", c_dest="Ship to", c_mx="Mexico", c_intl="Other country",
    c_unit="Per piece", c_total="Estimated total", c_ship="Shipping", c_free="Free", c_quote="Quoted by your advisor", c_note="VAT and payment fee included, in Mexican pesos. Your advisor confirms the final price after reviewing your art.", c_go="Design with this price",
    sizes=[(6, "Up to 6 cm · label"), (11, "Up to 11 cm · chest logo"), (20, "Up to 20 cm · half letter"), (27, "Up to 27 cm · letter"), (40, "Up to 40 cm · double letter"), (53, "Up to 53 cm · maximum")],
    designs_k="Free designs", designs_h="Famous art, ready to print", designs_p="Public-domain artworks: you can print them without paying royalties. Pick one and open it in the studio.", d_use="Print", d_pd="Public domain",
    ship_k="Shipping and timing", ship_h="Clear from day one",
    ship_rows=[("Production", "Up to 4 business days after you approve your art."), ("Shipping in Mexico", "3 to 5 business days. Flat rate by pieces, VAT included."), ("Outside Mexico", "Your advisor quotes freight and export documents."), ("Large orders", "From 25 pieces screen printing is cheaper: the quoter shows the saving.")],
    ship_table_h=("Pieces", "Shipping in Mexico"), ship_upto="up to", ship_over="Free over",
    trust_k="Why Chilian", trust=[("Audited plant", AUDITS_EN), ("Since 1990", "More than 35 years printing for brands, companies and campaigns."), ("Up to 20,000 pieces a day", "When your order grows, it moves to screen printing at the volume price."), ("One price, no surprises", "The quoter, the assistant and the team always see the same price.")],
    faq_k="Questions", faq_h="What people ask most",
    faq=[("What is the minimum?", "One piece. There is no minimum in print on demand."), ("What does the price include?", "The T-shirt, one full-color DTG print up to the size you choose, setup, quality check and individual packing, VAT and payment fee. An extra print adds its price; shipping is separate."), ("What file do I need?", "A 300 DPI PNG with a transparent background is ideal. We also accept JPG, SVG and WebP, and we warn you if the resolution is low."), ("Can I order different designs in one order?", "Yes. The price per piece drops with the total pieces, even if each one has a different design."), ("Can I use the free designs?", "Yes. They are public-domain works taken from Wikimedia Commons; you are responsible for not combining them with protected brands or text."), ("Do you ship abroad?", "Yes, we ship nationally and internationally. Outside Mexico your advisor quotes freight and export documents; the final price is confirmed in pesos.")],
    final_h="Your first T-shirt, today", final_p="No minimums, clear pricing and shipping across Mexico.", wa_msg="Hi Chilian, I saw the print on demand page and I would like to make my T-shirt.",
    foot_hours="Mon–Fri 9:00–18:00", motion="Animation", studio="/en?studio=1", quoter="/en?prod=pod#cotizar", home_label="Grupo Chilian", nav=("Catalog", "Techniques", "Get a quote"),
  ),
}

POD_CSS = """
.pod-hero{position:relative;overflow:hidden;padding-block:1.4rem 3.2rem}
.pod-hero .wrap{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(1.4rem,4vw,3rem);align-items:center}
.pod-hero h1 span{display:block}.pod-hero h1 .acc{color:var(--magenta)}
.price-chip{display:inline-flex;align-items:baseline;gap:.5rem;margin:.2rem 0 1.2rem;padding:.5rem .9rem;border:1px solid var(--rule);background:var(--card);font:600 .8rem "Jost",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--steel)}
.price-chip b{font:700 1.7rem "Jost",sans-serif;color:var(--ink);letter-spacing:0}
.stage{position:relative;aspect-ratio:1/1;max-width:520px;margin-inline:auto;width:100%}
.stage svg{width:100%;height:100%;display:block}
.tee-body{fill:#F3EBDD}.tee-shade{fill:#0B0B0B;opacity:.07}
.print-art{clip-path:inset(100% 0 0 0);animation:reveal 6s cubic-bezier(.5,0,.2,1) infinite}
@keyframes reveal{0%{clip-path:inset(100% 0 0 0)}55%{clip-path:inset(0 0 0 0)}92%{clip-path:inset(0 0 0 0)}100%{clip-path:inset(0 0 100% 0)}}
.gantry{animation:sweep 6s cubic-bezier(.5,0,.2,1) infinite;transform-box:fill-box}
@keyframes sweep{0%{transform:translateY(205px)}55%{transform:translateY(-10px)}92%{transform:translateY(-10px)}100%{transform:translateY(-10px)}}
.head{animation:scan .9s ease-in-out infinite alternate}
@keyframes scan{from{transform:translateX(-62px)}to{transform:translateX(62px)}}
.drop{fill:var(--magenta);opacity:0;animation:drip 1.1s linear infinite}
.drop:nth-child(2){animation-delay:.25s}.drop:nth-child(3){animation-delay:.5s}
@keyframes drip{0%{opacity:0;transform:translateY(0)}30%{opacity:.9}100%{opacity:0;transform:translateY(34px)}}
.float{animation:bob 5s ease-in-out infinite}.float.d2{animation-delay:-2s}.float.d3{animation-delay:-3.5s}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.tag{position:absolute;padding:.4rem .7rem;background:var(--card);border:1px solid var(--rule);font:600 .66rem "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase}
.tag.a{left:0;top:12%}.tag.b{right:0;top:46%}.tag.c{left:6%;bottom:6%}
.marquee{border-block:1px solid var(--rule);overflow:hidden;background:var(--card)}
.marquee .row{display:flex;gap:2.5rem;padding:.9rem 0;width:max-content;animation:slide 38s linear infinite;font:600 .8rem "Jost",sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--steel)}
.marquee:hover .row{animation-play-state:paused}
@keyframes slide{to{transform:translateX(-50%)}}
.rv{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.rv.in{opacity:1;transform:none}
.steps4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;counter-reset:s}
.step4{position:relative;padding:1.2rem 1.1rem 1.3rem;border:1px solid var(--rule);background:var(--card)}
.step4 .n{font:700 2rem "Jost",sans-serif;color:var(--magenta);line-height:1}
.step4 h3{font:650 1.05rem "Jost",sans-serif;margin:.6rem 0 .3rem}.step4 p{margin:0;color:var(--steel);font-size:.94rem}
.step4::after{content:"";position:absolute;left:0;bottom:0;height:3px;width:0;background:var(--magenta);transition:width 1s ease .3s}.step4.in::after{width:100%}
.cards3,.cards4{display:grid;gap:1rem}.cards3{grid-template-columns:repeat(3,minmax(0,1fr))}.cards4{grid-template-columns:repeat(4,minmax(0,1fr))}
.pcard{position:relative;padding:1.3rem 1.2rem;border:1px solid var(--rule);background:var(--card);display:flex;flex-direction:column;gap:.5rem;transition:transform .25s ease,border-color .25s ease}
.pcard:hover{transform:translateY(-4px);border-color:var(--ink)}
.pcard .badge{position:absolute;top:-.7rem;left:1rem;padding:.2rem .6rem;background:var(--magenta);color:var(--on-accent);font:700 .62rem "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase}
.pcard h3{font:650 1.2rem "Jost",sans-serif;margin:0}.pcard p{margin:0;color:var(--steel);font-size:.92rem;flex:1}
.pcard .pr{font:700 1.9rem "Jost",sans-serif}.pcard .pr small{font:500 .72rem "Jost",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--steel);margin-left:.3rem}
.pcard .sub{font-size:.84rem;color:var(--steel)}
.calc{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:1.4rem;align-items:start}
.calc .form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.9rem}
.calc label{display:grid;gap:.3rem;font:600 .72rem "Jost",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--steel)}
.calc select,.calc input{width:100%;padding:.8rem .8rem;border:1px solid var(--rule);background:var(--card);color:var(--ink);font:500 1rem "Questrial",sans-serif;border-radius:2px;min-height:48px}
.calc select:focus,.calc input:focus{outline:none;border-color:var(--ink)}
.calc .full{grid-column:1/-1}
.res{border:1px solid var(--ink);background:var(--card);padding:1.2rem 1.3rem;display:grid;gap:.6rem;position:sticky;top:84px}
.res .big{font:700 2.6rem/1 "Jost",sans-serif;color:var(--magenta)}
.res .row{display:flex;justify-content:space-between;gap:1rem;border-top:1px solid var(--rule);padding-top:.5rem;font-size:.95rem}
.res .row b{font-variant-numeric:tabular-nums}
.res .note{font-size:.8rem;color:var(--steel);margin:0}
.designs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.9rem}
.dcard{display:flex;flex-direction:column;border:1px solid var(--rule);background:var(--card);text-decoration:none;overflow:hidden;transition:transform .25s ease,border-color .25s ease}
.dcard:hover{transform:translateY(-4px);border-color:var(--ink)}
.dcard .ph{aspect-ratio:1/1;display:grid;place-items:center;background:repeating-conic-gradient(#e9e8ec 0 25%,#f7f6f8 0 50%) 50%/16px 16px}
.dcard .ph img{width:88%;height:88%;object-fit:contain}
.dcard .t{padding:.7rem .8rem .8rem;display:grid;gap:.1rem}.dcard b{font:650 .95rem "Jost",sans-serif}.dcard small{color:var(--steel);font-size:.76rem}
.dcard em{font-style:normal;font:600 .62rem "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--magenta);margin-top:.3rem}
.shipgrid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:1.6rem}
.shipgrid dl{margin:0;display:grid;gap:.8rem}.shipgrid dt{font:650 1rem "Jost",sans-serif}.shipgrid dd{margin:0;color:var(--steel)}
.trust4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}
.trust4 div{border-top:2px solid var(--magenta);padding-top:.7rem}.trust4 b{display:block;font:650 1.05rem "Jost",sans-serif}.trust4 span{color:var(--steel);font-size:.92rem}
.final{text-align:center;padding:3.4rem 0 3rem}.final h2{font-size:clamp(1.8rem,5vw,3rem)}
.stickybar{position:fixed;left:0;right:0;bottom:0;z-index:15;display:none;gap:.6rem;padding:.6rem 16px calc(.6rem + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--paper) 94%,transparent);backdrop-filter:blur(10px);border-top:1px solid var(--rule)}
.stickybar .btn{flex:1}
@media (max-width:900px){.pod-hero .wrap,.calc,.shipgrid{grid-template-columns:minmax(0,1fr)}.steps4,.cards4,.trust4{grid-template-columns:repeat(2,minmax(0,1fr))}.cards3{grid-template-columns:minmax(0,1fr)}.res{position:static}.stickybar{display:flex}.stage{max-width:380px}}
@media (max-width:520px){.steps4,.cards4,.trust4{grid-template-columns:minmax(0,1fr)}.calc .form{grid-template-columns:minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){.print-art{animation:none;clip-path:none}.gantry,.head,.drop,.float,.marquee .row{animation:none}.rv{opacity:1;transform:none;transition:none}.step4::after{width:100%;transition:none}}
"""

SCENE = """<svg viewBox="0 0 400 400" role="img" aria-label="{alt}">
  <defs><clipPath id="teeclip"><path id="teepath" d="M135 62 L72 92 L92 150 L126 134 L126 330 L274 330 L274 134 L308 150 L328 92 L265 62 C255 92 145 92 135 62 Z"/></clipPath>
  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9922E"/><stop offset="1" stop-color="#E8C16B"/></linearGradient>
  <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1B6FB5"/><stop offset="1" stop-color="#5BC0DE"/></linearGradient></defs>
  <ellipse cx="200" cy="352" rx="120" ry="10" fill="#000" opacity=".25"/>
  <path class="tee-body" d="M135 62 L72 92 L92 150 L126 134 L126 330 L274 330 L274 134 L308 150 L328 92 L265 62 C255 92 145 92 135 62 Z"/>
  <path class="tee-shade" d="M126 134 L126 330 L170 330 L170 120 Z"/>
  <g clip-path="url(#teeclip)"><g class="print-art">
    <circle cx="200" cy="190" r="50" fill="url(#g1)"/>
    <path d="M126 235 C150 205 170 265 200 235 S250 205 274 235 L274 300 L126 300 Z" fill="url(#g2)"/>
    <path d="M126 262 C150 240 175 290 200 262 S250 240 274 262 L274 300 L126 300 Z" fill="#0B0B0B" opacity=".25"/>
    <circle cx="172" cy="170" r="5" fill="#fff" opacity=".8"/><circle cx="232" cy="150" r="3" fill="#fff" opacity=".7"/>
  </g></g>
  <g class="gantry" style="transform-origin:200px 60px">
    <rect x="86" y="58" width="228" height="10" rx="5" fill="#2a2620"/><rect x="86" y="58" width="228" height="3" rx="1.5" fill="#C9922E"/>
    <g class="head"><rect x="186" y="50" width="28" height="26" rx="4" fill="#0B0B0B" stroke="#C9922E" stroke-width="2"/>
      <circle class="drop" cx="193" cy="82" r="2.2"/><circle class="drop" cx="200" cy="82" r="2.2"/><circle class="drop" cx="207" cy="82" r="2.2"/></g>
  </g>
</svg>"""


def esc(x): return html.escape(str(x))


def page(t):
    es = t["lang"] == "es"
    L = lambda a, b: a if es else b
    url = f"{SITE}/{t['slug']}"; alt_url = f"{SITE}/{t['alt']}"
    es_u, en_u = (url, alt_url) if es else (alt_url, url)
    o = PRICES["opciones"]; pk = PRICES["packs"]; env = PRICES["envio"]
    a_from = o["regular"]["blanca"]["1"]["unitFinal"]
    # cards of garment options
    opts = ""
    for oid in ("regular", "oversized", "economica"):
        name, desc, badge = t["opts"][oid]
        opts += f'<div class="pcard rv"><span class="badge">{esc(badge)}</span><h3>{esc(name)}</h3><p>{esc(desc)}</p><div class="pr">{mx(o[oid]["blanca"]["1"]["unitFinal"])}<small>{esc(t["white"])}</small></div><div class="sub">{mx(o[oid]["color"]["1"]["unitFinal"])} {esc(t["color"].lower())}</div><a class="btn" href="{t["quoter"].replace("prod=pod", "prod=pod&pod=" + oid)}">{esc(t["cta1"])} →</a></div>'
    # packs
    packs = ""
    for pid in ("duo", "creador", "equipo", "evento"):
        name, desc = t["packs"][pid]
        k = {"duo": 2, "creador": 3, "equipo": 6, "evento": 12}[pid]; w = pk[pid]["blanca"]
        ship = t["ship_free"] if w["envio"] == 0 and not w.get("cotizar") else f'{t["ship_in"]} {mx(w["envio"])}'
        disc = {"duo": 5, "creador": 5, "equipo": 6, "evento": 4}[pid]
        packs += f'<div class="pcard rv"><span class="badge">−{disc}% {esc(t["off"])}</span><h3>{esc(name)}</h3><p>{esc(desc)}</p><div class="pr">{mx(w["unitFinal"])}<small>{esc(t["perpc"])}</small></div><div class="sub">{k} {esc(t["pcs"])} · {mx(w["total"])} · {esc(ship)}</div><a class="btn" href="{t["quoter"].replace("prod=pod", "prod=pod&pack=" + pid)}">{esc(t["choose"])} →</a></div>'
    # designs
    des = ""
    for d in DESIGNS:
        des += f'<a class="dcard rv" href="{t["studio"]}&design={d["id"]}" aria-label="{esc(t["d_use"])}: {esc(d["es"] if es else d["en"])}"><span class="ph"><img src="/disenos/{d["id"]}-s.webp" alt="" loading="lazy" width="150" height="150"></span><span class="t"><b>{esc(d["es"] if es else d["en"])}</b><small>{esc(d["autor"])}, {esc(d["anio"])}</small><em>{esc(t["d_pd"])} · {esc(t["d_use"])} →</em></span></a>'
    marquee_items = [(d["es"] if es else d["en"]) for d in DESIGNS] + [L("Desde 1 pieza", "From 1 piece"), L("DTG a todo color", "Full-color DTG"), L("Envío a todo México", "Shipping across Mexico"), L("Sin mínimos", "No minimums")]
    mq = "".join(f"<span>{esc(x)}</span>" for x in marquee_items * 2)
    steps = "".join(f'<div class="step4 rv"><div class="n">{i + 1}</div><h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for i, (h, p) in enumerate(t["steps"]))
    ship_rows = "".join(f"<div><dt>{esc(a)}</dt><dd>{esc(b)}</dd></div>" for a, b in t["ship_rows"])
    ship_tbl = "".join(f'<tr><td>{esc(t["ship_upto"])} {m}</td><td class="r">{mx(p)}</td></tr>' for m, p in env["mx"]) + f'<tr><td>{esc(t["ship_over"])}</td><td class="r">{mx(env["gratisDesde"])}</td></tr>'
    trust = "".join(f"<div class=\"rv\"><b>{esc(a)}</b><span>{esc(b)}</span></div>" for a, b in t["trust"])
    faq = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in t["faq"])
    size_opts = "".join(f'<option value="{v}"{" selected" if v == 27 else ""}>{esc(lbl)}</option>' for v, lbl in t["sizes"])
    pack_opts = f'<option value="">{esc(L("Sin pack", "No pack"))}</option>' + "".join(f'<option value="{pid}" data-q="{k}">{esc(t["packs"][pid][0])} ({k})</option>' for pid, k in (("duo", 2), ("creador", 3), ("equipo", 6), ("evento", 12)))
    tee_opts = "".join(f'<option value="{oid}">{esc(t["opts"][oid][0])}</option>' for oid in ("regular", "oversized", "economica"))
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Product", "name": L("Playera Print on Demand con estampado DTG", "Print on demand T-shirt with DTG print"), "description": t["lead"], "image": f"{SITE}/photos/opt/print-on-demand-dtg-960.webp", "brand": {"@type": "Brand", "name": "Chilian"}, "manufacturer": {"@id": SITE + "/#chilian"},
         "offers": {"@type": "AggregateOffer", "priceCurrency": "MXN", "lowPrice": f"{a_from:.2f}", "highPrice": f"{o['oversized']['color']['1']['unitFinal']:.2f}", "offerCount": 6, "availability": "https://schema.org/InStock", "url": url, "seller": {"@id": SITE + "/#chilian"},
                    "shippingDetails": {"@type": "OfferShippingDetails", "shippingRate": {"@type": "MonetaryAmount", "value": str(env["mx"][0][1]), "currency": "MXN"}, "shippingDestination": {"@type": "DefinedRegion", "addressCountry": "MX"}, "deliveryTime": {"@type": "ShippingDeliveryTime", "handlingTime": {"@type": "QuantitativeValue", "minValue": 1, "maxValue": 4, "unitCode": "DAY"}, "transitTime": {"@type": "QuantitativeValue", "minValue": 3, "maxValue": 5, "unitCode": "DAY"}}}}},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Grupo Chilian", "item": SITE + t["home"]}, {"@type": "ListItem", "position": 2, "name": t["h1a"] + " " + t["h1b"], "item": url}]},
        {"@type": "HowTo", "name": t["how_h"], "step": [{"@type": "HowToStep", "position": i + 1, "name": h, "text": p} for i, (h, p) in enumerate(t["steps"])]},
        {"@type": "FAQPage", "inLanguage": "es-MX" if es else "en-US", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in t["faq"]]}]}
    from urllib.parse import quote as q_
    wa = f"https://wa.me/{WA['promo'] if es else WA['usa']}?text={q_(t['wa_msg'])}"
    data = json.dumps({"prices": "/api/precios"})
    js = """
(function(){
  var $=function(s){return document.querySelector(s)}, PR=null, es=document.documentElement.lang==="es";
  var tier=function(q,arr){var i=0;arr.forEach(function(x,k){if(q>=x)i=k});return i};
  var fmt=function(n){return "$"+Math.round(n).toLocaleString(es?"es-MX":"en-US")};
  // reveal on scroll
  var io=("IntersectionObserver" in window)?new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15}):null;
  document.querySelectorAll(".rv,.step4").forEach(function(el,i){if(io){el.style.transitionDelay=(i%4)*70+"ms";io.observe(el)}else el.classList.add("in")});
  fetch("/api/precios").then(function(r){return r.json()}).then(function(j){PR=j.precios;calc()}).catch(function(){});
  function dtg(cm,q,white){var D=PR.dtgTabla,i=D.medidas.findIndex(function(x){return x>=cm});if(i<0)i=D.medidas.length-1;return D[white?"blanca":"color"][i][tier(Math.max(1,q),D.tramos)]}
  function calc(){
    if(!PR||!PR.pod)return;
    var tee=$("#c-tee").value,white=$("#c-color").value==="blanca",cm=+$("#c-size").value,pk=$("#c-pack").value,q=Math.max(1,parseInt($("#c-qty").value,10)||1),dest=$("#c-dest").value;
    var P=PR,PK=P.pod.packs;
    if(pk&&PK[pk]&&PK[pk].piezas!==q){q=PK[pk].piezas;$("#c-qty").value=q}
    var opt=P.pod.opciones[tee],row=function(code){return P.lista.find(function(r){return r.codigo===code&&(white?/blanc/i.test(r.color):!/^blanc/i.test(r.color))})||P.lista.find(function(r){return r.codigo===code})};
    var r=row(opt.codigos[white?"blanca":"color"]),g=r?r.precios[tier(q,P.listaTramos)]:0,base=g+dtg(cm,q,white);
    var R=P.pod.recargo,pct=0;R.tramos.forEach(function(x){if(q>=x[0])pct=x[1]});pct+=white||!pct?0:R.colorExtra;
    var unit=base*(1+pct/100);if(pk&&PK[pk])unit*=1-PK[pk].desc/100;
    var fin=unit*(1+P.iva/100)*(1+P.cargos.comision/100),sub=fin*q,E=P.pod.envio,t=E.mx.find(function(x){return q<=x[0]}),quote=(dest==="intl"||!t),ship=0;
    if(!quote)ship=(pk&&PK[pk]&&PK[pk].envioGratis)||(E.gratisDesde&&sub>=E.gratisDesde)?0:t[1];
    $("#r-unit").textContent=fmt(fin);$("#r-total").textContent=fmt(sub);
    $("#r-ship").textContent=quote?$("#r-ship").dataset.q:(ship?fmt(ship):$("#r-ship").dataset.f);
    $("#r-sum").textContent=quote?"—":fmt(sub+ship);
    var big=q>P.pod.recargo.maxPiezas;$("#r-big").hidden=!big;
    var go=$("#c-go");go.href=go.dataset.base+"&pod="+tee+"&color="+(white?"blanca":"color")+"&dcm="+cm+"&qty="+q+(pk?"&pack="+pk:"")+"&dest="+dest+"#cotizar";
  }
  $("#c-qty").addEventListener("input",function(){var pk=$("#c-pack").value;if(pk&&this.value!==$("#c-pack").selectedOptions[0].dataset.q)$("#c-pack").value=""});
  $("#c-pack").addEventListener("change",function(){var o=this.selectedOptions[0];if(o&&o.dataset.q)$("#c-qty").value=o.dataset.q});
  ["c-tee","c-color","c-size","c-pack","c-qty","c-dest"].forEach(function(id){var el=$("#"+id);if(el){el.addEventListener("input",calc);el.addEventListener("change",calc)}});
})();
"""
    L2 = L
    return f"""<!doctype html>
<html lang="{t['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(t['title'])}</title>
<meta name="description" content="{esc(t['desc'])}">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="es-MX" href="{es_u}"><link rel="alternate" hreflang="es" href="{es_u}">
<link rel="alternate" hreflang="en" href="{en_u}"><link rel="alternate" hreflang="en-US" href="{en_u}"><link rel="alternate" hreflang="x-default" href="{en_u}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="Grupo Chilian">
<meta property="og:title" content="{esc(t['title'])}"><meta property="og:description" content="{esc(t['desc'])}">
<meta property="og:url" content="{url}"><meta property="og:locale" content="{L('es_MX', 'en_US')}">
<meta property="og:image" content="{SITE}/photos/opt/print-on-demand-dtg-1600.webp"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B0B0B">
<link rel="icon" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/jost.woff2" as="font" type="font/woff2" crossorigin>
<style>{CSS}{POD_CSS}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
<header><div class="wrap">
  <a class="logo" href="{t['home']}" aria-label="Grupo Chilian"><img src="/logos/chilian-logo-header.png" alt="" width="36" height="36"><i aria-hidden="true"></i></a>
  <nav aria-label="{L('Principal', 'Main')}"><a class="opt" href="#precios">{esc(t['cta2'])}</a><a class="opt" href="#disenos">{esc(t['designs_k'])}</a><a class="btn accent" href="{t['studio']}">{esc(t['cta1'])}</a></nav>
</div></header>
<main>
  <section class="pod-hero"><div class="wrap">
    <div>
      <p class="kicker">{esc(t['kicker'])}</p>
      <h1><span>{esc(t['h1a'])}</span><span class="acc">{esc(t['h1b'])}</span><span>{esc(t['h1c'])}</span></h1>
      <div class="price-chip">{esc(t['from_'])} <b>{mx(a_from)}</b> {esc(t['vat'])}</div>
      <p class="lead">{esc(t['lead'])}</p>
      <div class="cta"><a class="btn accent" href="{t['studio']}">{esc(t['cta1'])} →</a><a class="btn" href="#precios">{esc(t['cta2'])}</a></div>
    </div>
    <div class="stage" aria-hidden="false">
      {SCENE.format(alt=esc(L('Una impresora DTG imprime un diseño a todo color sobre una playera', 'A DTG printer prints a full-color design on a T-shirt')))}
      <span class="tag a float">{esc(L('Desde 1 pieza', 'From 1 piece'))}</span><span class="tag b float d2">{esc(L('DTG a todo color', 'Full-color DTG'))}</span><span class="tag c float d3">{esc(L('Envío a todo México', 'Shipping across Mexico'))}</span>
    </div>
  </div></section>
  <div class="marquee" aria-hidden="true"><div class="row">{mq}</div></div>
  <section class="b"><div class="wrap"><p class="kicker">{esc(t['how_k'])}</p><h2>{esc(t['how_h'])}</h2><div class="steps4">{steps}</div></div></section>
  <section class="b" id="precios"><div class="wrap"><p class="kicker">{esc(t['pick_k'])}</p><h2>{esc(t['pick_h'])}</h2><div class="cards3" style="margin-top:1.4rem">{opts}</div><p class="note" style="margin-top:.9rem;color:var(--steel);font-size:.84rem">{esc(t['pick_note'])}</p></div></section>
  <section class="b"><div class="wrap"><p class="kicker">{esc(t['packs_k'])}</p><h2>{esc(t['packs_h'])}</h2><div class="cards4" style="margin-top:1.4rem">{packs}</div></div></section>
  <section class="b" id="calculadora"><div class="wrap"><p class="kicker">{esc(t['calc_k'])}</p><h2>{esc(t['calc_h'])}</h2>
    <div class="calc" style="margin-top:1.4rem">
      <div class="form">
        <label>{esc(t['c_tee'])}<select id="c-tee">{tee_opts}</select></label>
        <label>{esc(t['c_color'])}<select id="c-color"><option value="blanca">{esc(t['white'])}</option><option value="color">{esc(t['color'])}</option></select></label>
        <label class="full">{esc(t['c_size'])}<select id="c-size">{size_opts}</select></label>
        <label>{esc(t['c_qty'])}<input id="c-qty" type="number" inputmode="numeric" min="1" max="200" value="1"></label>
        <label>{esc(t['c_pack'])}<select id="c-pack">{pack_opts}</select></label>
        <label class="full">{esc(t['c_dest'])}<select id="c-dest"><option value="mx">{esc(t['c_mx'])}</option><option value="intl">{esc(t['c_intl'])}</option></select></label>
      </div>
      <div class="res" aria-live="polite">
        <div><span class="kicker">{esc(t['c_unit'])}</span><div class="big" id="r-unit">{mx(a_from)}</div></div>
        <div class="row"><span>{esc(t['c_total'])}</span><b id="r-total">{mx(a_from)}</b></div>
        <div class="row"><span>{esc(t['c_ship'])}</span><b id="r-ship" data-f="{esc(t['c_free'])}" data-q="{esc(t['c_quote'])}">{mx(env['mx'][0][1])}</b></div>
        <div class="row"><span><b>{esc(L('Total con envío', 'Total with shipping'))}</b></span><b id="r-sum">{mx(a_from + env['mx'][0][1])}</b></div>
        <p class="note" id="r-big" hidden>{esc(L('Con tantas piezas la serigrafía sale más barata: el cotizador te muestra el ahorro.', 'At this volume screen printing is cheaper: the quoter shows the saving.'))}</p>
        <p class="note">{esc(t['c_note'])}</p>
        <a class="btn accent" id="c-go" data-base="{t['quoter'].split('#')[0]}" href="{t['quoter']}">{esc(t['c_go'])} →</a>
      </div>
    </div></div></section>
  <section class="b" id="disenos"><div class="wrap"><p class="kicker">{esc(t['designs_k'])}</p><h2>{esc(t['designs_h'])}</h2><p style="color:var(--steel);max-width:62ch">{esc(t['designs_p'])}</p><div class="designs" style="margin-top:1.2rem">{des}</div></div></section>
  <section class="b"><div class="wrap shipgrid"><div><p class="kicker">{esc(t['ship_k'])}</p><h2>{esc(t['ship_h'])}</h2><dl>{ship_rows}</dl></div>
    <div><table><thead><tr><th>{esc(t['ship_table_h'][0])}</th><th class="r">{esc(t['ship_table_h'][1])}</th></tr></thead><tbody>{ship_tbl}</tbody></table></div></div></section>
  <section class="b"><div class="wrap"><p class="kicker">{esc(t['trust_k'])}</p><div class="trust4" style="margin-top:1rem">{trust}</div></div></section>
  <section class="b"><div class="wrap"><p class="kicker">{esc(t['faq_k'])}</p><h2>{esc(t['faq_h'])}</h2>{faq}</div></section>
  <section class="b final"><div class="wrap"><h2>{esc(t['final_h'])}</h2><p style="color:var(--steel)">{esc(t['final_p'])}</p><div class="cta" style="justify-content:center"><a class="btn accent" href="{t['studio']}">{esc(t['cta1'])} →</a><a class="btn" href="{wa}" rel="noopener">WhatsApp</a></div></div></section>
</main>
<footer><div class="wrap">© 2026 Grupo Chilian · Industrias Chilian, S.A. de C.V. · Tlacomulco No. 2, San Pablo Ahuatempan, Santa Isabel Cholula, Puebla, C.P. 74355 · {esc(t['foot_hours'])} · <a href="https://wa.me/522226925404" rel="noopener">WhatsApp 222 692 5404</a></div></footer>
<div class="stickybar"><a class="btn accent" href="{t['studio']}">{esc(t['cta1'])}</a><a class="btn" href="#calculadora">{esc(t['cta2'])}</a></div>
<a class="wa" href="{wa}" rel="noopener">WhatsApp</a>
<script>{js}</script>
<script src="/chat.js" defer></script>
</body>
</html>
"""


for t in T.values():
    (ROOT / (t["slug"] + ".html")).write_text(page(t))
print("pod pages written")
