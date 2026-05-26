"""
vinyl_writer.py — Convert Shapely polygon layers to a cut-ready SVG for vinyl plotters.

Coordinates are in mm. The SVG uses mm for width/height and a matching mm viewBox,
so every unit in the path data is 1 mm. Vinyl cutting software (Cricut, Silhouette,
Roland, Inkscape) can open this and retain correct physical dimensions.

Each colour layer is output as a named <g> group so the operator can assign separate
vinyl sheets per colour without any additional layer splitting.
"""


def layers_to_vinyl_svg(color_poly_layers, w_mm, h_mm):
    """
    Produce a standalone SVG string ready for a vinyl cutter.

    color_poly_layers — list of ((R,G,B), [Polygon])
    w_mm, h_mm        — canvas dimensions in mm
    """
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg"',
        '     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"',
        f'     width="{w_mm:.2f}mm" height="{h_mm:.2f}mm"',
        f'     viewBox="0 0 {w_mm:.4f} {h_mm:.4f}">',
    ]

    for i, (color_rgb, polygons) in enumerate(color_poly_layers):
        hex_color = "#{:02x}{:02x}{:02x}".format(*[int(v) for v in color_rgb])
        lines.append(
            f'  <g id="layer-{i}"'
            f' inkscape:label="Cut layer {i + 1} — {hex_color}"'
            f' inkscape:groupmode="layer"'
            f' fill="{hex_color}" stroke="none">'
        )
        for poly in polygons:
            d = _poly_to_path(poly)
            if d:
                lines.append(f'    <path d="{d}" fill-rule="evenodd"/>')
        lines.append("  </g>")

    lines.append("</svg>")
    return "\n".join(lines)


def _poly_to_path(poly):
    """Convert a single Shapely Polygon (mm coords) to an SVG path d= string."""
    coords = list(poly.exterior.coords)
    if len(coords) < 3:
        return None

    def ring(pts):
        d = f"M{pts[0][0]:.4f},{pts[0][1]:.4f}"
        for x, y in pts[1:]:
            d += f" L{x:.4f},{y:.4f}"
        return d + " Z"

    d = ring(coords)
    for interior in poly.interiors:
        d += " " + ring(list(interior.coords))
    return d
