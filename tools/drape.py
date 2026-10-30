#!/usr/bin/env python3
"""
Drape a Chilian pattern on a mannequin: the realistic 3D for "Estampa tu idea".

    python3 tools/drape.py <style> <size> [--preview out.png]
    python3 tools/drape.py all

style: play-sport-mc (men, Chilian Sport) | playera-dama (women)
Reads patterns/<style>/<size>.json, writes drape/<style>-<size>.json.

What it does, in order:
  1. Builds a dress-form mannequin (male or female) sized to the garment:
     chest (or bust, waist and hip) = garment width minus the style's ease.
  2. Triangulates each pattern piece in its own millimeters (that 2D position
     is the texture coordinate, so prints land exactly where the pattern says).
  3. Finds the seams on the outline (shoulder, side, armhole, sleeve cap,
     sleeve underarm), wraps the pieces loosely around the body and sews them:
     a cloth simulation (position-based dynamics) pulls each seam closed while
     gravity drapes the fabric over the mannequin. The folds are not drawn,
     they come out of the simulation.
  4. Saves the draped positions plus the mannequin mesh, as compact base64.
"""
import base64, json, math, sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from scipy.spatial import Delaunay
from skimage import measure
from matplotlib.path import Path as MPath

ROOT = Path(__file__).resolve().parent.parent
H = 9.0          # cloth mesh spacing, mm
VOX = 5.0        # mannequin voxel size for collisions, mm
THICK = 3.0      # fabric stand-off from the body, mm
GRAV = float(__import__("os").environ.get("DRAPE_G", 350))   # mm/s², softened so the solver keeps the knit near its real length

# ---------------------------------------------------------------- mannequins
# Sections (y, half-width, half-depth, depth center), y = 0 at the base of the neck,
# for size M. Women's forms get a bust; both get shoulders, upper arms and a neck.
FORMS = {
    "male": dict(
        n=2.5, chest_y=-230, neck_r=58, arm_angle=42,
        rows=[(12, 60, 54, -10), (-25, 140, 82, -6), (-65, 196, 104, 0), (-140, 186, 120, 6),
              (-230, 170, 126, 8), (-330, 158, 120, 5), (-430, 150, 112, 0), (-540, 156, 112, -4),
              (-640, 164, 114, -8), (-830, 160, 112, -8)],
        deltoid=((182, -82, 0), (56, 62, 64)), arm=((190, -105, 0), 260, 49, 41), bust=None),
    "female": dict(
        n=2.3, chest_y=-250, neck_r=47, arm_angle=40,
        rows=[(12, 50, 46, -10), (-25, 118, 70, -6), (-62, 170, 88, -2), (-130, 160, 100, 2),
              (-200, 148, 104, 4), (-265, 146, 100, 4), (-380, 122, 88, 0), (-490, 156, 106, -6),
              (-580, 176, 116, -10), (-760, 170, 112, -10)],
        deltoid=((158, -72, 0), (44, 52, 52)), arm=((165, -92, 0), 230, 39, 33),
        bust=((80, -258, 66), (72, 66, 60))),
}
STYLES = {
    # ease: body circumference = garment circumference (front + back width) × factor
    "play-sport-mc": dict(form="male", chest=0.905),
    "playera-dama": dict(form="female", chest=0.95),
}


