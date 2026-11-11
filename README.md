# Chilian — nuevo sitio (rediseño de grupochilian.com.mx)

> **Sitio en producción: `index.html` (dirección v1).**

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | Página de inicio (v1, la dirección elegida) |
| `photos/`, `logos/` | Fotos de planta y trabajos; logos como máscaras de color |
| `favicon.png`, `apple-touch-icon.png` | Ícono de la pestaña y del teléfono |
| `studio3d.js` | 3D, vista de molde y archivo de producción (rutas 2 y 3) |
| `patterns/play-sport-mc/` | Molde Chilian Sport (PLAY SPORT MCORTA) tallas S–XL en milímetros, trazado de los PDF de CAD |
| `patterns/playera-dama/` | Molde playera dama (PLAYERA PW DAMA BIE) tallas S–XL |
| `tools/extract_pattern.py` | Convierte un trazo PDF de CAD en el JSON del molde |
| `tools/drape.py` | Cose y simula cada molde sobre un maniquí (hombre o mujer) para el 3D realista |
| `drape/` | Resultado de la simulación por estilo y talla: prenda drapeada + maniquí |
| `vendor/three-r128.min.js`, `vendor/three-room-env-r128.js` | three.js r128 y su estudio de reflejos RoomEnvironment (licencia MIT), servidos desde el propio sitio |
| `blanks/` | Prendas lisas (playera, sudadera, polo; frente y espalda) generadas con Canva AI para "Estampa tu idea" |
| `photos/opt/` | Copias WebP de cada foto a 480, 960 y 1600 px (las genera `tools/optimize_photos.py`) |
| `catalogo/` | Catálogo navegable: 244 productos (uno por modelo) de los 8 catálogos PDF oficiales (WebP grande y miniatura) y `catalogo.json` con sus datos |
| `fonts/` | Big Shoulders Display, Instrument Sans e IBM Plex Mono (licencia OFL), servidas desde el sitio |
| `vercel.json` | URLs limpias y caché larga para fotos, logos, prendas, fuentes y librerías |

Es un sitio estático: no necesita build. Vercel publica la raíz del repositorio.

## v2: qué se tomó de Nike y de Apple

| Referencia | Patrón | Dónde está en Chilian |
| --- | --- | --- |
| nike.com/mx | Barra de utilidades + menú centrado + cinta de aviso | Arriba de la página |
| nike.com/mx | Foto a sangre y titular gigante en mayúsculas condensadas debajo | Hero "Estampado a escala industrial" |
| nike.com/mx | Tarjetas de foto 2×2 con texto y píldoras blancas encima | Soluciones (marcas, uniformes, merch, EE. UU.) |
| nike.com/mx | Carril "Lo nuevo" con flechas | "Recién salido de los pulpos" y "Dentro de la planta" |
| nike.com/mx | "Compra por categorías" en círculos | "Elige por técnica" |
| nike.com/mx | Pie con columnas de enlaces | Pie de página |
| apple.com | Mosaico negro centrado: titular, una línea, dos píldoras | Capacidad de planta y sección EE. UU. |
| apple.com | Tabla "Compare models" | Programas por contrato: Piloto · Producción · Programa anual |
| apple.com | Tarjetas "Why buy" | 8 garantías para el cliente de contrato |
| apple.com | Tech Specs | Especificaciones de planta (capacidad, prensas, decorado, prenda, arte, cumplimiento, ubicación) |
| apple.com | Preguntas frecuentes plegables | 8 preguntas de compradores por contrato |

## PROPUESTO: términos de contrato que Chilian debe confirmar

Estos valores aparecen en la página (marcados `PROPUESTO` en el HTML) como estándar de la industria. Hay que confirmarlos o corregirlos antes de publicar:

- Rangos de volumen por programa: piloto 600–5,000, producción 5,000–50,000, anual 100,000+ piezas.
- Tiempo de muestra: 5–7 días hábiles.
- Tiempo de producción: 15–20 (piloto) y 15–25 (producción) días hábiles tras aprobar muestra.
- Inspección final AQL 2.5 y reporte por lote.
- Empaque: bolsa individual, etiqueta de talla y de caja, códigos UPC.
- Ejecutivo de cuenta dedicado y planeador de producción en programa anual.
- Pagos: anticipo + saldo antes de envío, crédito en programa anual, facturación en MXN o USD.
- Envíos a EE. UU.: términos de entrega por contrato (recolección en planta o puesto en almacén).
- Firma de NDA, visitas y auditorías de terceros con cita, reposición a costo de Chilian si un lote no pasa inspección.
- Respuesta a cotizaciones en un día hábil.

Sitio B2B de una sola página que reemplaza la tienda Shopify actual. El objetivo es atraer pedidos grandes de serigrafía: marcas y OEM (México y EE. UU.), uniformes corporativos, merch, eventos y campañas.

Se construyó con el mismo modelo que la página de Dstance: un `index.html` con los colores como tokens, ventanas emergentes con `<dialog>`, fotos en `photos/` y logos en `logos/`. No hace falta ningún framework.

## Qué se tomó de fabricantes grandes

| Patrón | Quién lo usa bien | Cómo quedó en Chilian |
| --- | --- | --- |
| La capacidad va primero, en números | Gildan, Bella+Canvas, fábricas de contrato en EE. UU. | Franja con 20,000 pzas/día, 450,000/mes, 8 pulpos, 14 colores |
| Una puerta de entrada por tipo de comprador | Caterpillar, 3M ("soluciones por industria") | Marcas y OEM · Uniformes y empresas · Merch, eventos y campañas |
| El cumplimiento se vende, no se esconde | Stanley/Stella, proveedores de VF y Disney | Sellos FAMA, WRAP, VF, C&A, ChemIQ, cada uno explica qué cubre |
| Prueba social en carrusel de logos | Casi todo fabricante B2B | Marcas y licencias impresas en la planta |
| Ficha técnica de la planta | Imprentas de contrato (Motion Textile, Real Thread) | Tabla de pulpos con paletas y colores |
| Biblioteca de técnicas con "cuándo usarla" | Real Thread, Printful | 12 técnicas con ficha emergente |
| Precio por volumen visible | Printful, Custom Ink | Calculadora de Chilian Sport con el escalonado real |
| Cotización guiada que llega a una persona | Custom Ink, fábricas OEM | Formulario que arma la orden de trabajo y la manda por WhatsApp a la asesora correcta |
| Página para el comprador extranjero | Proveedores de nearshoring | Sección "Para marcas de EE. UU." y versión completa en inglés |

## Secciones

1. Franja de credenciales + encabezado fijo con botón ES/EN y "Cotizar"
2. Hero con la pantalla magenta de la planta
3. Cifras de capacidad
4. Marcas y licencias
5. Soluciones (tres puertas + Chilian Sport, proyectos especiales, promocionales)
6. La planta (cifras, tabla de pulpos, fotos)
7. Proceso de pedido y servicio integral
8. Certificaciones y compromisos
9. Técnicas
10. Trabajos (galería ampliable)
11. Líneas Básica, Clásica y Premium + calculadora de volumen
12. Marcas de EE. UU.
13. Cotizador
14. Equipo comercial
15. Pie con planta, showroom y redes

## Ruteo del cotizador

| Tipo de proyecto | Llega a |
| --- | --- |
| Marca / OEM | Carlos Lecona · 222 692 5404 |
| Marca de EE. UU. | Iván Chilian · 55 2559 9348 |
| Uniformes | Elizabeth Rojano · 220 175 9053 |
| Merch / artista | Itzel González · 222 651 2650 |
| Eventos y promocionales | Martha Orta · 220 175 9053 |
| Campaña política | Martha Orta · 220 175 9053 |

Se cambia en el objeto `TYPES` dentro de `index.html`.

## Confirmado por Chilian

- 35 años de trayectoria.
- Hay permiso para mostrar los logos de marcas y licencias.
- Ya no hay showroom separado: el showroom está dentro de la planta (Tlacomulco No. 2, Santa Isabel Cholula).

## Dirección elegida: v1 (`index.html`)

Cambios de la revisión:
- Menos rosa: el magenta queda solo en los botones principales de cotizar, la línea "escala industrial." del hero y el anillo de foco del teclado.
- Corregido: la franja de cifras del hero se comprimía a media columna y "450,000" encimaba el "8".
- Corregido: el botón "Cotizar con esto" aparecía en las fichas de certificaciones.
- Corregido: las técnicas sin opción en el cotizador (glitter, mezclilla, etiquetas…) ahora se agregan a las notas.
- Corregido: la página no ocultaba elementos con `hidden` fuera del visor de artifacts.
- La fecha del cotizador ya no acepta días pasados.
- Pies de foto sin números de tintas inventados; se quitó "P36 / C12" de la foto del hero.

## Estado

Chilian confirmó todos los datos del sitio: capacidad (20,000 piezas/día, 450,000/mes), auditorías vigentes, 35 años, permiso de logos, showroom dentro de la planta, respuesta en un día hábil y muestra aprobada antes de producir.

## Estampa tu idea · Print your idea

Botón en el hero (y en el menú y el cotizador) que abre un estudio de mockups:

1. El visitante sube su diseño (PNG, JPG, SVG o WebP). Puede quitar el fondo blanco.
2. Elige prenda (playera, sudadera, polo), vista (frente o espalda) y uno de 8 colores.
3. Elige posición (frente completo, pecho izquierdo, espalda completa, nuca) y tamaño en centímetros reales.
4. Puede arrastrar el diseño o moverlo con las flechas del teclado.
5. "Cotizar con este diseño" lleva prenda, color, posición y medida al cotizador. "Descargar mockup" guarda un PNG con la marca de agua "Generated by Chilian": repetida en diagonal sobre toda la imagen y en una franja inferior con el logo. La vista previa en pantalla no lleva marca de agua.

