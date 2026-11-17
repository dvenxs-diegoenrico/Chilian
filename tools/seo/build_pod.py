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
    desc=f"Diseña tu playera y recíbela en casa: DTG a todo color desde 1 pieza, oversized, regular o económica. Desde {mx(min(PRICES['opciones'][k]['blanca']['1']['unitFinal'] for k in PRICES['opciones']))} con IVA, packs con descuento y envío fijo a todo México. Planta auditada en Puebla.",
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
    desc=f"Design your T-shirt and get it delivered: full-color DTG from 1 piece, oversized, regular or budget. From {mx(min(PRICES['opciones'][k]['blanca']['1']['unitFinal'] for k in PRICES['opciones']))} MXN with VAT, discount packs and flat-rate shipping across Mexico. Audited plant in Puebla.",
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
.form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.9rem}
.form label{display:grid;gap:.3rem;font:600 .72rem "Jost",sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--steel)}
.form select,.form input{width:100%;padding:.8rem .8rem;border:1px solid var(--rule);background:var(--card);color:var(--ink);font:500 1rem "Questrial",sans-serif;border-radius:2px;min-height:48px}
.form select:focus,.form input:focus{outline:none;border-color:var(--ink)}
.form .full{grid-column:1/-1}
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
@media (max-width:520px){.steps4,.cards4,.trust4{grid-template-columns:minmax(0,1fr)}.form{grid-template-columns:minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){.print-art{animation:none;clip-path:none}.gantry,.head,.drop,.float,.marquee .row{animation:none}.rv{opacity:1;transform:none;transition:none}.step4::after{width:100%;transition:none}}

.mock{position:relative;aspect-ratio:1/1;width:100%;max-width:560px;margin-inline:auto;filter:drop-shadow(0 28px 40px rgba(0,0,0,.55))}
.mock .poster,.mock canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.mock canvas{opacity:0;transition:opacity .5s ease}.mock.ready canvas{opacity:1}.mock.ready .poster{opacity:0;transition:opacity .5s .3s}
.mock-cap{display:flex;align-items:center;justify-content:center;gap:.55rem;margin-top:.6rem;font:600 .72rem "Jost",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--steel);min-height:1.4rem;text-align:center}
.live-dot{width:8px;height:8px;border-radius:50%;background:#e2358b;box-shadow:0 0 0 0 rgba(226,53,139,.6);animation:ping 1.8s infinite}
@keyframes ping{70%{box-shadow:0 0 0 9px rgba(226,53,139,0)}100%{box-shadow:0 0 0 0 rgba(226,53,139,0)}}
.stage{max-width:580px}.stage .sw{position:static;transform:none;justify-content:center;margin-top:.8rem}
.try .view{background:radial-gradient(circle at 50% 42%,#5a5040,#1d1a15 72%)}
.try .view .mock{filter:drop-shadow(0 18px 24px rgba(0,0,0,.5));max-width:440px}
@media (max-width:900px){.pod-hero .stage{order:-1;margin-bottom:-.6rem}.pod-hero{padding-top:1rem}.mock{max-width:420px}}
@media (prefers-reduced-motion:reduce){.live-dot{animation:none}}

.own-up{display:flex;gap:.8rem;align-items:center;padding:.85rem 1rem;border:1.5px dashed #C9922E;cursor:pointer;transition:background .25s,border-color .25s,transform .25s}
.own-up:hover,.own-up.drag{background:rgba(201,146,46,.12);border-color:#f2c14e;transform:translateY(-2px)}
.own-up b{display:block;font:600 .9rem "Jost",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#f2c14e}.own-up small{color:var(--steel);font-size:.8rem}
.own-ic{width:34px;height:34px;flex:none;background:#C9922E;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27%3E%3Cpath d=%27M12 16V4m0 0l-5 5m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3%27/%3E%3C/svg%3E") center/contain no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27black%27 stroke-width=%272%27%3E%3Cpath d=%27M12 16V4m0 0l-5 5m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3%27/%3E%3C/svg%3E") center/contain no-repeat}
.own-note{margin:.6rem 0 0;font-size:.85rem;color:var(--steel)}.own-note b{color:#f2c14e}.own-note.warn b{color:#e2358b}
#try-designs button.own img{object-fit:contain;background:repeating-conic-gradient(#2a2620 0 25%,#1d1a15 0 50%) 0 0/12px 12px}
.dtabs{display:flex;gap:.4rem;overflow-x:auto;padding:.2rem 0 .3rem;margin-top:.6rem;scrollbar-width:thin}
.dtabs button{flex:none;padding:.42rem .8rem;border:1px solid var(--rule);background:transparent;color:inherit;font:600 .72rem "Jost",sans-serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .2s,border-color .2s,color .2s}
.dtabs button small{opacity:.6;font-weight:500;margin-left:.2rem}
.dtabs button[aria-pressed="true"]{background:#C9922E;border-color:#C9922E;color:#161411}
.dtabs button:hover{border-color:#f2c14e}
.chips2.scroll{flex-wrap:nowrap;overflow-x:auto;padding:.3rem .1rem .6rem;scroll-snap-type:x proximity;scrollbar-width:thin}
.chips2.scroll button{flex:none;scroll-snap-align:start}
.designs.collapsed .dcard.more{display:none}
.designs .dcard[hidden]{display:none!important}
/* ===== v3: alive — ink-colored text and buttons that invite the click ===== */
@property --ga{syntax:"<angle>";inherits:false;initial-value:0deg}
.ink,.pod-hero h1 .acc{background:linear-gradient(100deg,#C9922E 0%,#f2c14e 18%,#e2358b 38%,#1fb6e8 58%,#f2c14e 78%,#C9922E 100%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:inkflow 7s linear infinite}
@keyframes inkflow{to{background-position:-260% 0}}
.pod-hero h1 .uline{display:inline;background-image:linear-gradient(100deg,#C9922E,#f2c14e,#e2358b,#1fb6e8,#C9922E),linear-gradient(90deg,#e2358b,#1fb6e8,#f2c14e,#e2358b);background-size:260% 100%,260% 6px;background-repeat:no-repeat;background-position:0 0,0 100%;padding-bottom:.06em;animation:inkflow 7s linear infinite}
.pod-hero h1 .ln:has(.uline)::after,.pod-hero h1 .uline::after{display:none}
.pop{display:inline-block;animation:pop 3.2s ease-in-out infinite}
@keyframes pop{0%,82%,100%{transform:none}88%{transform:scale(1.08) rotate(-2deg)}94%{transform:scale(.98)}}
.btn{position:relative;overflow:hidden;isolation:isolate;transition:transform .25s cubic-bezier(.2,.9,.3,1.4),box-shadow .25s,background-color .25s,color .25s}
.btn::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 48%,transparent 66%);transform:translateX(-120%);transition:none}
.btn:hover::before{transform:translateX(120%);transition:transform .7s ease}
.btn.accent::before{animation:shine 3.6s ease-in-out infinite}
@keyframes shine{0%,60%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
.btn:hover{transform:translateY(-3px);box-shadow:0 12px 26px -10px rgba(201,146,46,.7)}
.btn:active{transform:translateY(0) scale(.96);transition-duration:.08s}
.btn.accent{animation:breathe 2.8s ease-in-out infinite}
@keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(201,146,46,.55)}50%{box-shadow:0 0 0 10px rgba(201,146,46,0)}}
.btn.accent:hover{animation:none;background:linear-gradient(100deg,#C9922E,#f2c14e,#e2358b,#C9922E);background-size:300% 100%;animation:inkflow 2.4s linear infinite;color:#161411}
.btn .ar{display:inline-block;transition:transform .25s}.btn:hover .ar{transform:translateX(5px)}
.btn:not(.accent):hover{border-color:#f2c14e;color:#f2c14e}
[data-count]{background:linear-gradient(100deg,#C9922E,#f2c14e 40%,#fff6dc 50%,#f2c14e 60%,#C9922E);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:inkflow 5s linear infinite}
.badge-price{animation:float 4s ease-in-out infinite}
@keyframes float{50%{transform:translateY(-8px) rotate(-6deg)}}
.pcard{transition:transform .3s,box-shadow .3s,border-color .3s}.pcard:hover{transform:translateY(-6px);border-color:#C9922E;box-shadow:0 18px 40px -18px rgba(226,53,139,.45)}
#r-sum{display:inline-block;transition:transform .2s}#r-sum.bump{animation:bump .45s}
@keyframes bump{40%{transform:scale(1.15);color:#f2c14e}}
@media (prefers-reduced-motion:reduce){.ink,.pod-hero h1 .acc,.pod-hero h1 .uline,[data-count],.btn.accent,.btn.accent::before,.badge-price,.pop{animation:none!important}}

/* ===== v2: a landing that stops the scroll ===== */
.progress{position:fixed;left:0;top:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#C9922E,#F3EBDD);z-index:30}
.pod-hero{isolation:isolate;padding-block:2.2rem 3.4rem;background:radial-gradient(1200px 600px at 78% 12%,rgba(201,146,46,.16),transparent 60%)}
.halftone{position:absolute;inset:-20% -10%;z-index:-2;background-image:radial-gradient(circle,rgba(201,146,46,.30) 1.6px,transparent 1.8px);background-size:24px 24px;-webkit-mask-image:linear-gradient(115deg,transparent 18%,#000 55%,transparent 92%);mask-image:linear-gradient(115deg,transparent 18%,#000 55%,transparent 92%);animation:ht 40s linear infinite}
@keyframes ht{to{background-position:240px 120px}}
.blob{position:absolute;border-radius:50%;filter:blur(46px);opacity:.5;z-index:-1;animation:blobf 11s ease-in-out infinite}
.blob.c{width:240px;height:240px;background:#1fb6e8;left:44%;top:6%;opacity:.28}
.blob.m{width:200px;height:200px;background:#e2358b;right:2%;bottom:6%;opacity:.26;animation-delay:-4s}
.blob.y{width:170px;height:170px;background:#C9922E;left:-3%;bottom:4%;opacity:.35;animation-delay:-7s}
@keyframes blobf{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(26px,-30px) scale(1.14)}}
.reg-mark{position:absolute;width:22px;height:22px;border:1.5px solid var(--magenta);border-radius:50%;opacity:.8}
.reg-mark::before,.reg-mark::after{content:"";position:absolute;background:var(--magenta)}
.reg-mark::before{left:50%;top:-7px;bottom:-7px;width:1.5px;transform:translateX(-50%)}.reg-mark::after{top:50%;left:-7px;right:-7px;height:1.5px;transform:translateY(-50%)}
.reg-mark.a{left:1.2rem;top:6.5rem;animation:spin 18s linear infinite}.reg-mark.b{right:2rem;bottom:3rem;animation:spin 24s linear infinite reverse}
@keyframes spin{to{transform:rotate(360deg)}}
.pod-hero h1{font-size:clamp(2.1rem,5vw,3.7rem);line-height:1}
.pod-hero h1 .ln{display:block;overflow:hidden;padding-bottom:.06em}
.pod-hero h1 .ln>span{display:block;transform:translateY(108%);animation:up .9s cubic-bezier(.2,.8,.2,1) forwards}
.pod-hero h1 .ln:nth-child(2)>span{animation-delay:.12s}.pod-hero h1 .ln:nth-child(3)>span{animation-delay:.24s}
@keyframes up{to{transform:none}}
.uline{background:linear-gradient(var(--magenta),var(--magenta)) no-repeat 0 96%/0 .09em;animation:sweepx 1s .9s cubic-bezier(.2,.8,.2,1) forwards;-webkit-box-decoration-break:clone;box-decoration-break:clone}
@keyframes sweepx{to{background-size:100% .09em}}
.offer{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0 1.3rem}
.offer span{display:inline-flex;align-items:center;gap:.45rem;padding:.4rem .75rem;border:1px solid var(--rule);background:color-mix(in srgb,var(--card) 80%,transparent);font:600 .72rem "Jost",sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:0;transform:translateY(10px);animation:pop .6s forwards}
.offer span:nth-child(1){animation-delay:1s}.offer span:nth-child(2){animation-delay:1.12s}.offer span:nth-child(3){animation-delay:1.24s}.offer span:nth-child(4){animation-delay:1.36s}
.offer i{width:7px;height:7px;border-radius:50%;background:var(--magenta);flex:none}
@keyframes pop{to{opacity:1;transform:none}}
.cta .btn.accent{position:relative;overflow:hidden;box-shadow:0 10px 34px rgba(201,146,46,.35)}
.cta .btn.accent::after{content:"";position:absolute;top:0;bottom:0;width:60%;left:-80%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:shine 3.4s 2s infinite}
@keyframes shine{0%{left:-80%}40%,100%{left:140%}}
.stage{max-width:560px}
.badge-price{position:absolute;right:2%;top:6%;z-index:3;width:116px;height:116px;border-radius:50%;background:var(--magenta);color:var(--on-accent);display:grid;place-content:center;text-align:center;transform:rotate(-10deg);font:700 .62rem/1.15 "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 12px 30px rgba(0,0,0,.45);animation:pulse 2.6s ease-in-out infinite}
.badge-price b{display:block;font:700 1.55rem/1 "Jost",sans-serif;letter-spacing:0;margin:.1rem 0}
@keyframes pulse{0%,100%{transform:rotate(-10deg) scale(1)}50%{transform:rotate(-6deg) scale(1.08)}}
#hero-tee .teefill{transition:fill .7s ease}
#hero-tee .art{opacity:0}
#hero-tee .art.run{opacity:1;clip-path:inset(100% 0 0 0);animation:artin 2.6s .15s cubic-bezier(.5,0,.2,1) forwards}
@keyframes artin{to{clip-path:inset(0 0 0 0)}}
#hero-tee .gantry2{transform:translateY(190px);transform-box:fill-box}
#hero-tee .gantry2.run{animation:gsweep 2.6s .15s cubic-bezier(.5,0,.2,1) forwards}
@keyframes gsweep{0%{transform:translateY(190px)}85%{transform:translateY(-14px)}100%{transform:translateY(-30px);opacity:0}}
.sw{display:flex;gap:.5rem;position:absolute;left:50%;bottom:-.2rem;transform:translateX(-50%)}
.sw i{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--rule);transition:transform .3s,border-color .3s}.sw i.on{transform:scale(1.35);border-color:var(--ink)}
.strip{border-block:1px solid var(--rule);background:var(--card)}
.strip .wrap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem;padding-block:1.4rem}
.strip .n{font:700 clamp(1.6rem,3.6vw,2.4rem)/1 "Jost",sans-serif;color:var(--magenta);font-variant-numeric:tabular-nums}
.strip .l{font:600 .7rem "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);margin-top:.3rem}
.try{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1.6rem;align-items:start}
.try .view{position:relative;border:1px solid var(--ink);background:radial-gradient(circle at 50% 38%,#4a4234,#1b1813 70%);padding:1rem 1rem 1.4rem}
.try .view svg{width:100%;height:auto;display:block;max-height:430px}
#try-tee .teefill{transition:fill .5s ease}#try-art{transition:opacity .35s ease}
.chips2{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem}
.chips2 button{width:64px;height:64px;padding:4px;border:1.5px solid var(--rule);background:repeating-conic-gradient(#e9e8ec 0 25%,#f7f6f8 0 50%) 50%/12px 12px;cursor:pointer;transition:transform .2s,border-color .2s}
.chips2 button img{width:100%;height:100%;object-fit:contain;display:block}
.chips2 button[aria-pressed="true"]{border-color:var(--magenta);transform:translateY(-3px);box-shadow:0 0 0 2px var(--magenta)}
.swatches2{display:flex;gap:.55rem;margin-top:.8rem;align-items:center}
.swatches2 button{width:34px;height:34px;border-radius:50%;border:2px solid var(--rule);cursor:pointer;transition:transform .2s}
.swatches2 button[aria-pressed="true"]{border-color:var(--ink);transform:scale(1.18)}
.try .lbl{font:600 .7rem "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);margin-top:1rem}
.countdown{display:inline-flex;gap:.4rem;align-items:center;font:600 .74rem "Jost",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--steel)}
.tilt{transform-style:preserve-3d;will-change:transform}
.cards3 .pcard,.cards4 .pcard{transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}.pcard:hover{box-shadow:0 18px 40px rgba(0,0,0,.45)}
.bigtext{overflow:hidden;border-block:1px solid var(--rule);padding:.4rem 0}
.bigtext .row{display:flex;gap:3rem;width:max-content;animation:slide 30s linear infinite reverse;font:700 clamp(2.2rem,6vw,4.2rem)/1.1 "Jost",sans-serif;text-transform:uppercase;color:transparent;-webkit-text-stroke:1.5px rgba(243,235,221,.38)}
.bigtext .row b{color:var(--ink);-webkit-text-stroke:0}
@media (max-width:900px){.try{grid-template-columns:minmax(0,1fr)}.try .view{position:static}.strip .wrap{grid-template-columns:repeat(2,minmax(0,1fr))}.badge-price{width:92px;height:92px;font-size:.52rem}.badge-price b{font-size:1.2rem}.reg-mark{display:none}}
@media (prefers-reduced-motion:reduce){.halftone,.blob,.reg-mark,.badge-price,.bigtext .row{animation:none}.pod-hero h1 .ln>span{transform:none;animation:none}.uline{background-size:100% .09em;animation:none}.offer span{opacity:1;transform:none;animation:none}.cta .btn.accent::after{display:none}#hero-tee .art{opacity:1;clip-path:none;animation:none}#hero-tee .gantry2{display:none}}
"""

SCENE = """<svg id="hero-tee" viewBox="0 0 400 420" role="img" aria-label="{alt}">
  <defs><clipPath id="teeclip"><path d="M135 62 L72 92 L92 150 L126 134 L126 330 L274 330 L274 134 L308 150 L328 92 L265 62 C255 92 145 92 135 62 Z"/></clipPath>
  <clipPath id="printarea"><rect x="140" y="112" width="120" height="196"/></clipPath></defs>
  <ellipse cx="200" cy="362" rx="125" ry="11" fill="#000" opacity=".35"/>
  <path class="teefill" fill="#F3EBDD" stroke="#C9922E" stroke-opacity=".55" stroke-width="1.4" d="M135 62 L72 92 L92 150 L126 134 L126 330 L274 330 L274 134 L308 150 L328 92 L265 62 C255 92 145 92 135 62 Z"/>
  <path fill="#000" opacity=".1" d="M126 134 L126 330 L168 330 L168 120 Z"/>
  <path fill="none" stroke="#000" stroke-opacity=".12" d="M135 62 C145 92 255 92 265 62"/>
  <g clip-path="url(#teeclip)"><g clip-path="url(#printarea)"><image id="hero-art" class="art" href="/disenos/ola.webp" x="140" y="112" width="120" height="196" preserveAspectRatio="xMidYMid meet"/></g></g>
  <g class="gantry2" id="hero-gantry" style="transform-origin:200px 70px">
    <rect x="84" y="60" width="232" height="10" rx="5" fill="#2a2620"/><rect x="84" y="60" width="232" height="3" rx="1.5" fill="#C9922E"/>
    <rect x="186" y="50" width="28" height="26" rx="4" fill="#0B0B0B" stroke="#C9922E" stroke-width="2"/>
    <circle cx="193" cy="84" r="2.4" fill="#1fb6e8"/><circle cx="200" cy="84" r="2.4" fill="#e2358b"/><circle cx="207" cy="84" r="2.4" fill="#C9922E"/>
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
    a_min = min(o[k]["blanca"]["1"]["unitFinal"] for k in o)   # the lowest real price: "from" must never promise less or more than the engine
    # cards of garment options
    opts = ""
    for oid in ("regular", "oversized", "economica"):
        name, desc, badge = t["opts"][oid]
        opts += f'<div class="pcard rv"><span class="badge">{esc(badge)}</span><h3>{esc(name)}</h3><p>{esc(desc)}</p><div class="pr">{mx(o[oid]["blanca"]["1"]["unitFinal"])}<small>{esc(t["white"])}</small></div><div class="sub">{mx(o[oid]["color"]["1"]["unitFinal"])} {esc(t["color"].lower())}</div><a class="btn" href="{t["quoter"].replace("prod=pod", "prod=pod&pod=" + oid)}">{esc(t["cta1"])} →</a></div>'
    # packs
    packs = ""
    for pid in ("duo", "creador", "equipo", "evento"):
        name, desc = t["packs"][pid]
        k = pk[pid]["piezas"]; w = pk[pid]["blanca"]
        ship = t["ship_free"] if w["envio"] == 0 and not w.get("cotizar") else f'{t["ship_in"]} {mx(w["envio"])}'
        disc = pk[pid]["desc"]; sub = round(w["unitFinal"] * k, 2)
        packs += f'<div class="pcard rv"><span class="badge">−{disc}% {esc(t["off"])}</span><h3>{esc(name)}</h3><p>{esc(desc)}</p><div class="pr">{mx(w["unitFinal"])}<small>{esc(t["perpc"])}</small></div><div class="sub">{k} {esc(t["pcs"])} × {mx(w["unitFinal"])} = {mx(sub)} · {esc(ship)}<br><b>{esc(L("Total con envío", "Total with shipping"))} {mx(w["total"])}</b> · {esc(L("playera regular blanca, estampado hasta 27 cm", "regular white tee, print up to 27 cm"))}</div><a class="btn" href="{t["quoter"].replace("prod=pod", "prod=pod&pack=" + pid)}">{esc(t["choose"])} →</a></div>'
    # designs
    CATL = {"japones": ("Japonés", "Japanese"), "pintura": ("Pintura", "Painting"), "grabado": ("Grabado y línea", "Engraving"), "animales": ("Animales", "Animals"), "mexico": ("México", "Mexico"), "cartel": ("Carteles", "Posters"), "naturaleza": ("Naturaleza", "Nature")}
    cats = [c for c in CATL if any(d.get("cat") == c for d in DESIGNS)]
    def tabs(target):
        return f'<div class="dtabs" role="group" data-target="{target}"><button type="button" aria-pressed="true" data-cat="">{esc(L("Todos", "All"))} <small>{len(DESIGNS)}</small></button>' + "".join(f'<button type="button" aria-pressed="false" data-cat="{c}">{esc(CATL[c][0] if es else CATL[c][1])} <small>{sum(1 for d in DESIGNS if d.get("cat") == c)}</small></button>' for c in cats) + '</div>'
    tabs_try, tabs_gal = tabs("try-designs"), tabs("gal")
    des = ""
    for i, d in enumerate(DESIGNS):
        des += f'<a class="dcard rv{" more" if i >= 12 else ""}" data-cat="{d.get("cat", "")}" href="{t["studio"]}&design={d["id"]}" aria-label="{esc(t["d_use"])}: {esc(d["es"] if es else d["en"])}"><span class="ph"><img src="/disenos/{d["id"]}-s.webp" alt="" loading="lazy" width="150" height="150"></span><span class="t"><b>{esc(d["es"] if es else d["en"])}</b><small>{esc(d["autor"])}, {esc(d["anio"])}</small><em>{esc(t["d_pd"])} · {esc(t["d_use"])} →</em></span></a>'
    design_chips = "".join(f'<button type="button" data-cat="{d.get("cat", "")}" data-id="{d["id"]}" data-dark="{1 if d["id"] == "rinoceronte" else 0}" aria-pressed="{"true" if i == 0 else "false"}" title="{esc(d["es"] if es else d["en"])}"><img src="/disenos/{d["id"]}-s.webp" alt="{esc(d["es"] if es else d["en"])}" width="56" height="56"></button>' for i, d in enumerate(DESIGNS))
    marquee_items = [(d["es"] if es else d["en"]) for d in DESIGNS] + [L("Desde 1 pieza", "From 1 piece"), L("DTG a todo color", "Full-color DTG"), L("Envío a todo México", "Shipping across Mexico"), L("Sin mínimos", "No minimums")]
    mq = "".join(f"<span>{esc(x)}</span>" for x in marquee_items * 2)
    bigrow = "".join(f"<b>{esc(w)}</b><span>{esc(x)}</span>" for w, x in ((L("Diseña", "Design"), L("Imprime", "Print")), (L("Recibe", "Receive"), L("Repite", "Repeat")))) * 4
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
         "offers": {"@type": "AggregateOffer", "priceCurrency": "MXN", "lowPrice": f"{a_min:.2f}", "highPrice": f"{o['oversized']['color']['1']['unitFinal']:.2f}", "offerCount": 6, "availability": "https://schema.org/InStock", "url": url, "seller": {"@id": SITE + "/#chilian"},
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

  // scroll progress bar
  var bar=$("#prog");addEventListener("scroll",function(){var h=document.documentElement;bar.style.transform="scaleX("+(h.scrollTop/(h.scrollHeight-h.clientHeight||1))+")"},{passive:true});
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  // count-up numbers
  var cio=("IntersectionObserver" in window)?new IntersectionObserver(function(en){en.forEach(function(e){if(!e.isIntersecting)return;cio.unobserve(e.target);var el=e.target,to=+el.dataset.count,suf=el.dataset.suf||"",t0=null;function f(ts){t0=t0||ts;var k=Math.min(1,(ts-t0)/1300),v=Math.round(to*(1-Math.pow(1-k,3)));el.textContent=(el.dataset.sep?v.toLocaleString(es?"es-MX":"en-US"):v)+suf;if(k<1&&!reduce)requestAnimationFrame(f)}requestAnimationFrame(f)})},{threshold:.6}):null;
  document.querySelectorAll("[data-count]").forEach(function(el){if(cio&&!reduce)cio.observe(el);else el.textContent=(el.dataset.sep?(+el.dataset.count).toLocaleString():el.dataset.count)+(el.dataset.suf||"")});


  // alive: last words of each heading in ink, prices that bump when they change, arrows on the main buttons, magnetic CTAs
  document.querySelectorAll("main h2, section h2").forEach(function(h){if(h.querySelector(".ink"))return;var w=h.textContent.trim().split(" ");if(w.length<3)return;var k=w.length>5?2:1;h.innerHTML="";h.append(w.slice(0,-k).join(" ")+" ");var sp=document.createElement("span");sp.className="ink";sp.textContent=w.slice(-k).join(" ");h.appendChild(sp)});
  document.querySelectorAll(".btn.accent").forEach(function(b){if(!b.querySelector(".ar")&&!/→/.test(b.textContent)){var a=document.createElement("span");a.className="ar";a.textContent=" →";b.appendChild(a)}});
  var sumEl=$("#r-sum");if(sumEl)new MutationObserver(function(){sumEl.classList.remove("bump");void sumEl.offsetWidth;sumEl.classList.add("bump")}).observe(sumEl,{childList:true,characterData:true,subtree:true});
  if(!reduce&&matchMedia("(hover:hover)").matches)document.querySelectorAll(".btn.accent").forEach(function(b){b.addEventListener("mousemove",function(e){var r=b.getBoundingClientRect();b.style.transform="translate("+((e.clientX-r.left-r.width/2)*.18)+"px,"+((e.clientY-r.top-r.height/2)*.3-3)+"px)"});b.addEventListener("mouseleave",function(){b.style.transform=""})});
  document.querySelectorAll(".chips span,.offer span,.chip").forEach(function(c,i){c.style.animationDelay=(i*.4)+"s"});
  // design categories: the same tabs filter the fitting room row and the gallery
  document.querySelectorAll(".dtabs").forEach(function(tb){var box=document.getElementById(tb.dataset.target);tb.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;tb.querySelectorAll("button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});var c=b.dataset.cat;
    if(box.id==="gal"&&c)box.classList.remove("collapsed");box.querySelectorAll("[data-cat]").forEach(function(x){x.hidden=!!c&&x.dataset.cat!==c&&!x.classList.contains("own")});if(box.id==="gal"){var m=$("#gal-more");if(m)m.hidden=!!c||!box.classList.contains("collapsed")}box.scrollLeft=0})});
  var gm=$("#gal-more");if(gm)gm.addEventListener("click",function(){$("#gal").classList.remove("collapsed");gm.hidden=true});
  // ===== photoreal mockup engine =====
  // A real photo of a white tee (/blanks/tee-front.webp): the garment is recolored through its shade map so folds and seams stay,
  // and the design is multiplied by the same shade so it follows the fabric. Everything is cached per color and design.
  var MK=(function(){
    var S=900,BOX=[300,190,598,570],ready=false,waiting=[],al,s2,gc={},lc={},imgs={};
    function hex(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)]}
    function init(cb){if(ready)return cb();waiting.push(cb);if(init.p)return;init.p=1;
      var im=new Image();im.onload=function(){var c=document.createElement("canvas");c.width=c.height=S;var x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0,S,S);var d=x.getImageData(0,0,S,S).data,n=S*S,lum=new Float32Array(n),sum=0,cnt=0;al=new Uint8Array(n);
        for(var i=0;i<n;i++){al[i]=d[i*4+3];var l=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;lum[i]=l;if(al[i]>200){sum+=l;cnt++}}
        var mean=sum/cnt;s2=new Float32Array(n);for(var j=0;j<n;j++){var v=1+(lum[j]/mean-1)*2.2;s2[j]=v<.55?.55:v>1.25?1.25:v}
        ready=true;waiting.forEach(function(f){f()});waiting=[]};im.src="/blanks/tee-front.webp"}
    function garment(h){if(gc[h])return gc[h];var c=document.createElement("canvas");c.width=c.height=S;var x=c.getContext("2d"),id=x.createImageData(S,S),o=id.data,k=hex(h),lc_=(k[0]*.3+k[1]*.59+k[2]*.11)/255,lift=70*(1-lc_);
      for(var i=0;i<S*S;i++){var s=s2[i],a=al[i],p=i*4,e=(s-1)*lift;var r=k[0]*s+e,g=k[1]*s+e,b=k[2]*s+e;o[p]=r<0?0:r>255?255:r;o[p+1]=g<0?0:g>255?255:g;o[p+2]=b<0?0:b>255?255:b;o[p+3]=a}
      x.putImageData(id,0,0);return gc[h]=c}
    var q={};function loadArt(id,cb){var im=imgs[id];if(im&&im.complete&&im.naturalWidth)return cb(im);(q[id]=q[id]||[]).push(cb);if(im)return;im=imgs[id]=new Image();im.onload=function(){var l=q[id];q[id]=[];l.forEach(function(f){f(im)})};im.src="/disenos/"+id+".webp"}
    function layer(id,cb,sc){sc=sc||1;var key=id+"@"+sc;if(lc[key])return cb(lc[key]);loadArt(id,function(art){var bw=(BOX[2]-BOX[0])*sc,bh=(BOX[3]-BOX[1])*sc,k=Math.min(bw/art.naturalWidth,bh/art.naturalHeight),w=Math.max(1,Math.round(art.naturalWidth*k)),h=Math.max(1,Math.round(art.naturalHeight*k)),x0=BOX[0]+Math.floor((BOX[2]-BOX[0]-w)/2),y0=BOX[1];
      var t=document.createElement("canvas");t.width=w;t.height=h;var tx=t.getContext("2d",{willReadFrequently:true});tx.drawImage(art,0,0,w,h);var ad=tx.getImageData(0,0,w,h),a=ad.data;
      for(var y=0;y<h;y++)for(var x=0;x<w;x++){var gi=(y0+y)*S+(x0+x),s=s2[gi];s=s>1.06?1.06:s;var p=(y*w+x)*4;a[p]*=s*.97;a[p+1]*=s*.97;a[p+2]*=s*.97;a[p+3]=a[p+3]*(al[gi]/255)}
      tx.putImageData(ad,0,0);var c=document.createElement("canvas");c.width=c.height=S;c.getContext("2d").drawImage(t,x0,y0);lc[key]={c:c,top:y0,bottom:y0+h,left:x0,right:x0+w};cb(lc[key])})}
    // cfg: {color, design, reveal 0..1, alpha, dx, dy, t}
    function draw(ctx,cfg,L,parts){ctx.clearRect(0,0,S,S);var g=ctx.createRadialGradient(450,860,10,450,860,330);g.addColorStop(0,"rgba(0,0,0,.5)");g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.save();ctx.translate(cfg.dx||0,cfg.dy||0);ctx.globalAlpha=cfg.alpha==null?1:cfg.alpha;ctx.save();ctx.translate(0,860);ctx.scale(1,.12);ctx.translate(0,-860);ctx.fillStyle=g;ctx.fillRect(100,520,700,700);ctx.restore();
      ctx.drawImage(garment(cfg.color),0,0);
      if(L&&cfg.reveal>0){var ry=L.top+(L.bottom-L.top)*cfg.reveal;ctx.save();ctx.beginPath();ctx.rect(0,0,S,ry);ctx.clip();ctx.drawImage(L.c,0,0);ctx.restore();
        if(cfg.reveal<1){var cx=(L.left+L.right)/2,hw=(L.right-L.left)/2+22,hx=cx+Math.sin((cfg.t||0)/95)*hw*.82;ctx.save();ctx.shadowColor="#C9922E";ctx.shadowBlur=22;ctx.fillStyle="#C9922E";ctx.fillRect(cx-hw,ry-1.5,hw*2,3);ctx.shadowBlur=0;
          ctx.fillStyle="#161411";ctx.strokeStyle="#C9922E";ctx.lineWidth=3;ctx.beginPath();ctx.rect(hx-26,ry-46,52,40);ctx.fill();ctx.stroke();ctx.fillStyle="#1fb6e8";ctx.fillRect(hx-18,ry-10,8,6);ctx.fillStyle="#e2358b";ctx.fillRect(hx-4,ry-10,8,6);ctx.fillStyle="#f2c14e";ctx.fillRect(hx+10,ry-10,8,6);
          if(parts){for(var i=0;i<3;i++)parts.push({x:hx+(i-1)*12,y:ry,v:1+Math.random()*1.5,a:1,c:["#1fb6e8","#e2358b","#f2c14e"][i]})}ctx.restore()}}
      if(parts){for(var k=parts.length-1;k>=0;k--){var p=parts[k];p.y+=p.v;p.a-=.045;if(p.a<=0){parts.splice(k,1);continue}ctx.globalAlpha=p.a;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,2.4,0,6.3);ctx.fill()}ctx.globalAlpha=1}
      ctx.restore()}
    return {init:init,layer:layer,draw:draw,own:function(img){imgs.own=img;for(var k in lc)if(k.indexOf("own@")===0)delete lc[k]}}
  })();
  // hero: one printer, one real tee, four prints in a row (garment slides in, the head prints, it holds, the next one arrives)
  var HERO=[["medusas","#161411",es?"Medusas · Ernst Haeckel":"Jellyfish · Ernst Haeckel"],["ola","#F3EBDD",es?"La gran ola · Hokusai":"The Great Wave · Hokusai"],["rinoceronte","#E7DBC6",es?"Rinoceronte · Albrecht Dürer":"Rhinoceros · Albrecht Dürer"],["estrellada","#1B2A49",es?"Noche estrellada · Vincent van Gogh":"Starry Night · Vincent van Gogh"],["fuji","#161411",es?"Fuji rojo · Hokusai":"Red Fuji · Hokusai"],["girasoles","#F3EBDD",es?"Girasoles · Vincent van Gogh":"Sunflowers · Vincent van Gogh"],["mucha","#E7DBC6",es?"Zodiaco · Alphonse Mucha":"Zodiac · Alphonse Mucha"]];
  var heroMock=$("#hero-mock"),heroCv=$("#hero-canvas");
  if(heroCv){var hx=heroCv.getContext("2d"),dots=document.querySelectorAll(".stage .sw i"),cap=$("#hero-cap"),parts=[],visible=true,t0=0,idx=0,Ls=[];
    new IntersectionObserver(function(e){visible=e[0].isIntersecting}).observe(heroMock);
    MK.init(function(){var n=0;HERO.forEach(function(h,i){MK.layer(h[0],function(L){Ls[i]=L;if(++n===HERO.length)start()})});
      function start(){dots.forEach(function(d,i){d.classList.toggle("on",i===0)});
        if(reduce){MK.draw(hx,{color:HERO[0][1],reveal:1},Ls[0]);heroMock.classList.add("ready");cap.textContent=HERO[0][2];return}
        t0=performance.now();heroMock.classList.add("ready");
        (function frame(now){requestAnimationFrame(frame);if(!visible||document.hidden){t0+=16;return}
          var t=now-t0,T=6400,c=idx%HERO.length;if(t>=T){t0=now;idx++;c=idx%HERO.length;t=0;parts.length=0;dots.forEach(function(d,i){d.classList.toggle("on",i===c)});cap.textContent=HERO[c][2]}
          var enter=Math.min(1,t/650),pr=Math.max(0,Math.min(1,(t-650)/2600)),ex=t>5700?Math.min(1,(t-5700)/700):0,e1=1-Math.pow(1-enter,3);pr=1-Math.pow(1-pr,2);
          MK.draw(hx,{color:HERO[c][1],reveal:pr,alpha:e1*(1-ex),dx:(1-e1)*60-ex*60,dy:0,t:t},Ls[c],parts)})(t0)}});
    cap.textContent=HERO[0][2]}
  // fitting room: design + color drive the mockup, the links and the price
  var tryCv=$("#try-canvas"),COLORS=[["blanca","#F3EBDD",es?"Blanca":"White"],["color","#161411",es?"Negra":"Black"],["color","#1B2A49",es?"Marino":"Navy"],["color","#8e1f2b",es?"Roja":"Red"],["color","#3e4a35",es?"Militar":"Olive"]],curDesign="ola",curColor=0,DN={};
  document.querySelectorAll("#try-designs button").forEach(function(b){DN[b.dataset.id]=b.title});
  if(tryCv){var tx=tryCv.getContext("2d"),tmock=tryCv.parentNode,anim=0,tcap=$("#try-cap"),tparts=[];
    var render=function(replay){MK.init(function(){var sc=curDesign==="own"?Math.min(1.25,Math.max(.25,(+$("#c-size").value)/40)):1;MK.layer(curDesign,function(L){cancelAnimationFrame(anim);var st=performance.now();tcap.textContent=(DN[curDesign]||"")+" · "+COLORS[curColor][2];
      if(reduce||!replay){MK.draw(tx,{color:COLORS[curColor][1],reveal:1},L);tmock.classList.add("ready");return}
      (function f(now){var k=Math.min(1,(now-st)/1000);MK.draw(tx,{color:COLORS[curColor][1],reveal:1-Math.pow(1-k,2),alpha:1,t:now-st},L,tparts);tmock.classList.add("ready");if(k<1)anim=requestAnimationFrame(f);else{tparts.length=0;MK.draw(tx,{color:COLORS[curColor][1],reveal:1},L)}})(st)},sc)})};
    new IntersectionObserver(function(e,o){if(e[0].isIntersecting){o.disconnect();render(true)}},{rootMargin:"200px"}).observe(tmock);
    var sw=$("#try-colors");COLORS.forEach(function(c,i){var b=document.createElement("button");b.type="button";b.style.background=c[1];b.title=c[2];b.setAttribute("aria-label",c[2]);b.setAttribute("aria-pressed",String(i===0));b.addEventListener("click",function(){curColor=i;$("#c-color").value=c[0];sw.querySelectorAll("button").forEach(function(x,k){x.setAttribute("aria-pressed",String(k===i))});render(false);calc();links()});sw.appendChild(b)});
    document.querySelectorAll("#try-designs button").forEach(function(b){b.addEventListener("click",function(){curDesign=b.dataset.id;document.querySelectorAll("#try-designs button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});render(true);links()})});
    // own design: preview on the real tee, size suggested from its proportions, price from the quoter engine, file handed to the studio
    var ownFile=$("#own-file"),ownUp=$("#own-up"),note=$("#own-note");
    function useOwn(f){if(!f||!/^image\\//.test(f.type)){note.hidden=false;note.className="own-note warn";note.innerHTML="<b>"+(es?"Ese archivo no es una imagen.":"That file is not an image.")+"</b> PNG, JPG, SVG, WebP.";return}
      var url=URL.createObjectURL(f),img=new Image();img.onload=function(){MK.own(img);
        var chip=document.querySelector('#try-designs button.own');if(!chip){chip=document.createElement("button");chip.type="button";chip.className="own";chip.dataset.id="own";chip.innerHTML='<img alt="" width="56" height="56">';$("#try-designs").prepend(chip);chip.addEventListener("click",function(){pick(chip)})}
        chip.title=DN.own=(es?"Tu diseño":"Your design");chip.querySelector("img").src=url;
        var px=Math.max(img.naturalWidth,img.naturalHeight),cm=+$("#c-size").value,dpi=Math.round(px/(cm/2.54));
        note.hidden=false;note.className="own-note"+(dpi<150?" warn":"");
        note.innerHTML=(es?"Cotizado con tu diseño a ":"Priced with your design at ")+"<b>"+cm+" cm</b>"+(es?" por su lado más largo. Cambia la medida abajo y el precio se ajusta. ":" on its longest side. Change the size below and the price updates. ")+(dpi<150?"<b>"+(es?"Resolución baja ("+dpi+" ppp): súbelo más grande para que salga nítido.":"Low resolution ("+dpi+" dpi): upload a larger file for a sharp print.")+"</b>":(es?"Resolución buena ("+dpi+" ppp).":"Good resolution ("+dpi+" dpi)."));
        try{var rq=indexedDB.open("chilian-hand",1);rq.onupgradeneeded=function(){rq.result.createObjectStore("f")};rq.onsuccess=function(){var tx=rq.result.transaction("f","readwrite");tx.objectStore("f").put(f,"own");}}catch(e){}
        pick(chip)};img.src=url}
    function pick(b){curDesign=b.dataset.id;document.querySelectorAll("#try-designs button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});render(true);links();calc()}
    ownFile.addEventListener("change",function(){useOwn(ownFile.files[0])});
    ["dragover","dragenter"].forEach(function(t){ownUp.addEventListener(t,function(e){e.preventDefault();ownUp.classList.add("drag")})});
    ["dragleave","drop"].forEach(function(t){ownUp.addEventListener(t,function(){ownUp.classList.remove("drag")})});
    ownUp.addEventListener("drop",function(e){e.preventDefault();useOwn(e.dataTransfer.files[0])});
    $("#c-size").addEventListener("change",function(){if(curDesign==="own"){useOwnNoteRefresh();render(false)}});
    function useOwnNoteRefresh(){var im=document.querySelector('#try-designs button.own img');if(!im)return;var i2=new Image();i2.onload=function(){var cm=+$("#c-size").value,dpi=Math.round(Math.max(i2.naturalWidth,i2.naturalHeight)/(cm/2.54));note.className="own-note"+(dpi<150?" warn":"");note.innerHTML=(es?"Cotizado con tu diseño a ":"Priced with your design at ")+"<b>"+cm+" cm</b>. "+(dpi<150?"<b>"+(es?"Resolución baja ("+dpi+" ppp) para esta medida.":"Low resolution ("+dpi+" dpi) for this size.")+"</b>":(es?"Resolución buena ("+dpi+" ppp).":"Good resolution ("+dpi+" dpi)."))};i2.src=im.src}
    function links(){var s=$("#c-studio"),base=s.dataset.b||(s.dataset.b=s.getAttribute("href"));s.href=base+(base.indexOf("?")>-1?"&":"?")+"design="+curDesign+"&qty="+Math.max(1,parseInt($("#c-qty").value,10)||1)}links()}
  // cards lean toward the pointer
  if(!reduce&&matchMedia("(hover:hover)").matches)document.querySelectorAll(".pcard,.dcard").forEach(function(c){c.classList.add("tilt");c.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform="perspective(700px) rotateY("+(x*7)+"deg) rotateX("+(-y*7)+"deg) translateY(-4px)"});c.addEventListener("pointerleave",function(){c.style.transform=""})});
  $("#c-qty").addEventListener("input",function(){var pk=$("#c-pack").value;if(pk&&this.value!==$("#c-pack").selectedOptions[0].dataset.q)$("#c-pack").value=""});
  $("#c-pack").addEventListener("change",function(){var o=this.selectedOptions[0];if(o&&o.dataset.q)$("#c-qty").value=o.dataset.q});
  ["c-tee","c-color","c-size","c-pack","c-qty","c-dest"].forEach(function(id){var el=$("#"+id);if(el){el.addEventListener("input",calc);el.addEventListener("change",calc)}});$("#c-qty").addEventListener("input",function(){try{links()}catch(e){}});
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
<div class="progress" id="prog"></div>
<header><div class="wrap">
  <a class="logo" href="{t['home']}" aria-label="Grupo Chilian"><img src="/logos/chilian-logo-header.png" alt="" width="36" height="36"><i aria-hidden="true"></i></a>
  <nav aria-label="{L('Principal', 'Main')}"><a class="opt" href="#precios">{esc(t['cta2'])}</a><a class="opt" href="#disenos">{esc(t['designs_k'])}</a><a class="btn accent" href="{t['studio']}">{esc(t['cta1'])}</a></nav>
</div></header>
<main>
  <section class="pod-hero"><div class="halftone"></div><span class="blob c"></span><span class="blob m"></span><span class="blob y"></span><span class="reg-mark a"></span><span class="reg-mark b"></span><div class="wrap">
    <div>
      <p class="kicker">{esc(t['kicker'])}</p>
      <h1><span class="ln"><span>{esc(t['h1a'])}</span></span><span class="ln"><span class="acc">{esc(t['h1b'].rsplit(' ', 1)[0])} <span class="uline">{esc(t['h1b'].rsplit(' ', 1)[1])}</span></span></span><span class="ln"><span>{esc(t['h1c'])}</span></span></h1>
      <div class="offer"><span><i></i>{esc(t['from_'])} {mx(a_min)} {esc(t['vat'])}</span><span><i></i>{esc(L('Sin mínimos', 'No minimums'))}</span><span><i></i>{esc(L('Envío a todo México', 'Shipping across Mexico'))}</span><span><i></i>{esc(L('Producción en 4 días hábiles', 'Production in 4 business days'))}</span></div>
      <p class="lead">{esc(t['lead'])}</p>
      <div class="cta"><a class="btn accent" href="{t['studio']}">{esc(t['cta1'])} →</a><a class="btn" href="#probador">{esc(L('Pruébala y ve tu precio', 'Try it and see your price'))}</a></div>
    </div>
    <div class="stage">
      <div class="badge-price" aria-hidden="true">{esc(t['from_'])}<b>{mx(a_min)}</b>{esc(t['vat'])}</div>
      <div class="mock" id="hero-mock" role="img" aria-label="{esc(L('Una playera real con un diseño famoso impreso en DTG a todo color', 'A real T-shirt with a famous design printed in full-color DTG'))}">
        <img class="poster" src="/pod-assets/hero-poster.webp" alt="" width="900" height="900" fetchpriority="high" decoding="async">
        <canvas id="hero-canvas" width="900" height="900" aria-hidden="true"></canvas>
      </div>
      <div class="mock-cap"><span class="live-dot"></span><span id="hero-cap">{esc(L('Impresión DTG a todo color', 'Full-color DTG printing'))}</span></div>
      <div class="sw" aria-hidden="true"><i style="background:#161411"></i><i style="background:#F3EBDD"></i><i style="background:#E7DBC6"></i><i style="background:#1B2A49"></i><i style="background:#161411"></i><i style="background:#F3EBDD"></i><i style="background:#E7DBC6"></i></div>
    </div>
  </div></section>
  <div class="strip"><div class="wrap">
    <div><div class="n" data-count="35" data-suf="+">0</div><div class="l">{esc(L('años de experiencia', 'years of experience'))}</div></div>
    <div><div class="n" data-count="20000" data-sep="1">0</div><div class="l">{esc(L('piezas al día de capacidad', 'pieces a day of capacity'))}</div></div>
    <div><div class="n" data-count="1">0</div><div class="l">{esc(L('pieza basta para empezar', 'piece is enough to start'))}</div></div>
    <div><div class="n" data-count="4">0</div><div class="l">{esc(L('días hábiles de producción', 'business days of production'))}</div></div>
  </div></div>
  <section class="b" id="probador"><div class="wrap"><p class="kicker">{esc(t['calc_k'])}</p><h2>{esc(L('Pruébala y ve tu precio al momento', 'Try it and see your price instantly'))}</h2>
    <div class="try" style="margin-top:1.4rem">
      <div>
        <div class="view" id="try-view">
          <div class="mock" role="img" aria-label="{esc(L('Vista previa de tu playera', 'Preview of your T-shirt'))}"><img class="poster" src="/pod-assets/try-poster.webp" alt="" width="560" height="560" loading="lazy" decoding="async"><canvas id="try-canvas" width="900" height="900" aria-hidden="true"></canvas></div>
          <div class="mock-cap"><span id="try-cap"></span></div>
        </div>
        <div class="lbl">{esc(L('1. Tu diseño', '1. Your design'))}</div>
        <div class="own-row"><label class="own-up" id="own-up"><input type="file" id="own-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden><span class="own-ic" aria-hidden="true"></span><span><b>{esc(L('Sube tu propio diseño', 'Upload your own design'))}</b><small>{esc(L('PNG, JPG, SVG o WebP. Lo cotizamos con los precios del cotizador.', 'PNG, JPG, SVG or WebP. We price it with the quoter prices.'))}</small></span></label></div>
        <p class="own-note" id="own-note" hidden></p>
        <div class="lbl">{esc(L('O elige un diseño libre de uso', 'Or pick a free-to-use design'))}</div>
        {tabs_try}<div class="chips2 scroll" id="try-designs">{design_chips}</div>
        <div class="lbl">{esc(L('2. Elige el color', '2. Pick the color'))}</div>
        <div class="swatches2" id="try-colors"></div>
      </div>
      <div>
        <div class="form">
          <label>{esc(t['c_tee'])}<select id="c-tee">{tee_opts}</select></label>
          <input type="hidden" id="c-color" value="blanca">
          <label>{esc(t['c_qty'])}<input id="c-qty" type="number" inputmode="numeric" min="1" max="200" value="1"></label>
          <label class="full">{esc(t['c_size'])}<select id="c-size">{size_opts}</select></label>
          <label>{esc(t['c_pack'])}<select id="c-pack">{pack_opts}</select></label>
          <label>{esc(t['c_dest'])}<select id="c-dest"><option value="mx">{esc(t['c_mx'])}</option><option value="intl">{esc(t['c_intl'])}</option></select></label>
        </div>
        <div class="res" aria-live="polite" style="margin-top:1rem">
          <div><span class="kicker">{esc(t['c_unit'])}</span><div class="big" id="r-unit">{mx(a_from)}</div></div>
          <div class="row"><span>{esc(t['c_total'])}</span><b id="r-total">{mx(a_from)}</b></div>
          <div class="row"><span>{esc(t['c_ship'])}</span><b id="r-ship" data-f="{esc(t['c_free'])}" data-q="{esc(t['c_quote'])}">{mx(env['mx'][0][1])}</b></div>
          <div class="row"><span><b>{esc(L('Total con envío', 'Total with shipping'))}</b></span><b id="r-sum">{mx(a_from + env['mx'][0][1])}</b></div>
          <p class="note" id="r-big" hidden>{esc(L('Con tantas piezas la serigrafía sale más barata: el cotizador te muestra el ahorro.', 'At this volume screen printing is cheaper: the quoter shows the saving.'))}</p>
          <p class="note">{esc(t['c_note'])}</p>
          <a class="btn accent" id="c-studio" href="{t['studio']}">{esc(L('Diseñar mi playera con este diseño', 'Design my T-shirt with this design'))} →</a>
          <a class="btn" id="c-go" data-base="{t['quoter'].split('#')[0]}" href="{t['quoter']}">{esc(t['c_go'])} →</a>
        </div>
      </div>
    </div></div></section>
  <div class="marquee" aria-hidden="true"><div class="row">{mq}</div></div>
  <section class="b"><div class="wrap"><p class="kicker">{esc(t['how_k'])}</p><h2>{esc(t['how_h'])}</h2><div class="steps4">{steps}</div></div></section>
  <section class="b" id="precios"><div class="wrap"><p class="kicker">{esc(t['pick_k'])}</p><h2>{esc(t['pick_h'])}</h2><div class="cards3" style="margin-top:1.4rem">{opts}</div><p class="note" style="margin-top:.9rem;color:var(--steel);font-size:.84rem">{esc(t['pick_note'])}</p></div></section>
  <section class="b"><div class="wrap"><p class="kicker">{esc(t['packs_k'])}</p><h2>{esc(t['packs_h'])}</h2><div class="cards4" style="margin-top:1.4rem">{packs}</div></div></section>
  <section class="b" id="disenos"><div class="wrap"><p class="kicker">{esc(t['designs_k'])}</p><h2>{esc(t['designs_h'])}</h2><p style="color:var(--steel);max-width:62ch">{esc(t['designs_p'])}</p>{tabs_gal}<div class="designs collapsed" id="gal" style="margin-top:1rem">{des}</div><div style="text-align:center;margin-top:1.2rem"><button type="button" class="btn" id="gal-more">{esc(L(f'Ver los {len(DESIGNS)} diseños', f'See all {len(DESIGNS)} designs'))}</button></div></div></section>
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
