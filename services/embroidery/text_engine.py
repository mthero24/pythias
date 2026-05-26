"""
text_engine.py — TTF/OTF font → list of Shapely Polygons (in mm).

Uses FontTools RecordingPen to capture glyph outlines, approximates
bezier curves with line segments, then builds Shapely Polygons.
"""

import math
from fonttools.ttLib import TTFont
from fonttools.pens.recordingPen import RecordingPen
from shapely.geometry import Polygon
from shapely.ops import unary_union


def font_to_polygons(font_path, text, size_mm=20.0, letter_spacing_mm=1.0):
    """
    Convert a string to Shapely Polygons using the given TTF/OTF font.
    Returns list of (Polygon, color_hint) — color_hint is always None for now.
    Coordinates are in mm, baseline at y=0, text extends right from x=0.
    """
    font = TTFont(font_path)
    upem = font["head"].unitsPerEm
    scale = size_mm / upem
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()

    polygons = []
    x_cursor = 0.0

    for char in text:
        code = ord(char)
        if code not in cmap:
            x_cursor += size_mm * 0.5 + letter_spacing_mm
            continue

        glyph_name = cmap[code]
        pen = RecordingPen()
        glyph_set[glyph_name].draw(pen)

        polys = _pen_to_polygons(pen, scale, x_offset=x_cursor)
        polygons.extend(polys)

        advance = glyph_set[glyph_name].width * scale
        x_cursor += advance + letter_spacing_mm

    return polygons


# ── internal ───────────────────────────────────────────────────────────────────

def _pen_to_polygons(pen, scale, x_offset=0.0):
    """Convert RecordingPen commands to Shapely Polygons."""
    contours = []
    current = []

    for op, args in pen.value:
        if op == "moveTo":
            current = [_pt(args[0], scale, x_offset)]
        elif op == "lineTo":
            current.append(_pt(args[0], scale, x_offset))
        elif op == "curveTo":
            if current:
                pts = [current[-1]] + [_pt(p, scale, x_offset) for p in args]
                current += _cubic_bezier(pts)[1:]
        elif op == "qCurveTo":
            if current:
                pts = [current[-1]] + [_pt(p, scale, x_offset) for p in args]
                current += _quadratic_bezier(pts)[1:]
        elif op in ("closePath", "endPath"):
            if len(current) >= 3:
                contours.append(current)
            current = []

    # Build polygons — font contours can be outer rings or holes (counter-clockwise = hole in TrueType)
    polys = []
    outers, holes = [], []
    for c in contours:
        try:
            p = Polygon(c)
            if not p.is_valid or p.is_empty or p.area < 0.05:
                continue
            # Positive area = outer ring in TrueType (clockwise coords become CCW after y-flip)
            if _signed_area(c) >= 0:
                outers.append(p)
            else:
                holes.append(p)
        except Exception:
            pass

    # Subtract holes from their containing outer ring
    for outer in outers:
        ring_holes = [h for h in holes if outer.contains(h)]
        if ring_holes:
            result = outer
            for h in ring_holes:
                result = result.difference(h)
            if result.is_valid and not result.is_empty:
                if result.geom_type == "Polygon":
                    polys.append(result)
                elif result.geom_type == "MultiPolygon":
                    polys.extend(result.geoms)
        else:
            polys.append(outer)

    return polys


def _pt(raw, scale, x_offset):
    """Convert a font unit point to mm, flipping Y axis."""
    x, y = raw
    return (x * scale + x_offset, -y * scale)


def _cubic_bezier(pts, steps=16):
    """Sample a cubic bezier (4 control points)."""
    result = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        p = pts
        result.append((
            u**3 * p[0][0] + 3*u**2*t * p[1][0] + 3*u*t**2 * p[2][0] + t**3 * p[3][0],
            u**3 * p[0][1] + 3*u**2*t * p[1][1] + 3*u*t**2 * p[2][1] + t**3 * p[3][1],
        ))
    return result


def _quadratic_bezier(pts, steps=12):
    """Sample a quadratic bezier (3 control points)."""
    result = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        p = pts
        result.append((
            u**2 * p[0][0] + 2*u*t * p[1][0] + t**2 * p[2][0],
            u**2 * p[0][1] + 2*u*t * p[1][1] + t**2 * p[2][1],
        ))
    return result


def _signed_area(coords):
    """Shoelace formula — positive = clockwise (screen coords with y-down)."""
    n = len(coords)
    area = 0.0
    for i in range(n):
        x0, y0 = coords[i]
        x1, y1 = coords[(i + 1) % n]
        area += (x0 * y1 - x1 * y0)
    return area / 2.0
