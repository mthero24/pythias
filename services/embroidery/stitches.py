"""
stitches.py — Convert Shapely Polygons to embroidery stitch lists (mm coordinates).

Three stitch types:
  fill_stitch   — tatami scan-line fill for wide/large regions
  satin_stitch  — zigzag column for narrow strokes and letterforms
  running_stitch — outline walk (used for underlay trim paths)

All coordinates are in mm.
"""

import math
from shapely.geometry import LineString, Polygon
from shapely.affinity import rotate as shp_rotate

# ── tunable constants ─────────────────────────────────────────────────────────
SATIN_MAX_WIDTH   = 7.0   # mm — regions narrower than this get satin
SATIN_SPACING     = 0.45  # mm — stitch density across the column
FILL_ROW_SPACING  = 0.4   # mm — distance between fill rows
FILL_STITCH_LEN   = 4.0   # mm — max length of a single fill stitch
RUNNING_SPACING   = 2.5   # mm — running stitch interval
PULL_COMP         = 0.5   # mm — expand satin columns to compensate fabric pull
UNDERLAY_FACTOR   = 3     # underlay row spacing = FILL_ROW_SPACING × this


# ── classification ─────────────────────────────────────────────────────────────

def classify_polygon(poly):
    """Return 'satin' or 'fill' based on the polygon's minor-axis width."""
    mbr = poly.minimum_rotated_rectangle
    c = list(mbr.exterior.coords)
    w = min(math.dist(c[0], c[1]), math.dist(c[1], c[2]))
    return "satin" if w <= SATIN_MAX_WIDTH else "fill"


# ── fill stitch ────────────────────────────────────────────────────────────────

def fill_stitch(poly, angle_deg=45, row_spacing=FILL_ROW_SPACING,
                stitch_len=FILL_STITCH_LEN, underlay=True):
    """Tatami fill stitch. Returns list of (x, y) in mm."""
    stitches = []
    if underlay:
        stitches += _scan_fill(poly, angle_deg + 90, row_spacing * UNDERLAY_FACTOR, stitch_len)
    stitches += _scan_fill(poly, angle_deg, row_spacing, stitch_len)
    return stitches


def _scan_fill(poly, angle_deg, row_spacing, stitch_len):
    cx, cy = poly.centroid.x, poly.centroid.y
    rotated = shp_rotate(poly, -angle_deg, origin=(cx, cy))
    minx, miny, maxx, maxy = rotated.bounds

    stitches = []
    row_idx = 0
    y = miny + row_spacing / 2

    while y <= maxy:
        scan = LineString([(minx - 1, y), (maxx + 1, y)])
        inter = rotated.intersection(scan)
        segs = _extract_segments(inter)

        for coords in segs:
            if len(coords) < 2:
                continue
            xs = [p[0] for p in coords]
            x0, x1 = min(xs), max(xs)
            if row_idx % 2:
                x0, x1 = x1, x0          # alternate direction
            direction = 1 if x1 >= x0 else -1
            offset = (row_idx % 2) * stitch_len * 0.5   # tatami shift

            x = x0 + direction * offset
            while (direction > 0 and x <= x1 + 0.01) or (direction < 0 and x >= x1 - 0.01):
                stitches.append(_rot(x, y, angle_deg, cx, cy))
                x += direction * stitch_len
            end = _rot(x1, y, angle_deg, cx, cy)
            if not stitches or math.dist(stitches[-1], end) > 0.1:
                stitches.append(end)

        y += row_spacing
        row_idx += 1

    return stitches


# ── satin stitch ───────────────────────────────────────────────────────────────

def satin_stitch(poly, spacing=SATIN_SPACING, pull_comp=PULL_COMP):
    """Satin column zigzag for narrow polygons. Returns list of (x, y) in mm."""
    mbr = poly.minimum_rotated_rectangle
    c = list(mbr.exterior.coords)
    d1, d2 = math.dist(c[0], c[1]), math.dist(c[1], c[2])

    if d1 >= d2:
        mx, my, length = _norm(c[0], c[1])
        start = ((c[0][0] + c[3][0]) / 2, (c[0][1] + c[3][1]) / 2)
    else:
        mx, my, length = _norm(c[1], c[2])
        start = ((c[0][0] + c[1][0]) / 2, (c[0][1] + c[1][1]) / 2)

    # perpendicular direction
    px, py = -my, mx

    expanded = poly.buffer(pull_comp / 2, join_style=2)
    if expanded.is_empty:
        expanded = poly

    stitches = []
    t = 0
    flip = False
    while t <= length:
        pt_x = start[0] + mx * (t - length / 2)
        pt_y = start[1] + my * (t - length / 2)
        scan = LineString([(pt_x - px * 50, pt_y - py * 50),
                           (pt_x + px * 50, pt_y + py * 50)])
        inter = expanded.intersection(scan)
        segs = _extract_segments(inter)
        if segs:
            a, b = segs[0][0], segs[0][-1]
            if flip:
                stitches += [a, b]
            else:
                stitches += [b, a]
            flip = not flip
        t += spacing

    return stitches


# ── running stitch ─────────────────────────────────────────────────────────────

def running_stitch(poly, spacing=RUNNING_SPACING):
    """Walk the polygon exterior at fixed intervals."""
    coords = list(poly.exterior.coords)
    stitches = [coords[0]]
    acc = 0.0
    for i in range(1, len(coords)):
        x0, y0 = coords[i - 1]
        x1, y1 = coords[i]
        seg = math.dist((x0, y0), (x1, y1))
        if seg == 0:
            continue
        while acc + seg >= spacing:
            t = (spacing - acc) / seg
            x = x0 + t * (x1 - x0)
            y = y0 + t * (y1 - y0)
            stitches.append((x, y))
            x0, y0 = x, y
            seg = math.dist((x0, y0), (x1, y1))
            acc = 0.0
        acc += seg
    return stitches


# ── dispatch ───────────────────────────────────────────────────────────────────

def polygon_to_stitches(poly, fill_angle=45):
    """Classify a polygon and return (stitches, kind) where kind is 'satin' or 'fill'."""
    kind = classify_polygon(poly)
    if kind == "satin":
        return satin_stitch(poly), "satin"
    return fill_stitch(poly, angle_deg=fill_angle), "fill"


# ── helpers ────────────────────────────────────────────────────────────────────

def _extract_segments(geom):
    """Flatten a shapely geometry into a list of coordinate lists."""
    if geom.is_empty:
        return []
    t = geom.geom_type
    if t == "LineString":
        return [list(geom.coords)]
    if t == "MultiLineString":
        return [list(g.coords) for g in geom.geoms]
    if t == "GeometryCollection":
        out = []
        for g in geom.geoms:
            out += _extract_segments(g)
        return out
    return []


def _rot(x, y, angle_deg, cx, cy):
    """Rotate a point around (cx, cy) by angle_deg."""
    rad = math.radians(angle_deg)
    dx, dy = x - cx, y - cy
    return (dx * math.cos(rad) - dy * math.sin(rad) + cx,
            dx * math.sin(rad) + dy * math.cos(rad) + cy)


def _norm(a, b):
    """Return (unit_dx, unit_dy, length) from point a to point b."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = math.hypot(dx, dy)
    if length == 0:
        return 1, 0, 0
    return dx / length, dy / length, length
