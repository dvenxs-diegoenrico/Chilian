"""Extract garment pattern pieces from a CAD marker printed to PDF.

The Chilian markers ("trazos") are one PDF per size, printed with
"Microsoft Print to PDF": every line is a tiny filled shape, so the PDF
has no usable vectors. This script rasterizes the page, finds each closed
piece, traces its cut line and writes it in millimeters.

Usage: python3 tools/extract_pattern.py <marker.pdf> <size> <out.json>
The marker width and height are read from the sheet's own header ("1,500 m  1,003 m").
Needs: pdftoppm, pdftotext (poppler), numpy, opencv-python-headless.
"""
import json, math, re, subprocess, sys, tempfile, os
import numpy as np, cv2

DPI = 600
NAMES = {"DELANTERO": "front", "ESPALDA": "back", "MANGA": "sleeve"}

def main(pdf, size, out):
    tmp = tempfile.mkdtemp()
    subprocess.run(["pdftoppm", "-r", str(DPI), "-gray", "-singlefile", pdf, f"{tmp}/p"], check=True)
    img = cv2.imread(f"{tmp}/p.pgm", cv2.IMREAD_GRAYSCALE)
    subprocess.run(["pdftotext", "-bbox", pdf, f"{tmp}/b.html"], check=True)
    words = re.findall(r'xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]+)<', open(f"{tmp}/b.html").read())
    k = DPI / 72.0
    header_words = set(subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout.split("\n")[0].split())
    # A piece's label is a block of words ("MANGA" / "M" / "PLAY CAB"). Keep each block's box;
    # the piece is the region that holds most of that box (a word may overlap the cut line).
    boxes = [(float(a) * k, float(b) * k, float(c) * k, float(d) * k, w) for a, b, c, d, w in words]
    labels = []
    for a, b, c, d, w in boxes:
        if w not in NAMES: continue
        cx, cy = (a + c) / 2, (b + d) / 2
        block = [bb for bb in boxes if bb[4] not in NAMES and bb[4] not in header_words
                 and math.hypot((bb[0] + bb[2]) / 2 - cx, (bb[1] + bb[3]) / 2 - cy) < 60 * DPI / 25.4 / 7] + [(a, b, c, d, w)]
        labels.append(((min(bb[0] for bb in block), min(bb[1] for bb in block), max(bb[2] for bb in block), max(bb[3] for bb in block)), w))
    header = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
    dims = [float(v.replace(",", ".")) * 1000 for v in re.findall(r"(\d+,\d+)\s*m\b", header)[:2]]
    marker_w, marker_h = dims
    eff = re.search(r"(\d+,\d+)\s*%", header)
    eff = float(eff.group(1).replace(",", ".")) if eff else None

    ink = (img < 140).astype(np.uint8)
    # The marker frame: the biggest outer contour.
    cnts, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    fx, fy, fw, fh = cv2.boundingRect(max(cnts, key=cv2.contourArea))
    sx, sy = marker_w / fw, marker_h / fh   # mm per pixel on each sheet axis
    mm_per_px = (sx + sy) / 2
    print(f"{size}: sheet {marker_w:.0f} x {marker_h:.0f} mm, frame {fw}x{fh}px, axis scales differ {abs(sx - sy) / sx * 100:.2f}%")

    # Close the solid cut lines slightly (dashed stitch lines stay open), then label the white regions.
    lines = cv2.dilate(ink, np.ones((3, 3), np.uint8))
    white = (1 - lines).astype(np.uint8)
    white[:fy + 2, :] = 0; white[fy + fh - 2:, :] = 0; white[:, :fx + 2] = 0; white[:, fx + fw - 2:] = 0
    n, lab, stats, _ = cv2.connectedComponentsWithStats(white, connectivity=4)

    pieces = []
    for (bx0, by0, bx1, by1), word in labels:
        # Vote: sample a grid over the label block; the piece is the region most samples fall in.
        min_area = 50 * 100 / (sx * sy)                 # ignore letter holes and specks under 50 cm²
        votes = {}
        for gy in np.linspace(by0, by1, 15):
            for gx in np.linspace(bx0, bx1, 15):
                v = lab[int(gy), int(gx)]
                if v > 0 and stats[v, cv2.CC_STAT_AREA] >= min_area: votes[v] = votes.get(v, 0) + 1
        comp = max(votes, key=votes.get)
        mask = (lab == comp).astype(np.uint8)
        # Fill the text and stitch-line holes, then grow back over the cut line itself.
        cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        filled = np.zeros_like(mask); cv2.drawContours(filled, cs, -1, 1, thickness=cv2.FILLED)
        filled = cv2.dilate(filled, np.ones((7, 7), np.uint8))
        cs, _ = cv2.findContours(filled, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = max(cs, key=cv2.contourArea)
        c = cv2.approxPolyDP(c, 0.4 / mm_per_px, True)[:, 0, :].astype(float)   # 0.4 mm tolerance
        pts = (c - [fx, fy]) * [sx, sy]                                         # marker mm, y down
        x0, y0 = pts.min(0); x1, y1 = pts.max(0)
        kind = NAMES[word]
        # Upright = hem at the bottom. The hem is the long straight edge: compare how wide
        # the outline runs along the top and the bottom of its box, whatever way the
        # piece was laid on the sheet.
        local = pts - [x0, y0]
        h = y1 - y0
        span = lambda sel: (local[sel, 0].max() - local[sel, 0].min()) if sel.any() else 0
        top_span, bottom_span = span(local[:, 1] < 2), span(local[:, 1] > h - 2)
        rot = 0 if bottom_span >= top_span else 180
        if rot == 180: local = np.array([x1 - x0, y1 - y0]) - local
        pieces.append({
            "kind": kind, "label": word, "width": round(x1 - x0, 1), "height": round(y1 - y0, 1),
            "outline": [[round(x, 1), round(y, 1)] for x, y in local],
            "marker": {"x": round(x0, 1), "y": round(y0, 1), "rotation": rot},
            "area_cm2": round(cv2.contourArea(np.float32(local)) / 100, 1),
        })
    pieces.sort(key=lambda p: ["front", "back", "sleeve"].index(p["kind"]))
    # Neckline: on the front and back, the outline between the two neck points (the highest
    # point on each side of the center line). Its length sizes the neck binding.
    neck_total = 0
    for p in pieces:
        if p["kind"] not in ("front", "back"): continue
        o = np.array(p["outline"]); cx = p["width"] / 2; n = len(o)
        top = o[:, 1] < p["height"] * 0.25
        li = min((i for i in range(n) if top[i] and o[i, 0] < cx), key=lambda i: o[i, 1])
        ri = min((i for i in range(n) if top[i] and o[i, 0] > cx), key=lambda i: o[i, 1])
        walk = lambda i, j, step: [(i + step * t) % n for t in range(((j - i) * step) % n + 1)]
        a_, b_ = walk(li, ri, 1), walk(li, ri, -1)
        path = min((a_, b_), key=lambda w: max(o[w, 1]) if len(w) < n * 0.6 else 1e9)   # the neck dips; the other way is the whole piece
        # Measure on a smoothed curve so notch cuts (V marks of a few mm) don't add length.
        smooth = cv2.approxPolyDP(np.float32(o[path]).reshape(-1, 1, 2), 4.0, False)[:, 0, :]
        length = float(sum(np.hypot(*(smooth[t + 1] - smooth[t])) for t in range(len(smooth) - 1)))
        p["neck"] = {"from": int(path[0]), "to": int(path[-1]), "step": 1 if path == a_ else -1, "length_mm": round(length, 1),
                     "depth_mm": round(float(max(o[path, 1])), 1)}
        neck_total += length
    used = sum(p["area_cm2"] for p in pieces) / (marker_w * marker_h / 100) * 100
    style = re.split(r"\s+\d+,\d+\s*m\b", header.strip(), maxsplit=1)[0].strip()
    data = {"style": style, "size": size, "units": "mm", "orientation": "upright, y down",
            "source": os.path.basename(pdf),
            "marker": {"width": marker_w, "height": marker_h, "efficiency_pct": eff, "measured_use_pct": round(used, 2)},
            "neckline_mm": round(neck_total, 1), "pieces": pieces}
    json.dump(data, open(out, "w"), indent=1)
    for p in pieces: print(f"  {p['kind']:6s} {p['width']:6.1f} x {p['height']:6.1f} mm  {len(p['outline'])} pts  {p['area_cm2']} cm2")
    print(f"  fabric use measured {used:.2f}% (sheet says {eff}%) · neckline {neck_total:.0f} mm (front {pieces[0]['neck']['length_mm']:.0f}, back {pieces[1]['neck']['length_mm']:.0f}, front depth {pieces[0]['neck']['depth_mm']:.0f} mm)")

if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], a[3])