def body_field(form, kx, ky, bounds):
    """Occupancy (0/1) of the mannequin on a voxel grid; returns (field, origin)."""
    f = FORMS[form]
    (x0, x1), (y0, y1), (z0, z1) = bounds
    xs = np.arange(x0, x1, VOX); ys = np.arange(y0, y1, VOX); zs = np.arange(z0, z1, VOX)
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    rows = np.array(f["rows"], float)
    ry = rows[::-1, 0] * ky
    a = np.interp(Y, ry, rows[::-1, 1] * kx, left=0, right=0)
    b = np.interp(Y, ry, rows[::-1, 2] * kx, left=0, right=0)
    zc = np.interp(Y, ry, rows[::-1, 3] * kx)
    n = f["n"]
    with np.errstate(divide="ignore", invalid="ignore"):
        torso = (np.abs(X) / a) ** n + (np.abs(Z - zc) / b) ** n <= 1
    torso &= (Y <= ry.max()) & (Y >= ry.min()) & (a > 0)
    occ = torso
    # deltoids (round the shoulder) and the upper arms (capsules, relaxed A-pose)
    (dx, dy, dz), (rx, rY, rz) = f["deltoid"]
    for s in (-1, 1):
        occ |= ((X - s * dx * kx) / (rx * kx)) ** 2 + ((Y - dy * ky) / (rY * kx)) ** 2 + ((Z - dz) / (rz * kx)) ** 2 <= 1
        (ax, ay, az), L, r0, r1 = f["arm"]
        th = math.radians(f["arm_angle"])
        d = np.array([s * math.sin(th), -math.cos(th), 0.0])
        P = np.stack([X - s * ax * kx, Y - ay * ky, Z - az], -1)
        t = np.clip(P @ d, 0, L * ky)
        dist = np.linalg.norm(P - t[..., None] * d, axis=-1)
        occ |= dist <= (r0 + (r1 - r0) * t / (L * ky)) * kx
    # neck: a slightly forward-leaning cylinder, cut flat on top like a dress form
    nr = f["neck_r"] * kx
    neck = (X ** 2 + (Z + 12 - 0.12 * Y) ** 2 <= nr ** 2) & (Y >= -40) & (Y <= 105)
    occ |= neck
    if f["bust"]:
        (bx, by, bz), (rx, rY, rz) = f["bust"]
        for s in (-1, 1):
            occ |= ((X - s * bx * kx) / (rx * kx)) ** 2 + ((Y - by * ky) / (rY * kx)) ** 2 + ((Z - bz * kx) / (rz * kx)) ** 2 <= 1
    # soften every junction (shoulders, arms, bust) like a padded form
    smooth = ndimage.gaussian_filter(occ.astype(np.float32), 2.2)
    return smooth, np.array([x0, y0, z0], float)


class Body:
    def __init__(self, form, kx, ky):
        self.form = form
        bounds = ((-470 * kx, 470 * kx), (-880 * ky, 140), (-220 * kx, 240 * kx))
        self.field, self.origin = body_field(form, kx, ky, bounds)
        inside = self.field >= 0.5
        sdf = (ndimage.distance_transform_edt(~inside) - ndimage.distance_transform_edt(inside)) * VOX
        self.sdf = ndimage.gaussian_filter(sdf.astype(np.float32), 1.0)
        self.grad = np.stack(np.gradient(self.sdf, VOX), 0)

    def sample(self, p):
        c = ((p - self.origin) / VOX).T
        d = ndimage.map_coordinates(self.sdf, c, order=1, mode="nearest")
        g = np.stack([ndimage.map_coordinates(self.grad[i], c, order=1, mode="nearest") for i in range(3)], -1)
        g /= np.linalg.norm(g, axis=1, keepdims=True) + 1e-9
        return d, g

    def mesh(self):
        """The visible mannequin: marching cubes on a coarser grid, smoothed."""
        fld = self.field[::2, ::2, ::2]
        v, f, _, _ = measure.marching_cubes(fld, 0.5)
        v = v * VOX * 2 + self.origin
        # Taubin smoothing (keeps volume) so the voxel steps disappear
        nb = [[] for _ in range(len(v))]
        for a, b, c in f:
            nb[a] += [b, c]; nb[b] += [a, c]; nb[c] += [a, b]
        nb = [np.unique(x) for x in nb]
        for lam in [0.6, -0.62] * 8:
            avg = np.array([v[x].mean(0) for x in nb])
            v = v + lam * (avg - v)
        return v, f


# ---------------------------------------------------------------- pattern pieces
def ext(o, y):
    xs = []
    for i in range(len(o)):
        (x1, y1), (x2, y2) = o[i], o[(i + 1) % len(o)]
        if (y1 <= y < y2) or (y2 <= y < y1):
            xs.append(x1 + (y - y1) / (y2 - y1) * (x2 - x1))
    return (min(xs), max(xs)) if xs else (0, 0)


def underarm_y(p):
    ws = [(y, np.subtract(*ext(p["outline"], y)[::-1])) for y in np.arange(2, p["height"] * 0.55, 2)]
    m = max(w for _, w in ws)
    return next(y for y, w in ws if w >= m * 0.985)


