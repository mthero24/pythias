"""
render_png.py — Render embroidery stitch layers as a PNG that looks like real thread.

Each stitch segment is drawn as a thick anti-aliased line with a subtle highlight
along the centre to simulate the cylindrical sheen of embroidery thread.
Background is fully transparent (RGBA).
"""

import io
import math
from PIL import Image, ImageDraw, ImageFilter

# Render at 8 px/mm → ~200 DPI for a 100 mm design  (scaled up 3× for AA then down)
_PX_PER_MM    = 8.0
_SCALE_UP     = 3          # supersampling factor
_THREAD_MM    = 0.38       # visible thread diameter in mm  (~40-weight thread)
_JUMP_THRESH  = 12.0       # mm — skip "jumps" longer than this


def stitches_to_png(color_stitch_layers, w_mm, h_mm, px_per_mm=_PX_PER_MM):
    """
    Render stitch coordinates to a transparent-background PNG.

    Parameters
    ----------
    color_stitch_layers : list of ((R, G, B), [(x_mm, y_mm), ...])
    w_mm, h_mm          : canvas size in mm

    Returns
    -------
    bytes  PNG data
    """
    out_w = max(1, round(w_mm * px_per_mm))
    out_h = max(1, round(h_mm * px_per_mm))
    s     = _SCALE_UP

    # High-res canvas for supersampling
    canvas = Image.new("RGBA", (out_w * s, out_h * s), (0, 0, 0, 0))
    draw   = ImageDraw.Draw(canvas)

    base_w  = max(2, round(s * px_per_mm * _THREAD_MM))        # base thread width
    hi_w    = max(1, round(base_w * 0.35))                     # highlight stripe width

    for (r, g, b), stitches in color_stitch_layers:
        if len(stitches) < 2:
            continue

        pts = stitches  # already in mm

        for i in range(len(pts) - 1):
            x0, y0 = pts[i]
            x1, y1 = pts[i + 1]

            # Skip jumps (needle travel without stitching)
            if math.hypot(x1 - x0, y1 - y0) > _JUMP_THRESH:
                continue

            px0 = x0 * px_per_mm * s
            py0 = y0 * px_per_mm * s
            px1 = x1 * px_per_mm * s
            py1 = y1 * px_per_mm * s

            # ── base thread colour ──────────────────────────────────────────
            draw.line([(px0, py0), (px1, py1)], fill=(r, g, b, 255), width=base_w)

            # ── highlight stripe — lighter tone offset slightly to one side ─
            # The perpendicular unit vector gives us the highlight offset
            dx, dy = px1 - px0, py1 - py0
            length = math.hypot(dx, dy)
            if length > 0:
                # normalised perpendicular  (rotate 90°)
                nx, ny = -dy / length, dx / length
                off = base_w * 0.18          # small offset toward the light source
                hr  = min(255, int(r + (255 - r) * 0.55))
                hg  = min(255, int(g + (255 - g) * 0.55))
                hb  = min(255, int(b + (255 - b) * 0.55))
                draw.line(
                    [(px0 + nx * off, py0 + ny * off),
                     (px1 + nx * off, py1 + ny * off)],
                    fill=(hr, hg, hb, 200),
                    width=hi_w,
                )

    # Slight blur before downscale smooths the jaggies a touch
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=0.6))

    # Downscale with high-quality LANCZOS resampling (anti-aliasing)
    img = canvas.resize((out_w, out_h), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
