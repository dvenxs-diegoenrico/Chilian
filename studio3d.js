/* ==================================================================
   CHILIAN · Estampa tu idea · 3D and pattern pieces (routes 2 and 3)
   ------------------------------------------------------------------
   The t-shirt is built from Chilian's real CAD pattern (PLAY SPORT
   MCORTA, sizes S–XL, traced from the markers by tools/extract_pattern.py
   into patterns/play-sport-mc/<size>.json, in millimeters).

   One idea runs through everything here: each pattern piece (front,
   back, two sleeves) gets ONE texture drawn in its own millimeters.
     · The 3D garment uses those textures (each flat piece is bent into
       place: the body pieces wrap around an oval torso, the sleeves
       wrap into tubes).
     · The flat "pattern" view shows the same textures laid out.
     · The production file places the same textures on the marker at
       real scale, exactly where the CAD system put each piece.
   So what the client sees in 3D is what goes to the printer.

   Loaded only when the visitor opens the 3D or pattern views.
   Needs THREE (vendor/three-r128.min.js) and the page's STUDIO state.
   ================================================================== */
(function () {
  const TPX = 1.6;            // texture pixels per millimeter (front M ≈ 846 × 1212 px)
  const GRID = 9;             // mesh grid step in mm
  const patterns = {};

  function loadPattern(size) {
    if (!patterns[size]) patterns[size] = fetch(`patterns/play-sport-mc/${size}.json`).then((r) => {
      if (!r.ok) throw new Error(`pattern ${size}: ${r.status}`);
      return r.json();
    }).then(addLandmarks);
    return patterns[size];
  }

  // Landmarks used for print placement and for bending the pieces.
  function addLandmarks(pat) {
    for (const p of pat.pieces) {
      const o = p.outline, cx = p.width / 2;
      // Neck point: the highest outline point near the center line is the bottom of the neckline.
      const near = o.filter(([x]) => Math.abs(x - cx) < p.width * 0.06);
      p.neckY = near.length ? Math.max(...near.filter(([, y]) => y < p.height * 0.3).map(([, y]) => y), 0) : 0;
      // Underarm: where the outline reaches its full width on each side, top-most.
      const side = o.filter(([x]) => x < 2 || x > p.width - 2).map(([, y]) => y);
      p.underarmY = side.length ? Math.min(...side) : p.height * 0.3;
      p.path = new Path2D(`M${o.map(([x, y]) => `${x},${y}`).join("L")}Z`);
    }
    return pat;
  }

  /* -------------------- textures -------------------- */
  // design = { mode: "place" | "full", color, art, place, sizeIdx, dxmm, dymm, side, fill, tileMM }
  function pieceTexture(p, d) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(p.width * TPX); c.height = Math.ceil(p.height * TPX);
    const x = c.getContext("2d");
    x.scale(TPX, TPX);
    x.save(); x.clip(p.path);
    x.fillStyle = d.color; x.fillRect(0, 0, p.width, p.height);
    if (d.art) {
      if (d.mode === "full") drawFull(x, p, d);
      else drawPlaced(x, p, d);
    }
    x.restore();
    return c;
  }

  // Full print: the design covers the whole piece, or repeats as a pattern.
  function drawFull(x, p, d) {
    const a = d.art, ar = a.width / a.height;
    if (d.fill === "repeat") {
      const tw = d.tileMM, th = tw / ar;
      for (let yy = -th; yy < p.height + th; yy += th) for (let xx = -tw; xx < p.width + tw; xx += tw) x.drawImage(a, xx, yy, tw, th);
    } else {
      let w = p.width, h = w / ar;
      if (h < p.height) { h = p.height; w = h * ar; }
      x.drawImage(a, (p.width - w) / 2, (p.height - h) / 2, w, h);
    }
  }

  // Placement print on the front or back piece, in the same centimeters as the 2D studio.
  const PLACES = {
    full:  { piece: "front", cx: 0,  below: 70 },
    chest: { piece: "front", cx: 95, below: 75 },
    back:  { piece: "back",  cx: 0,  below: 80 },
    nape:  { piece: "back",  cx: 0,  below: 25 }
  };
  function placedRect(p, d) {
    const spec = PLACES[d.place.id];
    if (!spec || spec.piece !== p.kind) return null;
    const ar = d.art.height / d.art.width;
    let w = d.place.sizes[d.sizeIdx] * 10, h = w * ar;
    if (h > d.place.maxH * 10) { h = d.place.maxH * 10; w = h / ar; }
    // On the back piece the wearer's left is on the left as laid flat (outside up), so +x mirrors.
    const cx = p.width / 2 + (p.kind === "back" ? -spec.cx : spec.cx) + d.dxmm;
    return { x: cx - w / 2, y: p.neckY + spec.below + d.dymm, w, h };
  }
  function drawPlaced(x, p, d) {
    const r = placedRect(p, d);
    if (r) x.drawImage(d.art, r.x, r.y, r.w, r.h);
  }

  /* -------------------- 3D -------------------- */
  let three = null;   // { renderer, scene, camera, group, canvas, size }

  function initThree(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 10, 10000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8790, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(-500, 900, 1400); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(700, 400, -1200); scene.add(rim);
    const group = new THREE.Group(); scene.add(group);
    three = { renderer, scene, camera, group, canvas, rotY: -0.35, rotX: 0.06, dist: 2150, meshes: [] };
    wireOrbit(canvas);
    return three;
  }

  // A flat piece as a fine grid (the exact cut line comes from the texture's alpha).
  function gridGeometry(p, bend) {
    const nx = Math.ceil(p.width / GRID), ny = Math.ceil(p.height / GRID);
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const x = Math.min(p.width, i * GRID), y = Math.min(p.height, j * GRID);
      const v = bend(x, y);
      pos.push(v[0], v[1], v[2]); uv.push(x / p.width, 1 - y / p.height);
    }
    const ctx = document.createElement("canvas").getContext("2d");
    const inside = (x, y) => ctx.isPointInPath(p.path, x, y);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x0 = i * GRID, y0 = j * GRID, x1 = Math.min(p.width, x0 + GRID), y1 = Math.min(p.height, y0 + GRID);
      // keep the cell if any corner or the center is inside the piece
      if (!(inside(x0, y0) || inside(x1, y0) || inside(x0, y1) || inside(x1, y1) || inside((x0 + x1) / 2, (y0 + y1) / 2))) continue;
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  // Bend the flat pieces onto a body. Units are millimeters, Y up, the wearer faces +Z.
  function benders(pat) {
    const F = pat.pieces.find((p) => p.kind === "front"), B = pat.pieces.find((p) => p.kind === "back");
    const W = (F.width + B.width) / 2;
    // Half the torso circumference is one piece width: an oval with depth 0.5 × width.
    const a = W / (Math.PI * Math.sqrt((1 + 0.5 * 0.5) / 2)), b = a * 0.5;
    const H = Math.max(F.height, B.height);
    const body = (p, sign) => (x, y) => {
      const t = (x / p.width) * Math.PI - Math.PI / 2;
      let X = a * Math.sin(t) * sign, Z = b * Math.cos(t) * sign;
      // Above the underarm the piece curls over the shoulder, so front and back meet on top.
      const top = Math.max(0, Math.min(1, (p.underarmY - y) / p.underarmY));
      Z *= 1 - 0.82 * top * top;
      // a gentle waist and a little flare at the hem keep it from looking like a tube
      const yy = y / p.height, waist = 1 - 0.035 * Math.sin(Math.PI * Math.min(1, yy * 1.2));
      return [X * waist, H - y - (p.height - H) * 0, Z * waist];
    };
    const sleeve = (p, side) => {
      const S = pat.pieces.find((q) => q.kind === "sleeve");
      const capBase = S.height * 0.36;                    // where the cap meets the underarm seam
      const shoulderY = H - F.underarmY * 0.3, shoulderX = a * 0.9;
      const ang = (34 * Math.PI) / 180;                    // arms relaxed, 34° below horizontal
      const dir = [Math.cos(ang) * side, -Math.sin(ang), 0], up = [Math.sin(ang) * side, Math.cos(ang), 0];
      // the sleeve's width at each height becomes the tube's circumference
      const ctx = document.createElement("canvas").getContext("2d");
      const rowWidth = (y) => { let n = 0; for (let x = 0; x <= p.width; x += 4) if (ctx.isPointInPath(p.path, x, y)) n += 4; return Math.max(40, n); };
      const radius = {};
      return (x, y) => {
        const ky = Math.round(y / 6) * 6;
        const r = (radius[ky] ??= rowWidth(Math.max(capBase, ky)) / (2 * Math.PI)) * (y < capBase ? 0.55 + 0.45 * (y / capBase) : 1);
        const phi = (x / p.width - 0.5) * 2 * Math.PI * side;
        const s = (y - capBase * 0.75) * 0.92;
        const cu = Math.cos(phi) * r, cz = Math.sin(phi) * r;
        return [shoulderX * side + dir[0] * s + up[0] * cu, shoulderY + dir[1] * s + up[1] * cu, dir[2] * s + cz];
      };
    };
    return { front: body(F, 1), back: body(B, -1), sleeveR: (p) => sleeve(p, -1), sleeveL: (p) => sleeve(p, 1), H };
  }

  // The geometry is built once per size; a change of color or design only repaints textures.
  async function show3D(canvas, size, design) {
    const pat = await loadPattern(size);
    if (!three || three.canvas !== canvas) initThree(canvas);
    const { group } = three;
    if (three.size !== size) {
      for (const m of three.meshes) { group.remove(m); m.geometry.dispose(); m.material.map.dispose(); m.material.dispose(); }
      three.meshes = [];
      const bend = benders(pat);
      let sleeves = 0;
      for (const p of pat.pieces) {
        const f = p.kind === "front" ? bend.front : p.kind === "back" ? bend.back : (sleeves++ ? bend.sleeveL(p) : bend.sleeveR(p));
        const mat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.92, metalness: 0, alphaTest: 0.5 });
        const mesh = new THREE.Mesh(gridGeometry(p, f), mat);
        mesh.userData.piece = p;
        group.add(mesh); three.meshes.push(mesh);
      }
      group.position.y = -bend.H / 2;
      three.size = size;
    }
    for (const m of three.meshes) {
      const tex = new THREE.CanvasTexture(pieceTexture(m.userData.piece, design));
      tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
      if (m.material.map) m.material.map.dispose();
      m.material.map = tex; m.material.needsUpdate = true;
    }
    resize(); render();
  }

  function resize() {
    const { renderer, camera, canvas } = three, w = canvas.clientWidth || 600, h = canvas.clientHeight || w;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function render() {
    if (!three) return;
    const { renderer, scene, camera, group } = three;
    group.rotation.set(three.rotX, three.rotY, 0);
    camera.position.set(0, 60, three.dist); camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  // Drag to turn, wheel or pinch to zoom, double-click to reset.
  function wireOrbit(canvas) {
    const pts = new Map(); let last = null, pinch = 0;
    canvas.addEventListener("pointerdown", (e) => { pts.set(e.pointerId, e); canvas.setPointerCapture(e.pointerId); last = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, e);
      if (pts.size === 2) {
        const [p1, p2] = [...pts.values()], dd = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
        if (pinch) three.dist = Math.max(1500, Math.min(4200, three.dist * (pinch / dd)));
        pinch = dd; requestAnimationFrame(render); return;
      }
      three.rotY += (e.clientX - last.x) * 0.01;
      three.rotX = Math.max(-0.6, Math.min(0.6, three.rotX + (e.clientY - last.y) * 0.005));
      last = { x: e.clientX, y: e.clientY }; requestAnimationFrame(render);
    });
    const up = (e) => { pts.delete(e.pointerId); pinch = 0; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); three.dist = Math.max(1500, Math.min(4200, three.dist * (1 + e.deltaY * 0.001))); requestAnimationFrame(render); }, { passive: false });
    canvas.addEventListener("dblclick", () => { three.rotY = -0.35; three.rotX = 0.06; three.dist = 2150; render(); });
    canvas.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key];
      if (!k) return; e.preventDefault(); three.rotY += k[0]; three.rotX = Math.max(-0.6, Math.min(0.6, three.rotX + k[1])); render();
    });
    addEventListener("resize", () => { if (three) { resize(); render(); } });
  }

  /* -------------------- flat pattern view -------------------- */
  async function drawFlat(canvas, size, design, labels) {
    const pat = await loadPattern(size), x = canvas.getContext("2d"), S = canvas.width;
    const [F, B, S1, S2] = pat.pieces, gap = 40;
    const totalW = F.width + B.width + gap, totalH = Math.max(F.height, B.height) + gap + S1.height;
    const k = Math.min((S - 80) / totalW, (S - 120) / totalH);
    x.clearRect(0, 0, S, S);
    const ox = (S - totalW * k) / 2, oy = 40;
    const put = (p, px, py, label) => {
      x.save(); x.translate(px, py); x.scale(k, k);
      x.drawImage(pieceTexture(p, design), 0, 0, p.width, p.height);
      x.lineWidth = 1.4 / k; x.strokeStyle = "#151316"; x.stroke(p.path);
      x.restore();
      x.fillStyle = "#67626B"; x.font = '500 20px "IBM Plex Mono", monospace'; x.textAlign = "center";
      x.fillText(label, px + (p.width * k) / 2, py + p.height * k + 26);
    };
    put(F, ox, oy, labels.front);
    put(B, ox + (F.width + gap) * k, oy, labels.back);
    const sy = oy + (Math.max(F.height, B.height) + gap) * k;
    const sw = (S1.width + S2.width + gap) * k, sx = (S - sw) / 2;
    put(S1, sx, sy, labels.sleeve); put(S2, sx + (S1.width + gap) * k, sy, labels.sleeve);
  }

  /* -------------------- production file (route 2) -------------------- */
  // The marker at real scale: every piece printed where the CAD system laid it out.
  async function productionFile(size, design, dpi = 100) {
    const pat = await loadPattern(size), pxmm = dpi / 25.4, head = 22;   // mm of header above the marker
    const c = document.createElement("canvas");
    c.width = Math.round(pat.marker.width * pxmm); c.height = Math.round((pat.marker.height + head) * pxmm);
    const x = c.getContext("2d");
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, c.width, c.height);
    x.scale(pxmm, pxmm);
    x.fillStyle = "#151316"; x.font = '500 7px "IBM Plex Mono", monospace';
    x.fillText(`CHILIAN · ${pat.style} · TALLA ${size} · ${Math.round(pat.marker.width)} × ${Math.round(pat.marker.height)} mm · ${dpi} dpi · ${new Date().toISOString().slice(0, 10)}`, 6, 14);
    x.translate(0, head);
    x.strokeStyle = "#999"; x.lineWidth = 0.4; x.strokeRect(0, 0, pat.marker.width, pat.marker.height);
    for (const p of pat.pieces) {
      x.save(); x.translate(p.marker.x, p.marker.y);
      if (p.marker.rotation === 180) { x.translate(p.width, p.height); x.rotate(Math.PI); }
      x.drawImage(pieceTexture(p, design), 0, 0, p.width, p.height);
      x.lineWidth = 0.35; x.strokeStyle = "#151316"; x.stroke(p.path);
      x.restore();
    }
    return c;
  }

  window.Chilian3D = { loadPattern, show3D, render, resize, drawFlat, productionFile, placedRect, snapshot: () => three && three.canvas };
})();
