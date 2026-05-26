"""
preview.py — Render stored Shapely polygon layers as an inline SVG string.

Scale: 1 mm → 3.78 px (96 dpi screen resolution)
"""

_PX_PER_MM = 3.78


def layers_to_svg(layers, w_mm, h_mm, px_per_mm=_PX_PER_MM):
    """
    Convert vectorize_image() layers to a standalone SVG string.

    layers  — list of ((R,G,B), [Polygon])
    w_mm, h_mm — canvas dimensions in mm
    """
    w_px = round(w_mm * px_per_mm)
    h_px = round(h_mm * px_per_mm)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{w_px}" height="{h_px}" '
        f'viewBox="0 0 {w_px} {h_px}" '
        f'style="max-width:100%;display:block;background:#f5f5f5">'
    ]

    for color_rgb, polygons in layers:
        hex_color = "#{:02x}{:02x}{:02x}".format(*[int(v) for v in color_rgb])
        for poly in polygons:
            d = _poly_to_path(poly, px_per_mm)
            if d:
                parts.append(
                    f'  <path d="{d}" fill="{hex_color}" '
                    f'stroke="none" fill-rule="evenodd"/>'
                )

    parts.append("</svg>")
    return "\n".join(parts)


def _poly_to_path(poly, scale):
    """Convert a single Shapely Polygon to an SVG path d= string."""
    coords = list(poly.exterior.coords)
    if len(coords) < 3:
        return None

    def fmt(pts):
        first = f"M{pts[0][0] * scale:.1f},{pts[0][1] * scale:.1f}"
        rest  = " ".join(f"L{x * scale:.1f},{y * scale:.1f}" for x, y in pts[1:])
        return first + " " + rest + " Z"

    d = fmt(coords)
    for interior in poly.interiors:
        d += " " + fmt(list(interior.coords))

    return d