Todo corre en el navegador: el archivo del cliente nunca sale de su dispositivo.

**Cómo se hicieron las prendas.** Con Canva AI, usando como referencia las fotos de las líneas Básica, Clásica y Premium del catálogo. Se generaron en blanco, se les quitó el fondo en Canva y se exportaron a 1264 × 1264 px. El sitio las recolorea conservando sus pliegues. Diseño de trabajo en Canva: "Blank garment mockup canvas" (páginas 2 a 7).

**Para cambiar algo.** Colores, posiciones y medidas viven en el objeto `STUDIO` de `index.html`. Para usar fotos reales de la planta, reemplaza los archivos de `blanks/` con prendas blancas sobre fondo transparente, del mismo tamaño y encuadre.

## Rutas 2 y 3: molde real y 3D

**Molde.** Los cuatro PDF de CAD (`PLAY_SPORT_MCORTA_DIEG_S1…XL1.pdf`) se convierten con `tools/extract_pattern.py` en `patterns/play-sport-mc/<talla>.json`: delantero, espalda y dos mangas en milímetros, más su posición en el trazo. Verificación: el aprovechamiento de tela medido coincide con el que reporta CAD con menos de 0.75 % de diferencia (M: 61.01 % medido vs 61.42 %).

    python3 tools/extract_pattern.py trazo.pdf M patterns/play-sport-mc/M.json

**Una textura por pieza.** Cada pieza se pinta en sus propios milímetros. Esa misma textura alimenta:
- la vista **Molde** (piezas planas),
- la vista **3D**, donde cada pieza se dobla sobre el cuerpo (delantero y espalda alrededor de un torso ovalado, mangas en tubo),
- el **archivo de producción**: el trazo completo a escala real (1500 mm × alto del trazo, 100 dpi), cada pieza donde la colocó CAD y con su línea de corte. Sin marca de agua.

**En el estudio.**
- Playera: "Serigrafía por posición" (frente, pecho, espalda, nuca) o "Estampado completo" (sublimación).
- Vistas: Frente / Espalda / 3D en serigrafía; Molde / 3D en estampado completo.
- Estampado completo: cubrir cada pieza o repetir como patrón (40–320 mm), color de fondo y talla del molde.
- Sudadera y polo: 3D desactivado hasta tener su molde.

**Pendiente.**
- Moldes de sudadera y polo (PDF de CAD igual que estos) para llevarles el 3D.
- Resolución final y perfil de color de la impresora de sublimación para el archivo de producción (hoy 100 dpi).

### Playera dama y cuello de cinta

- La playera dama (PLAYERA PW DAMA BIE) se agregó al estudio con su molde S–XL. No tiene foto de prenda lisa, así que se muestra en 3D; las posiciones de frente y espalda están en una sola lista y el modelo gira al elegir una de espalda.
- **Cuello:** cinta de la misma tela, a 1 tono. En 3D es una banda sólida sobre la curva real del escote, del color de la prenda (o del fondo, en estampado completo); nunca lleva el estampado. El archivo de producción lo anota en el encabezado con el largo del escote, porque la cinta no está en el trazo.

| Estilo | Talla | Alto del trazo (mm) | Aprovechamiento CAD (%) | Medido (%) | Escote en línea de corte (mm) |
| --- | --- | --- | --- | --- | --- |
| Chilian Sport | S | 748 | 72.56 | 71.95 | 511 |
| Chilian Sport | M | 1003 | 61.42 | 61.01 | 522 |
| Chilian Sport | L | 1037 | 66.84 | 66.43 | 544 |
| Chilian Sport | XL | 1089 | 71.08 | 70.33 | 559 |
| Playera dama | S | 662 | 65.16 | 64.57 | 563 |
| Playera dama | M | 687 | 68.69 | 68.08 | 550 |
| Playera dama | L | 713 | 72.22 | 71.6 | 537 |
| Playera dama | XL | 738 | 76.29 | 75.67 | 531 |

El escote se mide sobre la línea de corte (incluye margen de costura), ignorando los piquetes. **Por revisar con Chilian:** en la playera dama el escote se acorta al subir de talla (S 563 → XL 531 mm) mientras se hace más profundo; en Chilian Sport crece (S 511 → XL 559 mm).

## Varios gráficos por prenda (uno por sección) y render realista

**Secciones de impresión.** Cada sección admite un solo gráfico, con su propia posición, tamaño, ajuste fino y opción de quitar fondo blanco. Subir otro archivo a la misma sección lo reemplaza; "Quitar gráfico" la vacía. Un punto relleno en cada botón indica qué secciones ya tienen gráfico.

| Prenda | Secciones |
| --- | --- |
| Playera y playera dama | Frente (frente completo o pecho izquierdo), Espalda, Nuca, Manga derecha, Manga izquierda |
| Sudadera | Frente, Espalda |
| Polo | Frente, Espalda, Nuca |

- Las mangas existen donde hay molde CAD y se ven en 3D y en la vista de molde.
- En estampado completo se agrega la sección **Fondo** (cubrir cada pieza o patrón repetido) y encima van los gráficos de cada sección.
- El resumen, la marca de agua de la descarga, el cotizador y el archivo de producción incluyen todas las secciones.

**Render realista.**
- *Fotos (Canva AI):* el gráfico se dobla con los pliegues de la tela (cada píxel de tinta se desplaza según la pendiente del pliegue), toma la luz y sombra de la prenda y deja ver un grano sutil de algodón. La playera dama ya tiene fotos de frente y espalda generadas con Canva AI (`blanks/dama-*.webp`), con cuello de cinta.
- *3D:* tono fílmico (ACES), iluminación de estudio de 3 luces, textura de tejido de punto, pliegues suaves que se desvanecen en las costuras, interior de la prenda en tela lisa y sombra de contacto.

### Armar la playera desde el molde (estampado completo)

En estampado completo la vista **Molde** es el editor: la playera se arma pieza por pieza, no con una foto encima de todo.

- **Fondo por pieza:** "Todas las piezas" (cubrir o repetir, como antes) y además una imagen propia para Delantero, Espalda, Manga der. y Manga izq. Cada una empieza cubriendo su pieza.
- **Gráficos encima:** Frente, Espalda, Nuca y mangas, uno por sección.
- **Todo es editable en el molde:** tocar una pieza o un gráfico lo selecciona (la pieza se marca, el gráfico lleva marco punteado); arrastrar lo mueve, la rueda o el control "Tamaño" lo escala (gráficos por ancho en cm, piezas en %), "Rotación" lo gira, las flechas lo empujan y Suprimir lo quita. "Volver a centrar" deja la capa como al subirla.
- Tocar una pieza vacía la deja lista para recibir la siguiente imagen que se suba.
- El 3D, el resumen, el cotizador y el archivo de producción usan exactamente lo armado en el molde.
- **Diseño de ejemplo ("TU DISEÑO"):** solo aparece la primera vez que se abre el estudio, se retira al pasar a estampado completo y, una vez quitado, no vuelve.

### 3D realista en hombre y mujer (simulación de tela)

El 3D ya no dobla las piezas sobre un tubo: **cose el molde real sobre un maniquí y deja caer la tela**, como un programa de confección 3D.

    python3 tools/drape.py play-sport-mc M      # una talla
    python3 tools/drape.py all                  # los 2 estilos × 4 tallas (≈ 2.5 min por talla)

1. **Maniquí por talla.** Chilian Sport usa un maniquí de hombre; la playera dama, uno de mujer (busto, cintura y cadera). Se escala con el contorno de la prenda: holgura ≈ 9 % en pecho de hombre y ≈ 6–7 % en busto de mujer.
2. **Costuras desde el contorno CAD.** Se detectan hombro, costado, sisa, copa de manga y costura bajo el brazo; cada par de costuras se reparte en el mismo número de puntos.
3. **Simulación** (dinámica basada en posiciones): las piezas se envuelven sueltas alrededor del cuerpo, las costuras se cierran poco a poco y después la gravedad asienta la prenda en hombros, busto y espalda, con colisión contra el maniquí. Las arrugas salen de la simulación, no se dibujan.
4. **Resultado** en `drape/<estilo>-<talla>.json` (posiciones en 0.1 mm, base64). La posición plana de cada punto es su coordenada de textura, así que los gráficos caen exactamente donde el molde dice (mismos centímetros que el estudio y el archivo de producción).

En el navegador: maniquí mate sobre base de acero, sombras suaves (las mangas sobre el torso, los pliegues), reflejos de estudio, tejido de punto, interior en tela lisa y la cinta del cuello a 1 tono con su costura a 11 mm. Si falta el archivo de una talla, el 3D vuelve al modelo anterior.

**Siguiente paso posible: render con IA sobre modelo.** Un botón "Render fotorrealista con IA" que envíe el mockup a un servicio de generación de imágenes y devuelva la prenda puesta en una persona. Requiere elegir proveedor, una llave de API guardada en Vercel y un presupuesto por render.

## Movimiento, botones y rendimiento

**Todo botón hace algo.**
- Las líneas Básica, Clásica y Premium, los servicios de planta (corte, costura, bordado, teñido) y las tres tarjetas chicas (Chilian Sport, proyectos especiales, promocionales) abren su ficha o llevan al cotizador con la prenda, el tipo de proyecto o la nota ya puestos.
- Las fotos de la planta abren en la galería (flechas, teclado y deslizar con el dedo), igual que los trabajos.
- Pie de página: dirección con mapa, WhatsApp, y "Aviso de privacidad" y "Términos" en ventana propia. **Por revisar con Chilian:** son un resumen redactado a partir de cómo funciona el sitio; el aviso completo debe venir de su área legal.
- Los correos del equipo son enlaces de correo; "Reservar capacidad" preselecciona Marca / OEM; la franja superior lleva a certificaciones.
- Botón "volver arriba" y avisos breves (copiar solicitud, mockup agregado, línea agregada).

