/* Chilian OS · avisos: what needs someone's attention, computed from the records.
   Used by the app's "Avisos" view and the badge in the menu (no device notifications).

   chilianAlerts(D, me, { today, scope })
     D:  { solicitudes, cuentas, oportunidades, tareas, cotizaciones, ots } (arrays)
     me: { name, admin }      scope: "mine" (default) or "all" (the main account sees the whole team)
   -> [{ key, cat, level, title, detail, href, owner }]  level: alta | media | baja */
(function (root) {
  const CATS = [
    ["tareas", "Tareas"], ["prospectos", "Prospectos nuevos"], ["cotizaciones", "Cotizaciones pendientes"],
    ["avances", "Avances sin terminar"], ["datos", "Información sin llenar"]
  ];
  const DAY = 864e5;
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const daysSince = (s, today) => (s ? Math.floor((new Date(today + "T12:00").getTime() - new Date(String(s).slice(0, 10) + "T12:00").getTime()) / DAY) : 0);
  const n = (v) => +v || 0;
  const OPEN_OPP = (o) => !["ganado", "perdido"].includes(o.etapa || "nuevo");

  function chilianAlerts(D, me, opt = {}) {
    const today = opt.today || iso(new Date()), all = opt.scope === "all" && me.admin;
    const byId = (col, id) => (D[col] || []).find((x) => x.id === id);
    const oppOwner = (id) => (byId("oportunidades", id) || {}).asesor || "";
    // mine: assigned to me, or to nobody (then the whole team sees it)
    const mine = (owner) => all || !owner || owner === me.name;
    const out = [];
    const add = (a) => { if (mine(a.owner)) out.push(a); };
    const due = (f) => (f < today ? `venció ${fmtD(f)}` : "es hoy");

    // ---------- tareas
    for (const t of D.tareas || []) {
      if (t.hecha || !t.fecha) continue;
      const dd = daysSince(t.fecha, today);
      if (dd >= 0) add({ key: `t:${t.id}:${t.fecha}`, cat: "tareas", level: dd > 0 ? "alta" : "media", title: `${t.tipo ? t.tipo + ": " : ""}${t.texto}`,
        detail: `${due(t.fecha)}${t.asesor ? " · " + t.asesor : " · sin asignar"}`, href: t.oportunidadId ? "oportunidad/" + t.oportunidadId : "tareas", owner: t.asesor || "" });
      else if (dd === -1) add({ key: `t1:${t.id}:${t.fecha}`, cat: "tareas", level: "baja", title: `${t.tipo ? t.tipo + ": " : ""}${t.texto}`, detail: `mañana${t.asesor ? " · " + t.asesor : ""}`, href: "tareas", owner: t.asesor || "" });
    }

    // ---------- prospectos: website / Instagram / WhatsApp requests and fresh leads
    for (const s of D.solicitudes || []) {
      if (s.estado === "nueva") out.push({ key: `s:${s.id}`, cat: "prospectos", level: "alta", title: `Solicitud nueva de ${s.nombre || "un cliente"}${s.empresa ? " (" + s.empresa + ")" : ""}`,
        detail: `${canal(s)} · ${s.prenda || "sin prenda"}${n(s.piezas) ? " · " + fmtN(s.piezas) + " pzas" : ""} · ${ago(s.recibida || s.createdAt, today)}`, href: "solicitudes", owner: "" });
      else if (s.nuevoMensaje) out.push({ key: `m:${s.id}:${s.ultimoMensaje || ""}`, cat: "prospectos", level: "alta", title: `Mensaje sin responder de ${s.nombre || "un cliente"}`,
        detail: `${canal(s)} · ${ago(s.ultimoMensaje || s.updatedAt, today)}`, href: "solicitudes", owner: "" });
    }
    for (const o of D.oportunidades || []) {
      if ((o.etapa || "nuevo") === "nuevo" && daysSince(o.createdAt, today) >= 1)
        add({ key: `on:${o.id}`, cat: "prospectos", level: "media", title: `Lead sin contactar: ${o.titulo}`, detail: `${cuenta(D, o.cuentaId)} · desde ${fmtD(o.createdAt)}`, href: "oportunidad/" + o.id, owner: o.asesor || "" });
    }

    // ---------- cotizaciones pendientes
    for (const q of D.cotizaciones || []) {
      const owner = oppOwner(q.oportunidadId) || q.createdBy || "", who = q.cliente || cuenta(D, q.cuentaId);
      const unpriced = (q.lineas || []).some((l) => !l.nopcs && !(n(l.precio) > 0));
      if (q.estado === "pre") add({ key: `qp:${q.id}`, cat: "cotizaciones", level: "alta", title: `Pre-cotización del sitio por revisar: ${q.id}`, detail: `${who || "cliente del sitio"} · ${ago(q.createdAt, today)}`, href: "cotizacion/" + q.id, owner });
      else if ((q.estado || "borrador") === "borrador" && daysSince(q.updatedAt || q.createdAt, today) >= 1)
        add({ key: `qb:${q.id}`, cat: "cotizaciones", level: "media", title: `Cotización sin enviar: ${q.id}`, detail: `${who || "sin cliente"} · sin cambios ${ago(q.updatedAt || q.createdAt, today)}`, href: "cotizacion/" + q.id, owner });
      else if (q.estado === "enviada") {
        const o = byId("oportunidades", q.oportunidadId), next = o && o.proximaAccion && o.proximaAccion.fecha;
        if (daysSince(q.enviadaEn, today) >= 3 && (!next || next < today) && (!o || OPEN_OPP(o)))
          add({ key: `qe:${q.id}:${q.enviadaEn}`, cat: "cotizaciones", level: "media", title: `Cotización enviada sin respuesta: ${q.id}`, detail: `${who} · enviada ${fmtD(q.enviadaEn)}; da seguimiento o márcala aceptada`, href: "cotizacion/" + q.id, owner });
      }
      if (unpriced && ["pre", "borrador", "enviada"].includes(q.estado || "borrador"))
        add({ key: `qx:${q.id}`, cat: "datos", level: "baja", title: `Cotización con renglones sin precio: ${q.id}`, detail: who || "", href: "cotizacion/" + q.id, owner });
    }

    // ---------- avances sin terminar
    for (const o of D.oportunidades || []) {
      if (!OPEN_OPP(o)) continue;
      const pa = o.proximaAccion || {};
      if (pa.fecha && pa.fecha < today) add({ key: `op:${o.id}:${pa.fecha}`, cat: "avances", level: "alta", title: `Seguimiento vencido: ${o.titulo}`, detail: `${pa.texto || "siguiente paso"} · ${due(pa.fecha)}`, href: "oportunidad/" + o.id, owner: o.asesor || "" });
      const STALE = { nuevo: 1, contactado: 4, calificado: 7, cotizacion: 5, negociacion: 10 }, days = daysSince(o.etapaDesde || o.createdAt, today);
      if ((o.etapa || "nuevo") !== "nuevo" && !pa.fecha && days > (STALE[o.etapa || "nuevo"] ?? 7)) add({ key: `os:${o.id}:${o.etapa}`, cat: "avances", level: "media", title: `Oportunidad estancada: ${o.titulo}`, detail: `${days} días en ${o.etapa || "nuevo"} sin siguiente paso`, href: "oportunidad/" + o.id, owner: o.asesor || "" });
      if (!pa.texto || !pa.fecha) add({ key: `od:${o.id}`, cat: "datos", level: "media", title: `Oportunidad sin siguiente paso con fecha: ${o.titulo}`, detail: cuenta(D, o.cuentaId), href: "oportunidad/" + o.id, owner: o.asesor || "" });
      if (!(n(o.valor) > 0)) add({ key: `ov:${o.id}`, cat: "datos", level: "baja", title: `Oportunidad sin valor: ${o.titulo}`, detail: "pon el monto estimado para que cuente en el pipeline", href: "oportunidad/" + o.id, owner: o.asesor || "" });
    }
    for (const ot of D.ots || []) {
      if (ot.etapa === "entregada") { const t2 = n(ot.total), p2 = (ot.pagos || []).reduce((a, p) => a + n(p.monto), 0); if (t2 && p2 < t2 - 0.5) add({ key: `ps:${ot.id}`, cat: "avances", level: "media", title: `Saldo por cobrar: ${ot.id}`, detail: (ot.clienteNombre || "") + " · $" + fmtN(Math.round(t2 - p2)) + " pendientes", href: "ot/" + ot.id, owner: oppOwner(ot.oportunidadId) }); continue; }
      const owner = oppOwner(ot.oportunidadId), who = ot.clienteNombre || cuenta(D, ot.cuentaId);
      if (ot.previa) {
        if (daysSince(ot.createdAt, today) >= 2) add({ key: `pv:${ot.id}`, cat: "avances", level: "media", title: `OT previa sin confirmar: ${ot.id}`, detail: `${who} · desde ${fmtD(ot.createdAt)}`, href: "ot/" + ot.id, owner });
        continue;
      }
      const paid = (ot.pagos || []).reduce((a, p) => a + n(p.monto), 0), total = n(ot.total), dep = total * n(ot.anticipo) / 100;
      const ORDER = ["arte", "aprobacion", "compra", "pantallas", "programada", "impresion", "calidad", "empaque", "embarcada", "entregada"];
      if (total && dep && paid < dep - 0.5 && ORDER.indexOf(ot.etapa) >= ORDER.indexOf("compra")) add({ key: `pa:${ot.id}`, cat: "avances", level: "alta", title: `OT en producción sin anticipo cubierto: ${ot.id}`, detail: `${who} · faltan $` + fmtN(Math.round(dep - paid)) + " del anticipo", href: "ot/" + ot.id, owner });
      if (total && paid < total - 0.5 && ["embarcada", "entregada"].includes(ot.etapa)) add({ key: `ps:${ot.id}`, cat: "avances", level: "media", title: `Saldo por cobrar: ${ot.id}`, detail: `${who} · $` + fmtN(Math.round(total - paid)) + " pendientes", href: "ot/" + ot.id, owner });
      if (ot.fechaCompromiso && ot.fechaCompromiso < today && ot.etapa !== "embarcada")
        add({ key: `oa:${ot.id}:${ot.fechaCompromiso}`, cat: "avances", level: "alta", title: `OT atrasada: ${ot.id}`, detail: `${who} · compromiso ${fmtD(ot.fechaCompromiso)} · en ${ot.etapa}`, href: "ot/" + ot.id, owner });
      if (ot.arte && ot.arte.estado === "cambios") add({ key: `oc:${ot.id}:${ot.updatedAt}`, cat: "avances", level: "alta", title: `El cliente pidió cambios al arte: ${ot.id}`, detail: who, href: "ot/" + ot.id, owner });
      const last = (ot.historial || []).map((x) => x.fecha).sort().pop() || ot.createdAt;
      if (daysSince(last, today) >= 5 && ot.etapa !== "embarcada") add({ key: `os:${ot.id}:${String(last).slice(0, 10)}`, cat: "avances", level: "media", title: `OT sin avance hace ${daysSince(last, today)} días: ${ot.id}`, detail: `${who} · en ${ot.etapa}`, href: "ot/" + ot.id, owner });
      if (!ot.fechaCompromiso) add({ key: `of:${ot.id}`, cat: "datos", level: "media", title: `OT sin fecha compromiso: ${ot.id}`, detail: who, href: "ot/" + ot.id, owner });
      const sinTallas = (ot.lineas || []).some((l) => n(l.piezas) > 0 && !Object.values(l.tallas || {}).some((v) => n(v) > 0));
      if (sinTallas && !["arte", "aprobacion"].includes(ot.etapa)) add({ key: `ot:${ot.id}`, cat: "datos", level: "media", title: `OT sin tallas: ${ot.id}`, detail: `${who} · ya va en ${ot.etapa}`, href: "ot/" + ot.id, owner });
    }
    for (const c of D.cuentas || []) {
      if (!(c.contactos || []).some((x) => x.contacto)) add({ key: `cc:${c.id}`, cat: "datos", level: "baja", title: `Cuenta sin teléfono ni correo: ${c.nombre}`, detail: "agrega cómo contactarla", href: "cuenta/" + c.id, owner: c.responsable || "" });
    }
    const rank = { alta: 0, media: 1, baja: 2 };
    return out.sort((a, b) => rank[a.level] - rank[b.level]);
  }

  const fmtN = (v) => Number(v || 0).toLocaleString("es-MX");
  const fmtD = (s) => { if (!s) return ""; const d = new Date(String(s).slice(0, 10) + "T12:00"); return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }); };
  const ago = (s, today) => { const d = daysSince(s, today); return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`; };
  const cuenta = (D, id) => ((D.cuentas || []).find((c) => c.id === id) || {}).nombre || "";
  const canal = (s) => (s.canal === "whatsapp" ? `WhatsApp${s.whatsapp && s.whatsapp.numero ? " " + s.whatsapp.numero : ""}` : s.canal === "messenger" ? "Facebook Messenger" : s.canal === "instagram" || s.fuente === "instagram" ? "Instagram" : s.canal === "manual" ? "registrada por el equipo" : "sitio web");

  root.chilianAlerts = chilianAlerts;
  root.CHILIAN_ALERT_CATS = CATS;
})(typeof window !== "undefined" ? window : globalThis);
