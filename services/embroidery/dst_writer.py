"""
dst_writer.py — Write stitch data to DST format via pyembroidery.

Coordinates in: mm
Coordinates expected by pyembroidery: 0.1mm units (multiply mm × 10)
"""

import math
import pyembroidery

MM = 10  # mm → pyembroidery units


def stitches_to_dst(color_layers, output_path):
    """
    color_layers: list of ((R,G,B), [(x,y), ...]) where x,y are in mm.
    output_path: .dst file path to write.
    """
    pattern = pyembroidery.EmbPattern()

    for i, (color, stitches) in enumerate(color_layers):
        if not stitches:
            continue

        # Register thread color
        r, g, b = (int(v) for v in color)
        thread = pyembroidery.EmbThread()
        thread.color = (r << 16) | (g << 8) | b
        thread.name = f"Color {i + 1}"
        pattern.add_thread(thread)

        if i > 0:
            pattern.add_command(pyembroidery.COLOR_CHANGE)

        # Jump to starting position
        x0, y0 = stitches[0]
        pattern.add_command(pyembroidery.JUMP, x0 * MM, y0 * MM)

        prev = stitches[0]
        for x, y in stitches:
            dx = abs(x - prev[0]) * MM
            dy = abs(y - prev[1]) * MM
            # DST max movement per record is 121 units; trim and jump for longer moves
            if dx > 121 or dy > 121:
                pattern.add_command(pyembroidery.TRIM)
                pattern.add_command(pyembroidery.JUMP, x * MM, y * MM)
            else:
                pattern.add_command(pyembroidery.STITCH, x * MM, y * MM)
            prev = (x, y)

        pattern.add_command(pyembroidery.TRIM)

    pattern.add_command(pyembroidery.END)
    pyembroidery.write_embroidery(pattern, output_path)
    return output_path