def landmarks(p):
    o = np.array(p["outline"], float); n = len(o); cx = p["width"] / 2
    if p["kind"] == "sleeve":
        crown = int(np.argmin(o[:, 1]))
        ca, cb = int(np.argmin(o[:, 0])), int(np.argmax(o[:, 0]))
        ha = int(np.argmax(o[:, 1] - (o[:, 0] - cx)))     # bottom-left
        hb = int(np.argmax(o[:, 1] + (o[:, 0] - cx)))     # bottom-right
        return dict(crown=crown, capL=ca, capR=cb, hemL=ha, hemR=hb)
    nk = p["neck"]; neck = set()
    i = nk["from"]
    while True:
        neck.add(i)
        if i == nk["to"]:
            break
        i = (i + nk["step"]) % n
    uy = underarm_y(p)
    lm = {}
    for side, sgn in (("L", -1), ("R", 1)):     # L/R = small x / large x as laid flat
        lat = sgn * (o[:, 0] - cx)
        cand = [j for j in range(n) if j not in neck and o[j, 1] < uy and lat[j] > 0]
        lm["sh" + side] = max(cand, key=lambda j: lat[j] - 2 * o[j, 1])
        xl, xr = ext(p["outline"], uy + 1)
        tx = xl if sgn < 0 else xr
        lm["ua" + side] = int(np.argmin(np.hypot(o[:, 0] - tx, o[:, 1] - uy)))
        lm["hem" + side] = int(np.argmax(o[:, 1] + lat))
        ends = [nk["from"], nk["to"]]
        lm["nk" + side] = min(ends, key=lambda j: sgn * (o[j, 0] - cx) * -1)
    return lm


def polyline(o, i, j, step):
    n = len(o); pts = [o[i]]
    while i != j:
        i = (i + step) % n; pts.append(o[i])
    return np.array(pts)


def resample(pl, k):
    """k + 1 points evenly spaced by arc length from the first to the last point."""
    seg = np.hypot(*np.diff(pl, axis=0).T); s = np.r_[0, np.cumsum(seg)]
    t = np.linspace(0, s[-1], k + 1)
    return np.stack([np.interp(t, s, pl[:, 0]), np.interp(t, s, pl[:, 1])], -1), s[-1]


def arc(o, i, j):
    """Shorter way round the outline from vertex i to j (seams never take the long way)."""
    n = len(o)
    a = polyline(o, i, j, 1); b = polyline(o, i, j, -1)
    la = np.hypot(*np.diff(a, axis=0).T).sum(); lb = np.hypot(*np.diff(b, axis=0).T).sum()
    return a if la <= lb else b


def build_piece(p, segments, counts):
    """Boundary = named segments in outline order, each resampled to its seam count;
    interior = a grid. Returns vertices (2D mm), triangles, and the index run of each segment."""
    o = np.array(p["outline"], float)
    bpts, runs = [], {}
    for name, (i, j) in segments:
        pl = arc(o, i, j)
        k = counts.get(name) or max(2, int(round(np.hypot(*np.diff(pl, axis=0).T).sum() / H)))
        rs, _ = resample(pl, k)
        start = len(bpts)
        bpts.extend(rs[:-1])
        runs[name] = list(range(start, start + k + 1))
    nb = len(bpts)
    for name in runs:
        runs[name] = [r % nb for r in runs[name]]
    bpts = np.array(bpts)
    path = MPath(bpts)
    gx, gy = np.meshgrid(np.arange(H / 2, p["width"], H), np.arange(H / 2, p["height"], H * 0.866))
    gx = gx + (np.arange(gx.shape[0])[:, None] % 2) * H / 2
    g = np.stack([gx.ravel(), gy.ravel()], -1)
    g = g[path.contains_points(g)]
    # keep interior points off the boundary so triangles stay well shaped
    d = np.min(np.hypot(g[:, None, 0] - bpts[None, :, 0], g[:, None, 1] - bpts[None, :, 1]), 1)
    g = g[d > H * 0.55]
    pts = np.vstack([bpts, g])
    tri = Delaunay(pts).simplices
    cen = pts[tri].mean(1)
    tri = tri[path.contains_points(cen, radius=-0.01) | MPath(bpts[::-1]).contains_points(cen)]
    # drop slivers along concave boundary stretches
    e = np.linalg.norm(pts[tri] - pts[np.roll(tri, 1, 1)], axis=2)
    tri = tri[e.max(1) < H * 2.6]
    return pts, tri, runs, nb


