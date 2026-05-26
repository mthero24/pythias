"""
pipeline.py — Orchestration: image/text → stitches → DST.

Public functions:
  image_to_dst(image_path, output_path, ...)
  text_to_dst(text, font_path, output_path, ...)
"""

from vectorize import vectorize_image
from stitches import polygon_to_stitches
from text_engine import font_to_polygons
from dst_writer import stitches_to_dst


def image_to_dst(image_path, output_path, n_colors=8, size_mm=100.0, fill_angle=45.0):
    """
    Convert a raster image to a DST embroidery file.

    image_path  — path to PNG/JPG/etc.
    output_path — where to write the .dst file
    n_colors    — number of thread colors to reduce to (2–12)
    size_mm     — desired width of the design in mm
    fill_angle  — fill stitch angle in degrees
    """
    print(f"[emb] vectorizing {image_path} → {n_colors} colors, {size_mm}mm wide")
    layers, (w_mm, h_mm) = vectorize_image(image_path, n_colors=n_colors, target_size_mm=size_mm)
    print(f"[emb] {len(layers)} color layer(s), canvas {w_mm:.1f}×{h_mm:.1f}mm")

    color_stitch_layers = []

    for color, polygons in layers:
        print(f"[emb] color {color} — {len(polygons)} polygon(s)")

        classified = [(p, *polygon_to_stitches(p, fill_angle)) for p in polygons]
        fills  = [(p, s) for p, s, k in classified if k == "fill"]
        satins = [(p, s) for p, s, k in classified if k == "satin"]

        layer_stitches = []
        for p, stitches in fills + satins:
            if stitches:
                layer_stitches.extend(stitches)
                print(f"[emb]   {len(stitches):>5} stitches  area={p.area:.1f}mm²")

        if layer_stitches:
            color_stitch_layers.append((color, layer_stitches))

    total = sum(len(s) for _, s in color_stitch_layers)
    print(f"[emb] writing {output_path} — {total} total stitches")
    stitches_to_dst(color_stitch_layers, output_path)
    print("[emb] done")
    return output_path


def text_to_dst(text, font_path, output_path, size_mm=20.0,
                color=(0, 0, 0), fill_angle=0.0, letter_spacing_mm=1.0):
    """
    Convert a text string to a DST embroidery file.

    text              — string to stitch
    font_path         — path to .ttf or .otf font file
    output_path       — where to write the .dst file
    size_mm           — cap-height in mm
    color             — (R, G, B) thread color
    fill_angle        — fill stitch angle in degrees
    letter_spacing_mm — extra space between characters
    """
    print(f"[emb] text='{text}'  font={font_path}  size={size_mm}mm")
    polygons = font_to_polygons(font_path, text, size_mm=size_mm,
                                letter_spacing_mm=letter_spacing_mm)
    print(f"[emb] {len(polygons)} glyph polygon(s)")

    all_stitches = []
    for p in polygons:
        stitches, kind = polygon_to_stitches(p, fill_angle)
        if stitches:
            all_stitches.extend(stitches)
            print(f"[emb]   {kind:<5} {len(stitches):>5} stitches  area={p.area:.1f}mm²")

    print(f"[emb] writing {output_path} — {len(all_stitches)} stitches")
    stitches_to_dst([(color, all_stitches)], output_path)
    print("[emb] done")
    return output_path
