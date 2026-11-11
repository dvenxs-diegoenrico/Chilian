"""SEO of the public site, focused on the high-ticket buyer: global brands and licenses,
OEM, large uniform programs and US brands nearshoring to Mexico.

Run after editing index.html:   python3 tools/seo/build_seo.py

1. Writes the <head> SEO block (title, description, canonical, hreflang, social cards,
   schema.org JSON-LD) and the visible FAQ into index.html (Spanish, canonical "/").
2. Builds en.html (served at /en): the same page with every data-en text already in
   English in the HTML, so Google and AI crawlers index a real English page for US buyers.
   The ES/EN switch still works on both pages (data-es keeps the Spanish).
3. Writes sitemap.xml with both languages.
Every fact here is already published on the site; nothing is invented.
"""
import json, html, re, pathlib
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = "https://chilian.vercel.app"          # change here if the site moves to its own domain
E = html.escape

SEO = {
    "es": {
        "title": "Chilian · Planta de serigrafía y confección para marcas en México",
        "desc": "Maquila de estampado, bordado y confección para marcas, licencias y uniformes. Planta auditada (Disney FAMA, WRAP, SMETA, Walmart) en Puebla: 20,000 piezas al día.",
        "url": SITE + "/", "locale": "es_MX", "alt": "en_US", "lang": "es-MX",
        "img_alt": "Pulpo automático de serigrafía estampando en la planta auditada de Chilian en Puebla",
    },
    "en": {
        "title": "Chilian · Audited screen printing & apparel manufacturer in Mexico",
        "desc": "Screen printing, embroidery and cut-and-sew for brands, licenses and uniform programs. Audited plant (Disney FAMA, WRAP, SMETA, Walmart) in Mexico: 20,000 pcs a day.",
        "url": SITE + "/en", "locale": "en_US", "alt": "es_MX", "lang": "en-US",
        "img_alt": "Automatic screen printing press at Chilian's audited plant in Puebla, Mexico",
    },
}
for k, v in SEO.items():
    assert len(v["desc"]) <= 170, (k, len(v["desc"]))