def setup(style, size):
    pat = json.loads((ROOT / f"patterns/{style}/{size}.json").read_text())
    ref = json.loads((ROOT / f"patterns/{style}/M.json").read_text())
    F = next(p for p in pat["pieces"] if p["kind"] == "front")
    B = next(p for p in pat["pieces"] if p["kind"] == "back")
    Fm = next(p for p in ref["pieces"] if p["kind"] == "front")
    girth = lambda pt, q, y: np.subtract(*ext(pt["outline"], y)[::-1]) + np.subtract(*ext(q["outline"], y)[::-1])
    Bm = next(p for p in ref["pieces"] if p["kind"] == "back")
    kx = girth(F, B, 300) / girth(Fm, Bm, 300)
    ky = F["height"] / Fm["height"]
    return pat, kx, ky


# ---------------------------------------------------------------- simulation
def drape(style, size, steps=700, iters=14, log=True, snap=()):
    cfg = STYLES[style]; form = cfg["form"]
    pat, kx, ky = setup(style, size)
    body = Body(form, kx, ky)
    fm = FORMS[form]
    pieces = pat["pieces"]
    F = next(p for p in pieces if p["kind"] == "front"); Bk = next(p for p in pieces if p["kind"] == "back")
    sleeves = [p for p in pieces if p["kind"] == "sleeve"]
    lmF, lmB = landmarks(F), landmarks(Bk)
    # Front laid flat: small x = wearer's right (world -X). Back: small x = wearer's left (+X).
    side = {"front": {"R": "L", "L": "R"}, "back": {"R": "R", "L": "L"}}   # world side -> flat side

    def body_segments(lm, kind):
        s = side[kind]
        # walk the outline once: neck(R) -> shoulder R -> underarm R -> hem R -> hem L -> ... -> neck L
        return [(f"shoulder_R_{kind}", (lm["nk" + s["R"]], lm["sh" + s["R"]])),
                (f"armhole_R_{kind}", (lm["sh" + s["R"]], lm["ua" + s["R"]])),
                (f"side_R_{kind}", (lm["ua" + s["R"]], lm["hem" + s["R"]])),
                (f"hem_{kind}", (lm["hem" + s["R"]], lm["hem" + s["L"]])),
                (f"side_L_{kind}", (lm["hem" + s["L"]], lm["ua" + s["L"]])),
                (f"armhole_L_{kind}", (lm["ua" + s["L"]], lm["sh" + s["L"]])),
                (f"shoulder_L_{kind}", (lm["sh" + s["L"]], lm["nk" + s["L"]])),
                (f"neck_{kind}", (lm["nk" + s["L"]], lm["nk" + s["R"]]))]

    oF, oB = np.array(F["outline"], float), np.array(Bk["outline"], float)
    L = lambda o, i, j: np.hypot(*np.diff(arc(o, i, j), axis=0).T).sum()
    counts = {}
    for w in "RL":
        sF, sB = side["front"][w], side["back"][w]
        for seam, a, b in (("shoulder", "nk", "sh"), ("side", "ua", "hem")):
            k = max(2, int(round((L(oF, lmF[a + sF], lmF[b + sF]) + L(oB, lmB[a + sB], lmB[b + sB])) / 2 / H)))
            counts[f"{seam}_{w}_front"] = counts[f"{seam}_{w}_back"] = k
        counts[f"armhole_{w}_front"] = max(3, int(round(L(oF, lmF["sh" + sF], lmF["ua" + sF]) / H)))
        counts[f"armhole_{w}_back"] = max(3, int(round(L(oB, lmB["sh" + sB], lmB["ua" + sB]) / H)))

    meshes = []   # per piece: dict(pts2, tri, runs, world fn)
    segF = body_segments(lmF, "front"); segB = body_segments(lmB, "back")
    for p, seg in ((F, segF), (Bk, segB)):
        pts, tri, runs, nb = build_piece(p, seg, counts)
        meshes.append(dict(piece=p, pts=pts, tri=tri, runs=runs, nb=nb))
    # Sleeves: first on the marker = wearer's right (same rule as the 2D studio).
    for si, p in enumerate(sleeves):
        w = "R" if si == 0 else "L"
        lm = landmarks(p); o = np.array(p["outline"], float)
        hl = {c: L(o, lm["crown"], lm[c]) for c in ("capL", "capR")}
        # the cap half closest in length to the front armhole goes to the front
        fa, ba = counts[f"armhole_{w}_front"] * H, counts[f"armhole_{w}_back"] * H
        frontC = "capL" if abs(hl["capL"] - fa) + abs(hl["capR"] - ba) <= abs(hl["capR"] - fa) + abs(hl["capL"] - ba) else "capR"
        backC = "capR" if frontC == "capL" else "capL"
        hemOf = {"capL": "hemL", "capR": "hemR"}
        k_ua = max(2, int(round((L(o, lm["capL"], lm["hemL"]) + L(o, lm["capR"], lm["hemR"])) / 2 / H)))
        cnt = {f"cap_{w}_front": counts[f"armhole_{w}_front"], f"cap_{w}_back": counts[f"armhole_{w}_back"],
               f"sleeveua_{w}_front": k_ua, f"sleeveua_{w}_back": k_ua}
        seg = [(f"cap_{w}_front", (lm["crown"], lm[frontC])),
               (f"sleeveua_{w}_front", (lm[frontC], lm[hemOf[frontC]])),
               (f"sleevehem_{w}", (lm[hemOf[frontC]], lm[hemOf[backC]])),
               (f"sleeveua_{w}_back_r", (lm[hemOf[backC]], lm[backC])),
               (f"cap_{w}_back_r", (lm[backC], lm["crown"]))]
        cnt[f"sleeveua_{w}_back_r"] = k_ua; cnt[f"cap_{w}_back_r"] = counts[f"armhole_{w}_back"]
        pts, tri, runs, nb = build_piece(p, seg, cnt)
        runs[f"sleeveua_{w}_back"] = runs.pop(f"sleeveua_{w}_back_r")[::-1]
        runs[f"cap_{w}_back"] = runs.pop(f"cap_{w}_back_r")[::-1]
        meshes.append(dict(piece=p, pts=pts, tri=tri, runs=runs, nb=nb, side=w, frontC=frontC, lm=lm))

    # ---------- initial placement: loose wrap around the body
    pos = []
    top = 6.0
    for m in meshes:
        p = m["piece"]; P = m["pts"]; cx = p["width"] / 2
        if p["kind"] in ("front", "back"):
            uy = underarm_y(p); xl, xr = ext(p["outline"], uy + 1); Wu = xr - xl
            rq = Wu / math.pi                          # sqrt((Ra²+Rb²)/2)
            Rb = rq * math.sqrt(2 / (1 + (1 / 0.78) ** 2)); Ra = Rb / 0.78
            sgn = 1 if p["kind"] == "front" else -1
            th = (P[:, 0] - cx) / Wu * math.pi
            X = Ra * np.sin(th) * sgn; Z = (Rb + 14) * np.cos(th) * sgn + 6
            Y = top - P[:, 1]
            pos.append(np.stack([X, Y, Z], -1))
        else:
            w = m["side"]; s = -1 if w == "R" else 1
            lm = m["lm"]; capY = (P[:, 1].max() * 0 + p["outline"][lm["capL"]][1] + p["outline"][lm["capR"]][1]) / 2
            th = math.radians(fm["arm_angle"])
            (ax, ay, az), *_ = fm["arm"]
            S = np.array([s * ax * kx, ay * ky, az])
            d = np.array([s * math.sin(th), -math.cos(th), 0.0]); u = np.array([s * math.cos(th), math.sin(th), 0.0])
            zf = np.array([0, 0, 1.0])
            xc = p["outline"][lm["crown"]][0]
            # the front cap corner wraps toward +Z
            dirn = 1 if (p["outline"][lm[m["frontC"]]][0] < xc) else -1
            phi = -(P[:, 0] - xc) / p["width"] * 2 * math.pi * dirn
            r = p["width"] / (2 * math.pi) + 10
            sl = np.maximum(P[:, 1] - capY, (P[:, 1] - capY) * 0.35) + 40
            pos.append(S + sl[:, None] * d + r * (np.cos(phi)[:, None] * u + np.sin(phi)[:, None] * zf))
    # global arrays
    off = np.cumsum([0] + [len(m["pts"]) for m in meshes])
    X = np.vstack(pos)
    uv = np.vstack([m["pts"] for m in meshes])
    # stretch edges (triangle edges) and bend edges (across shared edges)
    E = []; Bd = []
    for k, m in enumerate(meshes):
        t = m["tri"] + off[k]
        e = np.sort(np.vstack([t[:, [0, 1]], t[:, [1, 2]], t[:, [2, 0]]]), 1)
        E.append(np.unique(e, axis=0))
        # bending: opposite vertices of triangle pairs sharing an edge
        opp = {}
        for tr in t:
            for a in range(3):
                key = tuple(sorted((tr[a], tr[(a + 1) % 3])))
                opp.setdefault(key, []).append(tr[(a + 2) % 3])
        Bd += [v for v in opp.values() if len(v) == 2]
    E = np.vstack(E); Bd = np.array(Bd)
    restE = np.linalg.norm(uv[E[:, 0]] - uv[E[:, 1]], axis=1)
    restB = np.linalg.norm(uv[Bd[:, 0]] - uv[Bd[:, 1]], axis=1)
    # seams
    def run(k, name):
        return np.array(meshes[k]["runs"][name]) + off[k]
    S = []
    for w in "RL":
        for seam in ("shoulder", "side"):
            S.append(np.stack([run(0, f"{seam}_{w}_front"), run(1, f"{seam}_{w}_back")], -1))
        sk = 2 if w == "R" else 3
        # armhole runs go shoulder -> underarm on the right, underarm -> shoulder on the left;
        # the cap runs always go crown -> corner
        rv = (lambda a: a) if w == "R" else (lambda a: a[::-1])
        S.append(np.stack([rv(run(0, f"armhole_{w}_front")), run(sk, f"cap_{w}_front")], -1))
        S.append(np.stack([rv(run(1, f"armhole_{w}_back")), run(sk, f"cap_{w}_back")], -1))
        S.append(np.stack([run(sk, f"sleeveua_{w}_front"), run(sk, f"sleeveua_{w}_back")], -1))
    S = np.vstack(S)
    S = S[S[:, 0] != S[:, 1]]
    seam0 = np.linalg.norm(X[S[:, 0]] - X[S[:, 1]], axis=1)
    if log:
        print(f"{style} {size}: {len(X)} verts, {len(E)} edges, {len(S)} seam pairs, kx {kx:.3f} ky {ky:.3f}")

    N = len(X); V = np.zeros_like(X); dt = 1 / 120
    grav = np.array([0, -GRAV, 0])

    def counts_of(idx):
        return np.bincount(idx.ravel(), minlength=N).astype(float)

    def project(Pp, idx, rest, w):
        dvec = Pp[idx[:, 1]] - Pp[idx[:, 0]]
        ln = np.linalg.norm(dvec, axis=1) + 1e-9
        c = ((ln - rest) / ln)[:, None] * dvec * 0.5 * w
        acc = np.empty_like(Pp)
        for k in range(3):
            acc[:, k] = np.bincount(idx[:, 0], c[:, k], N) - np.bincount(idx[:, 1], c[:, k], N)
        return acc
    cE, cB, cS = counts_of(E), counts_of(Bd), counts_of(S)
    cnt = np.maximum(cE + cB + 2 * cS, 1)[:, None]
    snaps = {}

    for step in range(steps):
        sew = max(0.0, 1 - step / (steps * 0.4))
        g = grav * min(1.0, max(0.0, (step - steps * 0.42) / (steps * 0.2)))
        V = V * 0.96 + g * dt
        Pp = X + V * dt
        for _ in range(iters):
            acc = project(Pp, E, restE, 1.0) + project(Pp, Bd, restB, 0.08) + 2 * project(Pp, S, seam0 * sew, 1.0)
            Pp += 1.6 * acc / cnt
            d, n = body.sample(Pp)
            hit = d < THICK
            Pp[hit] += (THICK - d[hit])[:, None] * n[hit]
        Vn = (Pp - X) / dt
        d, n = body.sample(Pp)
        hit = d < THICK + 1.5
        vn = (Vn[hit] * n[hit]).sum(1, keepdims=True)
        Vn[hit] = (Vn[hit] - vn * n[hit]) * 0.55 + np.maximum(vn, 0) * n[hit]     # friction
        V = Vn; X = Pp
        if step in snap:
            snaps[step] = X.copy()
        if log and step % 100 == 0:
            gap = np.linalg.norm(X[S[:, 0]] - X[S[:, 1]], axis=1)
            st = np.linalg.norm(X[E[:, 0]] - X[E[:, 1]], axis=1) / restE
            print(f"  step {step}: seam gap max {gap.max():.1f} mean {gap.mean():.2f}, stretch p95 {np.percentile(st, 95):.3f}")
    # close seams exactly: average the paired vertices
    for _ in range(3):
        mid = (X[S[:, 0]] + X[S[:, 1]]) / 2
        X[S[:, 0]] = mid; X[S[:, 1]] = mid
    return dict(meshes=meshes, X=X, off=off, body=body, kx=kx, ky=ky, form=form, snaps=snaps, X0=np.vstack(pos))


