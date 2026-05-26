"""
vectorize.py — Raster image → list of (color, [Polygon]) color layers.

Pipeline:
  1. Preprocess (denoise, contrast boost, scale up small images)
  2. K-means color reduction to n_colors
  3. For each color: create binary mask → run Potrace → parse SVG paths → Shapely Polygons
"""

import os
import subprocess
import tempfile
import math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from sklearn.cluster import KMeans
from shapely.geometry import Polygon
import xml.etree.ElementTree as ET
import svgpathtools


# ── preprocessing ─────────────────────────────────────────────────────────────

def preprocess(src, target_px=1000):
    """Return a clean RGBA PIL image ready for color reduction."""
    img = Image.open(src) if isinstance(src, str) else src
    img = img.convert("RGBA")

    w, h = img.size
    if max(w, h) < target_px:
        scale = target_px / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    img = img.filter(ImageFilter.MedianFilter(size=3))
    rgb = ImageEnhance.Contrast(img.convert("RGB")).enhance(1.6)
    r, g, b = rgb.split()
    _, _, _, a = img.split()
    return Image.merge("RGBA", (r, g, b, a))


# ── color reduction ────────────────────────────────────────────────────────────

def reduce_colors(img, n_colors=8, alpha_threshold=30):
    """
    K-means color reduction on opaque pixels.
    Returns (quantized PIL image, palette as list of (R,G,B) tuples).
    """
    arr = np.array(img.convert("RGBA"))
    opaque = arr[:, :, 3] > alpha_threshold

    if opaque.sum() < 10:
        return img, []

    pixels = arr[opaque][:, :3].astype(float)
    n = min(n_colors, len(np.unique(pixels.reshape(-1, 3), axis=0)))
    if n < 1:
        return img, []

    km = KMeans(n_clusters=n, n_init=10, random_state=42)
    km.fit(pixels)

    result = arr.copy()
    result[opaque, :3] = km.cluster_centers_[km.predict(pixels)].astype(np.uint8)
    result[~opaque, 3] = 0

    palette = [tuple(int(v) for v in c) for c in km.cluster_centers_]
    return Image.fromarray(result), palette


# ── per-color mask → polygons ─────────────────────────────────────────────────

def _color_mask(arr, color, tol=25):
    diff = np.abs(arr[:, :, :3].astype(int) - np.array(color)).max(axis=2)
    return (diff < tol) & (arr[:, :, 3] > 30)


def _potrace(mask_arr, scale_mm_per_px):
    """Run Potrace on a binary mask. Returns list of Shapely Polygons (in mm)."""
    with tempfile.TemporaryDirectory() as td:
        bmp = os.path.join(td, "m.bmp")
        svg = os.path.join(td, "m.svg")
        Image.fromarray((mask_arr * 255).astype(np.uint8), "L").save(bmp)

        r = subprocess.run(
            ["potrace", "--svg",
             "--turdsize", "4",
             "--alphamax", "1.0",
             "--opttolerance", "0.5",
             bmp, "-o", svg],
            capture_output=True, timeout=30,
        )
        if r.returncode != 0 or not os.path.exists(svg):
            return []

        return _parse_svg(svg, scale_mm_per_px)


def _parse_svg(svg_path, scale):
    """Parse Potrace SVG → list of Shapely Polygons scaled to mm."""
    try:
        paths, _ = svgpathtools.svg2paths(svg_path)
    except Exception:
        return []

    polygons = []
    for path in paths:
        pts = _sample_path(path)
        if len(pts) < 3:
            continue
        pts_mm = [(x * scale, y * scale) for x, y in pts]
        try:
            poly = Polygon(pts_mm)
            if poly.is_valid and not poly.is_empty and poly.area > 0.1:
                polygons.append(poly)
        except Exception:
            pass
    return polygons


def _sample_path(path, samples_per_seg=20):
    pts = []
    for seg in path:
        for i in range(samples_per_seg):
            p = seg.point(i / samples_per_seg)
            pts.append((p.real, p.imag))
    return pts


# ── public API ────────────────────────────────────────────────────────────────

def vectorize_image(src, n_colors=8, target_size_mm=100):
    """
    Full pipeline: image path or PIL Image → list of (rgb, [Polygon]) layers + (width_mm, height_mm).
    """
    img = preprocess(src)
    img_q, palette = reduce_colors(img, n_colors)

    w, h = img_q.size
    scale = target_size_mm / w

    arr = np.array(img_q.convert("RGBA"))
    layers = []
    for color in palette:
        mask = _color_mask(arr, color)
        if mask.sum() < 50:
            continue
        polys = _potrace(mask, scale)
        if polys:
            layers.append((color, polys))

    return layers, (w * scale, h * scale)
