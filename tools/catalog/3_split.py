"""Break the catalog down to one product per entry, with its own cropped image.

   Run from the folder that holds the 8 PDFs (see README.md), after 1_extract/2_clean:
       python3 3_split.py <repo>/catalogo
   - MK: each spread shows 2–6 products; every style code gets its own entry and the crop of
     its block (code, text, swatches and photo). Codes that share one photo share its crop.
   - YBK: each spread is two products (left and right page): one entry per half.
   - OPT 38–41: uniforms (shirt + trousers, each with its own style) become two entries.
   Every entry also gets the colors printed for it (when the PDF has them as text). """
import json, os, re, subprocess, sys
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "catalogo"
DPI = 200
FILES = {"MK": "CATALOGO_CHILIAN_MK_-_BASIC", "YBK": "CATALOGO_CHILIAN_-_YBK_-_BASIC", "OPT": "CATALOGO_CHILIAN_-_OPT", "PLT": "CATALOGO_PTX_-1",
         "BON": "CATALOGO_CHILIAN-BON_-_PREMIUM", "MYK": "CATALOGO_CHILIAN_MYK_-_PREMIUM", "KG": "CATALOGO_CHILIAN_KG_-_BASIC", "AK": "CATALOGO_CHILIAN_ak_-_GOLD"}
# MK codes printed next to one shared photo: they share the crop instead of cutting the person
YBK_WHOLE = {38}   # one photo of both products across the spread
MK_SHARED = [{"3171", "6641", "6631"}, {"5901", "1643"}, {"8002", "3172"}]
# MK names, read from the pages (their text is letter-spaced and mixed with the side disclaimer)
MK_TITLES = {
    "5501": "Playera cuello redondo unisex 100% algodón peinado", "3171": "Playera cuello redondo unisex 50% poliéster 50% algodón",
    "6641": "Playera cuello redondo unisex 99% algodón 1% poliéster", "6631": "Playera cuello redondo unisex 80% algodón 20% poliéster",
    "6901": "Playera cuello V unisex 100% algodón peinado", "5901": "Playera manga larga unisex 100% algodón peinado",
    "1643": "Playera manga larga unisex 50% poliéster 50% algodón", "5503": "Playera cuello redondo junior 100% algodón peinado",
    "5504": "Playera cuello redondo niño 100% algodón peinado", "8002": "Playera cuello redondo dama 100% algodón peinado",
    "3172": "Playera cuello redondo dama 50% poliéster 50% algodón", "8502": "Playera cuello V dama 100% algodón peinado",
    "7381": "Camisa beisbolera unisex 100% poliéster", "1037": "Playera beisbolera manga 3/4 unisex 100% algodón peinado",
    "1639": "Playera cuello redondo unisex 100% algodón pima orgánico", "1638": "Playera cuello redondo unisex de viscosa",
    "1121": "Playera sublimable cuello V unisex", "1101": "Playera sublimable cuello redondo unisex", "1132": "Playera sublimable cuello redondo dama",
    "1122": "Playera sublimable cuello V dama", "2801": "Tank top sublimable unisex", "1152": "Tank top olímpica sublimable dama",
    "1103": "Playera sublimable cuello redondo junior", "1104": "Playera sublimable cuello redondo niño", "1105": "Playera sublimable cuello redondo bebé",
    "2795": "Pañalero sublimable", "1039": "Playera ecosustentable cuello redondo unisex", "9401": "Playera peso completo cuello redondo unisex",
    "7391": "Polo premium Dry Tech unisex 100% poliéster", "7393": "Polo premium Dry Tech dama 100% poliéster",
    "6061": "Polo vivos Dry Tech unisex 100% poliéster", "6062": "Polo vivos Dry Tech dama 100% poliéster",
    "1451": "Polo unisex 50% poliéster 50% algodón", "1452": "Polo dama 50% poliéster 50% algodón", "1454": "Polo niño 50% poliéster 50% algodón",
    "1453": "Polo junior 50% poliéster 50% algodón", "3201": "Polo manga larga unisex 50% poliéster 50% algodón",
    "1332": "Tank top olímpica dama 100% algodón peinado", "1271": "Tank top unisex 100% algodón peinado",
    "5601": "Playera deportiva Dry Tech cuello redondo unisex", "5603": "Playera deportiva Dry Tech cuello redondo junior",
    "8102": "Playera deportiva Dry Tech cuello redondo dama", "5604": "Playera deportiva Dry Tech cuello redondo niño",
    "7001": "Playera deportiva Dry Tech cuello V unisex", "5331": "Playera deportiva Dry Tech manga larga unisex",
    "8602": "Playera deportiva Dry Tech cuello V dama", "6322": "Playera deportiva Dry Tech manga larga dama",
    "4881": "Camisa ejecutiva manga corta unisex", "4391": "Camisa ejecutiva manga larga unisex", "4402": "Blusa ejecutiva manga corta dama",
    "4412": "Blusa ejecutiva manga larga dama", "1171": "Sudadera con capucha cerrada unisex", "1161": "Sudadera con capucha y cierre unisex",
    "1391": "Playera thermal manga larga unisex"}