# ---------------------------------------------------------------- output
def b64(a, dt):
    return base64.b64encode(np.ascontiguousarray(a, dtype=dt).tobytes()).decode()


def save(style, size, r):
    out = {"style": style, "size": size, "form": r["form"], "units": "mm", "scale": 0.1, "pieces": [], "body": None}
    X = r["X"]
    for k, m in enumerate(r["meshes"]):
        a, b = r["off"][k], r["off"][k + 1]
        out["pieces"].append({
            "kind": m["piece"]["kind"], "side": m.get("side"), "count": int(b - a),
            "uv": b64(np.round(m["pts"] * 10), "<i2"),      # flat pattern position, 0.1 mm
            "pos": b64(np.round(X[a:b] * 10), "<i2"),       # draped position, 0.1 mm
            "idx": b64(m["tri"], "<u2"),
            "neck": [int(i) for i in m["runs"].get(f"neck_{m['piece']['kind']}", [])],
        })
    v, f = r["body"].mesh()
    out["body"] = {"count": len(v), "pos": b64(np.round(v * 10), "<i2"),
                   "idx": b64(f, "<u2" if len(v) < 65536 else "<u4"), "wide": len(v) >= 65536}
    dst = ROOT / "drape" / f"{style}-{size}.json"
    dst.parent.mkdir(exist_ok=True)
    dst.write_text(json.dumps(out, separators=(",", ":")))
    print(f"  wrote {dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB, body {len(v)} verts)")


def preview(r, path):
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    X = r["X"]; fig = plt.figure(figsize=(15, 8))
    for i, (az, title) in enumerate(((0, "front"), (90, "side"), (180, "back"))):
        ax = fig.add_subplot(1, 3, i + 1)
        th = math.radians(az); R = np.array([[math.cos(th), 0, math.sin(th)], [0, 1, 0], [-math.sin(th), 0, math.cos(th)]])
        for k, m in enumerate(r["meshes"]):
            P = X[r["off"][k]:r["off"][k + 1]] @ R.T
            ax.triplot(P[:, 0], P[:, 1], m["tri"], lw=0.2, color="C%d" % k)
        ax.set_aspect("equal"); ax.set_title(title)
    fig.savefig(path, dpi=80); plt.close(fig)


if __name__ == "__main__":
    args = sys.argv[1:]
    jobs = [(s, z) for s in STYLES for z in "S M L XL".split()] if args[:1] == ["all"] else [(args[0], args[1])]
    for s, z in jobs:
        r = drape(s, z)
        save(s, z, r)
        if "--preview" in args:
            preview(r, args[args.index("--preview") + 1])
