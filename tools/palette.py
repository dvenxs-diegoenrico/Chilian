"""Chilian palette (Nov 2026): ocre accent, black ground, light cream text; blue becomes black.
Re-runnable: python3 tools/palette.py
- Every page gets one closing token block that wins over the old light/dark blocks.
- Hard-coded pinks become ocre; text that sat on the old dark ink becomes black.
- The quote sheet follows the palette; plant print-outs (traveler, packing list) stay black on paper.
- Logo icons are recolored: blue circle -> black, white C -> cream.
"""
import re, pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
BLACK, CARD, CREAM, MUTED, OCRE = "#0B0B0B", "#171512", "#F3EBDD", "#B9AF9E", "#C9922E"
TOKENS = {  # every token name any page uses
    "paper": BLACK, "card": CARD, "ink": CREAM, "steel": MUTED, "rule": "rgba(243,235,221,.16)", "shade": "rgba(243,235,221,.06)",
    "magenta": OCRE, "on-accent": BLACK, "accent": OCRE, "cyan": BLACK, "press": "#A6E22E",
    "ok": "#9BD84A", "warn": "#E8B04B", "bad": "#FF6B60", "info": "#E9DFCC",
}
MARK = "/* Paleta Chilian (tools/palette.py): ocre, negro y crema */"


def block(names):
    vals = "; ".join(f"--{n}: {TOKENS[n]}" for n in names if n in TOKENS)
    return f"  {MARK}\n  :root:root:root {{ {vals}; color-scheme: dark; }}\n"


PINKS = re.compile(r"#(CF1069|C20E62|FF4D9D|FF3F96|FF5AA3)\b", re.I)


def css_page(path, extra=()):
    p = ROOT / path
    s = p.read_text()
    s = re.sub(r"  /\* Paleta Chilian \(tools/palette.py\)[^\n]*\n  :root:root:root \{[^\n]*\}\n", "", s)
    names = sorted(set(re.findall(r"--([a-z-]+):", s)) & set(TOKENS))
    i = s.index("</style>")
    s = s[:i] + block(names) + s[i:]
    s = PINKS.sub(OCRE, s)
    s = s.replace("color: #0070BB; }", f"color: {OCRE}; }}")               # logo tagline bullets
    s = s.replace('<meta name="theme-color" content="#151316">', f'<meta name="theme-color" content="{BLACK}">')
    for a, b in extra:
        s = s.replace(a, b)
    p.write_text(s)


def recolor_icon(src, dst, bg=None):
    """Blue circle -> black, white C -> cream. With bg, white padding around the circle (reached from
    the corners) becomes that background. Run once on the blue originals."""
    im = Image.open(src).convert("RGBA"); px = im.load(); W, H = im.size
    cb, cc = (11, 11, 11), (243, 235, 221)
    pad = set()
    if bg is not None:
        stack = [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]
        while stack:
            x, y = stack.pop()
            if (x, y) in pad or not (0 <= x < W and 0 <= y < H): continue
            r, g, b, a = px[x, y]
            if a > 0 and min(r, g, b) < 200: continue
            pad.add((x, y)); stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if (x, y) in pad: px[x, y] = (*bg, 255); continue
            if a == 0: continue
            w = max(0.0, min(1.0, r / 255))           # 0 on the blue circle, 1 on the white C
            px[x, y] = tuple(round(cb[k] * (1 - w) + cc[k] * w) for k in range(3)) + (a,)
    im.save(dst, optimize=True)


def blue_to_black(path):
    """Stacked logos used outside the site (search results): only the blue becomes black."""
    im = Image.open(path).convert("RGBA"); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and b > r + 40:
                w = r / 255
                px[x, y] = tuple(round(11 * (1 - w) + 255 * w) for _ in range(3)) + (a,)
    im.save(path, optimize=True)


def main():
    css_page("index.html", [
        ("background: var(--ink); color: #fff;\n  }\n  .tech img", "background: var(--ink); color: var(--paper);\n  }\n  .tech img"),
    ])
    css_page("ops/index.html", [("background: var(--magenta); color: #fff;", "background: var(--magenta); color: var(--on-accent);")])
    for f in ["404.html", "aprobar.html", "pedido.html", "ops/conectar.html"]:
        css_page(f)
    # quote sheet: black paper, cream text, ocre-free (it has no accent)
    p = ROOT / "ops/index.html"; s = p.read_text(); out = []
    for line in s.split("\n"):
        if line.lstrip().startswith(".qsheet"):
            line = line.replace(".qsheet { background: #fff; color: #18181B;", f".qsheet {{ background: {BLACK}; color: {CREAM};")
            line = line.replace("border-bottom: 1.5px solid #101012", f"border-bottom: 1.5px solid {CREAM}")
            for a, b in [("#101012", "#1E1A15"), ("#fff", CREAM), ("#18181B", CREAM), ("#3F3F46", "#D9CFBF"), ("#52525B", "#D9CFBF"),
                         ("#71717A", MUTED), ("#86868C", MUTED), ("#9A9AA0", MUTED), ("#A1A1AA", MUTED), ("#B9B9BD", MUTED), ("#CFCFD4", "#D9CFBF"),
                         ("#ECECEF", "#2E2A24"), ("#E4E4E7", "#2E2A24"), ("#F0F0F1", "#2E2A24"), ("#2A2A2E", "#3A342C")]:
                line = line.replace(a, b)
        out.append(line)
    p.write_text("\n".join(out))
    # landing pages generator + the manifest + scripts
    lp = ROOT / "tools/seo/build_landings.py"; t = lp.read_text()
    t = re.sub(r':root\{--paper:#F4F3F5;[^}]*\}', ':root{--paper:%s;--card:%s;--ink:%s;--steel:%s;--rule:rgba(243,235,221,.16);--shade:rgba(243,235,221,.06);--magenta:%s;--on-accent:%s;color-scheme:dark}' % (BLACK, CARD, CREAM, MUTED, OCRE, BLACK), t)
    t = re.sub(r'@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{[^}]*\}\}\n', "", t)
    t = re.sub(r':root\[data-theme="dark"\]\{[^}]*\}\n', "", t)
    t = t.replace('content="#151316"', f'content="{BLACK}"')
    lp.write_text(t)
    for f in ["ops/manifest.webmanifest"]:
        q = ROOT / f; q.write_text(q.read_text().replace("#151316", BLACK))
    for f in ["ops/app.js", "studio3d.js", "index.html"]:
        q = ROOT / f; q.write_text(PINKS.sub(OCRE, q.read_text()))
    # logos (only once: the originals are blue)
    L = ROOT / "logos"
    if (ROOT / "logos/.palette-done").exists():
        print("palette applied (logos already recolored)"); return
    (ROOT / "logos/.palette-done").write_text("logos recolored to the Nov 2026 palette\n")
    recolor_icon(L / "chilian-icono.png", L / "chilian-icono.png")
    recolor_icon(ROOT / "favicon.png", ROOT / "favicon.png")
    recolor_icon(ROOT / "apple-touch-icon.png", ROOT / "apple-touch-icon.png", bg=(11, 11, 11))
    for n in (192, 512):
        recolor_icon(ROOT / f"ops/icon-{n}.png", ROOT / f"ops/icon-{n}.png", bg=(11, 11, 11))
    blue_to_black(L / "chilian-logo.png"); blue_to_black(L / "chilian-logo-blanco.png")
    print("palette applied")


if __name__ == "__main__":
    main()
