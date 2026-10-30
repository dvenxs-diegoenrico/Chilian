# Chilian — nuevo sitio (rediseño de grupochilian.com.mx)

> **Versión actual: `index.html` (v2, referencias Nike y Apple).** La primera propuesta queda en `index-v1.html`.

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

## Dirección elegida: v1 (`index-v1.html`)

Cambios de la revisión:
- Menos rosa: el magenta queda solo en los botones principales de cotizar, la línea "escala industrial." del hero y el anillo de foco del teclado.
- Corregido: la franja de cifras del hero se comprimía a media columna y "450,000" encimaba el "8".
- Corregido: el botón "Cotizar con esto" aparecía en las fichas de certificaciones.
- Corregido: las técnicas sin opción en el cotizador (glitter, mezclilla, etiquetas…) ahora se agregan a las notas.
- Corregido: la página no ocultaba elementos con `hidden` fuera del visor de artifacts.
- La fecha del cotizador ya no acepta días pasados.
- Pies de foto sin números de tintas inventados; se quitó "P36 / C12" de la foto del hero.

## Por confirmar con Chilian

- Capacidad: el estudio usa 20,000 piezas/día; un banner viejo dice "30,000 prints daily, 10,000 garments a week".
- Vigencia de las auditorías. ISO 9001 se dejó fuera porque no hay certificado publicado.
- Promesas de servicio: respuesta a cotizaciones en un día hábil y "nada entra a producción sin muestra aprobada".
- Contacto directo de Federico Chilian (hoy no se publica).
