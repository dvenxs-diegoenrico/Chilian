#!/usr/bin/env python3
"""
Responsive WebP copies of every photo, for the site.

    python3 tools/optimize_photos.py

photos/<name>.jpg -> photos/opt/<name>-480.webp, -960.webp, -1600.webp
(never upscaled: a photo narrower than a width keeps its own size).
The originals stay in photos/ as the masters; index.html loads the WebP
copies through srcset, so phones download the 480 or 960 version.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC, DST = ROOT / "photos", ROOT / "photos" / "opt"
WIDTHS = (480, 960, 1600)

DST.mkdir(exist_ok=True)
before = after = 0
for f in sorted(SRC.iterdir()):
    if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
        continue
    im = Image.open(f)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    before += f.stat().st_size
    for w in WIDTHS:
        out = DST / f"{f.stem}-{w}.webp"
        k = min(1, w / im.width)
        im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).save(out, "WEBP", quality=66 if w < 1600 else 70, method=6)
        if w == 960:
            after += out.stat().st_size
print(f"{before // 1024} KB of originals -> {after // 1024} KB at 960 px")
