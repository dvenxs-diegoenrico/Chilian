/* Chilian OS · ayuda para que cualquiera lo entienda
   - Una tarjeta «¿Cómo funciona esta pantalla?» arriba de cada sección: qué es, qué hacer primero y qué sigue.
     Se muestra abierta las primeras veces y después queda cerrada (se puede abrir cuando se quiera).
   - La guía (#guia): el camino de un pedido del cliente al embarque, para ventas y para planta, y un glosario sin jerga.
   Todo es texto: no toca los datos. */
(() => {
  "use strict";

  // route → [what it is, [steps…], what comes next (label, route)]
  const HELP = {
    inicio: ["Tu día en una sola pantalla: lo urgente, lo nuevo y lo que se está produciendo.", ["Empieza por lo que dice «Para hoy»: tareas vencidas y clientes que esperan respuesta.", "Toca una tarjeta para abrirla; cada una te lleva a su pantalla.", "Con «Buscar o crear» (arriba a la izquierda, o Ctrl K) encuentras cualquier cliente, OT o cotización."], ["Ver la guía completa", "guia"]],
    avisos: ["Lo que pasó mientras no estabas: solicitudes nuevas, mensajes de clientes, pagos y arte aprobado.", ["Cada aviso dice qué pasó y a quién.", "Toca «Ver» para ir directo al registro.", "Marca como visto lo que ya atendiste; lo visto se esconde solo."], ["Ir a Solicitudes", "solicitudes"]],
    solicitudes: ["Todo lo que piden los clientes llega aquí: del sitio, del chat, del estudio, de WhatsApp o de Instagram.", ["Abre una solicitud y lee qué pidió y cuánto cotizó en el sitio.", "Si trae «pre-cotización», ábrela: ya viene armada, solo ponle precios.", "Si vale la pena, tócale «Convertir en oportunidad» para darle seguimiento."], ["Ver Oportunidades", "pipeline"]],
    pipeline: ["El tablero de ventas: cada tarjeta es un posible pedido y las columnas son sus etapas.", ["Arrastra la tarjeta a la siguiente columna cuando avance (de Nuevo a Ganado).", "El número de la esquina es el valor estimado; las tarjetas rojas llevan días sin movimiento.", "Dentro de una tarjeta están las cotizaciones, las tareas y el historial del cliente."], ["Ver Cotizaciones", "cotizaciones"]],
    tareas: ["Tu lista de pendientes: llamadas, seguimientos y cosas por entregar.", ["Las vencidas salen primero, en rojo.", "Marca una tarea como hecha con un toque.", "Puedes crear una tarea para ti o para alguien del equipo con «Buscar o crear»."], ["Ir al Tablero", "inicio"]],
    cuentas: ["Los clientes y sus contactos, sin repetir: aquí vive todo su historial.", ["Busca por nombre, teléfono o correo.", "Dentro de una cuenta ves sus cotizaciones, órdenes, tareas y lo que ya compró.", "Si un cliente aparece dos veces, ábrelo y unifícalo."], ["Ver Oportunidades", "pipeline"]],
    prospeccion: ["Mensajes listos para buscar clientes nuevos: distribuidores, campañas, marcas.", ["Elige el tipo de cliente.", "Copia el mensaje; ya trae tu nombre.", "Cuando conteste, crea la oportunidad para no perderla."], ["Ir a Cuentas", "cuentas"]],
    cotizaciones: ["Aquí armas el precio que ve el cliente, con la hoja lista para PDF o WhatsApp.", ["Abre una cotización o crea una nueva con «Buscar o crear».", "Agrega productos: el precio cambia solo según las piezas (12, 50, 100, 300, 1,000…).", "Revisa la hoja, tal como la recibe el cliente, y marca «Enviada». Cuando acepte, toca «Aceptada» y nace la orden de trabajo."], ["Ver Órdenes de trabajo", "ots"]],
    reportes: ["Los números del negocio: ventas, conversión y cuánto hay por cobrar.", ["Elige el periodo arriba.", "Compara por origen (sitio, chat, equipo) para ver qué canal rinde más.", "Los totales usan lo cobrado sin IVA."], ["Ir al Tablero", "inicio"]],
    ots: ["Las órdenes de trabajo (OT): cada pedido aceptado, desde el arte hasta la entrega.", ["Una OT nace sola cuando aceptas una cotización.", "Sube el arte y manda al cliente su enlace de aprobación; sin arte aprobado no se programa.", "Imprime la hoja viajera: lleva el código de barras que se escanea en planta."], ["Programar en máquinas", "programacion"]],
    programacion: ["El calendario de máquinas: cuánto se produce cada día sin pasarse de la capacidad.", ["Las OT por programar están en la lista lateral (abajo en el celular).", "Arrastra una OT al día y la máquina que toca.", "Si un día se llena, se marca; mueve la orden a otro día."], ["Ir a Escaneo", "escaneo"]],
    escaneo: ["Cada estación escanea el código de la OT para avisar que ya terminó su parte.", ["Elige tu estación (pantallas, impresión, calidad, empaque…).", "Escanea el código o escríbelo y presiona Enter.", "El avance queda registrado y el cliente lo ve en su página de seguimiento."], ["Ir a Embarques", "embarques"]],
    pod: ["Las playeras de Print on Demand que ya pagó el cliente, agrupadas para imprimirlas por lotes.", ["La orden de trabajo se crea sola cuando se confirma el pago; aquí se agrupa por playera, color y tamaño de estampado.", "Si falta el arte o las tallas, toca «Pedir arte y tallas»: abre WhatsApp con el mensaje listo.", "Imprime la hoja del lote para la impresora DTG. Abajo ves a quién darle seguimiento porque todavía no paga."], ["Ir a Programación", "programacion"]],
    embarques: ["Lo que está listo para salir y lo que ya va en camino.", ["Las OT que pasaron calidad y empaque aparecen en «Por embarcar».", "Captura la paquetería, la guía y las cajas.", "El cliente recibe su enlace para rastrear el envío."], ["Ver Órdenes de trabajo", "ots"]],
    equipo: ["Las personas que usan el sistema y lo que puede hacer cada una.", ["Crea un usuario por persona; no compartan contraseñas.", "Quita el acceso a quien ya no trabaje aquí.", "Solo la cuenta principal ve esta pantalla."], ["Ir a Ajustes", "ajustes"]],
    ajustes: ["Los números que mueven los precios: tarifas, márgenes, máquinas y el asistente.", ["Cambia solo lo que entiendas; cada campo explica para qué sirve.", "Los precios del sitio y del asistente salen de aquí y de las listas oficiales.", "Guarda al final de cada bloque."], ["Ver la guía", "guia"]]
  };

  // the path of an order, in plain words
  const STEPS = [
    ["Llega una solicitud", "El cliente cotiza en el sitio, en el chat o en el estudio, o escribe por WhatsApp. Aparece en Solicitudes.", "solicitudes", "Ventas"],
    ["Revisa lo que pidió", "Abre la solicitud: ves su conversación, lo que cotizó y qué tan buen cliente parece.", "solicitudes", "Ventas"],
    ["Convierte en oportunidad", "Si vale la pena, se vuelve una tarjeta en Oportunidades, con tareas de seguimiento.", "pipeline", "Ventas"],
    ["Arma la cotización", "Pon productos y piezas; el precio se ajusta solo. Revisa la hoja, mándala por PDF o WhatsApp y marca «Enviada».", "cotizaciones", "Ventas"],
    ["El cliente acepta", "Toca «Aceptada»: se crea la orden de trabajo (OT) y la cotización queda ganada.", "cotizaciones", "Ventas"],
    ["Aprueba el arte", "En la OT sube el diseño y manda el enlace de aprobación. Cuando el cliente lo aprueba, ya se puede producir.", "ots", "Planta"],
    ["Programa la producción", "Arrastra la OT a un día y a una máquina en Programación.", "programacion", "Planta"],
    ["Produce y escanea", "Cada estación escanea el código de la hoja viajera: pantallas, impresión, calidad, empaque.", "escaneo", "Planta"],
    ["Embarca y entrega", "Captura paquetería y guía. El cliente rastrea su pedido desde su enlace.", "embarques", "Planta"]
  ];

  const GLOSSARY = [
    ["OT", "Orden de trabajo: el pedido ya aceptado, con todo lo que hay que producir."],
    ["Oportunidad", "Un posible pedido al que se le da seguimiento. Todavía no es venta."],
    ["Pipeline", "El tablero de oportunidades por etapas, de Nuevo a Ganado."],
    ["Pre-cotización", "Una cotización que el sistema arma solo con lo que el cliente pidió en el sitio. Solo falta revisar los precios."],
    ["Hoja viajera", "La hoja impresa que acompaña a la OT en planta, con su código de barras."],
    ["Lista de precios (LN1)", "La tabla oficial de serigrafía de Chilian por tamaño, piezas y colores. El precio sale de ahí, sin margen encima."],
    ["Escala", "Cada tramo de piezas con su precio (12, 50, 100, 300, 1,000…). A más piezas, menos por pieza."],
    ["DTG", "Impresión digital directa a la prenda, a todo color, desde 1 pieza."],
    ["Print on Demand", "Playera que se vende ya estampada, desde 1 pieza, con un estampado DTG incluido."],
    ["Costeo interno", "Lo que le cuesta a Chilian; nunca aparece en la hoja del cliente."],
    ["Utilidad", "Venta cobrada sin IVA menos el costo directo."],
    ["Pagar anticipo", "El primer pago para arrancar producción (por defecto 50 %)."]
  ];

  const KEY = "chilian-os-ayuda";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  window.OSHelp = {
    has: (route) => !!HELP[route],
    // the card above a screen; it is open the first three times and then folds
    card(h, route, go) {
      const x = HELP[route]; if (!x) return null;
      const seen = load(), n = seen[route] || 0;
      const open = n < 3 && !seen.__off;
      seen[route] = n + 1; save(seen);
      const det = h("details", { class: "os-help", open: open ? "" : null },
        h("summary", {}, h("span", { class: "q", "aria-hidden": "true", text: "?" }), h("span", { text: "¿Cómo funciona esta pantalla?" })),
        h("div", { class: "body" },
          h("p", { text: x[0] }),
          h("ol", {}, x[1].map((t) => h("li", { text: t }))),
          h("div", { class: "row" },
            x[2] ? h("a", { class: "btn sm", href: "#" + x[2][1] }, x[2][0] + " →") : null,
            h("button", { class: "btn sm ghost", type: "button", onclick: () => { const s = load(); s.__off = true; save(s); det.removeAttribute("open"); } }, "No mostrar abierta"))));
      return det;
    },
    // the full guide (route #guia)
    guide(h, go) {
      const group = (name) => STEPS.map((s, i) => [s, i + 1]).filter(([s]) => s[3] === name);
      const stepEl = ([s, n]) => h("a", { class: "os-step", href: "#" + s[2] }, h("span", { class: "n", text: n }), h("span", {}, h("b", { text: s[0] }), h("small", { text: s[1] })));
      const top = h("div", { class: "topbar" }, h("div", {}, h("div", { class: "sub", text: "Ayuda" }), h("h1", { text: "Guía de Chilian OS" })));
      return h("div", { class: "grid" }, top,
        h("p", { class: "muted", text: "Un pedido recorre siempre el mismo camino. Toca cada paso para ir a su pantalla." }),
        h("div", { class: "os-roles" },
          h("div", { class: "card" }, h("h2", { text: "Soy de ventas" }), h("p", { class: "small muted", text: "Pasos 1 al 5: de la solicitud a la cotización aceptada." }), h("div", { class: "os-steps" }, group("Ventas").map(stepEl))),
          h("div", { class: "card" }, h("h2", { text: "Soy de planta" }), h("p", { class: "small muted", text: "Pasos 6 al 9: del arte aprobado al embarque." }), h("div", { class: "os-steps" }, group("Planta").map(stepEl)))),
        h("div", { class: "card" }, h("h2", { text: "Atajos que ahorran tiempo" }),
          h("ul", { class: "os-tips" }, [
            "«Buscar o crear» (Ctrl K, o el botón + en el celular) encuentra cualquier cliente, OT o cotización, y crea cosas nuevas.",
            "En el celular, la barra de abajo tiene lo que más se usa: Inicio, Avisos, Solicitudes, Tareas y Planta.",
            "Cada pantalla tiene arriba una tarjeta «¿Cómo funciona esta pantalla?». Se cierra sola después de unas veces; ábrela cuando la necesites.",
            "Los datos se actualizan solos, pero puedes forzarlo con «Actualizar datos» en el menú.",
            "Nada se pierde si cierras la pestaña: todo se guarda en el sistema, no en tu navegador."
          ].map((t) => h("li", { text: t })))),
        h("div", { class: "card" }, h("h2", { text: "Glosario" }), h("dl", { class: "os-gloss" }, GLOSSARY.flatMap(([t, d]) => [h("dt", { text: t }), h("dd", { text: d })]))),
        h("div", { class: "row" }, h("button", { class: "btn ghost", type: "button", onclick: () => { save({}); go("inicio"); } }, "Volver a mostrar las ayudas abiertas")));
    }
  };
})();
