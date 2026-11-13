"""Landing pages by buyer and search intent (wholesale and retail), from facts already on the site.

Run:  python3 tools/seo/build_landings.py   (after build_seo.py; it rewrites sitemap.xml with every page)

Each page: its own title, description and H1 for one search intent, the facts that buyer
needs (capacity, audits, minimums, process, prices when published), a quote button that opens
the quoter with the project type already chosen, the right advisor's WhatsApp, the online store
for small retail purchases, links to the sibling pages, and schema.org (Service or Product,
BreadcrumbList, FAQPage). Nothing here is invented: every fact is published on the home page.
"""
import json, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = "https://chilian.vercel.app"
STORE = "https://grupochilian.com.mx/collections/all"
CAMPAIGN_PDF = "https://cdn.shopify.com/s/files/1/0716/8802/8409/files/CAMPANAS_POLITICAS_VENTA.pdf"
E = html.escape
WA = {"marca": "522226925404", "uniformes": "522201759053", "merch": "522226512650", "promo": "522201759053", "usa": "525525599348"}
AUDITS = "Walt Disney FAMA, WRAP, VF Corporation, C&A, SMETA (Sedex), Walmart y ChemIQ"
AUDITS_EN = "Walt Disney FAMA, WRAP, VF Corporation, C&A, SMETA (Sedex), Walmart and ChemIQ"
BRANDS = "Carhartt, The North Face, Vans, Supreme, Marvel, Bluey, Minecraft, Snoopy y Tom and Jerry"
# Print on Demand and campaign prices: final price per piece (VAT 16 % + online payment fee 5 % included), from the site's
# own price engine (api/_pricing.js quote). Regenerate them when the lists change.
POD_TIERS = [("Económica · 50/50", [(1, 177.54, 234.98), (5, 139.78, 181.38), (12, 128.82, 164.33), (50, 101.56, 141.11), (100, 94.61, 134.98)]),
             ("Regular · 100 % algodón", [(1, 182.18, 236.45), (5, 144.42, 182.86), (12, 133.46, 165.81), (50, 105.88, 142.49), (100, 98.79, 136.32)]),
             ("Oversized", [(1, 187.29, 244.64), (5, 149.53, 191.04), (12, 138.57, 173.99), (50, 110.66, 150.13), (100, 103.40, 143.69)])]
CAMP_TIERS = [(500, 66.22, 86.53), (1000, 59.19, 76.45), (10000, 58.22, 74.75)]
TIERS = [("100–299", 310.80, 334.78), ("300–999", 199.80, 206.02), ("1,000–2,999", 177.60, 180.26), ("3,000–9,999", 155.40, 180.26), ("10,000+", 133.20, 154.51)]

