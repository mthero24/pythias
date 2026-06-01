"""
api.py — FastAPI service exposing the embroidery pipeline over HTTP.

Endpoints:
  POST /generate/image        — upload an image, get back a .dst file (direct)
  POST /generate/text         — submit text + font, get back a .dst file (direct)
  GET  /palettes              — return Isacord / Madeira / Sulky palette data
  POST /vectorize             — vectorize image, store job, return preview SVG + layer info
  POST /generate/from-job     — produce DST from stored job + user color choices + text layers
  POST /generate/vinyl        — produce cut-ready SVG from stored job (vinyl plotter output)

Run with:
  uvicorn api:app --host 0.0.0.0 --port 8765
"""

import os
import platform
import tempfile
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from shapely.affinity import translate as shp_translate

from pipeline import image_to_dst, text_to_dst
from vectorize import vectorize_image
from stitches import polygon_to_stitches
from dst_writer import stitches_to_dst
from text_engine import font_to_polygons
from palettes import PALETTES, closest_thread
import jobs as job_store
from preview import layers_to_svg
from vinyl_writer import layers_to_vinyl_svg
from render_png import stitches_to_png
from render_vinyl_png import vinyl_to_png

app = FastAPI(title="Embroidery DST Generator", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── font resolution ───────────────────────────────────────────────────────────

_FONT_MAP = {
    "Arial":            ["arial.ttf",       "LiberationSans-Regular.ttf", "FreeSans.ttf"],
    "Georgia":          ["georgia.ttf"],
    "Impact":           ["impact.ttf"],
    "Times New Roman":  ["times.ttf",        "timesnewroman.ttf"],
    "Courier New":      ["cour.ttf",         "LiberationMono-Regular.ttf"],
    "Verdana":          ["verdana.ttf"],
    "Trebuchet MS":     ["trebuc.ttf"],
    "Bebas Neue":       ["BebasNeue-Regular.ttf"],
    "Anton":            ["Anton-Regular.ttf"],
    "Oswald":           ["Oswald-Regular.ttf"],
    "Montserrat":       ["Montserrat-Regular.ttf"],
    "Raleway":          ["Raleway-Regular.ttf"],
    "Pacifico":         ["Pacifico-Regular.ttf"],
    "Permanent Marker": ["PermanentMarker-Regular.ttf"],
}

def _font_dirs():
    sys = platform.system()
    if sys == "Windows":
        return [r"C:\Windows\Fonts"]
    if sys == "Darwin":
        return ["/Library/Fonts", "/System/Library/Fonts",
                os.path.expanduser("~/Library/Fonts")]
    return ["/usr/share/fonts", "/usr/local/share/fonts",
            os.path.expanduser("~/.fonts")]

def find_font(family: str) -> Optional[str]:
    """Return an absolute TTF path for the font family, or None."""
    candidates = _FONT_MAP.get(family, [
        family.lower().replace(" ", "") + ".ttf",
        family.replace(" ", "") + ".ttf",
        family.replace(" ", "-") + ".ttf",
    ])
    for d in _font_dirs():
        for fn in candidates:
            path = os.path.join(d, fn)
            if os.path.exists(path):
                return path
        # Walk subdirectories (Linux font tree)
        for root, _, files in os.walk(d):
            for fn in candidates:
                if fn in files:
                    return os.path.join(root, fn)
    # Last-resort Arial fallback
    for d in _font_dirs():
        fallback = os.path.join(d, "arial.ttf")
        if os.path.exists(fallback):
            return fallback
    return None


# ── helpers ───────────────────────────────────────────────────────────────────

def _rgb_to_hex(rgb):
    return "#{:02x}{:02x}{:02x}".format(*[int(v) for v in rgb])

def _hex_to_rgb(hex_color: str):
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


# ── existing direct-generate endpoints ───────────────────────────────────────

@app.post("/generate/image")
async def generate_image(
    file: UploadFile,
    n_colors: int = Form(8),
    size_mm: float = Form(100.0),
    fill_angle: float = Form(45.0),
):
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, file.filename or "input.png")
        dst = os.path.join(td, "embroidery.dst")
        with open(src, "wb") as f:
            f.write(await file.read())
        try:
            image_to_dst(src, dst, n_colors=n_colors, size_mm=size_mm, fill_angle=fill_angle)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        with open(dst, "rb") as f:
            data = f.read()

    tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".dst")
    tmp_out.write(data)
    tmp_out.close()
    return FileResponse(tmp_out.name, filename="embroidery.dst",
                        media_type="application/octet-stream")