COLORS = ["Blanco", "Negro", "Marino", "Rojo", "Rey", "Royal", "Gris", "Jaspe", "Carbón", "Carbon", "Vino", "Verde", "Amarillo", "Naranja", "Morado", "Fucsia", "Rosa", "Turquesa",
          "Arena", "Marrón", "Canario", "Kaki", "Khaki", "Beige", "Oxford", "Militar", "Botella", "Aqua", "Coral", "Lila", "Mango", "Limón", "Plumbago", "Plúmbago", "Cielo", "Azul",
          "Francia", "Hueso", "Ivory", "Mostaza", "Menta", "Grafito", "Neón", "Neon", "Celeste", "Bandera", "Banana", "Tangerine", "Cranberry", "Carolina", "Pink", "Granate",
          "Chocolate", "Café", "Vainilla", "Crema", "Uva", "Lavanda", "Durazno", "Salmón", "Ocre", "Petróleo", "Jade", "Esmeralda", "Kelly", "Charcoal", "Heather", "Natural",
          "Perla", "Plata", "Oro", "Bronce", "Tinto", "Magenta", "Púrpura", "Violeta", "Aguamarina", "Pistache", "Olivo", "Musgo", "Ladrillo", "Terracota", "Gold", "Ceniza", "Oscuro", "Claro"]
CSET = {c.lower() for c in COLORS}
KINDS = [("uniforme", r"uniforme"), ("polo", r"\bpolo\b"), ("pantalon", r"pantal[óo]n|jogger"), ("sudadera", r"sudadera|hoodie|felpa|fleece|crewneck"),
         ("camisa", r"\bcamisa\b|blusa"), ("gorra", r"\bgorra"), ("tank", r"tank|camiseta|esqueleto"), ("playera", r".")]
WHO = [("nino", r"niñ[oa]|infantil|juvenil|junior|kids|bebé|bebe|panalero|pañalero|años"), ("dama", r"\bdama\b|mujer"), ("caballero", r"caballero|hombre"), ("unisex", r"unisex")]