**Movimiento** (se apaga si el sistema pide menos movimiento):
- Botones con brillo al pasar, gota de tinta donde se presiona y un leve imán en los principales; insignia "NUEVO" que se mueve; selector ES/EN que se desliza.
- Encabezado con sombra al bajar, barra magenta de lectura y la sección actual subrayada en el menú.
- Las secciones aparecen al llegar a ellas (en escalera), los números cuentan hasta su valor, la línea del proceso se llena estación por estación, la foto principal se asienta y se desplaza lento.
- Las ventanas cierran con animación; el menú del teléfono entra en escalera; en la orden de trabajo se ilumina lo que cambia.

**Rendimiento** (4G lenta simulada, antes → después):

| | Antes | Después |
| --- | --- | --- |
| Pintado principal (LCP), escritorio | 5.9 s | 1.2 s |
| Carga completa, escritorio | 8.2 s | 4.1 s |
| Imágenes al recorrer toda la página, escritorio | 9.4 MB | 3.0 MB |
| Imágenes al recorrer toda la página, teléfono | 9.4 MB | 1.5 MB |
| Saltos de diseño (CLS), escritorio / teléfono | 0.107 / 0.061 | 0.061 / 0.012 |

Cómo: fotos WebP con `srcset` (el teléfono baja la de 480 o 960 px), foto principal precargada con prioridad alta, fuentes propias precargadas (sin pedirlas a Google), foto principal alineada arriba para que no salte, y caché larga en Vercel para fotos, fuentes, prendas y librerías.

