import json, re, subprocess
R = lambda a, b: list(range(a, b + 1))
CATS = [
    # file, code, line, pages kept, model-code regex
    ("CATALOGO_PTX_-1", "PLT", "basica", [p for p in R(3, 31) if p not in (16, 20)], r"C[óo]digo\.\s*([A-Z]{1,2})\b"),
    ("CATALOGO_CHILIAN_MK_-_BASIC", "MK", "basica", R(2, 14), r"(?m)^\s*(\d{4})\s*$"),
    ("CATALOGO_CHILIAN_-_OPT", "OPT", "clasica", [p for p in R(4, 41) if p not in (29, 37)] + [51], r"(?m)ESTILO\s+(\w{4,6})|^\s*(3\d{4}[A-Z]{0,2})\s*$"),
    ("CATALOGO_CHILIAN-BON_-_PREMIUM", "BON", "clasica", R(4, 17), r"\b(\d{4}[A-Z]{1,2})\s*\|"),
    ("CATALOGO_CHILIAN_KG_-_BASIC", "KG", "clasica", [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27], None),
    ("CATALOGO_CHILIAN_-_YBK_-_BASIC", "YBK", "clasica", [p for p in R(6, 42) if p not in (9, 16, 21, 23, 28, 33, 37)], r"\b([A-Z]\d{4})\b"),
    ("CATALOGO_CHILIAN_MYK_-_PREMIUM", "MYK", "premium", R(4, 22), r"(?m)^\s*(\d{3})\s*$"),
    ("CATALOGO_CHILIAN_ak_-_GOLD", "AK", "premium", [p for p in R(6, 33) if p not in (8, 9, 19, 20, 28, 29)], None),
]
# KG is image-only: read from the pages (style code printed on each product page).
KG = {3: ("PCRMCCA100", "Playera cuello redondo manga corta caballero", "Gold"), 5: ("PCRMCDA100", "Playera cuello redondo dama", "Gold"),
      7: ("PCRMCNO100", "Playera cuello redondo niño", "Gold"), 9: ("PCVMCCA100", "Playera cuello V caballero", "Gold"),
      11: ("PCRMLCA100", "Playera manga larga caballero", "Gold"), 13: ("PPIMCCA100", "Playera polo piqué caballero", "Gold"),
      15: ("PSHMCCA100", "Playera polo chifón caballero", "Gold"), 17: ("PTTKXCA100", "Playera tank top caballero", "Gold"),
      19: ("PPIMCCA050", "Playera polo piqué caballero", "Platinum"), 21: ("PCRMCCA050", "Playera cuello redondo caballero", "Platinum"),
      23: ("PCRMCDA050", "Playera cuello redondo dama", "Platinum"), 25: ("SCRCCCA050", "Sudadera con capucha unisex", "Platinum"),
      27: ("SCRSCCA050", "Sudadera sin capucha unisex", "Platinum")}

KINDS = [("polo", r"\bpolo\b"), ("sudadera", r"sudadera|hoodie|felpa|fleece|crewneck"), ("camisa", r"\bcamisa\b|blusa|\bshirt\b(?!.*polo)"),
         ("pantalon", r"pantal[óo]n|jogger"), ("gorra", r"\bgorra"), ("tank", r"tank|camiseta|esqueleto"), ("playera", r"playera|t-shirt|\btee\b")]
WHO = [("nino", r"niñ[oa]|infantil|juvenil|kids|youth|junior|años"), ("dama", r"\bdama\b|mujer|lady|women"), ("caballero", r"caballero|hombre|\bmen\b|\bman\b"), ("unisex", r"unisex")]

def text(file, p):
    return subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), "-q", f"{file}.pdf", "-"], capture_output=True, text=True).stdout

out = []
for file, code, line, pages, rx in CATS:
    for p in pages:
        t = text(file, p); low = t.lower()
        e = {"id": f"{code}-{p}", "cat": code, "line": line, "page": p, "img": f"{file}-{p:02d}" if len(str(p)) < 2 or True else ""}
        if code == "KG":
            c, title, tier = KG[p]
            e.update(models=[c], title=title, tier=tier, pages=[p, p + 1]); low = title.lower()
        else:
            models = []
            if rx:
                for m in re.finditer(rx, t):
                    v = next(g for g in m.groups() if g) if m.groups() else m.group(0)
                    if v not in models: models.append(v)
            e["models"] = models[:6]
            # product name: the first garment phrase on the page
            m = re.search(r"((?:PLAYERA|Playera|POLO|Polo|SUDADERA|Sudadera|CAMISA|Camisa|CAMISETA|Camiseta|PANTAL[ÓO]N|Pantal[óo]n|BLUSA|Blusa|GORRA|Gorra|TANK|Tank)[^\n|•]{0,70})", t)
            e["title"] = re.sub(r"\s+", " ", m.group(1)).strip(" .·-").capitalize() if m else ""
            if code == "AK": e["tier"] = "Gold"
        w = re.search(r"(\d{3})\s*(?:g|gr)\.?\s*/?\s*(?:m2|m\s*2|m²)", t, re.I)
        e["weight"] = int(w.group(1)) if w else None
        comp = re.search(r"(\d{2,3}\s?%\s*(?:algod[óo]n|poli[ée]ster|polyester|cotton|viscosa|rayon)[^\n·]{0,40})", t, re.I)
        e["comp"] = re.sub(r"\s+", " ", comp.group(1)).strip() if comp else ""
        sz = re.search(r"Tallas?[:\s/]+(?:Sizes[:\s]*)?([A-Z0-9 ,\-yY()añosEG]{3,40})", t)
        e["sizes"] = re.sub(r"\s+", " ", sz.group(1)).strip(" ,") if sz else ""
        e["kind"] = next((k for k, r in KINDS if re.search(r, low + " " + e["title"].lower())), "playera")
        e["who"] = [k for k, r in WHO if re.search(r, low)]
        e["text"] = re.sub(r"\s+", " ", t)[:600]
        out.append(e)
json.dump(out, open("catalog.json", "w"), ensure_ascii=False, indent=0)
from collections import Counter
print(len(out), Counter(e["kind"] for e in out), Counter(e["cat"] for e in out))
for e in out[::7]: print(e["id"], "|", e["title"][:50], "|", e["models"], "|", e["weight"], "|", e["comp"][:30], "|", e["sizes"], "|", e["kind"], e["who"])