@app.post("/generate/text")
async def generate_text(
    text: str = Form(...),
    font: UploadFile = None,
    font_path: str = Form(None),
    font_family: str = Form(None),
    size_mm: float = Form(20.0),
    color_r: int = Form(0),
    color_g: int = Form(0),
    color_b: int = Form(0),
    fill_angle: float = Form(0.0),
    letter_spacing_mm: float = Form(1.0),
):
    with tempfile.TemporaryDirectory() as td:
        if font:
            fp = os.path.join(td, font.filename or "font.ttf")
            with open(fp, "wb") as f:
                f.write(await font.read())
        elif font_path:
            fp = font_path
            if not os.path.exists(fp):
                raise HTTPException(status_code=400, detail=f"font_path not found: {fp}")
        elif font_family:
            fp = find_font(font_family)
            if not fp:
                raise HTTPException(status_code=400, detail=f"Font not found: {font_family}")
        else:
            raise HTTPException(status_code=400,
                                detail="Provide 'font' upload, 'font_path', or 'font_family'")

        dst = os.path.join(td, "embroidery.dst")
        try:
            text_to_dst(text, fp, dst, size_mm=size_mm,
                        color=(color_r, color_g, color_b),
                        fill_angle=fill_angle,
                        letter_spacing_mm=letter_spacing_mm)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

        with open(dst, "rb") as f:
            data = f.read()

    tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".dst")
    tmp_out.write(data)
    tmp_out.close()
    return FileResponse(tmp_out.name, filename="embroidery.dst",
                        media_type="application/octet-stream")


# ── palette endpoint ──────────────────────────────────────────────────────────

@app.get("/palettes")
def get_palettes():
    """Return all thread palette data keyed by palette name."""
    return PALETTES


# ── vectorize endpoint ────────────────────────────────────────────────────────

@app.post("/vectorize")
async def vectorize(
    file: UploadFile,
    n_colors: int = Form(8),
    size_mm: float = Form(100.0),
    palette: str = Form("isacord"),
):
    """
    Vectorize an image into color layers, store as a job, and return:
    - job_id       : use with /generate/from-job
    - layers       : [{index, color_hex, polygon_count, closest_thread}]
    - preview_svg  : inline SVG of the vectorized result
    - w_mm, h_mm   : canvas dimensions
    """
    with tempfile.TemporaryDirectory() as td:
        src = os.path.join(td, file.filename or "input.png")
        with open(src, "wb") as f:
            f.write(await file.read())

        try:
            layers, (w_mm, h_mm) = vectorize_image(src, n_colors=n_colors,
                                                    target_size_mm=size_mm)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    if not layers:
        raise HTTPException(status_code=422, detail="No color layers detected in image")

    jid = job_store.store(layers, w_mm, h_mm)
    preview_svg = layers_to_svg(layers, w_mm, h_mm)

    layers_info = []
    for i, (color_rgb, polys) in enumerate(layers):
        hex_color = _rgb_to_hex(color_rgb)
        closest = closest_thread(hex_color, palette)
        layers_info.append({
            "index": i,
            "color_hex": hex_color,
            "polygon_count": len(polys),
            "closest_thread": closest,
        })

    return {
        "job_id":      jid,
        "layers":      layers_info,
        "preview_svg": preview_svg,
        "w_mm":        round(w_mm, 2),
        "h_mm":        round(h_mm, 2),
    }


# ── generate/from-job endpoint ────────────────────────────────────────────────

class TextLayer(BaseModel):
    text: str
    font_family: str = "Arial"
    size_mm: float = 20.0
    color_hex: str = "#000000"
    thread_hex: str = "#000000"
    x_mm: float = 0.0
    y_mm: float = 0.0
    fill_angle: float = 0.0
    letter_spacing_mm: float = 1.0


class GenerateFromJobRequest(BaseModel):
    job_id: str
    colors: List[str] = []          # hex per image layer, in order
    fill_angle: float = 45.0
    text_layers: List[TextLayer] = []