PAGES = [
  dict(slug="maquila-serigrafia-para-marcas", lang="es", tipo="marca",
       title="Maquila de serigrafía para marcas y licencias en México · Chilian",
       desc="Maquila de estampado y confección para marcas, OEM y producto licenciado, desde 600 piezas. Planta auditada (Disney FAMA, WRAP, SMETA, Walmart) en Puebla.",
       h1="Maquila de serigrafía para marcas y licencias", kicker="Marcas · OEM · Licencias",
       lead="Estampamos sobre tu prenda o la nuestra, o hacemos el paquete completo desde la tela, en una planta auditada en Puebla, México.",
       img="planta-pulpos-automaticos", img_alt="Pulpos automáticos de serigrafía en la nave de impresión de Chilian",
       blocks=[("Hecha para programas de marca", ["Hasta 20,000 piezas al día con 8 pulpos automáticos Roq y M&R.", "Marcas y OEM desde 600 piezas.", "Efectos especiales: alta densidad, puff, discharge, glitter, base agua y full print.", "Atención en inglés y contacto dedicado en EE. UU."]),
               ("Auditorías que tu equipo de cumplimiento ya conoce", [f"{AUDITS}.", "Aprobaciones de cumplimiento social 2026 de SMETA, Walmart, C&A y Disney FAMA: los estándares que piden cadenas como Walmart, Amazon, Costco, Disney, Carhartt, Nike y adidas.", f"En nuestra planta se han estampado marcas y licencias como {BRANDS}."]),
               ("Decorado o paquete completo", ["Estampamos tu prenda lisa.", "O cortamos, cosemos, teñimos y estampamos desde la tela: corte de precisión en punto y plano, costura, bordado plano y 3D, stone wash y enzimáticos."]),
               ("Cómo corre un pedido", ["Brief: prenda, cantidad, técnica, fecha y tu arte.", "Propuesta: prenda y técnica recomendadas, con precio por volumen.", "Muestra física de preproducción con tu arte real. Nada entra a producción sin una muestra aprobada.", "Producción en el pulpo que mejor va con tu tiraje y colores.", "Entrega revisada, doblada y empacada; envíos nacionales e internacionales."])],
       faq=[0, 1, 2, 3, 4, 5], related=["uniformes-empresariales", "playeras-personalizadas-mayoreo", "contract-screen-printing-mexico"]),
  dict(slug="uniformes-empresariales", lang="es", tipo="uniformes",
       title="Uniformes empresariales bordados y estampados en Puebla · Chilian",
       desc="Uniformes corporativos e industriales: polos, camisas, pantalón de trabajo y sudaderas con bordado, estampado y etiqueta propia. Reposiciones del mismo color y corte.",
       h1="Uniformes empresariales e industriales", kicker="Corporativo · Industrial",
       lead="Polos, camisas, pantalón de trabajo y sudaderas con tu logo bordado o estampado, y reposiciones con el mismo color y corte.",
       img="uniformes", img_alt="Uniformes corporativos con logo bordado hechos en la planta de Chilian",
       blocks=[("Lo que incluye un programa de uniformes", ["Polos, camisas, pantalón de trabajo y sudaderas.", "Bordado, estampado y etiqueta propia.", "Reposiciones con el mismo color y corte.", "Una asesora que da seguimiento a tu proyecto."]),
               ("Tres líneas de prenda", ["Básica: volumen con buena relación costo–beneficio; eventos, promociones y uniforme operativo.", "Clásica: balance entre calidad, comodidad y durabilidad para uso diario; uniforme empresarial y equipos.", "Premium: materiales superiores, acabados finos y mayor valor percibido."]),
               ("Bordado y estampado en la misma planta", ["Bordadora de 6 cabezas para bordado plano, 3D y parches.", "Serigrafía en 8 pulpos automáticos y DTG para tirajes cortos.", f"Planta auditada: {AUDITS}."])],
       faq=[2, 4, 7, 8], related=["playeras-personalizadas-mayoreo", "maquila-serigrafia-para-marcas", "merch-eventos-y-campanas"]),
  dict(slug="playeras-personalizadas-mayoreo", lang="es", tipo="promo",
       title="Playeras personalizadas por mayoreo con serigrafía, DTG y bordado · Chilian",
       desc="Playeras personalizadas por mayoreo desde Puebla: serigrafía, DTG desde 1 pieza y bordado. Precio de referencia al momento y hasta 20,000 piezas al día.",
       h1="Playeras personalizadas por mayoreo", kicker="Mayoreo · Empresas · Eventos",
       lead="Elige la prenda, la técnica y las piezas, y ve un precio de referencia al momento. Para pocas piezas, compra en nuestra tienda en línea.",
       img="trabajo-tipografia-varsity", img_alt="Playera con tipografía varsity estampada en serigrafía por Chilian",
       blocks=[("Del mayoreo al tiraje corto", ["Serigrafía para volumen: el precio por pieza baja mientras más piezas son.", "DTG digital a todo color desde 1 pieza: muestras, fotos y tirajes cortos.", "Bordado en bordadora de 6 cabezas.", "Hasta 20,000 piezas al día."]),
               ("Técnicas", ["Plastisol, base agua, alta densidad, puff, discharge, glitter, fotocromática y brilla en la oscuridad.", "Full print sublimado de costura a costura (Chilian Sport).", "Tie dye y lavados, estampado sobre mezclilla y etiquetas."]),
               ("¿Mayoreo o menudeo?", ["Mayoreo, empresas y eventos: cotiza en un minuto y tu asesora confirma el precio final en un día hábil.", "Pocas piezas o prendas listas: cómpralas en la tienda en línea de Chilian."])],
       faq=[2, 4, 3, 8], related=["playeras-deportivas-sublimadas", "uniformes-empresariales", "merch-eventos-y-campanas"]),
  dict(slug="playeras-deportivas-sublimadas", lang="es", tipo="promo", product=True,
       title="Playeras deportivas sublimadas full print · Chilian Sport desde 100 piezas",
       desc="Playera deportiva Chilian Sport sublimada de costura a costura con tu diseño, desde 100 piezas. Precios por volumen publicados desde $133.20 por pieza.",
       h1="Playeras deportivas sublimadas full print", kicker="Chilian Sport",
       lead="Playera deportiva de poliéster sublimada de costura a costura sobre su molde real, desde 100 piezas, con precios por volumen publicados.",
       img="chilian-sport", img_alt="Playera deportiva Chilian Sport sublimada full print",
       blocks=[("Por qué full print", ["Sublimado de costura a costura: el diseño cubre toda la prenda.", "El cuello es cinta de la misma tela, a un tono.", "Se arma en Estampa tu idea, sobre el molde real de la playera."])],
       faq=[4, 5, 8], related=["playeras-personalizadas-mayoreo", "merch-eventos-y-campanas", "uniformes-empresariales"]),
  dict(slug="merch-eventos-y-campanas", lang="es", tipo="merch",
       title="Merch para marcas, artistas, eventos y campañas · Chilian",
       desc="Merch en tirajes masivos: playeras, gorras, totes, termos y banderas para marcas, artistas, giras, eventos y campañas, con costo unitario cuidado.",
       h1="Merch para marcas, artistas, eventos y campañas", kicker="Merch · Eventos · Campañas",
       lead="Playeras, gorras, totes, termos y banderas en tirajes masivos, con costo unitario cuidado y entregas a tiempo: Your merch on time.",
       img="promocionales", img_alt="Artículos promocionales y merch estampados por Chilian",
       blocks=[("Lo que hacemos", ["Playeras, gorras, totes, termos y banderas.", "Tirajes masivos con costo unitario cuidado.", "Merch para artistas, creadores y giras.", "Promocionales para escuelas, organizaciones y eventos."]),
               ("Campañas", ["Catálogo de campañas políticas con sus prendas y artículos (PDF)."]),
               ("Antes de cotizar, ve tu diseño", ["En Estampa tu idea subes tu logo y lo ves en playera, sudadera o polo; el mockup y tus archivos llegan con tu solicitud."])],
       faq=[2, 4, 8], related=["playeras-personalizadas-mayoreo", "playeras-deportivas-sublimadas", "uniformes-empresariales"]),
  dict(slug="print-on-demand-playeras-dtg", lang="es", tipo="promo", pod=True, quote="/?prod=pod#cotizar",
       title="Print on Demand en México: playeras DTG desde 1 pieza · Chilian",
       desc="Playeras con tu diseño a todo color desde 1 pieza: oversized, regular o económica con 1 estampado DTG incluido. Precio al momento con IVA, planta en Puebla.",
       h1="Print on Demand: playeras DTG desde 1 pieza", kicker="Print on Demand · DTG",
       lead="Elige la playera (oversized, regular o económica), sube tu diseño y ve el precio al momento. El primer estampado a todo color va incluido; cada estampado extra suma su precio.",
       img="print-on-demand-dtg", img_alt="Impresora DTG imprimiendo a todo color sobre una playera negra",
       blocks=[("Cómo funciona", ["Elige la prenda: oversized, regular (100 % algodón) o económica (50/50), blanca o de color.", "Elige el tamaño del estampado por su lado más largo: de 6 a 53 cm.", "Sube tu diseño en Estampa tu idea y ve el mockup antes de pagar.", "Imprimimos en DTG a todo color, sin pantallas: fotos, degradados y un diseño distinto por pieza."]),
               ("Para quién", ["Creadores y marcas que venden por pedido, sin inventario.", "Regalos, eventos chicos y muestras antes de un pedido grande.", "Equipos y negocios que necesitan pocas piezas con su logo."]),
               ("Precio claro", ["El precio por pieza baja con 2, 5, 10, 20, 30, 40, 50 y 100 piezas.", "Incluye IVA y comisión de pago en línea; el envío se cotiza aparte.", "Archivo recomendado: PNG de 300 DPI con fondo transparente."]),
               ("Hecho en una planta auditada", ["Planta en Santa Isabel Cholula, Puebla, con 2 impresoras DTG y 8 pulpos automáticos.", f"Auditorías: {AUDITS}.", "Si tu pedido crece, lo pasamos a serigrafía con el precio de volumen."])],
       faq=[2, 4, 8], related=["playeras-personalizadas-mayoreo", "merch-eventos-y-campanas", "playeras-deportivas-sublimadas"]),
  dict(slug="playeras-para-campanas-politicas", lang="es", tipo="merch", camp=True, quote="/?prod=playera&tec=plastisol&qty=1000#cotizar",
       title="Playeras para campañas políticas por mayoreo con factura · Chilian",
       desc="Playeras, gorras y banderas para precampañas y campañas 2027, en volumen y con factura. Hasta 20,000 piezas al día en una planta formal en Puebla.",
       h1="Playeras para campañas políticas", kicker="Precampañas y campañas 2027",
       lead="Playeras, gorras, banderas y artículos para campaña en volumen, con factura, planta formal y entregas por semana. Aparta tu capacidad antes del arranque.",
       img="campana-politica", img_alt="Playeras, gorras y banderas impresas para campaña",
       blocks=[("Calendario 2027", ["Precampañas: 4 de enero a 12 de febrero.", "Campañas: 4 de abril a 2 de junio.", "Apartamos capacidad por semana de entrega con anticipo."]),
               ("Lo que fabricamos", ["Playeras básicas, clásicas o premium, blancas o de color.", "Gorras, banderas textiles, totes y más.", "Serigrafía para volumen; DTG para muestras y tirajes cortos."]),
               ("Por qué Chilian", ["Hasta 20,000 piezas al día con 8 pulpos automáticos.", "Factura y planta formal, auditada.", "Una asesora dedicada a tu campaña."])],
       faq=[2, 4, 8], related=["merch-eventos-y-campanas", "playeras-personalizadas-mayoreo", "uniformes-empresariales"]),
  dict(slug="contract-screen-printing-mexico", lang="en", tipo="usa",
       title="Contract screen printing & apparel manufacturing in Mexico · Chilian",
       desc="Audited contract screen printing, embroidery and cut-and-sew in Mexico for US brands and licenses: Disney FAMA, WRAP, SMETA, Walmart; 20,000 pcs a day; US contact.",
       h1="Contract screen printing and apparel manufacturing in Mexico", kicker="For US brands · Nearshoring",
       lead="Your audited plant in Mexico: decoration on your blanks or full package from the fabric, with a dedicated US contact and a bilingual team in your time zones.",
       img="planta-linea-roq", img_alt="Automatic Roq screen printing line at Chilian's plant in Puebla, Mexico",
       blocks=[("Audits your compliance team already knows", [f"{AUDITS_EN}.", "2026 social compliance approvals from SMETA, Walmart, C&A and Disney FAMA: the standards retailers such as Walmart, Amazon, Costco, Disney, Carhartt, Nike and adidas ask for.", "Brands and licenses printed in our plant include Carhartt, The North Face, Vans, Supreme, Marvel, Bluey, Minecraft, Snoopy and Tom and Jerry."]),
               ("Capacity", ["Up to 20,000 pieces a day with 8 automatic Roq and M&R presses.", "2 DTG printers and a 6-head embroidery machine.", "Cutting, sewing, dyeing and washing in the same plant.", "Brands and OEM from 600 pieces."]),
               ("Production in Mexico, coordinated import logistics", ["A dedicated US contact takes your run from approval to delivery.", "Bilingual team in the same time zones: calls, approvals and samples without waiting a day.", "A physical pre-production sample with your real artwork; nothing goes into production without an approved sample."])],
       faq=[1, 2, 3, 4, 5, 6], related=["maquila-serigrafia-para-marcas"]),
]
TITLES = {p["slug"]: p["h1"] for p in PAGES}