BRANDS = "Carhartt, The North Face, Vans, Supreme, Marvel, Bluey, Minecraft, Snoopy y Tom and Jerry"
BRANDS_EN = "Carhartt, The North Face, Vans, Supreme, Marvel, Bluey, Minecraft, Snoopy and Tom and Jerry"
FAQ = [  # (question es, answer es, question en, answer en) — written for brand, OEM and program buyers
    ("¿Para qué marcas y licencias han producido?",
     f"En nuestra planta se han estampado marcas y licencias como {BRANDS}.",
     "Which brands and licenses have you produced for?",
     f"Our plant has printed brands and licenses such as {BRANDS_EN}."),
    ("¿Qué auditorías tiene la planta?",
     "Walt Disney FAMA, WRAP, VF Corporation y C&A, con aprobaciones de cumplimiento social 2026 de SMETA (Sedex) y Walmart, y gestión química con ChemIQ: los estándares que piden cadenas como Walmart, Amazon, Costco, Disney, Carhartt, Nike y adidas.",
     "Which audits does the plant have?",
     "Walt Disney FAMA, WRAP, VF Corporation and C&A, with 2026 social compliance approvals from SMETA (Sedex) and Walmart, and chemical management with ChemIQ: the standards retailers such as Walmart, Amazon, Costco, Disney, Carhartt, Nike and adidas ask for."),
    ("¿Cuál es la capacidad de producción?",
     "Hasta 20,000 piezas al día, con 8 pulpos automáticos Roq y M&R, 2 impresoras DTG, una bordadora de 6 cabezas, y corte, costura, teñido y lavado en la misma planta.",
     "What is your production capacity?",
     "Up to 20,000 pieces a day, with 8 automatic Roq and M&R presses, 2 DTG printers, a 6-head embroidery machine, and cutting, sewing, dyeing and washing in the same plant."),
    ("¿Hacen paquete completo o solo estampado?",
     "Las dos cosas: estampamos tu prenda lisa, o cortamos, cosemos, teñimos y estampamos desde la tela.",
     "Do you do full package or decoration only?",
     "Both: we decorate your blank garments, or we cut, sew, dye and print from the fabric."),
    ("¿Cuál es el pedido mínimo para marcas?",
     "Marcas y OEM desde 600 piezas. Para muestras y tirajes cortos, DTG desde 1 pieza; la playera deportiva Chilian Sport sublimada, desde 6 piezas.",
     "What is the minimum order for brands?",
     "Brands and OEM from 600 pieces. For samples and short runs, DTG from 1 piece; the sublimated Chilian Sport performance tee from 6 pieces."),
    ("¿Cómo es el proceso de un pedido?",
     "Cinco pasos: brief, propuesta con precio por volumen, muestra física de preproducción con tu arte real, producción y entrega. Nada entra a producción sin una muestra aprobada.",
     "How does an order run?",
     "Five steps: brief, proposal with volume pricing, a physical pre-production sample with your real artwork, production and delivery. Nothing goes into production without an approved sample."),
    ("¿Trabajan con marcas de Estados Unidos?",
     "Sí. Un contacto dedicado en EE. UU. lleva tu tiraje de la aprobación a la entrega, con equipo bilingüe en los mismos husos horarios y logística de importación coordinada.",
     "Do you work with US brands?",
     "Yes. A dedicated US contact takes your run from approval to delivery, with a bilingual team in the same time zones and coordinated import logistics."),
    ("¿Dónde está la planta y se puede visitar?",
     "En Tlacomulco No. 2, San Pablo Ahuatempan, Santa Isabel Cholula, Puebla, C.P. 74355. El showroom está dentro de la planta: ves muestras y producción en una sola visita, de lunes a viernes de 9:00 a 18:00.",
     "Where is the plant and can we visit?",
     "Tlacomulco No. 2, San Pablo Ahuatempan, Santa Isabel Cholula, Puebla, Mexico, ZIP 74355. The showroom is inside the plant, so you see samples and production in one visit, Monday to Friday, 9:00 to 18:00."),
    ("¿Cómo cotizo y cuánto tardan en responder?",
     "En «Cotiza en un minuto» ves un precio de referencia al momento. Al enviar tu solicitud, tu asesora te responde en un día hábil con el precio final.",
     "How do I get a quote and how fast do you reply?",
     "“Quote in a minute” shows a reference price instantly. Send your request and your advisor replies within one business day with the final price."),
]