@app.post("/generate/from-job")
async def generate_from_job(req: GenerateFromJobRequest):
    """
    Produce a DST file from a stored vectorize job.

    Image layers use the provided color overrides (or original colors).
    Text layers are stitched separately using system fonts, then appended.
    """
    job = job_store.get(req.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id!r} not found or expired")

    stored_layers = job["layers"]   # [(rgb_tuple, [Polygon])]
    color_stitch_layers = []

    # ── image layers ──────────────────────────────────────────────────────────
    for i, (color_rgb, polygons) in enumerate(stored_layers):
        # Use user's chosen thread color if provided
        if i < len(req.colors) and req.colors[i]:
            color = _hex_to_rgb(req.colors[i])
        else:
            color = tuple(int(v) for v in color_rgb)

        layer_stitches = []
        for poly in polygons:
            stitches, _ = polygon_to_stitches(poly, req.fill_angle)
            if stitches:
                layer_stitches.extend(stitches)

        if layer_stitches:
            color_stitch_layers.append((color, layer_stitches))

    # ── text layers ───────────────────────────────────────────────────────────
    for tl in req.text_layers:
        if not tl.text.strip():
            continue

        font_path = find_font(tl.font_family)
        if not font_path:
            print(f"[emb] WARNING: font not found for '{tl.font_family}', skipping text layer")
            continue

        try:
            polys = font_to_polygons(font_path, tl.text, size_mm=tl.size_mm,
                                     letter_spacing_mm=tl.letter_spacing_mm)
        except Exception as e:
            print(f"[emb] WARNING: text polygon error: {e}")
            continue

        text_stitches = []
        for p in polys:
            s, _ = polygon_to_stitches(p, tl.fill_angle)
            if s:
                # Offset stitches to the text layer's canvas position
                text_stitches.extend([(x + tl.x_mm, y + tl.y_mm) for x, y in s])

        if text_stitches:
            color = _hex_to_rgb(tl.thread_hex)
            color_stitch_layers.append((color, text_stitches))

    if not color_stitch_layers:
        raise HTTPException(status_code=422, detail="No stitchable content found")

    tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".dst")
    tmp_out.close()
    try:
        stitches_to_dst(color_stitch_layers, tmp_out.name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return FileResponse(tmp_out.name, filename="embroidery.dst",
                        media_type="application/octet-stream")


# ── export-polygons endpoint ─────────────────────────────────────────────────

@app.get("/job/{job_id}/export-polygons")
def export_polygons(job_id: str):
    """
    Serialize the stored polygon data for a job as a plain JSON dict.
    Upload the result to Wasabi so it can be used after the in-memory TTL expires.
    """
    data = job_store.serialize_job(job_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Job {job_id!r} not found or expired")
    return data


# ── generate/from-polygons endpoint ──────────────────────────────────────────

class GenerateFromPolygonsRequest(BaseModel):
    polygons_data: dict          # serialized job (from /job/{id}/export-polygons)
    colors: List[str] = []       # hex per image layer
    text_layers: List[TextLayer] = []
    fill_angle: float = 45.0
    format: str = "dst"          # "dst" or "svg"


@app.post("/generate/from-polygons")
async def generate_from_polygons(req: GenerateFromPolygonsRequest):
    """
    Generate a DST or vinyl SVG from polygon data fetched from persistent storage.

    This is the customer-order endpoint — called when a customer customizes text
    on an embroidery/vinyl product. The polygon data is the serialized image layer
    (stored in Wasabi at design creation time), and text_layers carry the
    customer's own text replacing the template defaults.
    """
    try:
        layers, w_mm, h_mm = job_store.deserialize_layers(req.polygons_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid polygon data: {e}")

    if req.format == "svg":
        color_poly_layers = []
        for i, (color_rgb, polygons) in enumerate(layers):
            color = _hex_to_rgb(req.colors[i]) if i < len(req.colors) and req.colors[i] \
                    else tuple(int(v) for v in color_rgb)
            if polygons:
                color_poly_layers.append((color, polygons))

        for tl in req.text_layers:
            if not tl.text.strip():
                continue
            font_path = find_font(tl.font_family)
            if not font_path:
                continue
            try:
                polys = font_to_polygons(font_path, tl.text, size_mm=tl.size_mm,
                                         letter_spacing_mm=tl.letter_spacing_mm)
                offset_polys = [shp_translate(p, xoff=tl.x_mm, yoff=tl.y_mm) for p in polys]
                if offset_polys:
                    color_poly_layers.append((_hex_to_rgb(tl.thread_hex), offset_polys))
            except Exception:
                pass

        if not color_poly_layers:
            raise HTTPException(status_code=422, detail="No content in polygon data")

        svg_content = layers_to_vinyl_svg(color_poly_layers, w_mm, h_mm)
        return Response(
            content=svg_content.encode("utf-8"),
            media_type="image/svg+xml",
            headers={"Content-Disposition": 'attachment; filename="vinyl.svg"'},
        )

    else:  # DST
        color_stitch_layers = []
        for i, (color_rgb, polygons) in enumerate(layers):
            color = _hex_to_rgb(req.colors[i]) if i < len(req.colors) and req.colors[i] \
                    else tuple(int(v) for v in color_rgb)
            layer_stitches = []
            for poly in polygons:
                stitches, _ = polygon_to_stitches(poly, req.fill_angle)
                if stitches:
                    layer_stitches.extend(stitches)
            if layer_stitches:
                color_stitch_layers.append((color, layer_stitches))

        for tl in req.text_layers:
            if not tl.text.strip():
                continue
            font_path = find_font(tl.font_family)
            if not font_path:
                continue
            try:
                polys = font_to_polygons(font_path, tl.text, size_mm=tl.size_mm,
                                         letter_spacing_mm=tl.letter_spacing_mm)
                text_stitches = []
                for p in polys:
                    s, _ = polygon_to_stitches(p, tl.fill_angle)
                    if s:
                        text_stitches.extend([(x + tl.x_mm, y + tl.y_mm) for x, y in s])
                if text_stitches:
                    color_stitch_layers.append((_hex_to_rgb(tl.thread_hex), text_stitches))
            except Exception:
                pass

        if not color_stitch_layers:
            raise HTTPException(status_code=422, detail="No stitchable content found")

        tmp_out = tempfile.NamedTemporaryFile(delete=False, suffix=".dst")
        tmp_out.close()
        try:
            stitches_to_dst(color_stitch_layers, tmp_out.name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        return FileResponse(tmp_out.name, filename="embroidery.dst",
                            media_type="application/octet-stream")


# ── generate/vinyl endpoint ───────────────────────────────────────────────────

class GenerateVinylRequest(BaseModel):
    job_id: str
    colors: List[str] = []
    text_layers: List[TextLayer] = []


@app.post("/generate/vinyl")
async def generate_vinyl(req: GenerateVinylRequest):
    """
    Produce a cut-ready SVG from a stored vectorize job.

    Each colour layer becomes a named <g> in the SVG so operators can assign
    separate vinyl sheets per colour. Text layers are rendered via font outlines
    and offset to their canvas positions (same as /generate/from-job).
    """
    job = job_store.get(req.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id!r} not found or expired")

    stored_layers = job["layers"]
    w_mm = job["w_mm"]
    h_mm = job["h_mm"]

    color_poly_layers = []

    # ── image layers ──────────────────────────────────────────────────────────
    for i, (color_rgb, polygons) in enumerate(stored_layers):
        color = _hex_to_rgb(req.colors[i]) if i < len(req.colors) and req.colors[i] \
                else tuple(int(v) for v in color_rgb)
        if polygons:
            color_poly_layers.append((color, polygons))

    # ── text layers ───────────────────────────────────────────────────────────
    for tl in req.text_layers:
        if not tl.text.strip():
            continue
        font_path = find_font(tl.font_family)
        if not font_path:
            print(f"[vinyl] WARNING: font not found for '{tl.font_family}', skipping")
            continue
        try:
            polys = font_to_polygons(font_path, tl.text, size_mm=tl.size_mm,
                                     letter_spacing_mm=tl.letter_spacing_mm)
        except Exception as e:
            print(f"[vinyl] WARNING: text polygon error: {e}")
            continue

        offset_polys = [shp_translate(p, xoff=tl.x_mm, yoff=tl.y_mm) for p in polys]
        if offset_polys:
            color_poly_layers.append((_hex_to_rgb(tl.thread_hex), offset_polys))

    if not color_poly_layers:
        raise HTTPException(status_code=422, detail="No content found in job")

    svg_content = layers_to_vinyl_svg(color_poly_layers, w_mm, h_mm)
    return Response(
        content=svg_content.encode("utf-8"),
        media_type="image/svg+xml",
        headers={"Content-Disposition": 'attachment; filename="vinyl.svg"'},
    )


@app.post("/generate/vinyl-preview-png")
async def generate_vinyl_preview_png(req: GenerateVinylRequest):
    """
    Produce a vinyl-look PNG preview from a stored vectorize job.

    Same inputs as /generate/vinyl.  Returns a transparent-background PNG where
    each colour layer is rendered as clean solid-filled polygons with a subtle
    gloss highlight — the visual appearance of real cut vinyl.
    """
    job = job_store.get(req.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id!r} not found or expired")

    stored_layers = job["layers"]
    w_mm = job["w_mm"]
    h_mm = job["h_mm"]

    color_poly_layers = []

    # ── image layers ──────────────────────────────────────────────────────────
    for i, (color_rgb, polygons) in enumerate(stored_layers):
        color = _hex_to_rgb(req.colors[i]) if i < len(req.colors) and req.colors[i] \
                else tuple(int(v) for v in color_rgb)
        if polygons:
            color_poly_layers.append((color, polygons))

    # ── text layers ───────────────────────────────────────────────────────────
    for tl in req.text_layers:
        if not tl.text.strip():
            continue
        font_path = find_font(tl.font_family)
        if not font_path:
            continue
        try:
            polys = font_to_polygons(font_path, tl.text, size_mm=tl.size_mm,
                                     letter_spacing_mm=tl.letter_spacing_mm)
            offset_polys = [shp_translate(p, xoff=tl.x_mm, yoff=tl.y_mm) for p in polys]
            if offset_polys:
                color_poly_layers.append((_hex_to_rgb(tl.thread_hex), offset_polys))
        except Exception:
            pass

    if not color_poly_layers:
        raise HTTPException(status_code=422, detail="No content found in job")

    png_bytes = vinyl_to_png(color_poly_layers, w_mm, h_mm)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": 'inline; filename="vinyl-preview.png"'},
    )


@app.post("/generate/preview-png")
async def generate_preview_png(req: GenerateFromJobRequest):
    """
    Produce a thread-rendered PNG preview from a stored vectorize job.

    Same inputs as /generate/from-job.  Returns a PNG (transparent background)
    where every stitch is drawn to look like real embroidery thread.
    """
    job = job_store.get(req.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id!r} not found or expired")

    stored_layers = job["layers"]
    w_mm = job["w_mm"]
    h_mm = job["h_mm"]

    color_stitch_layers = []

    # ── image layers ──────────────────────────────────────────────────────────
    for i, (color_rgb, polygons) in enumerate(stored_layers):
        color = _hex_to_rgb(req.colors[i]) if i < len(req.colors) and req.colors[i] \
                else tuple(int(v) for v in color_rgb)
        layer_stitches = []
        for poly in polygons:
            stitches, _ = polygon_to_stitches(poly, req.fill_angle)
            if stitches:
                layer_stitches.extend(stitches)
        if layer_stitches:
            color_stitch_layers.append((color, layer_stitches))

    # ── text layers ───────────────────────────────────────────────────────────
    for tl in req.text_layers:
        if not tl.text.strip():
            continue
        font_path = find_font(tl.font_family)
        if not font_path:
            continue
        try:
            polys = font_to_polygons(font_path, tl.text, size_mm=tl.size_mm,
                                     letter_spacing_mm=tl.letter_spacing_mm)
        except Exception:
            continue
        text_stitches = []
        for p in polys:
            s, _ = polygon_to_stitches(p, tl.fill_angle)
            if s:
                text_stitches.extend([(x + tl.x_mm, y + tl.y_mm) for x, y in s])
        if text_stitches:
            color_stitch_layers.append((_hex_to_rgb(tl.thread_hex), text_stitches))

    if not color_stitch_layers:
        raise HTTPException(status_code=422, detail="No stitchable content found")

    png_bytes = stitches_to_png(color_stitch_layers, w_mm, h_mm)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": 'inline; filename="preview.png"'},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765, reload=False)