def faq_pairs(lang):
    import importlib.util
    spec = importlib.util.spec_from_file_location("b", ROOT / "tools/seo/build_seo.py"); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return [(q, a) if lang == "es" else (qe, ae) for q, a, qe, ae in m.FAQ]


CSS = """
@font-face{font-family:"Jost";font-weight:300 800;font-display:swap;src:url(/fonts/jost.woff2) format("woff2")}
@font-face{font-family:"Questrial";font-weight:400;font-display:swap;src:url(/fonts/questrial.woff2) format("woff2")}
:root{--paper:#0B0B0B;--card:#171512;--ink:#F3EBDD;--steel:#B9AF9E;--rule:rgba(243,235,221,.16);--shade:rgba(243,235,221,.06);--magenta:#C9922E;--on-accent:#0B0B0B;color-scheme:dark}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.6 "Questrial","Century Gothic",Arial,sans-serif}
a{color:inherit;text-underline-offset:3px}a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--magenta);outline-offset:3px}
.wrap{max-width:1180px;margin:0 auto;padding:0 max(16px,env(safe-area-inset-left))}
header{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--rule)}
header .wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px}
.logo{display:inline-flex;align-items:center;gap:.6rem;text-decoration:none;color:#FFFFFF}.logo img{width:36px;height:36px}
.logo i{display:block;width:6.4rem;aspect-ratio:669/96;background:currentColor;-webkit-mask:url(/logos/chilian-wordmark.png) left center/contain no-repeat;mask:url(/logos/chilian-wordmark.png) left center/contain no-repeat}
nav{display:flex;gap:1.2rem;align-items:center;font-size:.92rem}nav a{text-decoration:none}nav a:hover{text-decoration:underline}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:48px;padding:.75rem 1.2rem;border:1.5px solid var(--ink);color:var(--ink);background:transparent;text-decoration:none;font:600 .8rem "Jost",sans-serif;letter-spacing:.1em;text-transform:uppercase;transition:transform .15s ease}
.btn:hover{transform:translateY(-1px)}.btn.accent{background:var(--magenta);border-color:var(--magenta);color:var(--on-accent)}
.crumbs{font:500 .74rem "Jost",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--steel);margin:1.4rem 0 0}.crumbs a{text-decoration:none}
.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(1.5rem,4vw,3rem);align-items:center;padding-block:1.4rem 3rem}
.kicker{font:500 .74rem "Jost",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--steel);margin:0}
h1{font:650 clamp(2.1rem,5.2vw,3.6rem)/1.04 "Jost",sans-serif;text-transform:uppercase;letter-spacing:-.005em;margin:.5rem 0 1rem}
.lead{font-size:1.15rem;color:var(--steel);max-width:58ch;margin:0 0 1.6rem}
.cta{display:flex;flex-wrap:wrap;gap:.6rem}
.hero picture img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;display:block}
section.b{padding:2.4rem 0;border-top:1px solid var(--rule)}
h2{font:650 clamp(1.4rem,3vw,1.9rem)/1.1 "Jost",sans-serif;text-transform:uppercase;margin:0 0 1rem}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.4rem 2.4rem}
.grid ul{margin:0;padding-left:1.1rem}.grid li{margin:.35rem 0}
table{width:100%;border-collapse:collapse;font-size:.95rem;font-variant-numeric:tabular-nums;max-width:640px}
th,td{text-align:left;padding:.6rem .5rem .6rem 0;border-bottom:1px solid var(--rule)}th{font:500 .72rem "Jost",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--steel)}
td.r,th.r{text-align:right}
details{border-bottom:1px solid var(--rule)}summary{cursor:pointer;list-style:none;padding:1rem 0;font:600 1.02rem/1.35 "Jost",sans-serif;display:flex;justify-content:space-between;gap:1rem}
summary::-webkit-details-marker{display:none}summary::after{content:"+";font-size:1.3rem;line-height:1}details[open] summary::after{content:"×"}
details p{margin:0 0 1rem;color:var(--steel);max-width:70ch}
.rel{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.8rem}
.rel a{display:block;padding:1rem 1.1rem;border:1px solid var(--rule);background:var(--card);text-decoration:none;font:600 .98rem/1.3 "Jost",sans-serif}.rel a:hover{border-color:var(--ink)}
.retail{background:var(--card);border:1px solid var(--rule);padding:1.1rem 1.2rem;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;align-items:center}
footer a{display:inline-block;padding:.6rem 0}
footer{border-top:1px solid var(--rule);padding:2rem 0 calc(5.5rem + env(safe-area-inset-bottom));color:var(--steel);font-size:.9rem}
.wa{position:fixed;right:calc(16px + env(safe-area-inset-right));bottom:calc(16px + env(safe-area-inset-bottom));z-index:20;display:inline-flex;align-items:center;gap:.5rem;padding:.85rem 1.1rem;border-radius:999px;background:var(--ink);color:var(--paper);text-decoration:none;font:600 .78rem "Jost",sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 10px 30px rgba(0,0,0,.25)}
@media (max-width:860px){.wa{display:none}.hero{grid-template-columns:minmax(0,1fr)}.hero picture{order:-1}.grid{grid-template-columns:minmax(0,1fr)}nav .opt{display:none}}
@media (max-width:420px){.cta .btn{flex:1 1 100%}.logo i{width:5.4rem}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
"""