def graph(lang):
    es = lang == "es"
    data = json.loads((ROOT / "tools/seo/techs.json").read_text())
    org = {
        "@type": ["Organization", "LocalBusiness"], "@id": SITE + "/#chilian",
        "name": "Grupo Chilian", "alternateName": ["Chilian Screen Printing", "Chilian Estampados"],
        "legalName": "Industrias Chilian, S.A. de C.V.", "url": SITE + "/",
        "logo": SITE + "/logos/chilian-logo.png", "image": SITE + "/photos/prensa-pantalla-magenta.jpg",
        "description": ("Planta auditada de serigrafía, bordado y confección en Puebla, México, para marcas globales, licencias, OEM y programas de uniformes. Hasta 20,000 piezas al día."
                        if es else "Audited screen printing, embroidery and cut-and-sew plant in Puebla, Mexico, for global brands, licenses, OEM and uniform programs. Up to 20,000 pieces a day."),
        "slogan": "Estampados • Textiles • Promocionales", "foundingDate": "1990",
        "founder": {"@type": "Person", "name": "Federico Chilian"},
        "award": "Premio Nacional de Artes Gráficas 2025, categoría Textil",
        "telephone": "+52 222 692 5404",
        "address": {"@type": "PostalAddress", "streetAddress": "Tlacomulco No. 2, San Pablo Ahuatempan", "addressLocality": "Santa Isabel Cholula", "addressRegion": "Puebla", "postalCode": "74355", "addressCountry": "MX"},
        "hasMap": "https://www.google.com/maps/search/?api=1&query=Tlacomulco+2+San+Pablo+Ahuatempan+Santa+Isabel+Cholula+Puebla+74355",
        "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "18:00"}],
        "areaServed": [{"@type": "Country", "name": "México"}, {"@type": "Country", "name": "United States"}],
        "contactPoint": [
            {"@type": "ContactPoint", "contactType": "sales", "name": "Marcas y OEM" if es else "Brands and OEM", "telephone": "+52 222 692 5404", "email": "fde@grupochilian.com", "availableLanguage": ["es", "en"], "areaServed": ["MX", "US"]},
            {"@type": "ContactPoint", "contactType": "sales", "name": "Contacto en EE. UU." if es else "US contact", "telephone": "+52 55 2559 9348", "email": "ichilian@grupochilian.com", "availableLanguage": ["es", "en"], "areaServed": "US"},
            {"@type": "ContactPoint", "contactType": "sales", "name": "Uniformes y promocionales" if es else "Uniforms and promotional", "telephone": "+52 220 175 9053", "email": "ventas@grupochilian.com", "availableLanguage": "es", "areaServed": "MX"}],
        "sameAs": ["https://www.instagram.com/chilianestampados", "https://www.tiktok.com/@chilianestampados", "https://www.facebook.com/grupochilian",
                   "https://www.youtube.com/@grupochilian4341", "https://mx.linkedin.com/company/grupo-chilian", "https://www.pinterest.com/chilianestampados/",
                   "https://x.com/grupochilian", "https://grupochilian.com.mx/"],
        "knowsAbout": (["Maquila de serigrafía para marcas", "Producto licenciado", "Confección de paquete completo", "Programas de uniformes corporativos", "Bordado", "Impresión DTG", "Sublimación full print", "Nearshoring textil en México", "Cumplimiento social (Disney FAMA, WRAP, SMETA)"]
                       if es else ["Contract screen printing for brands", "Licensed apparel", "Full-package apparel manufacturing", "Corporate uniform programs", "Embroidery", "DTG printing", "Sublimated full print", "Apparel nearshoring to Mexico", "Social compliance (Disney FAMA, WRAP, SMETA)"]),
        "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Servicios" if es else "Services", "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": n, "description": d}} for n, d in (
                ([("Maquila de estampado para marcas y OEM", "Sobre tu prenda o la nuestra, desde 600 piezas, con auditorías aprobadas para Disney, VF y C&A."),
                  ("Paquete completo", "Corte, costura, teñido, lavado y estampado desde la tela."),
                  ("Uniformes y empresas", "Polos, camisas, pantalón de trabajo y sudaderas, con bordado, estampado y etiqueta propia; reposiciones con el mismo color y corte."),
                  ("Merch, eventos y campañas", "Playeras, gorras, totes, termos y banderas en tirajes masivos.")] if es else
                 [("Contract printing for brands and OEM", "On your garment or ours, from 600 pieces, with audits approved for Disney, VF and C&A."),
                  ("Full package", "Cutting, sewing, dyeing, washing and printing from the fabric."),
                  ("Uniforms and companies", "Polos, shirts, work pants and sweatshirts with embroidery, printing and private labels; reorders in the same color and cut."),
                  ("Merch, events and campaigns", "Tees, caps, totes, tumblers and flags in large runs.")])
                + [(n, t) for n, t in data])]}
    }
    faq = {"@type": "FAQPage", "@id": SEO[lang]["url"] + "#faq", "inLanguage": SEO[lang]["lang"],
           "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in ((x[0], x[1]) if es else (x[2], x[3]) for x in FAQ)]}
    web = {"@type": "WebSite", "@id": SITE + "/#web", "url": SITE + "/", "name": "Grupo Chilian", "inLanguage": ["es-MX", "en-US"], "publisher": {"@id": SITE + "/#chilian"}}
    page = {"@type": "WebPage", "@id": SEO[lang]["url"] + "#page", "url": SEO[lang]["url"], "name": SEO[lang]["title"], "description": SEO[lang]["desc"], "inLanguage": SEO[lang]["lang"], "isPartOf": {"@id": SITE + "/#web"}, "about": {"@id": SITE + "/#chilian"}}
    return {"@context": "https://schema.org", "@graph": [org, web, page, faq]}


def head(lang):
    v = SEO[lang]
    return f'''<!-- seo:head (generated by tools/seo/build_seo.py) -->
<title>{E(v["title"])}</title>
<meta name="description" content="{E(v["desc"])}">
<link rel="canonical" href="{v["url"]}">
<link rel="alternate" hreflang="es-MX" href="{SITE}/">
<link rel="alternate" hreflang="en-US" href="{SITE}/en">
<link rel="alternate" hreflang="x-default" href="{SITE}/">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Grupo Chilian">
<meta property="og:title" content="{E(v["title"])}">
<meta property="og:description" content="{E(v["desc"])}">
<meta property="og:url" content="{v["url"]}">
<meta property="og:locale" content="{v["locale"]}">
<meta property="og:locale:alternate" content="{v["alt"]}">
<meta property="og:image" content="{SITE}/photos/prensa-pantalla-magenta.jpg">
<meta property="og:image:width" content="1600">
<meta property="og:image:height" content="1067">
<meta property="og:image:alt" content="{E(v["img_alt"])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#151316">
<script type="application/ld+json">{json.dumps(graph(lang), ensure_ascii=False, separators=(",", ":"))}</script>
<!-- /seo:head -->'''


def faq_html():
    items = "".join(f'''        <details><summary data-en="{E(qe)}">{E(q)}</summary><p data-en="{E(ae)}">{E(a)}</p></details>
''' for q, a, qe, ae in FAQ)
    return f'''<!-- seo:faq -->
  <section class="band" id="preguntas" aria-labelledby="faq-title" style="padding-top:0">
    <div class="wrap">
      <div class="section-head">
        <div>
          <p class="kicker"><svg aria-hidden="true"><use href="#reg"/></svg><span data-en="Questions brands ask">Lo que preguntan las marcas</span></p>
          <h2 class="h2" id="faq-title" data-en="Before you place a program.">Antes de colocar un programa.</h2>
        </div>
        <p class="lead" data-en="Audits, capacity, minimums, sampling and logistics, answered.">Auditorías, capacidad, mínimos, muestras y logística, respondidas.</p>
      </div>
      <div class="faq">
{items}      </div>
    </div>
  </section>
  <!-- /seo:faq -->'''


def between(s, a, b, new):
    i, j = s.index(a), s.index(b) + len(b)
    return s[:i] + new + s[j:]


def main():
    p = ROOT / "index.html"
    s = p.read_text()
    s = between(s, "<!-- seo:head", "<!-- /seo:head -->", head("es"))
    s = between(s, "<!-- seo:faq -->", "<!-- /seo:faq -->", faq_html())
    s = re.sub(r'<html lang="[^"]*"[^>]*>', f'<html lang="es" data-title-es="{E(SEO["es"]["title"])}" data-title-en="{E(SEO["en"]["title"])}">', s, count=1)
    p.write_text(s)

    # ---- English page: the same document with the English already in the HTML
    soup = BeautifulSoup(s, "html.parser")
    for n in soup.select("[data-en]"):
        n["data-es"] = n.decode_contents()
        n.clear()
        n.append(BeautifulSoup(n["data-en"], "html.parser"))
    for attr, es_attr, target in (("data-en-ph", "data-es-ph", "placeholder"), ("data-en-alt", "data-es-alt", "alt"), ("data-en-label", "data-es-label", "aria-label")):
        for n in soup.select(f"[{attr}]"):
            n[es_attr] = n.get(target, "")
            n[target] = n[attr]
    out = str(soup)
    out = between(out, "<!-- seo:head", "<!-- /seo:head -->", head("en") + '\n<script>window.CHILIAN_LANG = "en";</script>')
    out = out.replace('<html data-title-en=', '<html data-title-en=', 1)
    out = re.sub(r'<html lang="es"', '<html lang="en"', out, count=1)
    out = re.sub(r'(<html[^>]*?) lang="es"', r'\1 lang="en"', out, count=1)
    (ROOT / "en.html").write_text(out)

    (ROOT / "sitemap.xml").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>{SITE}/</loc>
    <xhtml:link rel="alternate" hreflang="es-MX" href="{SITE}/"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="{SITE}/en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>{SITE}/photos/prensa-pantalla-magenta.jpg</image:loc></image:image>
  </url>
  <url>
    <loc>{SITE}/en</loc>
    <xhtml:link rel="alternate" hreflang="es-MX" href="{SITE}/"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="{SITE}/en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
''')
    print("index.html, en.html and sitemap.xml written")


if __name__ == "__main__":
    main()
