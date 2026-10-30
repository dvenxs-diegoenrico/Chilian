# Regenerar el catálogo navegable

Desde una carpeta de trabajo con los 8 PDF oficiales (los enlaces están en `index.html`, constante `CATALOGS`):

    pdftoppm -scale-to-x 1100 -scale-to-y -1 -jpeg <cada PDF> pages/<nombre>   # una imagen por página
    python3 1_extract.py      # páginas de producto, modelos, gramaje, tela, tallas -> catalog.json
    python3 2_clean.py        # títulos y tipos de prenda corregidos -> catalog2.json

Luego, por cada modelo, se guardan `catalogo/<id>.webp` (1100 px), `<id>-s.webp` (420 px) y, en el catálogo KG, `<id>-b.webp` (la página de colores), y `catalogo/catalogo.json` con: id, cat, line, page, pages, title, models, weight, comp, sizes, kind, who, tier, w, h.

Las páginas que se incluyen de cada PDF y las correcciones a mano (KG y AK son solo imagen) están al inicio de cada script. Al cambiar un catálogo, revisa esas listas.
