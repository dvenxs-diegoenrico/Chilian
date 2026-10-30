import json, re, subprocess
cat = json.load(open("catalog.json"))
FILES = {"PLT": "CATALOGO_PTX_-1", "MK": "CATALOGO_CHILIAN_MK_-_BASIC", "OPT": "CATALOGO_CHILIAN_-_OPT", "BON": "CATALOGO_CHILIAN-BON_-_PREMIUM",
         "KG": "CATALOGO_CHILIAN_KG_-_BASIC", "YBK": "CATALOGO_CHILIAN_-_YBK_-_BASIC", "MYK": "CATALOGO_CHILIAN_MYK_-_PREMIUM", "AK": "CATALOGO_CHILIAN_ak_-_GOLD"}
txt = lambda f, p: subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), "-q", f"{f}.pdf", "-"], capture_output=True, text=True).stdout
OPT_INDEX = {}
for l in txt(FILES["OPT"], 2).splitlines():
    m = re.match(r"(.+?) - ([0-9A-Z]{4,6})$", l.strip())
    if m: OPT_INDEX[m.group(2)] = m.group(1).capitalize()
OPT_MANUAL = {28: ("Polo piqué manga larga caballero", ["33981"]), 30: ("Sudadera cuello redondo", ["38102"]), 31: ("Sudadera con capucha y canguera", ["38103"]),
              32: ("Sudadera con capucha y cierre", ["38105"]), 33: ("Sudadera con capucha y canguera dama", ["38108"]), 34: ("Pantalón tipo jogger caballero", ["38106"]),
              35: ("Pantalón tipo jogger juvenil", ["38132"]), 36: ("Sudadera con capucha y canguera juvenil", ["38129"]),
              38: ("Uniforme: camisa manga larga y pantalón de gabardina caballero", ["35003", "51774"]), 39: ("Uniforme: camisa manga larga y pantalón de mezclilla dama", ["35001", "55152"]),
              40: ("Uniforme: camisa manga corta y pantalón de mezclilla caballero", ["35002", "55151"]), 41: ("Uniforme: camisa manga corta y pantalón de gabardina dama", ["35000", "51783"]),
              51: ("Gorras", [])}
KINDS = [("uniforme", r"uniforme"), ("polo", r"\bpolo\b"), ("pantalon", r"pantal[óo]n|jogger"), ("sudadera", r"sudadera|hoodie|felpa|fleece|crewneck"),
         ("camisa", r"\bcamisa\b|blusa"), ("gorra", r"\bgorra"), ("tank", r"tank|camiseta|esqueleto"), ("playera", r".")]
for e in cat:
    t = txt(FILES[e["cat"]], e["page"])
    if e["cat"] == "OPT":
        codes = [c for c in re.findall(r"(?m)^\s*(\d{5}|370[A-Z]{2})\s*$", t)]
        if e["page"] in OPT_MANUAL: e["title"], e["models"] = OPT_MANUAL[e["page"]]
        else:
            e["models"] = list(dict.fromkeys(codes))[:3]
            e["title"] = next((OPT_INDEX[c] for c in e["models"] if c in OPT_INDEX), e["title"])
    if e["cat"] == "MYK":
        m = re.search(r"(?m)^(Playera[^\n]*|Polo[^\n]*|Sudadera[^\n]*|Camisa[^\n]*)$", t)
        names = [l.strip() for l in t.splitlines() if re.match(r"^(Playera|Sudadera|Camisa|Chamarra)\b(?!s\b)", l.strip())]
        e["title"] = names[0] if names else e["title"]
        e["models"] = list(dict.fromkeys(re.findall(r"(?m)^\s*(\d{3})\s*$", t)))[:3]
        e["models"] = [m for m in e["models"] if not 0 < int(m) < 100]
    if e["cat"] == "MK" and not e["title"]:
        e["title"] = "Playeras y polos" if "polo" in t.lower() else "Playeras"
    if e["cat"] == "AK":
        e["title"] = re.sub(r"\s*//\s*", " y ", e["title"]).replace("poliester", "poliéster")
    if e["cat"] == "YBK":
        e["title"] = re.sub(r"\s*·.*$", "", e["title"])
    e["title"] = re.sub(r"\s{2,}", " ", e["title"]).strip()[:70] or "Prenda"
    e["title"] = e["title"][0].upper() + e["title"][1:]
    low = (e["title"] + " " + t).lower()
    e["kind"] = next(k for k, r in KINDS if re.search(r, e["title"].lower()))
    if e["kind"] == "playera" and re.search(r"\bpolo\b", low) and "polo" not in e["title"].lower() and e["cat"] in ("MYK", "MK"): e["kind"] = "polo" if e["cat"] == "MYK" else e["kind"]
    e.pop("text", None)
json.dump(cat, open("catalog2.json", "w"), ensure_ascii=False, indent=0)
from collections import Counter
print(Counter(e["kind"] for e in cat))
for e in cat: print(e["id"].ljust(7), e["title"][:58].ljust(58), ",".join(e["models"])[:24].ljust(24), e["weight"], e["kind"], ",".join(e["who"]))