def page(p):
    es = p["lang"] == "es"
    url = f"{SITE}/{p['slug']}"
    home = "/" if es else "/en"
    quote = p.get("quote") or (f"/?tipo={p['tipo']}#cotizar" if es else f"/en?tipo={p['tipo']}#cotizar")
    wa_msg = ("Hola Chilian, vi la página «" + p["h1"] + "» y quiero cotizar.") if es else ("Hi Chilian, I saw the page “" + p["h1"] + "” and would like a quote.")
    from urllib.parse import quote as q_
    wa = f"https://wa.me/{WA[p['tipo']]}?text={q_(wa_msg)}"
    faqs = [faq_pairs(p["lang"])[i] for i in p["faq"]]
    blocks = "".join(f'<div><h2>{E(h)}</h2><ul>{"".join(f"<li>{E(x)}</li>" for x in xs)}</ul></div>' for h, xs in p["blocks"])
    extra = ""
    if p.get("product"):
        rows = "".join(f'<tr><td>{a}</td><td class="r">${r:,.2f}</td><td class="r">${x:,.2f}</td></tr>' for a, r, x in TIERS)
        extra = f'''<section class="b"><div class="wrap"><h2>Precio por volumen</h2>
<table><thead><tr><th>Piezas</th><th class="r">CH–EG</th><th class="r">2XL–3XL</th></tr></thead><tbody>{rows}</tbody></table>
<p class="kicker" style="margin-top:.8rem;text-transform:none;letter-spacing:0">MXN por pieza, precios de lista publicados en la <a href="{STORE}" rel="noopener">tienda en línea Chilian</a>. El precio final se confirma en tu cotización.</p></div></section>'''
    if p.get("pod"):
        rows = "".join(f'<tr><th scope="row" colspan="3" style="padding-top:1rem">{E(name)}</th></tr>' + "".join(f'<tr><td>{q} pz</td><td class="r">${w:,.2f}</td><td class="r">${c:,.2f}</td></tr>' for q, w, c in t) for name, t in POD_TIERS)
        extra = f'''<section class="b"><div class="wrap"><h2>Precio por pieza</h2>
<table><thead><tr><th>Piezas</th><th class="r">Prenda blanca</th><th class="r">Prenda de color</th></tr></thead><tbody>{rows}</tbody></table>
<p class="kicker" style="margin-top:.8rem;text-transform:none;letter-spacing:0">MXN por pieza con 1 estampado DTG de hasta 27 cm, IVA y comisión de pago incluidos. Cada estampado adicional suma su precio. El envío se cotiza aparte.</p></div></section>'''
    if p.get("camp"):
        rows = "".join(f'<tr><td>{q:,} pz</td><td class="r">${w:,.2f}</td><td class="r">${c:,.2f}</td></tr>' for q, w, c in CAMP_TIERS)
        extra = f'''<section class="b"><div class="wrap"><h2>Precio de referencia</h2>
<table><thead><tr><th>Piezas</th><th class="r">Blanca, 1 tinta media carta</th><th class="r">De color, 2 tintas carta</th></tr></thead><tbody>{rows}</tbody></table>
<p class="kicker" style="margin-top:.8rem;text-transform:none;letter-spacing:0">MXN por pieza, línea básica, con IVA y comisión de pago. Pedidos grandes los cotiza una asesora y pueden tener mejor precio. <a href="{CAMPAIGN_PDF}" rel="noopener">Catálogo de campañas (PDF)</a></p></div></section>'''
    if p["slug"] == "merch-eventos-y-campanas":
        extra = f'<section class="b"><div class="wrap"><a class="btn" href="{CAMPAIGN_PDF}" rel="noopener">Ver el catálogo de campañas políticas (PDF)</a></div></section>'
    retail = (f'<section class="b"><div class="wrap retail"><div><h2 style="margin:0 0 .3rem">¿Pocas piezas?</h2><p style="margin:0;color:var(--steel)">Compra prendas listas en la tienda en línea de Chilian; para mayoreo y programas, cotiza aquí.</p></div><a class="btn" href="{STORE}" rel="noopener">Ir a la tienda en línea ↗</a></div></section>'
              if es and p["tipo"] in ("promo", "merch") else "")
    rel = "".join(f'<a href="/{r}">{E(TITLES[r])} →</a>' for r in p["related"])
    faq_html = "".join(f"<details><summary>{E(q)}</summary><p>{E(a)}</p></details>" for q, a in faqs)
    org = {"@id": SITE + "/#chilian"}
    pod_prices = [x for _, t in POD_TIERS for _, w, c in t for x in (w, c)]
    main = ({"@type": "Product", "name": "Playera Print on Demand con estampado DTG", "description": p["lead"], "image": f"{SITE}/photos/opt/{p['img']}-960.webp", "brand": {"@type": "Brand", "name": "Chilian"}, "manufacturer": org,
             "offers": {"@type": "AggregateOffer", "priceCurrency": "MXN", "lowPrice": f"{min(pod_prices):.2f}", "highPrice": f"{max(pod_prices):.2f}", "offerCount": len(pod_prices), "availability": "https://schema.org/InStock", "url": url, "seller": org}}
            if p.get("pod") else
            {"@type": "Product", "name": "Playera deportiva Chilian Sport full print", "description": p["lead"], "image": f"{SITE}/photos/opt/{p['img']}-960.webp", "brand": {"@type": "Brand", "name": "Chilian Sport"}, "manufacturer": org,
             "offers": {"@type": "AggregateOffer", "priceCurrency": "MXN", "lowPrice": "133.20", "highPrice": "334.78", "offerCount": 10, "availability": "https://schema.org/InStock", "url": url, "seller": org}}
            if p.get("product") else
            {"@type": "Service", "name": p["h1"], "description": p["desc"], "serviceType": p["kicker"], "provider": org, "areaServed": ["MX", "US"], "url": url, "image": f"{SITE}/photos/opt/{p['img']}-960.webp"})
    ld = {"@context": "https://schema.org", "@graph": [main,
          {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Grupo Chilian", "item": SITE + home}, {"@type": "ListItem", "position": 2, "name": p["h1"], "item": url}]},
          {"@type": "FAQPage", "inLanguage": "es-MX" if es else "en-US", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}]}
    L = (lambda a, b: a if es else b)
    return f'''<!doctype html>
<html lang="{p['lang']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(p["title"])}</title>
<meta name="description" content="{E(p["desc"])}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="Grupo Chilian">
<meta property="og:title" content="{E(p["title"])}"><meta property="og:description" content="{E(p["desc"])}">
<meta property="og:url" content="{url}"><meta property="og:locale" content="{L("es_MX", "en_US")}">
<meta property="og:image" content="{SITE}/photos/opt/{p['img']}-1600.webp"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B0B0B">
<link rel="icon" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/jost.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="/photos/opt/{p['img']}-960.webp" imagesrcset="/photos/opt/{p['img']}-480.webp 480w, /photos/opt/{p['img']}-960.webp 960w, /photos/opt/{p['img']}-1600.webp 1600w" imagesizes="(max-width: 860px) 100vw, 46vw">
<style>{CSS}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
<header><div class="wrap">
  <a class="logo" href="{home}" aria-label="Grupo Chilian"><img src="/logos/chilian-logo-header.png" alt="" width="36" height="36"><i aria-hidden="true"></i></a>
  <nav aria-label="{L("Principal", "Main")}"><a class="opt" href="{home}#catalogo">{L("Catálogo", "Catalog")}</a><a class="opt" href="{home}#tecnicas">{L("Técnicas", "Techniques")}</a><a class="btn accent" href="{quote}">{L("Cotizar", "Get a quote")}</a></nav>
</div></header>
<main>
  <div class="wrap"><p class="crumbs"><a href="{home}">Grupo Chilian</a> / {E(p["h1"])}</p></div>
  <div class="wrap hero">
    <div>
      <p class="kicker">{E(p["kicker"])}</p>
      <h1>{E(p["h1"])}</h1>
      <p class="lead">{E(p["lead"])}</p>
      <div class="cta"><a class="btn accent" href="{quote}">{L("Cotiza en un minuto", "Quote in a minute")} →</a><a class="btn" href="{wa}" rel="noopener">WhatsApp</a></div>
    </div>
    <picture><source type="image/webp" srcset="/photos/opt/{p['img']}-480.webp 480w, /photos/opt/{p['img']}-960.webp 960w, /photos/opt/{p['img']}-1600.webp 1600w" sizes="(max-width: 860px) 100vw, 46vw">
      <img src="/photos/opt/{p['img']}-960.webp" alt="{E(p["img_alt"])}" width="960" height="720" fetchpriority="high"></picture>
  </div>
  <section class="b"><div class="wrap grid">{blocks}</div></section>
  {extra}
  {retail}
  <section class="b"><div class="wrap"><h2>{L("Preguntas frecuentes", "Questions")}</h2>{faq_html}</div></section>
  <section class="b"><div class="wrap"><h2>{L("También te puede servir", "Also useful")}</h2><div class="rel">{rel}<a href="{home}">{L("Todo sobre Chilian", "All about Chilian")} →</a></div></div></section>
  <section class="b"><div class="wrap" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:space-between;align-items:center">
    <h2 style="margin:0">{L("¿Listo para cotizar?", "Ready for a quote?")}</h2>
    <div class="cta"><a class="btn accent" href="{quote}">{L("Cotizar proyecto", "Get a quote")} →</a><a class="btn" href="{home}#equipo">{L("Hablar con una asesora", "Talk to the team")}</a></div></div></section>
</main>
<footer><div class="wrap">© 2026 Grupo Chilian · Industrias Chilian, S.A. de C.V. · Tlacomulco No. 2, San Pablo Ahuatempan, Santa Isabel Cholula, Puebla, C.P. 74355 · {L("Lun–Vie 9:00–18:00", "Mon–Fri 9:00–18:00")} · <a href="https://wa.me/522226925404" rel="noopener">WhatsApp 222 692 5404</a></div></footer>
<a class="wa" href="{wa}" rel="noopener">WhatsApp</a>
<script src="/chat.js" defer></script>
</body>
</html>
'''


def main():
    for p in PAGES:
        out = ROOT / (p["slug"] + ".html")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page(p))
    # sitemap: home pages (from build_seo) + landings
    sm = (ROOT / "sitemap.xml").read_text()
    add = "".join(f'''  <url>
    <loc>{SITE}/{p["slug"]}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
''' for p in PAGES)
    sm = sm.replace("</urlset>", add + "</urlset>") if "<loc>" + SITE + "/" + PAGES[0]["slug"] not in sm else sm
    (ROOT / "sitemap.xml").write_text(sm)
    print(len(PAGES), "pages")


if __name__ == "__main__":
    main()
