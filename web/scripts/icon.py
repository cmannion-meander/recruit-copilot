#!/usr/bin/env python3
"""Regenerates the icon set in web/app/.

The mark is the citation: a rule, and the passage beside it. It is what the product
produces, so it is what the product is called by. Nothing on the do-not list appears
in it, it carries no glyph that could be mistaken for a sparkle, and it survives
greyscale — the rule is lighter than the ink field whether or not colour renders.

    python3 scripts/icon.py

Requires Pillow. The geometry lives here once and both the raster and the vector are
derived from it, so app/icon.svg cannot drift from app/favicon.ico.
"""

from pathlib import Path

from PIL import Image, ImageDraw

# brand/tokens.css. --rc-evidenced itself reaches only 1.9:1 on ink, so the mark uses
# --rc-evidenced-on-ink from app/tokens-derived.css.
INK = (0x12, 0x17, 0x1F, 255)
PAPER = (0xF6, 0xF5, 0xF2, 255)
EVIDENCED_ON_INK = (0x5F, 0xB4, 0xCE, 255)

RULE = {"x": 0.19, "y": 0.25, "w": 0.06, "h": 0.50}
LINES = ((0.47, 0.28), (0.38, 0.47), (0.28, 0.66))
LINE_X, LINE_H = 0.34, 0.0625

APP = Path(__file__).resolve().parent.parent / "app"


def mark(size: int, radius: int, scale: int = 8) -> Image.Image:
    """Drawn oversized and downsampled — the geometry is axis-aligned, but the corner
    radius is not, and LANCZOS gives it a clean edge at 16px."""
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if radius > 0:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius * scale, fill=INK)
    else:
        d.rectangle([0, 0, s - 1, s - 1], fill=INK)

    d.rectangle(
        [
            RULE["x"] * s,
            RULE["y"] * s,
            (RULE["x"] + RULE["w"]) * s,
            (RULE["y"] + RULE["h"]) * s,
        ],
        fill=EVIDENCED_ON_INK,
    )

    for width, y in LINES:
        d.rectangle(
            [LINE_X * s, y * s, (LINE_X + width) * s, y * s + LINE_H * s],
            fill=PAPER,
        )

    return img.resize((size, size), Image.LANCZOS)


def svg() -> str:
    s = 32
    lines = "\n".join(
        f'  <rect x="{LINE_X * s:g}" y="{y * s:g}" width="{w * s:g}" '
        f'height="{LINE_H * s:g}" fill="#F6F5F2" />'
        for w, y in LINES
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}" width="{s}" height="{s}" role="img" aria-label="Recruit Copilot">
  <title>Recruit Copilot</title>
  <!-- GENERATED — run scripts/icon.py rather than editing by hand.
       A rule beside a quoted passage: the citation the product produces.
       Colours are --rc-ink, --rc-evidenced-on-ink and --rc-paper. -->
  <rect width="{s}" height="{s}" rx="3" fill="#12171F" />
  <rect x="{RULE["x"] * s:g}" y="{RULE["y"] * s:g}" width="{RULE["w"] * s:g}" height="{RULE["h"] * s:g}" fill="#5FB4CE" />
{lines}
</svg>
"""


if __name__ == "__main__":
    # The tab icon carries the brand's own 3px radius, at the size it was drawn for.
    (APP / "icon.svg").write_text(svg())
    # iOS applies its own mask, so this one is full-bleed.
    mark(180, 0).save(APP / "apple-icon.png")
    # For the browsers that still ask for an .ico.
    mark(64, 6).save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"icons written to {APP}")
