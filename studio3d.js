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
  const CAP = 0.36;           // the sleeve cap is the top 36 % of the sleeve piece
  const patterns = {};

  // style = folder in patterns/ (play-sport-mc, playera-dama); size = S | M | L | XL
  function loadPattern(style, size) {
    const key = `${style}/${size}`;
    if (!patterns[key]) patterns[key] = fetch(`patterns/${key}.json`).then((r) => {
      if (!r.ok) throw new Error(`pattern ${key}: ${r.status}`);
      return r.json();
    }).then(addLandmarks);
    return patterns[key];
  }

  // Where a horizontal line at height y crosses the piece: [left, right] in mm.
  function rowExtent(p, y) {
    const o = p.outline; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < o.length; i++) {
      const [x1, y1] = o[i], [x2, y2] = o[(i + 1) % o.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) { const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1); lo = Math.min(lo, x); hi = Math.max(hi, x); }
    }
    return lo < hi ? [lo, hi] : [0, p.width];
  }

  // Landmarks used for print placement and for bending the pieces.
  function addLandmarks(pat) {
    let sleeves = 0;
    for (const p of pat.pieces) {
      if (p.kind === "sleeve") p.side = sleeves++ ? "L" : "R";   // first sleeve on the marker = wearer's right
      const o = p.outline, cx = p.width / 2;
      // Neck point: the highest outline point near the center line is the bottom of the neckline.
      const near = o.filter(([x]) => Math.abs(x - cx) < p.width * 0.06);
      p.neckY = p.neck ? p.neck.depth_mm : near.length ? Math.max(...near.filter(([, y]) => y < p.height * 0.3).map(([, y]) => y), 0) : 0;
      // The neck curve as points (front and back), where the binding is sewn.
      if (p.neck) {
        p.neckPath = [];
        for (let i = p.neck.from; ; i = (i + p.neck.step + o.length) % o.length) { p.neckPath.push(o[i]); if (i === p.neck.to) break; }
      }
      // Underarm: going down from the shoulder, the first height where the armhole curve has
      // reached the full width of the upper body. (Not the widest point: on fitted pieces
      // that is the flared hem.)
      let maxW = 0; const ws = [];
      for (let y = 2; y < p.height * 0.55; y += 2) { const [l, r] = rowExtent(p, y); ws.push([y, r - l]); maxW = Math.max(maxW, r - l); }
      p.underarmY = (ws.find(([, w]) => w >= maxW * 0.985) || [p.height * 0.3])[0];
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
    if (d.mode === "full" && d.bg) drawFull(x, p, d);
    for (const pr of d.prints || []) drawPlaced(x, p, pr);
    x.restore();
    return c;
  }

  // Full print: the design covers the whole piece, or repeats as a pattern.
  function drawFull(x, p, d) {
    const a = d.bg, ar = a.width / a.height;
    if (d.fill === "repeat") {
      const tw = d.tileMM, th = tw / ar;
      for (let yy = -th; yy < p.height + th; yy += th) for (let xx = -tw; xx < p.width + tw; xx += tw) x.drawImage(a, xx, yy, tw, th);
    } else {
      let w = p.width, h = w / ar;
      if (h < p.height) { h = p.height; w = h * ar; }
      x.drawImage(a, (p.width - w) / 2, (p.height - h) / 2, w, h);
    }
  }

  // Where each section's graphic sits on its piece, in mm (same centimeters as the 2D studio).
  // Body prints hang from the neck point; sleeve prints sit on the sleeve's center line
  // (the outside of the arm), 25 mm below the base of the sleeve cap.
  const PLACES = {
    full:  { piece: "front", cx: 0,  below: 70 },
    chest: { piece: "front", cx: 95, below: 75 },
    back:  { piece: "back",  cx: 0,  below: 80 },
    nape:  { piece: "back",  cx: 0,  below: 25 },
    sleeve: { piece: "sleeve", cx: 0, belowCap: 25 }
  };
  function placedRect(p, pr) {
    const spec = PLACES[pr.placeId];
    if (!spec || spec.piece !== p.kind) return null;
    if (p.kind === "sleeve" && pr.section !== (p.side === "R" ? "sleeveR" : "sleeveL")) return null;
    // On the back piece the wearer's left is on the left as laid flat (outside up), so +x mirrors.
    const cx = p.width / 2 + (p.kind === "back" ? -spec.cx : spec.cx) + pr.dxmm;
    const top = p.kind === "sleeve" ? p.height * CAP + spec.belowCap : p.neckY + spec.below;
    return { x: cx - pr.wmm / 2, y: top + pr.dymm, w: pr.wmm, h: pr.hmm };
  }
  function drawPlaced(x, p, pr) {
    const r = placedRect(p, pr);
    if (r) x.drawImage(pr.art, r.x, r.y, r.w, r.h);
  }

  // A fine knit, as a normal map: vertical ribs a few millimeters apart plus a little
  // irregular yarn noise, so light breaks on the fabric like it does on cotton jersey.
  let knitMap = null;
  function knit() {
    if (knitMap) return knitMap;
    const N = 128, c = document.createElement("canvas"); c.width = c.height = N;
    const x = c.getContext("2d"), img = x.createImageData(N, N), h = new Float32Array(N * N);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) h[j * N + i] = 0.6 * Math.sin((i / N) * Math.PI * 2 * 16) ** 2 + 0.25 * Math.sin((j / N) * Math.PI * 2 * 32 + i) + 0.3 * rnd();
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const dx = h[j * N + ((i + 1) % N)] - h[j * N + ((i - 1 + N) % N)], dy = h[((j + 1) % N) * N + i] - h[((j - 1 + N) % N) * N + i];
      const k = (j * N + i) * 4, len = Math.hypot(dx, dy, 1);
      img.data[k] = (-dx / len * 0.5 + 0.5) * 255; img.data[k + 1] = (-dy / len * 0.5 + 0.5) * 255; img.data[k + 2] = (1 / len * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    knitMap = new THREE.CanvasTexture(c); knitMap.wrapS = knitMap.wrapT = THREE.RepeatWrapping;
    return knitMap;
  }
  // Soft shadow under the garment, like a product photo on a sweep.
  function shadowPlane(width, y) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const x = c.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,.30)"); g.addColorStop(0.6, "rgba(0,0,0,.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.4, width * 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
  }

  /* -------------------- 3D -------------------- */
  let three = null;   // { renderer, scene, camera, group, canvas, size }

  function initThree(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    // Filmic tone mapping keeps whites soft and darks deep, like a studio photo.
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 10, 10000);
    // A three-light product setup: soft sky fill, a key from the upper left, a rim from behind.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6f6c74, 0.65));
    const key = new THREE.DirectionalLight(0xfff6ec, 1.05); key.position.set(-700, 1100, 1300); scene.add(key);
    const fill = new THREE.DirectionalLight(0xe9f0ff, 0.35); fill.position.set(900, 200, 900); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.55); rim.position.set(500, 700, -1400); scene.add(rim);
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
    // Outside must face out (outside = textured, inside = plain): compare normals with the
    // direction from the piece's own center; flip the triangles if most point inward.
    const P = g.attributes.position.array, Nn = g.attributes.normal.array;
    let cx = 0, cy = 0, cz = 0, n = P.length / 3; for (let i = 0; i < P.length; i += 3) { cx += P[i]; cy += P[i + 1]; cz += P[i + 2]; }
    cx /= n; cy /= n; cz /= n;
    let dot = 0; for (let i = 0; i < P.length; i += 3) dot += (P[i] - cx) * Nn[i] + (P[i + 2] - cz) * Nn[i + 2];
    if (dot < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
    return g;
  }

  // Bend the flat pieces onto a body. Units are millimeters, Y up, the wearer faces +Z.
  function benders(pat) {
    const F = pat.pieces.find((p) => p.kind === "front"), B = pat.pieces.find((p) => p.kind === "back");
    const W = (F.width + B.width) / 2;
    // Half the torso circumference is one piece width: an oval with depth 0.5 × width.
    const a = W / (Math.PI * Math.sqrt((1 + 0.5 * 0.5) / 2)), b = a * 0.5;
    const H = Math.max(F.height, B.height);
    // Each row of a piece wraps half the torso between that row's side seams, so fitted
    // pieces (the women's waist) keep their shape and the side seams meet at every height.
    const extent = rowExtent;
    const body = (p, sign) => {
      const rows = {}, ref = extent(p, p.underarmY + 1), refW = ref[1] - ref[0];
      return (x, y) => {
        const ky = Math.round(y / 4) * 4;
        const [xl, xr] = (rows[ky] ??= extent(p, Math.max(p.underarmY + 1, Math.min(p.height - 1, ky))));
        const k = (xr - xl) / refW;
        const t = ((x - xl) / (xr - xl)) * Math.PI - Math.PI / 2;
        let X = a * k * Math.sin(t) * sign, Z = b * k * Math.cos(t) * sign;
      // Above the underarm the piece curls over the shoulder, so front and back meet on top.
      const top = Math.max(0, Math.min(1, (p.underarmY - y) / p.underarmY));
      Z *= 1 - 0.82 * top * top;
      // a gentle waist and a little flare at the hem keep it from looking like a tube
      const yy = y / p.height, waist = 1 - 0.035 * Math.sin(Math.PI * Math.min(1, yy * 1.2));
      // Soft folds: long vertical drapes from the chest down, a few horizontal ripples at the
      // waist and hem, and drag lines from the underarm. Amplitudes are a few millimeters.
      const below = Math.max(0, (y - p.underarmY) / (p.height - p.underarmY));
      const fold = 3.2 * below * Math.sin(x * 0.035 + Math.sin(y * 0.011) * 1.7)
        + 1.6 * Math.sin(y * 0.09 + x * 0.006) * Math.min(1, below * 2) * (1 - Math.abs(t) / 1.8)
        + 2.0 * Math.exp(-((y - p.underarmY - 60) ** 2) / 4000) * Math.sin((x - p.width / 2) * 0.05);
      // Folds fade out at the side seams (cos t = 0 there), so front and back still meet.
      const rad = Math.hypot(X, Z) || 1, f = 1 + (fold * Math.max(0, Math.cos(t)) ** 0.8) / rad;
      return [X * waist * f, H - y, Z * waist * f];
      };
    };
    const sleeve = (p, side) => {
      const S = pat.pieces.find((q) => q.kind === "sleeve");
      const capBase = S.height * CAP;                     // where the cap meets the underarm seam
      // Hang the sleeve from the shoulder: use the body's width at the underarm, not at the
      // hem (fitted pieces are narrower up top), so the cap meets the armhole.
      const [ul, ur] = extent(F, F.underarmY + 1), aUnder = a * ((ur - ul) / W);
      const shoulderY = H - F.underarmY * 0.3, shoulderX = aUnder * 0.9;
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
    return { front: body(F, 1), back: body(B, -1), sleeveR: (p) => sleeve(p, -1), sleeveL: (p) => sleeve(p, 1), H, W: a * 2 };
  }

  // Neck binding: a strip of the same fabric in one solid tone, sewn over the neck edge.
  // Drawn as a band along the real neck curve of the front and back pieces.
  const BINDING_MM = 11;
  function bindingGeometry(p, bend) {
    const path = p.neckPath; if (!path || path.length < 2) return null;
    const ctx = document.createElement("canvas").getContext("2d"), pos = [], idx = [];
    path.forEach(([x, y], i) => {
      const [xa, ya] = path[Math.max(0, i - 1)], [xb, yb] = path[Math.min(path.length - 1, i + 1)];
      let nx = -(yb - ya), ny = xb - xa; const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      if (!ctx.isPointInPath(p.path, x + nx * 4, y + ny * 4)) { nx = -nx; ny = -ny; }   // point into the piece
      for (const d of [-1.5, BINDING_MM]) {
        const v = bend(x + nx * d, y + ny * d), r = 1.012;            // a hair outside the body, no flicker
        pos.push(v[0] * r, v[1], v[2] * r);
      }
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  // The geometry is built once per pattern; a change of color or design only repaints textures.
  async function show3D(canvas, style, size, design) {
    const pat = await loadPattern(style, size), key = `${style}/${size}`;
    if (!three || three.canvas !== canvas) initThree(canvas);
    const { group } = three;
    if (three.key !== key) {
      // A new pattern: clear everything (outside, inside, binding, shadow) before rebuilding.
      for (const m of [...group.children]) { group.remove(m); m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); if (m.material.normalMap) m.material.normalMap.dispose(); m.material.dispose(); }
      three.meshes = []; three.bindings = [];
      const bend = benders(pat);
      let sleeves = 0;
      for (const p of pat.pieces) {
        const f = p.kind === "front" ? bend.front : p.kind === "back" ? bend.back : (sleeves++ ? bend.sleeveL(p) : bend.sleeveR(p));
        // Outside: the printed fabric with a knit texture. Inside: the same cloth, plain and a bit
        // darker (it gets less light), so the neck and sleeve openings read as real fabric.
        const geo = gridGeometry(p, f), n = knit().clone(); n.needsUpdate = true;
        n.repeat.set(p.width / 9, p.height / 9);
        const mat = new THREE.MeshStandardMaterial({ side: THREE.FrontSide, roughness: 0.94, metalness: 0, alphaTest: 0.5, normalMap: n, normalScale: new THREE.Vector2(0.13, 0.13) });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.piece = p;
        const inner = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ side: THREE.BackSide, roughness: 1, metalness: 0, alphaTest: 0.5 }));
        mesh.userData.inner = inner;
        group.add(mesh, inner); three.meshes.push(mesh);
        const bg = p.kind !== "sleeve" && bindingGeometry(p, f);
        if (bg) {
          const band = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.85, metalness: 0 }));
          group.add(band); three.bindings.push(band);
        }
      }
      group.add(shadowPlane(bend.W || 600, -45));
      group.position.y = -bend.H / 2;
      three.key = key;
    }
    for (const m of three.meshes) {
      const tex = new THREE.CanvasTexture(pieceTexture(m.userData.piece, design));
      tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8;
      if (m.material.map) m.material.map.dispose();
      m.material.map = tex; m.material.needsUpdate = true;
      // The inside keeps the cut shape but shows plain cloth in the garment color (no print:
      // ink is only on the outside).
      const inner = m.userData.inner.material, plain = new THREE.CanvasTexture(pieceTexture(m.userData.piece, { color: design.color, prints: [] }));
      plain.encoding = THREE.sRGBEncoding;
      if (inner.map) inner.map.dispose();
      inner.map = plain; inner.color.set(0x9a989e); inner.needsUpdate = true;
    }
    // One tone: the binding is the garment (or background) color, never printed.
    const tone = new THREE.Color(design.color).convertSRGBToLinear();
    for (const b of three.bindings) b.material.color.copy(tone);
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
  async function drawFlat(canvas, style, size, design, labels) {
    const pat = await loadPattern(style, size), x = canvas.getContext("2d"), S = canvas.width;
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
    put(S1, sx, sy, S1.side === "L" ? labels.sleeveL : labels.sleeveR); put(S2, sx + (S1.width + gap) * k, sy, S2.side === "L" ? labels.sleeveL : labels.sleeveR);
    if (pat.neckline_mm) {
      x.fillStyle = "#151316"; x.font = '500 22px "IBM Plex Mono", monospace'; x.textAlign = "center";
      x.fillText(labels.binding(Math.round(pat.neckline_mm)), S / 2, S - 26);
    }
  }

  /* -------------------- production file (route 2) -------------------- */
  // The marker at real scale: every piece printed where the CAD system laid it out.
  async function productionFile(style, size, design, dpi = 100) {
    const pat = await loadPattern(style, size), pxmm = dpi / 25.4, head = 30;   // mm of header above the marker
    const c = document.createElement("canvas");
    c.width = Math.round(pat.marker.width * pxmm); c.height = Math.round((pat.marker.height + head) * pxmm);
    const x = c.getContext("2d");
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, c.width, c.height);
    x.scale(pxmm, pxmm);
    x.fillStyle = "#151316"; x.font = '500 7px "IBM Plex Mono", monospace';
    x.fillText(`CHILIAN · ${pat.style} · TALLA ${size} · ${Math.round(pat.marker.width)} × ${Math.round(pat.marker.height)} mm · ${dpi} dpi · ${new Date().toISOString().slice(0, 10)}`, 6, 12);
    if (pat.neckline_mm) x.fillText(`CUELLO: CINTA DE LA MISMA TELA, 1 TONO ${(design.colorName || "").toUpperCase()} ${design.color.toUpperCase()} · ESCOTE ${Math.round(pat.neckline_mm)} mm EN LÍNEA DE CORTE (NO INCLUIDA EN ESTE TRAZO)`, 6, 22);
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

  // Turn the model to face the side being printed.
  function face(side) {
    if (!three) return;
    three.rotY = { back: Math.PI - 0.35, right: 1.25, left: -1.25 }[side] ?? -0.35; render();
  }

  window.Chilian3D = { face, loadPattern, show3D, render, resize, drawFlat, productionFile, placedRect, snapshot: () => three && three.canvas };
})();