def words(f, p):
    out = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), "-bbox", "-q", f + ".pdf", "-"], capture_output=True, text=True).stdout
    m = re.search(r'<page width="([\d.]+)" height="([\d.]+)"', out)
    ws = [(float(a), float(b), float(c), float(d), t.replace("&amp;", "&")) for a, b, c, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', out)]
    return float(m.group(1)), float(m.group(2)), ws


def lines(ws):
    out, cur = [], None
    for w in sorted(ws, key=lambda w: (w[1], w[0])):
        if cur and abs(w[1] - cur[0]) < 3.5: cur[1].append(w)
        else: cur = [w[1], [w]]; out.append(cur)
    return [(y, " ".join(x[4] for x in sorted(ws_, key=lambda w: w[0]))) for y, ws_ in out]


BASE2 = {"azul", "gris", "verde", "amarillo", "rosa", "jaspe", "naranja", "rojo", "morado", "café", "vino", "palo", "blanco", "negro"}
MOD2 = {"rey", "francia", "jaspe", "neón", "neon", "bandera", "oxford", "marino", "claro", "oscuro", "pastel", "militar", "botella", "cielo", "royal", "carbón", "cranberry", "pizarra", "mezclilla", "indigo", "acero", "hueso", "perla"}
def colors_of(ws):
    """Color names in reading order; two words join only when they make one color (Azul Rey, Gris Jaspe…)."""
    found = []
    for _, t in lines(ws):
        toks = re.findall(r"[A-Za-zÁÉÍÓÚáéíóúñÑ]+", t)
        i = 0
        while i < len(toks):
            w = toks[i]
            if w.lower() in CSET:
                name = w
                if i + 1 < len(toks) and w.lower() in BASE2 and toks[i + 1].lower() in MOD2: name = w + " " + toks[i + 1]; i += 1
                name = " ".join(x[:1].upper() + x[1:].lower() for x in name.split())
                if name.lower() not in ("claro", "oscuro", "azul", "neón", "neon", "francia", "rey", "bandera") and name not in found: found.append(name)
            i += 1
    return found[:30]


page_cache = {}
def page_img(f, p):
    key = (f, p)
    if key not in page_cache:
        base = f"hi/{f}-{p}"
        if not os.path.exists(base + ".png"):
            os.makedirs("hi", exist_ok=True)
            subprocess.run(["pdftoppm", "-f", str(p), "-l", str(p), "-r", str(DPI), "-singlefile", "-png", f + ".pdf", base], check=True)
        page_cache[key] = Image.open(base + ".png").convert("RGB")
    return page_cache[key]


def save(img, eid):
    big = img.copy(); big.thumbnail((1100, 1100), Image.LANCZOS)
    big.save(f"{OUT}/{eid}.webp", quality=82, method=6)
    sm = img.copy(); sm.thumbnail((420, 420), Image.LANCZOS)
    sm.save(f"{OUT}/{eid}-s.webp", quality=78, method=6)
    return big.size


def tidy(t):
    t = re.sub(r"\s+", " ", t).strip(" ·-|,")
    return t[:1].upper() + t[1:].lower() if t else t


def expand(t):
    t = re.sub(r"\bCR\b", "cuello redondo", t); t = re.sub(r"\bCV\b", "cuello V", t)
    return t


def meta(text):
    w = re.search(r"(\d{3})\s*(?:g|gr)\.?\s*/?\s*m", text, re.I)
    comp = re.search(r"(\d{2,3}\s?%\s*(?:algod[óo]n|poli[ée]ster|polyester|viscosa|rayon|spandex)(?:[^\n·|]{0,30}?\d{1,3}\s?%\s*(?:algod[óo]n|poli[ée]ster|viscosa|spandex))?)", text, re.I)
    sz = re.search(r"Tallas?\s*:?\s*([A-Z0-9][A-Z0-9 ,\-yY()añosEG./]{1,40})", text)
    return (int(w.group(1)) if w else None, re.sub(r"\s+", " ", comp.group(1)).strip() if comp else "", re.sub(r"\s+", " ", sz.group(1)).strip(" ,.") if sz else "")


def classify(title, text):
    low = (title + " " + text).lower()
    kind = next(k for k, r in KINDS if re.search(r, title.lower()))
    who = [k for k, r in WHO if re.search(r, low)]
    return kind, who


cat = json.load(open(f"{OUT}/catalogo.json"))
old = {e["id"]: e for e in cat}
out, removed = [], []

for e in cat:
    c, p = e["cat"], e["page"]
    f = FILES[c]
    if c == "MK":
        W, H, ws = words(f, p)
        codes = [w for w in ws if re.fullmatch(r"\d{4}", w[4]) and w[1] < H - 30]
        img = page_img(f, p); k = img.width / W
        regions = {}
        for cw in codes:
            x0, y0, half = cw[0], cw[1], (0 if cw[0] < W / 2 else 1)
            hx0, hx1 = (0, W / 2) if half == 0 else (W / 2, W)
            same = [o for o in codes if o is not cw and (o[0] < W / 2) == (half == 0)]
            right = [o[0] for o in same if o[0] > x0 + 20 and abs(o[1] - y0) < 60]
            below = [o[1] for o in same if o[1] > y0 + 20 and o[0] < (min(right) if right else hx1) and o[0] + 60 > x0]
            regions[cw[4]] = [max(hx0, x0 - 12), max(0, y0 - 14), min(right) - 6 if right else hx1, min(below) - 8 if below else H]
        for g in MK_SHARED:
            ids = [i for i in regions if i in g]
            if len(ids) > 1:
                box = [min(regions[i][0] for i in ids), min(regions[i][1] for i in ids), max(regions[i][2] for i in ids), max(regions[i][3] for i in ids)]
                for i in ids: regions[i] = box
        textboxes = {}
        for cw in codes:   # the text that belongs to each code: its own band, not the shared box
            x0, y0 = cw[0], cw[1]; half = 0 if x0 < W / 2 else 1
            same = [o for o in codes if o is not cw and (o[0] < W / 2) == (half == 0)]
            right = [o[0] for o in same if o[0] > x0 + 20 and abs(o[1] - y0) < 60]
            below = [o[1] for o in same if o[1] > y0 + 5 and abs(o[0] - x0) < 60]
            textboxes[cw[4]] = (x0 - 4, y0 - 2, (min(right) - 4) if right else (W / 2 if half == 0 else W), (min(below) - 2) if below else H)
        for cw in sorted(codes, key=lambda w: (w[0] >= W / 2, w[1], w[0])):
            code = cw[4]; tx0, ty0, tx1, ty1 = textboxes[code]
            mine = [w for w in ws if tx0 <= w[0] < tx1 and ty0 <= w[1] < ty1]
            ls = [t for _, t in lines(mine)]
            # the name is printed big right under the code; the vertical disclaimer and body text are small
            ch = cw[3] - cw[1]
            big = [w for w in mine if w is not cw and w[1] >= cw[1] and w[1] < cw[1] + 75 and (w[3] - w[1]) >= 0.62 * ch and (w[2] - w[0]) >= 0.45 * (w[3] - w[1])]
            head = []
            for t in [t for _, t in lines(big)][:3]:
                if re.match(r"^(Jersey|Piqu|Chif|Felpa|Gabardina|Rib|\d{2,3}\s*g|Uso|Tallas|Peso)", t, re.I): break
                head.append(t)
            name = " · ".join(expand(x) for x in head[:3]).replace("- ·", "·")
            if not re.search(r"polo|tank|sudadera|camisa|blusa|beisbolera|thermal|playera|panalero|pañalero|cuello", name, re.I): name = "Playera " + name
            elif re.match(r"^(cuello|100|50|9|8|6)", name, re.I): name = "Playera " + name
            title = MK_TITLES.get(code) or tidy(name.replace("TIPO POLO", "Polo").replace("Tipo polo", "Polo"))[:80]
            text = " ".join(ls)
            weight, comp, sizes = meta(text)
            kind, who = classify(title, text)
            x0, y0, x1, y1 = regions[code]
            crop = img.crop((int(x0 * k), int(y0 * k), int(x1 * k), int(y1 * k)))
            eid = f"MK-{p}-{code}"
            w_, h_ = save(crop, eid)
            out.append({"id": eid, "cat": "MK", "line": e["line"], "page": p, "pages": 1, "title": title, "models": [code], "weight": weight, "comp": comp,
                        "sizes": sizes, "kind": kind, "who": who, "tier": "", "colors": colors_of(mine), "w": w_, "h": h_})
        removed.append(e["id"])
    elif c == "YBK":
        W, H, ws = words(f, p)
        img = page_img(f, p); k = img.width / W
        halves = [(0, W / 2), (W / 2, W)]
        has = [any(re.fullmatch(r"[A-Z]\d{4}", w[4]) for w in ws if a <= w[0] < b) for a, b in halves]
        # one product on the spread, or one photo for both: the whole spread is its image
        whole = sum(has) == 1 or p in YBK_WHOLE
        for half, (hx0, hx1) in enumerate(halves):
            mine = [w for w in ws if hx0 <= w[0] < hx1]
            code = next((w[4] for w in sorted(mine, key=lambda w: w[1]) if re.fullmatch(r"[A-Z]\d{4}", w[4])), None)
            if not code: continue
            ls = [t for _, t in lines(mine)]
            i = next(n for n, t in enumerate(ls) if code in t)
            raw = re.sub(r"\s+para$", "", ls[i + 1] if i + 1 < len(ls) else "").strip()
            m = re.match(r"^(Caballero|Dama|Niño|Niña|Unisex|Juvenil|Infantil)\s+(.*)$", raw)
            title = tidy(f"{m.group(2)} {m.group(1)}" if m else raw) or e["title"]
            text = " ".join(ls)
            weight, comp, sizes = meta(text)
            szm = re.search(r"\b(CH|XCH|[0-9]{1,2})\s*-\s*(EEEG|EEG|EG|G|[0-9]{1,2})\b", text)
            if not sizes and szm: sizes = szm.group(0).replace(" ", "")
            kind, who = classify(title, text)
            cols = [re.sub(r"\s+", " ", x).strip() for x in re.findall(r"\d{3}\s*\|\s*([A-ZÁÉÍÓÚa-záéíóúñ ]{3,24}?)(?=\s+\d{3}\s*\||\s*$|\s+Nuevo|\s+NUEVO)", " ".join(t for t in ls if "|" in t))]
            crop = img if whole else img.crop((int(hx0 * k), 0, int(hx1 * k), img.height))
            eid = f"YBK-{p}-{code}"
            w_, h_ = save(crop, eid)
            out.append({"id": eid, "cat": "YBK", "line": e["line"], "page": p, "pages": 1, "title": title[:80], "models": [code], "weight": weight, "comp": comp,
                        "sizes": sizes, "kind": kind, "who": who, "tier": "", "colors": [x for x in dict.fromkeys(cols) if x][:30] or colors_of(mine), "w": w_, "h": h_})
        removed.append(e["id"])
    elif c == "OPT" and 38 <= p <= 41 and len(e["models"]) == 2:
        shirt, pants = e["models"]
        m = re.match(r"Uniforme: (.+?) y (pantalón.+)$", e["title"])
        who = e.get("who") or []
        gender = " dama" if "dama" in e["title"] else " caballero" if "caballero" in e["title"] else ""
        t1, t2 = (tidy(m.group(1) + gender), tidy(m.group(2))) if m else (e["title"] + " (camisa)", e["title"] + " (pantalón)")
        for code, title, kind in [(shirt, t1, "camisa"), (pants, t2, "pantalon")]:
            eid = f"OPT-{p}-{code}"
            Image.open(f"{OUT}/{e['id']}.webp").save(f"{OUT}/{eid}.webp", quality=82, method=6)
            Image.open(f"{OUT}/{e['id']}-s.webp").save(f"{OUT}/{eid}-s.webp", quality=78, method=6)
            out.append({**e, "id": eid, "title": title, "models": [code], "kind": kind, "colors": e.get("colors", [])})
        removed.append(e["id"])
    else:
        if "colors" not in e:
            try:
                W, H, ws = words(f, p); e["colors"] = colors_of(ws)
            except Exception: e["colors"] = []
        out.append(e)

for rid in removed:
    for suf in ("", "-s", "-b"):
        pth = f"{OUT}/{rid}{suf}.webp"
        if os.path.exists(pth) and not any(o["id"] == rid for o in out): os.remove(pth)
json.dump(out, open(f"{OUT}/catalogo.json", "w"), ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print(len(cat), "->", len(out), Counter(o["cat"] for o in out))