**Errores corregidos en la revisión:** un enlace directo a una sección (…/#equipo) caía fuera de lugar porque la página crecía después del salto; la fecha mínima del cotizador usaba la hora UTC (después de las 6 p. m. en México no dejaba elegir el día de hoy); la imagen para compartir en redes (og:image) no tenía dirección completa; el botón de WhatsApp flotante tapaba los enlaces legales del pie.

    python3 tools/optimize_photos.py     # después de agregar o cambiar fotos en photos/

## Información pública de Chilian integrada (octubre 2026)

Recopilada de su sitio oficial (grupochilian.com.mx), LinkedIn, TikTok, YouTube, X, Pinterest y prensa de Puebla. Lo que se agregó al sitio:

| Dato | Dónde quedó | Fuente |
| --- | --- | --- |
| 1er lugar, categoría Textil, Premio Nacional de Artes Gráficas (PNAG) 2025, con "Einstein: Abre tu mente" | Sección Historia (banda negra) | Diario Cambio, 2025 |
| Origen en 1990 como Estampados Especiales; la primera mesa con bisagras compradas con 6 pesos | Historia | Sitio oficial, LinkedIn, Mundo Ejecutivo Puebla (2023) |
| Unidades del grupo: Estampados Especiales, Promocionales Especiales, FDE Industries, Sport Exalta | Historia | LinkedIn de Grupo Chilian |
| Federico Chilian: expresidente de CANAIVE Puebla–Tlaxcala, autor de "Echando a perder se emprende", entrevista Hack-Eca Podcast | Historia y tarjeta del CEO | Agencia Enfoque, Heraldo de Puebla, Mundo Ejecutivo, YouTube |
| Aprobaciones 2026 de cumplimiento social SMETA, Walmart, C&A y FAMA | Certificaciones (SMETA y Walmart nuevas), franja superior, texto principal, sección EE. UU. | Publicación de LinkedIn de Grupo Chilian / Federico Chilian |
| Cadenas de suministro (Walmart, Amazon, Costco, Disney, Carhartt, Nike, adidas) | Sección EE. UU. | Perfil de LinkedIn de Federico Chilian |
| 8 catálogos PDF por línea (Básica: PLT, MK; Clásica: OPT, BON, KG, YBK; Premium: MYK, AK) | Ficha de cada línea | grupochilian.com.mx/pages/catalogos |
| Catálogo de campañas políticas (PDF) | Cotizador, al elegir "Campaña política" | Sitio oficial |
| 7 videos cortos y 6 guías del blog | Sección "Directo de la planta" | YouTube @grupochilian4341, blog oficial |
| Tinta fotocromática (cambia con el sol) | Técnicas | Video oficial de YouTube |
| Envíos nacionales e internacionales, lema #échalehuevos | Proceso y pie | Bio de TikTok |
| LinkedIn, Pinterest, X y tienda en línea | Pie de página | Perfiles oficiales |

**Encontrado pero NO publicado (por confirmar con Chilian):**
- **ISO 9001:** su página de serigrafía muestra una insignia, pero no hay certificado público. No se agregó.
- **Showroom en Av. 2 Sur 1914, Puebla:** aparece en su sitio oficial, pero Chilian indicó que el showroom ahora está dentro de la planta. Conviene actualizar su sitio y sus directorios.
- **Datos de directorios** (Dun & Bradstreet, RocketReach) con fundación 2018 y 9 a 50 empleados: contradicen 1990 y 51–200 de LinkedIn. Se usó 1990.
- **Teléfono en su sitio oficial** escrito como +51 2226 925404 (código de Perú): debería ser +52.
- **"Einstein: Abre tu mente"** solo aparece en una nota de prensa; sería ideal una foto de la pieza y del reconocimiento para la sección Historia.

## Catálogo, ventanas de información y animación de todo lo que se toca

**Catálogo (sección "Elige la prenda", menú "Catálogo").**
- 174 modelos tomados de los 8 catálogos PDF oficiales de Chilian (Básica: PLT y MK; Clásica: OPT, BON, KG y YBK; Premium: MYK y AK). Cada página de producto se convirtió en imagen y se le extrajo título, modelos, gramaje, tela, tallas y para quién es (caballero, dama, niños, unisex).
- Filtros por línea, prenda y público (con conteo), búsqueda por prenda, modelo, tela o gramaje, y "Ver más" de 12 en 12. Se carga solo al acercarse a la sección.
- Ficha de cada modelo: foto grande con zoom (tocar y mover), flechas, teclado y deslizar; datos; "Agregar a mi cotización"; "Ponle mi diseño" (abre Estampa tu idea con playera, playera dama, sudadera o polo); y "Ver en el PDF" en la página exacta.
- "Mi selección": los modelos agregados aparecen en el cotizador (se pueden quitar) y viajan en el mensaje de WhatsApp como "Modelos del catálogo". Se recuerdan en el navegador.
- Fuera del catálogo navegable: portadas, índices, separadores, guías de tallas y el catálogo de campañas políticas (lleva marcas de partidos y candidatos; sigue disponible como PDF desde el cotizador).
- Imágenes: las páginas oficiales de los catálogos; no fue necesario generar imágenes con IA.

**Ventanas de información nuevas:** los cuatro números de capacidad, cada paso del proceso, cada pulpo de la tabla (paletas, colores y para qué tiraje conviene), cada momento de la historia (con su fuente) y cada persona del equipo (WhatsApp y correo).

**Animación de todo lo que se toca:** transición suave de color, fondo, borde y sombra en todos los enlaces y botones; botones y tarjetas se hunden al presionar; los chips se elevan al pasar el cursor; los enlaces de texto dibujan su subrayado; las tarjetas del catálogo entran en escalera.

Para regenerar el catálogo cuando Chilian actualice sus PDF: ver `tools/catalog/README.md`.

## Catálogo y cotizador, juntos

- En la ficha de cada modelo se escriben las **piezas** y el **color**; "Agregar a mi cotización" lo suma (y "Actualizar" lo cambia). Después aparecen "Quitar" e "Ir a cotizar".
- En el cotizador, paso 02, cada modelo es una fila con foto, piezas y color editables, y se puede abrir de nuevo su ficha. La **cantidad total se calcula sola** (la suma de los modelos) y la prenda se toma de los modelos; "+ Agregar más modelos" regresa al catálogo.
- Sin modelos, el cotizador funciona como antes y ofrece "Ver modelos de [prenda] en el catálogo", que abre el catálogo ya filtrado por esa prenda.
- La orden de trabajo muestra cada modelo con sus piezas, y el mensaje de WhatsApp lista cada modelo con modelo, piezas, color y página del catálogo.
- No se envía la solicitud si algún modelo no tiene piezas. La selección se recuerda en el navegador.

## Chilian OS: cada pedido, de la prospección al embarque (`/ops`)

Sistema interno en `chilian.vercel.app/ops`. Cada persona entra con su usuario y contraseña (la sesión dura 14 días).

**Cuentas:** `admin1` es la cuenta principal. La primera vez entra con la contraseña original del equipo (`OPS_PASSWORD` en Vercel) y conviene cambiarla en «Mi cuenta». Desde **Equipo** crea las cuentas del equipo con su contraseña inicial, restablece contraseñas, desactiva o borra cuentas, da permisos de administrador, asigna tareas (con cliente, oportunidad, fecha y prioridad) y seguimientos de clientes (responsable de la cuenta y seguimientos repetidos), y ve la carga de trabajo de cada persona. Solo los administradores ven Equipo y Ajustes; el servidor lo hace valer. Las contraseñas se guardan con scrypt en `users/` del Blob privado, fuera de `/api/db`.

**Flujo:** Solicitud del sitio → Oportunidad (CRM) → Cotización → OT → Programación por pulpo → Escaneo por estación → Embarque → Entregada.

| Sección | Qué hace |
| --- | --- |
| Solicitudes | Todo lo que se envía desde el cotizador y el catálogo del sitio llega aquí con folio `SOL-AAMM-###`, además de abrir WhatsApp. «Convertir» crea la cuenta, la oportunidad y la primera tarea. |
| Oportunidades | Tablero por etapas (arrastrar), valor y valor ponderado, ajuste high-ticket de 7 puntos (A/B/C), siguiente paso con fecha, cadencia de 8 toques en 21 días y mensajes listos. |
| Tareas, Cuentas, Prospección | Tareas por persona (atrasadas, hoy, próximas); cuentas con contactos e importación CSV; guía de dónde encontrar cuentas que llenen la planta. |
| Cotizaciones (solo equipo, `ops/cotizador.js`) | Catálogo de Chilian (244 prendas y servicios de planta), productos frecuentes, precios aprendidos de cada cotización guardada con sugerencia por volumen, costeo interno (costo × factor, margen), descuento general y por volumen, cargo express, 4 formas de IVA, anticipo, entrega, condiciones, escenarios de cantidad, opciones a elegir, hoja del cliente en vivo (PDF) y texto para WhatsApp. Cotizador de serigrafía por tintas (tabla editable en Ajustes) con prenda opcional. Se guarda sola. «Aceptada» crea la OT. |
| Órdenes de trabajo | Folio `OT-AAMM-###` con código de barras Code 128, tallas, arte con enlace de aprobación para el cliente, merma, historial, hoja viajera y lista de empaque. |
| Programación | 8 pulpos × días hábiles, capacidad en minutos por día, arrastrar OT desde la fila de espera. |
| Escaneo | Lector USB/Bluetooth (o cámara donde el navegador lo permite): cada escaneo mueve la OT a la estación. |
| Embarques | Por embarcar y en camino, con guía y enlace de rastreo; el cliente lo ve en `/pedido?t=…`. |
| Ajustes | Tarifas (las iniciales son de ejemplo), tiempos, turnos, pulpos y equipo. |

**Páginas del cliente** (sin índice en buscadores): `/aprobar?t=…` para aprobar el arte o pedir cambios, `/pedido?t=…` para seguir el pedido.

**Técnica:** funciones en `api/` (Node, Vercel) sobre un Blob privado (`chilian-ops`); un archivo por registro en `db/<colección>/<id>.json`, archivos de arte en `files/<OT>/`. Cada guardado revisa que nadie haya guardado antes (si pasó, se carga la versión nueva). Variables: `BLOB_READ_WRITE_TOKEN`, `OPS_PASSWORD`, `SESSION_SECRET`. Para probar en local: `OPS_LOCAL_DIR=/ruta` guarda los registros como archivos y la contraseña local es `local`.

### Estampa tu idea (cliente)

El cotizador del cliente sigue sencillo. En el estudio de diseño: prenda y color primero; cada archivo subido queda en «Tus archivos» para usarlo en otra sección sin volver a subirlo; el fondo blanco se quita solo cuando el archivo lo tiene; se puede pegar una imagen (Ctrl+V); el ancho se ajusta con un deslizador o la rueda; «Quitar gráfico» se puede deshacer; la prenda queda a la vista mientras se eligen opciones y «Cotizar con este diseño» siempre está visible.

### Solicitudes: fuente, mercancía y pre-cotización; Instagram

- Cada solicitud llega al OS con **por dónde llegó** (Instagram, Facebook, Google, TikTok, WhatsApp, directo… desde `utm_source`, el navegador de la app o el referente), qué usó (cotizador, catálogo, Estampa tu idea) y cómo se envió (WhatsApp, copiada, Instagram Direct, registrada por el equipo), y si pidió **mercancía específica** del catálogo.
- Si pidió modelos del catálogo, el OS crea sola una **pre-cotización** con esos modelos, piezas y colores, con los precios que el equipo ya cotizó; al convertir la solicitud queda ligada a la oportunidad.
- Estampa tu idea pide **cuántas piezas** (atajos de 50 a 5,000); abierto desde un modelo del catálogo, lo agrega a la cotización con esas piezas y el color elegido.
- **Instagram**: enlaces para bio e historias (`/?utm_source=instagram&utm_medium=bio#cotizar`), registro manual de DMs (Solicitudes → + Solicitud) y webhook `/api/instagram` (API de Instagram con inicio de sesión de Instagram, campo `messages`, firma `X-Hub-Signature-256`): cada conversación es una solicitud con su hilo y se responde desde el OS. Variables: `IG_VERIFY_TOKEN` (ya creada), `IG_APP_SECRET`, `IG_ACCESS_TOKEN`. Pasos en Ajustes → Instagram.
- **OT previa desde Estampa tu idea**: al cotizar desde el estudio, el sitio envía con la solicitud el mockup limpio (frente y espalda, o el molde/3D) y los archivos de diseño originales (`/api/adjunto`, permiso de 30 min por solicitud, PNG/JPG/WebP, 4 MB, 8 archivos), más la medida de cada sección. El OS crea una **OT previa** con ese arte y esas medidas: no entra a programación, escaneo ni embarques hasta confirmarla, y se confirma sola (la misma OT) al aceptar su cotización. El cliente ve ese arte en su enlace de aprobación.

### Máquinas: pulpos, 2 DTG y bordadora de 6 cabezas

- **Estudio:** cada foto de prenda se calibró con el pecho real de la talla M y se corrigió su proporción (las fotos estaban estiradas a lo alto), así que la medida que muestra el estudio es la que se ve sobre la prenda; los tamaños muestran la medida real con tu diseño. El cliente elige técnica (serigrafía, DTG o bordado) y viaja a la solicitud y a la OT previa.
- **OS:** Ajustes → Máquinas (tipo serigrafía, DTG o bordado) y Ajustes → DTG y bordado (tiempos y costos de ejemplo). Cada ubicación de una partida tiene técnica (colores, puntadas o prenda oscura); los minutos se calculan por técnica: DTG pieza por pieza, bordado por ciclos de 6 cabezas. Programación agrupa las máquinas por tipo y programa cada técnica de la OT en su máquina (el DTG se puede repartir entre las 2). Cotizador de bordado y DTG con precio y días de máquina.
- **Sitio:** tabla de impresión digital y bordado en la planta, DTG como técnica y en el cotizador.
- **WhatsApp de destino:** cada solicitud guarda a qué número de Chilian se envió (la línea del asesor del tipo de proyecto) y el OS lo muestra («Llegó al WhatsApp 220 175 9053 · Ventas uniformes…»), con filtro por número. Las registradas a mano eligen la línea; las solicitudes anteriores lo deducen del asesor. Los números se editan en Ajustes → Números de WhatsApp.

### Catálogo desglosado, gráficos por modelo y Chilian Sport

- **Catálogo:** `tools/catalog/3_split.py` deja un producto por ficha: las páginas MK (2–6 productos) y YBK (2 por página doble) se recortan por producto a 200 ppp; los uniformes OPT se separan en camisa y pantalón con su estilo. 174 → 244 productos. Cada ficha trae sus colores (192 de 244 los tienen en el PDF como texto), que se muestran en la ficha y se sugieren al escribir el color en el cotizador del sitio y en el del OS.
- **Gráficos por modelo:** en el cotizador del sitio cada modelo del catálogo tiene «Adjuntar gráfico» (PNG, JPG, WebP, PDF o SVG convertido a PNG; 4 MB, hasta 6). Se suben con la solicitud y en el OS aparecen con su modelo; también generan la OT previa.
- **Estudio:** el estampado completo existe solo como **Chilian Sport** (playera); en las demás prendas no se ofrece. Las piezas y «Cotizar» quedan fijos al pie del panel y toman la cantidad actual del modelo al abrir el estudio.

### Revisión (5 pasadas)

1. Todo el sitio en computadora y teléfono: errores, recursos y enlaces internos, imágenes, desbordes y cada botón (54) — limpio.
2. Ventanas y flujos (catálogo, ventanas de información, formulario, calculadora, estudio con descarga, molde y 3D, menú, inglés): títulos de catálogo repetidos (23 nombres en 61 productos) → ahora cada nombre es único (línea MYK, Gold/Platinum, para quién, tela, gramaje o modelo).
3. OS en todas las secciones y detalles, computadora y teléfono: en teléfono la columna crecía con el tablero de oportunidades → corregido; página 404 con la marca (`404.html`).
4. Consistencia y accesibilidad: teléfonos, correos y WhatsApp iguales en todo el sitio, sin IDs duplicados, botones con nombre, imágenes con texto alternativo; campo trampa con etiqueta.
5. Regresión completa (cotizador, equipo, Instagram, OT previa, máquinas, WhatsApp, catálogo y adjuntos): la prenda llegaba en minúsculas al elegir modelos → corregido.

## Cotiza en un minuto (cotizador del sitio)

La sección `#cotizar` funciona como un configurador con precio en vivo:

- **Configurador:** producto, cantidad (campo, atajos 100 / 500 / 2,000 / 10,000 y deslizador), técnica, colores de tinta (1–6), tamaño de bordado, ubicaciones (1–4) y entrega (estándar o express). El full print solo se ofrece en la playera Chilian Sport y DTG no se ofrece en gorras. Cada técnica tiene su mínimo (serigrafía 6, DTG 1, bordado 12, full print 6).
- **Orden estimada:** una frase con lo que se cotiza, el desglose por pieza (prenda, impresión, pantallas o ponchado prorrateados, cargo express), el precio por pieza, el total antes y con IVA, la fecha de entrega en días hábiles y cuánto baja el precio en la siguiente escala, con un botón para usarla. En teléfono, una barra fija abajo muestra el precio mientras se configura.
- **Mi cotización:** un panel lateral (botón en el encabezado, con contador) junta los estimados, lo que llega de Estampa tu idea y los modelos del catálogo con sus gráficos. Ahí se editan las piezas, se quita lo que sobra, se ve el total y se envía la solicitud (nombre, empresa, correo, WhatsApp, fecha y comentarios), por el sitio o por WhatsApp a la asesora del tipo de proyecto.
- **Precios:** `/api/precios` (público) devuelve los precios de venta de referencia; se editan en **Chilian OS → Ajustes → Precios del cotizador web**. Los valores que trae son **de ejemplo** y el sitio lo dice hasta que se marquen como revisados.
- **En el OS:** la solicitud muestra lo que el cliente cotizó y su correo, y se crea una pre-cotización con un renglón por estimado al precio que vio el cliente, con sus ubicaciones y técnica.

### Cotizaciones y pipeline, conectados

- **Cotización nueva = lead:** al crear una cotización se elige la cuenta (o se da de alta el cliente nuevo con contacto, WhatsApp o correo, segmento y fuente) y su oportunidad (una abierta de la cuenta o una nueva). La oportunidad nueva entra en *Calificado*, con el valor de la cotización y la siguiente acción «Enviar la cotización». Si se crea desde una oportunidad en *Nuevo* o *Contactado*, pasa a *Calificado*. Las copias de una cotización también entran al pipeline.
- **Al marcarla enviada:** la oportunidad pasa a *Cotización enviada* (sin retroceder si ya está en *Negociación*; si estaba perdida, se reabre), toma el valor, las piezas y el folio de la cotización, programa el seguimiento a 2 días (siguiente acción y tarea) y deja la nota en su actividad. Si la cotización no tenía lead (por ejemplo, una pre-cotización del sitio sin convertir), se crea en ese momento a partir de su solicitud.

## WhatsApp, Instagram y Messenger; Avisos del OS

- **Un solo webhook** `/api/meta` (antes `/api/instagram`, que sigue funcionando) recibe WhatsApp (todos los números de la cuenta de WhatsApp Business, incluida la coexistencia con la app), Instagram Direct y Facebook Messenger. Cada conversación es una solicitud con su hilo; en WhatsApp dice a qué número llegó. Se responde desde la solicitud (ventana de 24 h de Meta).
- **Avisos** (`ops/alerts.js`, solo en el OS): tareas, prospectos nuevos, cotizaciones pendientes, avances sin terminar e información sin llenar, por persona. Sección «Avisos» con contador en el menú y aviso de urgentes en el Tablero.
- **Sin notificaciones en el dispositivo.** Se quitaron el push (Web Push con VAPID), el service worker, el resumen diario por Cron y las notificaciones del navegador. Lo nuevo se ve en Solicitudes y en Avisos al abrir el OS. Las solicitudes y mensajes nuevos quedan marcadas «mensaje nuevo».
- **Tutorial paso a paso:** `/ops/conectar` (también enlazado en Ajustes). Variables de entorno: `META_APP_SECRET`, `IG_VERIFY_TOKEN` (o `META_VERIFY_TOKEN`), `WA_ACCESS_TOKEN`, `IG_ACCESS_TOKEN`, `META_PAGE_TOKEN`.

## Identidad: logo y tipografía originales

- **Logo:** los archivos originales de Grupo Chilian (carpeta de marketing en Drive): el círculo azul `#0070BB` con la C (`logos/chilian-icono.png`) y la palabra CHILIAN (`logos/chilian-wordmark.png`, versión negra o blanca según el modo claro u oscuro), con el lema «Estampados • Textiles • Promocionales». Aparece en el encabezado y el pie del sitio, el OS (barra lateral y entrada), la hoja de cotización, las páginas de cliente, la 404, el tutorial y la marca de agua de los mockups. Favicon e íconos del OS salen del ícono original.
- **Tipografía:** la del logo es una geométrica tipo Century Gothic (de licencia comercial). En la web se usan sus equivalentes libres (OFL): **Jost** para titulares, botones y etiquetas, y **Questrial** para el texto. Se sirven desde `fonts/`.

### Operación: tablero de órdenes de trabajo

- **Órdenes de trabajo** se ve como tablero por etapa (Arte → Entregada). Las OT se arrastran de una etapa a otra; en el teléfono, con «Mover a…» en cada tarjeta. La vista de lista sigue disponible.
- **Procesos sin terminar:** antes de avanzar una OT se revisa lo que falta para la etapa destino (arte subido y aprobado, tallas completas, máquina programada, revisión de calidad, datos de embarque, fecha compromiso, piezas, OT previa sin confirmar y etapas brincadas). Si falta algo, aparece la lista y se puede cancelar, abrir la OT o mover de todos modos (queda en el historial con el nombre de quien la movió). Las tarjetas, la lista, el detalle de la OT y el escaneo muestran la leyenda «⚠ procesos sin terminar»; en la barra de etapas, las que se brincaron salen con «!».

### Origen del cliente y borrado

- **Toda cotización trabajada entra al CRM:** las que se crean con «+ Cotización» nacen con su oportunidad; las pre-cotizaciones del sitio y las que no tenían oportunidad se agregan solas en cuanto se editan (o con «Agregar al CRM»).
- **¿De dónde viene el cliente?** Se pide al crear la cotización, en dos grupos: por internet (sitio web, Instagram, Facebook, WhatsApp, TikTok, Google, redes) y sin internet (cliente actual ya retenido, contacto personal, referido, llamada o visita, feria o evento, distribuidor, prospección, otro), con un detalle libre (quién lo refirió, qué feria…). Una cuenta existente propone su origen, o «cliente actual» si ya compró. Se puede cambiar arriba de cada cotización y en la oportunidad; se guarda en la cotización, la oportunidad y la cuenta.
- **Borrar:** tareas (× en cada tarea), cotizaciones (× en la lista o «Borrar cotización») y cuentas («Borrar cuenta», solo la cuenta principal; opcionalmente con sus oportunidades, cotizaciones y tareas; las órdenes de trabajo se conservan).

## Revisión de OS y CRM: agilidad y coherencia (noviembre 2026)

Tomado de lo que hacen bien los sistemas para talleres de estampado (Printavo, ShopVOX, YoPrint: todo el trabajo por etapas, pagos y aprobación del cliente en la orden) y los CRM de ventas (Pipedrive: oportunidades estancadas, crear rápido desde cualquier lugar):

- **Buscar o crear desde cualquier pantalla:** Ctrl/⌘ K o «/» (y el botón ＋ en el teléfono). Busca clientes, contactos, oportunidades, cotizaciones, OT, solicitudes y tareas; y crea cotización, oportunidad, tarea, cuenta, solicitud u OT.
- **Teléfono:** barra inferior con Inicio, Avisos, Solicitudes, Tareas, Planta y ＋, con contadores.
- **Navegación:** cada detalle (oportunidad, cuenta, cotización, OT) tiene «← volver» a su lista; los diálogos se cierran al cambiar de pantalla; Ajustes tiene índice de secciones.
- **Pipeline:** días en la etapa y aviso de oportunidad estancada (Nuevo 1 día, Contactado 4, Calificado 7, Cotización enviada 5, Negociación 10, sin siguiente paso a futuro); filtros por origen del cliente y por estancadas. También salen en Avisos.
- **Cliente 360:** la cuenta muestra sus tareas pendientes (con alta rápida) y un historial único con solicitudes, oportunidades y su actividad, cotizaciones, movimientos de OT y tareas hechas.
- **Tareas:** alta rápida en una línea (tipo, texto, fecha, para quién) y botón «Mañana» para pasarla al siguiente día hábil.
- **Pagos en la OT:** total, anticipo y saldo; registro de pagos (monto, método, fecha, referencia). Pasar a compra de prenda sin anticipo cubierto y entregar con saldo pendiente avisan como proceso sin terminar; también en Avisos.
- **Reportes:** leads, tasa de cierre, vendido, ciclo de venta, entregas a tiempo y merma; de dónde vienen los clientes (leads, ganadas, cierre, vendido, abierto por origen), embudo solicitud → lead → cotización enviada → aceptada, venta por mes y razones de pérdida.

## SEO y visibilidad en buscadores y asistentes de IA

- **Título y descripción** con lo que se busca (serigrafía, bordado, DTG, Puebla) y cambian al inglés con el botón EN. Canónica, Open Graph completo y tarjeta de X.
- **Datos estructurados (schema.org JSON-LD):** organización y negocio local (dirección, teléfono, horario, fundación 1990, redes, contactos de venta, técnicas como servicios), sitio web y preguntas frecuentes.
- **Preguntas frecuentes visibles** (`#preguntas`) con las mismas respuestas que los datos estructurados; todo sale de datos ya publicados en el sitio.
- **Contenido legible sin JavaScript:** técnicas, equipo y auditorías vienen ya en el HTML (el script los vuelve a dibujar con su diseño).
- **`robots.txt`** (permite buscadores y asistentes de IA; cierra `/ops`, `/api`, enlaces privados de clientes), **`sitemap.xml`** y **`llms.txt`** (resumen del negocio para asistentes).
- El dominio está en una sola constante del script de SEO: si el sitio se muda a grupochilian.com.mx, hay que cambiar la canónica, `og:url`, el sitemap y `robots.txt`.

### SEO enfocado en el cliente de alto valor

- **Para quién:** marcas globales y licencias, OEM, programas de uniformes y marcas de EE. UU. que producen en México.
- **Página en inglés indexable: `/en`** (`en.html`), con todo el texto en inglés ya en el HTML, título, descripción, canónica y datos estructurados propios. `hreflang` une `/` (español) y `/en` (inglés). El botón ES/EN cambia la dirección; la dirección manda el idioma (los navegadores en inglés ven una invitación a la versión en inglés, sin cambiar la página en español).
- **Títulos y descripciones:** «Planta de serigrafía y confección para marcas en México» / «Audited screen printing & apparel manufacturer in Mexico», con auditorías y capacidad.
- **Preguntas que hacen las marcas** (visibles y en datos estructurados): marcas y licencias producidas, auditorías, capacidad, paquete completo, mínimo para marcas, proceso con muestra de preproducción, marcas de EE. UU., visita a planta y cotización.
- **Datos estructurados:** servicios B2B (maquila para marcas y OEM, paquete completo, uniformes, merch), temas (producto licenciado, nearshoring, cumplimiento social), premio PNAG 2025 y contactos por tipo de cliente.
- **`llms.txt`** con los clientes principales y un resumen en inglés.
- **Regenerar después de editar `index.html`:** `python3 tools/seo/build_seo.py` (escribe el bloque SEO, las preguntas, `en.html` y `sitemap.xml`). El dominio está en la constante `SITE`.

### Mayoreo y menudeo, páginas por tipo de cliente y todos los dispositivos

- **Dos caminos para comprar** en la página principal: mayoreo y programas (cotizador) y menudeo (tienda en línea de Chilian).
- **Páginas por intención de búsqueda** (`tools/seo/build_landings.py`): `/maquila-serigrafia-para-marcas`, `/uniformes-empresariales`, `/playeras-personalizadas-mayoreo`, `/playeras-deportivas-sublimadas` (con precios por volumen y datos de producto), `/merch-eventos-y-campanas` y `/contract-screen-printing-mexico` (inglés). Cada una abre el cotizador con el tipo de proyecto ya elegido (`/?tipo=…#cotizar`) y lleva al WhatsApp de la asesora correcta; están enlazadas desde el pie y entre sí, en `sitemap.xml` y en `llms.txt`.
- **Dispositivos:** revisión automática en 320, 360, 390, 414, 768, 1024, 1280, 1440 y 1920 px del sitio, `/en`, las páginas nuevas, la 404, las páginas de cliente, el tutorial y el OS: sin desbordes laterales, botones y enlaces táctiles de al menos ~40 px, letra mínima legible y la animación de fotos sin provocar desplazamiento lateral.
- Orden para regenerar: `python3 tools/seo/build_seo.py && python3 tools/seo/build_landings.py`.

## Paleta (noviembre 2026): ocre, negro y crema

El rosa pasa a ocre (`#C9922E`), el blanco a negro (`#0B0B0B`), el negro y gris oscuro a crema (`#F3EBDD`, texto secundario `#B9AF9E`) y el azul a negro. Aplica a todo: sitio, versión en inglés, páginas por tipo de cliente, OS, hoja de cotización, páginas de cliente, 404, tutorial y logos (círculo negro con la C en crema; favicon e íconos del OS). `tools/palette.py` agrega un bloque final de colores en cada página y regenera lo necesario; las hojas que se imprimen en planta (hoja viajera y lista de empaque) siguen en negro sobre papel. Las fotos de producto del catálogo conservan su fondo blanco.

## Venta por mensaje: asistente, chat del sitio y pagos en línea

Un solo asistente para el chat del sitio, WhatsApp, Instagram y Messenger. Cotiza paso a paso con botones (prenda → piezas → técnica → tintas o bordado → ubicaciones → entrega). Usa los mismos precios que «Cotiza en un minuto» (`api/_pricing.js`, la versión de servidor de `qzCalc`, que lee `ajustes/precios-web`).

- **Cuándo pasa a una asesora:** pedidos de más de $7,200 MXN (total con IVA, comisión y envío); licencias, programas de marca, paquete completo o quejas; o cuando el cliente lo pide. Fuera del horario (lunes a viernes, 9:00 a 19:00, hora CDMX) avisa cuándo le contestan.
- **Cuándo se calla:** si el equipo contesta desde el OS o desde el teléfono, el asistente se calla en esa conversación. También se puede pausar o reanudar desde Solicitudes.
- **Pagos:** usa Mercado Pago (Checkout Pro) y Stripe (Checkout).
  - `/api/venta?webhook=mp|stripe` registra cada pago una sola vez (por `pid`) en la solicitud (`SOL-`) o la cotización (`COT-`).
  - Al registrarlo, avisa al equipo y le confirma al cliente en su chat.
  - El OS abre la OT con el pago ya registrado y crea una tarea para confirmar arte, tallas y fecha.
  - «Link de pago» en solicitudes y cotizaciones propone el anticipo o el saldo.
- **Encendido por canal:** se activa por canal en Ajustes → *Asistente de ventas* (`ajustes/asistente`) y viene apagado. Para probarlo sin publicarlo, abre `/?asistente=1`. El widget es `chat.js` y se carga en todas las páginas.
- **Archivos:**

  | Archivo | Qué hace |
  | --- | --- |
  | `api/_bot.js` | Flujo guiado y extracción opcional con IA |
  | `api/_channels.js` | Envío con botones o listas por canal |
  | `api/_pay.js` | Links de pago y webhooks |
  | `api/venta.js` | Endpoint del chat, links y webhooks |
  | `pago.html` | Página de regreso después de pagar |

- **Variables en Vercel (todas Sensitive):**
  - `MP_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
  - Opcionales: `ANTHROPIC_API_KEY` (y `BOT_MODEL`) y `SITE_URL`.
  - Paso a paso: `/ops/conectar.html#pagos`.
- **Funciones de Vercel:** `/api/instagram` se reescribe a `/api/meta` (`vercel.json`), así el proyecto se mantiene en 11 funciones.

### Cómo atiende el asistente (definido con el dueño de Chilian)

1. **Primero identifica quién escribe.** Si el primer mensaje ya lo dice, no pregunta.
   - **Ya sé lo que quiero:** ya trae prenda, tela, gramaje y sistema de impresión, y probablemente está comparando precios. Va directo: producto, línea (o su propia tela y gramaje), piezas, sistema de impresión y cotización.
   - **Necesito asesoría:** conoce el producto pero no las calidades ni los sistemas de impresión.
   - **Estoy explorando:** no sabe qué cotizar. Recibe el mismo camino que «Necesito asesoría», con más explicación.
   - **Ya soy cliente:** se reconoce solo por su teléfono en WhatsApp, o lo elige el cliente. Puede repetir un pedido (pasa a su asesora), cotizar algo nuevo o hablar con su asesora.
2. **Asesoría por uso.** Pregunta para qué es: carrera o deporte, evento, merch de un negocio, uniforme, banda o gira, marca de ropa, o regalo. Con eso sugiere tres productos, con el recomendado marcado con ⭐.
   - Ejemplos: una carrera lleva a la Chilian Sport con full print; una cafetería, a playeras básicas; una banda, a la línea premium con efectos.
3. **Tres opciones a la vez.** Las líneas Básica, Clásica y Premium se muestran lado a lado, con tela, gramaje y precio por pieza a la cantidad del cliente. Normalmente se elige la de en medio.
4. **Impresión según el diseño.** Pregunta cómo es el diseño (logo, foto, bordado, sin diseño) y sugiere la técnica. Luego cotiza.

En el OS, cada solicitud muestra el **perfil** del cliente, el **uso** y, si la pidió, su **especificación de tela**. Una especificación propia siempre pasa a una asesora para confirmar el precio.

Las líneas y sus telas o gramajes están en `api/precios.js` (`lineas`, `specs`). Son **ejemplos** hasta que Chilian los confirme: la Básica cuesta 0.85× y la Premium 1.4× el precio de la prenda.

### El asistente con Claude (`api/_ai.js`)

Cuando `ANTHROPIC_API_KEY` está en Vercel, cada mensaje escrito por el cliente se lo manda a Claude junto con cuatro funciones (herramientas estrictas). Claude usa las que apliquen:

| Función | Qué hace |
| --- | --- |
| `registrar_pedido` | Guarda producto, piezas, técnica, uso, línea, tela, nombre, empresa y fecha |
| `responder` | Contesta dudas sobre Chilian, sin dar precios |
| `calificar_cliente` | Estima el valor del pedido en USD y anota las señales que lo justifican |
| `pasar_a_asesora` | Manda la conversación con una asesora |

- **Precios:** los sigue calculando el motor de precios. Claude nunca los da.
- **Modelo:** `claude-sonnet-5-5` con esfuerzo bajo. Se puede cambiar con `BOT_MODEL`.
- **Si el modelo se niega a responder:** la API reintenta sola con otro modelo (fallback del servidor).
- **Sin llave:** el asistente sigue funcionando con botones y reconocimiento de frases.

**Clientes que valen la pena.** `rateLead` en `api/venta.js` toma el valor más alto entre la cotización, el estimado del motor (producto × piezas) y el estimado de Claude. Si llega al umbral (400 USD por defecto, con tipo de cambio 18.5; se cambia en Ajustes → Asistente):
- marca la solicitud como «Vale la pena»;
- la sube al inicio de Solicitudes (filtro «Valen la pena»);
- avisa al equipo una sola vez.

### Precios: lista oficial de Chilian y lo que paga el cliente

- **Lista oficial.** `api/_lista.js` contiene la lista de precios de playera cuello redondo, entregada por Chilian en noviembre de 2026: 113 renglones, precios por 12, 50, 100, 300 y 1,000 piezas.
- **Líneas del sitio y del asistente.** Usan modelos Óptima de la lista:

  | Línea | Blanca | De color |
  | --- | --- | --- |
  | Básica | OP-STPB | OP-STPC |
  | Clásica | OP-PRB | OP-PRC |
  | Premium | OP-MXB | OP-MXC |

  - **Básica:** 50/50, 155 g.
  - **Clásica:** 100 % algodón, 155 g.
  - **Premium:** peso completo, 190 g.

  Otros productos de la lista:
  - La Chilian Sport usa `CH-SPORT`.
  - La playera teñida en prenda usa `12030`.
- **Precio final.** El cliente paga (prenda + impresión) × 1.16 (IVA) × 1.05 (comisión de Mercado Pago o Stripe), más el envío por pedido. La comisión y el envío se configuran en Ajustes → Asistente de ventas (`precios-web.precios.cargos`).
- **Referencias de Factory 1 Direct** (factory1direct.com):
  - **Productos que Chilian aún no tiene en lista:** manga larga, crewneck, short y pants. Precio = precio USD con una impresión, menos 3 USD, × 18.5.
  - **DTG:** 55.50 MXN por ubicación, que equivale a sus 3 USD por impresión extra.
  - **Estudio:** texto con fuentes, revisión de resolución (mínimo 150 DPI a la medida de impresión) y precio en vivo por ubicación.
  - No se copia ninguna imagen de ese sitio.

### Serigrafía: tabla oficial LN1

- **Tabla.** `api/_serigrafia.js` contiene la tabla oficial de Chilian: precio por pieza y por ubicación, antes de IVA, en MXN. Se busca por tamaño del estampado (100, 300, 600, 1,200 o 1,800 cm²), por piezas (100, 250, 500, 1,000, 10,000 o 100,000) y por colores (1, 2-3, 4-5, 6-7, 8-9 o 10-11).
- **Extras por pieza y por ubicación** (según tamaño y piezas):
  - Fabric Color.
  - Antimigrante.
  - HD / Puff: se suma sola con las tintas HD y puff.
  - Fleece: se suma sola en sudaderas y crewneck.
  - Glitter: se suma sola con la tinta glitter.
  - Calidad exportación.
- **Mínimo.** Serigrafía desde 100 piezas, que es donde empieza la tabla. Por debajo de eso, DTG.
- **Ya no hay cargo de pantallas.** El precio de la tabla las incluye.
- **Cálculo.** Prenda de la lista + impresión de la tabla, y encima IVA 16 % × comisión 5 % + envío.
- **Dónde se usa.** El cotizador del sitio, el asistente (pregunta colores y tamaño) y el estudio (usa el área real de cada ubicación).
- **Cambios.** Las tablas están en código: para cambiarlas hay que pasar la nueva lista.
- **Límite del asistente.** Pasa a una asesora arriba de $7,200 (6,000 + 20 %).

### Precios de estampado en todo el sistema

- **Una sola tabla.** La tabla LN1 de serigrafía se usa en:
  - el cotizador del sitio;
  - el estudio «Estampa tu idea» (cada ubicación por su área real);
  - el asistente en el chat, WhatsApp, Instagram y Messenger;
  - el cotizador de serigrafía por tintas del OS.
- **Colores de prenda y extras:**
  - **Prenda de color:** suma la columna «prenda de color» (Fabric Color) y una base blanca.
  - **HD, puff y glitter:** cada tinta suma su extra.
  - **Prendas afelpadas:** las sudaderas y crewneck suman fleece.
  - **Opcionales:** antimigrante y calidad exportación.
- **OS: la tabla es lista de precios.** En Ajustes se llama «Tabla de precios de serigrafía (LN1)» y el margen de estampado queda en 0 %: el OS cobra el precio de la tabla más IVA. Si se quiere un margen, se pone en Ajustes o en la cotización.
- **Cambio de versión.** `tarifas.tablaVersion` (hoy `LN1-2026-11`) marca la versión de la tabla. Si los ajustes guardados traen otra, la tabla, el margen de estampado y el ajuste en % vuelven a los valores nuevos una sola vez. Al guardar los ajustes queda la versión nueva.
- **Diferencia con el sitio.** El sitio suma además 5 % de comisión de pago en línea y envío; el OS no, porque ahí el cobro lo registra el equipo.

### Envío «a cotizar» y publicación del chat

- **Envío.** El sitio y el asistente ya no suman envío. Muestran «envío a cotizar con tu asesora» y el total dice «sin envío». Para cobrar un monto fijo: Ajustes → Asistente de ventas → «Envío por pedido», con la casilla «Envío a cotizar» quitada.
- **Chat publicado.** El chat del sitio viene encendido por defecto (`BOT_DEFAULTS.activo.web`).
  - **Se apaga desde Ajustes:** se desactiva en Ajustes → Asistente de ventas, y lo guardado ahí manda sobre el valor por defecto.
  - **Almacenamiento caído:** el botón del chat solo aparece si el almacenamiento responde (`/api/venta?accion=activo`). Si el almacenamiento falla, el sitio no muestra un chat que no puede guardar.
  - **WhatsApp, Instagram y Messenger:** siguen apagados hasta conectar Meta y encenderlos en Ajustes.


### Uso del almacenamiento (Vercel Blob)

- **Qué gastaba más.** En el plan Hobby, los listados (`list`) cuentan como operaciones avanzadas y tienen un límite mensual bajo. El mayor consumo era el OS: cada actualización listaba el almacén 8 veces, una por colección y una por usuarios. Con la pestaña abierta se actualizaba cada 90 segundos, así que una sola pestaña gastaba unos 280 listados por hora. El consumo fue una estimación hecha leyendo el código, sin medidor de operaciones; el plan Hobby se pasó de su límite y suspendió el almacén.
- **Ahora:**
  - El OS carga todo con una petición y un solo listado (`/api/db?all=1`).
  - Ya no se actualiza solo cada 90 segundos: se actualiza al volver a la pestaña después de 10 minutos, al cambiar de sección después de 1 minuto y con «Actualizar datos».
  - Las cuentas se piden una vez y cada 15 minutos, no en cada carga.
  - El servidor recuerda los listados 2 minutos y los corrige con sus propias escrituras.
  - El chat del sitio solo consulta cuando una persona puede contestar (cada 12 segundos), no mientras habla el asistente.
  - Cada consulta de «¿está encendido el chat?» lee una sola vez, y la comprobación de que el almacén responde es esa misma lectura.
- **Ya sin uso.** El push no tocaba el almacenamiento (sin las llaves VAPID no hacía nada), pero se quitó por no tener uso.
- **Código quitado.** `api/_push.js`, `api/avisos.js`, `ops/sw.js`, `propuesta-v2.html`, 21 archivos de fotos y un logo sin referencias, las funciones `calcLinea`, `userByName` y `listaPor`, y la dependencia `web-push`.

### El chat: medidas, datos al inicio, memoria y varias cotizaciones

- **Medidas con conciencia.** Para serigrafía, el asistente pregunta lugar por lugar (frente, espalda, pecho izquierdo, manga o nuca) y le da a cada uno su medida. No hay solo «chico, mediano y grande».
  - **Medidas de la tabla.** Son las mismas que usa el cotizador del OS, cada una con su uso:
    - Escudo ≈ 10×10 cm.
    - Media carta ≈ 21.5×14 cm.
    - Carta ≈ 21.5×28 cm.
    - Doble carta ≈ 28×43 cm.
    - Extra grande ≈ 30×60 cm.
  - **Sugerencia por lugar.** Marca con ⭐ la medida que suele ir en cada lugar.
  - **Medida propia.** El cliente puede escribir la suya («20 × 25 cm» o «8 × 10 pulgadas») y se acomoda a la medida siguiente de la tabla. Una medida mayor a 30×60 cm pasa a una asesora.
  - **Cuenta y cotización.** Luego pregunta si se agrega otra ubicación (hasta 4). La cotización lista cada ubicación con su medida y cada una se cobra por su área.
  - **Sitio y estudio.** El cotizador del sitio tiene las mismas medidas, más una casilla de «Tu medida» para escribir ancho × alto. El estudio ya cotizaba por el área real.
- **Datos desde el inicio, de uno en uno.** En el chat del sitio pregunta primero el nombre y luego un WhatsApp o correo. Cada pregunta tiene «Prefiero no decirlo». Si el cliente se salta los datos, los pide antes de dar el precio. En WhatsApp, Instagram y Messenger ya los tiene del canal.
- **Un chat es una cotización.** Cada cotización queda en su propia solicitud del OS. Marca «cotización 2» y «Viene de SOL-…» en las siguientes.
  - **«Nueva cotización»:** botón en el encabezado del chat, botón tras cada cotización y texto «nueva cotización».
  - **«Cerrar chat»:** igual, con botón o texto.
  - **Después de cerrar:** el chat se bloquea y ofrece «Nueva cotización».
- **Reinicio a las 24 h, memoria a las 72 h** (`api/_ciclo.js`, por cliente del chat):
  - **Reinicio a las 24 h:** si el cliente tiene una cotización y pasan 24 horas sin escribir, su siguiente mensaje abre un chat nuevo.
  - **Memoria que se queda:** nombre, empresa, contacto, tipo de cliente, producto, calidad, color y técnica de su última cotización, y cuántas cotizaciones lleva.
  - **Lo que se pierde:** la conversación y el pedido. Con la memoria el asistente lo saluda por su nombre y ofrece «Igual que la última vez».
  - **72 h sin escribir:** se pierde también la memoria. El siguiente chat empieza de cero.
  - **Canales sociales:** conservan su identificador (es como se les contesta), que no cuenta como memoria.
- **Privacidad.** Solo el identificador de WhatsApp permite reconocer una cuenta de cliente. Un teléfono escrito en el chat del sitio ya no sirve para saludar con el nombre de una cuenta.

### Cotizador interno: precios por escala (lista de playeras y serigrafía desde 6 pz)

- **Lista de precios en el cotizador.** El cotizador del OS (`ops/cotizador.js`) carga la lista de playeras cuello redondo de `/api/precios`, que sale de `api/_lista.js`.
  - **Dónde aparece.** En el buscador de productos, en el grupo «Lista de precios · playera cuello redondo», y como prenda en los cotizadores por tintas, de bordado y de DTG.
  - **Cómo cambia el precio.** Al escribir las piezas, el precio toma la escala de la lista: 12, 50, 100, 300 y 1,000 pz. Con menos de 12 pz se usa la de 12. El precio es antes de IVA y la cotización suma el IVA según su opción.
  - **Margen.** Al elegir una prenda de la lista en los cotizadores por tintas, de bordado o de DTG, el margen de prenda queda en 0 %, porque la lista ya es el precio de venta.
  - **Color de la prenda.** En el cotizador por tintas, «Prenda» pasa sola a clara o de color según el color de la prenda en la lista.
- **Serigrafía de 6 a 99 piezas.** Usa la lista de estampado de Chilian de 0 a 100 pz.
  - **Tablas y escalas.** Hay dos tablas: chico (escudo y media carta) y grande (carta a doble carta). Las escalas son 6, 12, 20, 30 y 50 pz.
  - **Tintas.** Se cotiza por número exacto de tintas, de 1 a 8. De 9 a 11 tintas se estima con el mismo aumento por tinta.
  - **Prenda de color, fleece y efectos.** Se suman con la primera escala de LN1.
  - **Desde 100 pz.** Manda la tabla LN1. El renglón de 100 pz de la lista de 0 a 100 no se usa.
  - **Celdas corregidas.** Cuatro celdas de la hoja rompían su secuencia y se tomaron de la secuencia:
    - Grande, 12 pz, 7 tintas: 233.47 → 332.38.
    - Grande, 50 pz, 4 tintas: 61.43 → 59.22.
    - Chico, 20 pz, 6 tintas: 192.09 → 162.38.
    - Chico, 50 pz, 4 tintas: 58.18 → 52.99.
- **Renglones que siguen la escala.**
  - **Prendas de la lista y renglones del cotizador por tintas.** Guardan su especificación, así que al cambiar las piezas en la cotización se recalculan el precio y el costo.
  - **Escalas en el renglón.** Cada renglón muestra sus precios por escala; tocar una escala la usa.
  - **Precio a mano.** Si se escribe un precio a mano, el renglón deja de seguir la escala hasta tocar «Volver al precio por escala».
- **Sitio y asistente.** Siguen cotizando serigrafía desde 100 pz con LN1. La tabla de 6 a 99 pz está solo en el OS.

### DTG, Print on Demand, serigrafía desde 6 piezas, buscador y slideshow (noviembre 2026)

- **DTG con la lista de Chilian** (`api/_dtg.js`).
  - **Cómo se cobra.** Precio por estampado según el lado más largo del diseño (hasta 6, 11, 20, 27, 32, 40, 45, 49 o 53 cm), las piezas (1, 2, 5, 10, 20, 30, 40, 50 o 100+) y la prenda: negra o de color, o blanca.
  - **Dónde.** Lo usan el sitio (pide la medida o la saca del ancho × alto del cliente), el asistente (27 cm por defecto) y el cotizador DTG del OS.
  - **Margen.** En el OS la lista es el precio de venta, sin margen. El renglón se recalcula al cambiar las piezas.
  - **Cargos.** El sitio suma IVA y comisión como en las demás listas.
- **Print on Demand** (producto `pod`).
  - **Qué es.** Solo se vende estampada, en tres opciones: oversized, regular (Óptima peso medio 100 % algodón) y económica (Óptima 50/50).
  - **Precio.** Incluye 1 estampado DTG. Cada estampado adicional suma su precio de la lista DTG.
  - **Oversized.** Usa la Óptima peso completo mientras Chilian manda su precio (marcado como provisional).
  - **Dónde se vende.** En el sitio; el asistente no lo ofrece.
- **Serigrafía desde 6 piezas en todos lados.** El sitio, el asistente y el OS usan la tabla de 6 a 99 pz (`SERIGRAFIA.chica`, por tintas exactas) y LN1 desde 100.
  - **Mínimo.** Un mínimo de 50 o 100 guardado en Ajustes se toma como 6.
- **Buscador del catálogo.**
  - **Palabras clave.** Entiende sinónimos (camiseta, hoodie, cachucha, pants), telas y cortes (manga larga, cuello V, 50/50, 100 % algodón, dry fit, peinado, reciclado), gramaje («190g»), plurales y errores chicos.
  - **Ordenar.** Por relevancia o por precio, de más caro a más económico o al revés.
  - **Precio por modelo.** Cada modelo muestra un precio de referencia de la prenda sola, a 100 pz con IVA y comisión: el de su línea en la lista, o el de su renglón cuando el modelo está en ella.
  - **Filtros.** Los conteos de línea, prenda y para quién siguen la búsqueda.
- **Slideshow del hero.**
  - **Diapositivas.** Serigrafía industrial, Print on Demand, Chilian Sport, merch y promocionales, y campaña política.
  - **Botón de cada una.** Abre el cotizador con ese producto, o el catálogo.
  - **Movimiento.** Avanza cada 6 s y se detiene con el mouse encima, con el foco, en una pestaña oculta o con movimiento reducido. Tiene puntos, pausa y deslizar.
  - **Imágenes generadas.** Las de Print on Demand y campaña son ilustrativas (`photos/print-on-demand-dtg.jpg`, `photos/campana-politica.jpg`), sin marcas ni partidos. Conviene cambiarlas por fotos de la planta.

### Chilian Sport sublimada: matriz de precios cliente (noviembre 2026)

- **Dónde vive.** `api/precios.js` (`SPORT`, que sale como `fullprint`): 15 escalas de 6 a 10,000 piezas y cinco modalidades, precio por pieza antes de IVA con prenda y sublimación.
  - Modalidades: full print clásica manga corta (micro piqué), blanca con sublimado parcial, full print infantil, full print manga larga y full print manga larga en tela premium.
  - Donde la matriz subía de precio en una escala mayor se dejó el precio de la escala anterior (por ejemplo 500 pz de manga corta a $112.00 y no $112.50).
  - Tallas 2XL–3XL: el mismo recargo que ya tenía cada rango (`tallasExtra`): 7.72 % hasta 299 pz, 3.11 % de 300 a 999, 1.5 % de 1,000 a 2,999 y 16 % desde 3,000.
  - La tabla está en el código y manda sobre lo guardado en Ajustes; el mínimo de full print baja de 100 a 6 piezas.
- **Quién la usa.** El cotizador del sitio y el estudio (`qzCalc`, con la modalidad en el paso de calidad), la calculadora de volumen del sitio, el asistente (`api/_pricing.js`; pregunta la modalidad con su precio), el cotizador del OS (grupo «Sublimación · Chilian Sport», precio por escala) y Ajustes → Precios del cotizador web (tabla de consulta).
- **Copias que hay que regenerar.** `index.html` trae una copia en `PRECIOS_BASE` y `tools/seo/build_landings.py` otra para `/playeras-deportivas-sublimadas`. Después de cambiar la matriz: `python3 tools/seo/build_seo.py && python3 tools/seo/build_landings.py`.

### Candados de tela × técnica (`reglas.js`)

Un solo archivo decide qué impresión aplica en cada prenda. Lo cargan el sitio (`index.html`), el asistente (`api/_pricing.js`, `api/_bot.js`) y el OS (`ops/cotizador.js`).

| Técnica | Algodón (90 % o más) | Mezclas | Poliéster |
|---|---|---|---|
| Plastisol, HD, puff, glitter, brilla en la oscuridad | Sí | Sí; de color, con base antimigrante | Sí; de color, con base antimigrante |
| Base agua | Sí | Sí | No |
| Discharge | Solo 100 % algodón de color | No | No |
| DTG | Sí | No | No |
| Full print / sublimación | No | No | Solo Chilian Sport |
| Bordado, DTF | Sí | Sí | Sí |

- **De dónde sale la tela.** De la lista oficial (`api/_lista.js`), de las líneas (`specs` en `api/precios.js`), de la ficha del catálogo (`comp` o el título) o de lo que el cliente dice de su propia prenda. Si no se conoce la tela, no se bloquea nada.
- **Sitio, estudio y asistente: bloquean.** La técnica que no aplica sale desactivada con su motivo; si ya estaba elegida, cambia a plastisol y lo dice. La base antimigrante se suma sola y no se puede quitar. En «Mi prenda» se pregunta la tela. Print on Demand solo ofrece las opciones de algodón.
- **OS: avisa en rojo y deja seguir.** En el cotizador por tintas, en bordado y DTG, y en cada renglón de la cotización. Al elegir una prenda de poliéster o mezcla de color, el cotizador por tintas marca la base antimigrante en todas las posiciones.
- **Catálogo del sitio.** La ficha de cada modelo dice qué impresión aplica y cuál no; el formulario avisa si la técnica marcada no va con un modelo elegido.
- **Además.** El cotizador del sitio cobraba la prenda como de color sin sumar la base blanca cuando no se había tocado «blanca o de color»; ahora parte de «de color» en todo el cálculo.

