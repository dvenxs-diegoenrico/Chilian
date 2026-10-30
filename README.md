# Chilian — nuevo sitio (rediseño de grupochilian.com.mx)

> **Sitio en producción: `index.html` (dirección v1).** La propuesta con referencias Nike/Apple queda en `propuesta-v2.html`.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | Página de inicio (v1, la dirección elegida) |
| `propuesta-v2.html` | Propuesta alternativa con referencias Nike y Apple |
| `photos/`, `logos/` | Fotos de planta y trabajos; logos como máscaras de color |
| `favicon.png`, `apple-touch-icon.png` | Ícono de la pestaña y del teléfono |
| `studio3d.js` | 3D, vista de molde y archivo de producción (rutas 2 y 3) |
| `patterns/play-sport-mc/` | Molde Chilian Sport (PLAY SPORT MCORTA) tallas S–XL en milímetros, trazado de los PDF de CAD |
| `patterns/playera-dama/` | Molde playera dama (PLAYERA PW DAMA BIE) tallas S–XL |
| `tools/extract_pattern.py` | Convierte un trazo PDF de CAD en el JSON del molde |
| `vendor/three-r128.min.js` | three.js r128 (licencia MIT), servido desde el propio sitio |
| `blanks/` | Prendas lisas (playera, sudadera, polo; frente y espalda) generadas con Canva AI para "Estampa tu idea" |
| `vercel.json` | URLs limpias y caché larga para fotos y logos |

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

## Rutas 2 y 3: molde real y 3D (beta)

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
- Cerrar la unión manga–sisa en 3D (hoy se ve una abertura al girar).
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

**Siguiente paso posible: render con IA sobre modelo.** Un botón "Render fotorrealista con IA" que envíe el mockup a un servicio de generación de imágenes y devuelva la prenda puesta en una persona. Requiere elegir proveedor, una llave de API guardada en Vercel y un presupuesto por render.
