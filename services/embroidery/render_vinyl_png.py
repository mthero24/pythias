"""
render_vinyl_png.py — Render vinyl polygon layers as a PNG with transparent background.

Each colour layer is drawn as solid filled polygons — clean, sharp edges that look
like real vinyl. A subtle top-to-bottom gloss gradient is composited on top of the
combined shape to simulate the slightly shiny surface of vinyl material.
"""

import io
import numpy as np
from PIL import Image, ImageDraw

_PX_PER_MM = 8.0   # 8 px/mm ≈ 200 DPI at 100 mm
_SCALE_UP  = 3     # supersampling factor for anti-aliased edges


def vinyl_to_png(color_poly_layers, w_mm, h_mm, px_per_mm=_PX_PER_MM):
    """
    Render Shapely polygon layers to a transparent-background PNG.

    Parameters
    ----------
    color_poly_layers : list of ((R, G, B), [Polygon])  — mm coordinates
    w_mm, h_mm        : canvas size in mm

    Returns
    -------
    bytes  PNG data
    """
    out_w = max(1, round(w_mm * px_per_mm))
    out_h = max(1, round(h_mm * px_per_mm))
    s     = _SCALE_UP

    canvas = Image.new("RGBA", (out_w * s, out_h * s), (0, 0, 0, 0))
    draw   = ImageDraw.Draw(canvas)

    for (r, g, b), polygons in color_poly_layers:
        for poly in polygons:
            pts = _poly_pts(poly.exterior.coords, s, px_per_mm)
            if len(pts) < 3:
                continue
            draw.polygon(pts, fill=(r, g, b, 255))
            # Punch holes for any interior rings
            for interior in poly.interiors:
                hole = _poly_pts(interior.coords, s, px_per_mm)
                if len(hole) >= 3:
                    draw.polygon(hole, fill=(0, 0, 0, 0))

    # ── gloss overlay ─────────────────────────────────────────────────────────
    # A white→transparent vertical gradient masked to the design's own alpha.
    # This mimics the top-lit sheen of cut vinyl.
    canvas = _apply_gloss(canvas, gloss_strength=0.28)

    # Downscale with LANCZOS for anti-aliased edges
    img = canvas.resize((out_w, out_h), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ── helpers ───────────────────────────────────────────────────────────────────

def _poly_pts(coords, scale, px_per_mm):
    """Convert mm coordinates to scaled PIL integer tuples."""
    return [(int(x * px_per_mm * scale), int(y * px_per_mm * scale))
            for x, y in coords]


def _apply_gloss(img, gloss_strength=0.28):
    """
    Composite a vertical white→transparent gradient onto the image,
    masked so it only affects pixels that already have content.
    """
    w, h = img.size
    arr = np.array(img, dtype=np.float32)   # H × W × 4

    # Vertical gradient: 1.0 at top → 0.0 at ~60% height
    gradient = np.linspace(1.0, 0.0, h, dtype=np.float32)
    gradient = np.clip(gradient / 0.6, 0.0, 1.0)   # reaches 0 at 60%
    gradient = gradient[:, np.newaxis, np.newaxis]   # shape (H, 1, 1)

    alpha_mask = arr[:, :, 3:4] / 255.0              # content mask

    gloss_alpha = gradient * alpha_mask * gloss_strength * 255.0
    white_blend = 255.0 - arr[:, :, :3]              # distance from white

    arr[:, :, :3] = np.clip(arr[:, :, :3] + white_blend * (gloss_alpha / 255.0), 0, 255)

    return Image.fromarray(arr.astype(np.uint8), "RGBA")
