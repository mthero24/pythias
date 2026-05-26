"""
jobs.py — In-memory job store for vectorized design layers.

Each job holds the Shapely polygon data from vectorize_image() so that
/generate/from-job can produce a DST without re-running potrace.
Jobs expire after 1 hour of idle time.
"""

import uuid
import time

_jobs = {}


def store(layers, w_mm, h_mm):
    """
    Store vectorize_image() results and return a short job_id.

    layers  — list of ((R,G,B), [Polygon])
    w_mm, h_mm — canvas dimensions in mm
    """
    jid = str(uuid.uuid4())[:8]
    _purge()
    _jobs[jid] = {"layers": layers, "w_mm": w_mm, "h_mm": h_mm, "ts": time.time()}
    return jid


def get(jid):
    """Return the stored job dict or None."""
    job = _jobs.get(jid)
    if job:
        job["ts"] = time.time()  # refresh TTL on access
    return job


def _purge():
    cutoff = time.time() - 3600
    for k in list(_jobs):
        if _jobs[k]["ts"] < cutoff:
            del _jobs[k]


# ── serialization (for persistent storage in Wasabi) ─────────────────────────

def serialize_job(jid):
    """
    Return job polygon data as a plain JSON-serializable dict.
    Upload this to Wasabi so it can be used past the 1-hour in-memory TTL.
    """
    job = _jobs.get(jid)
    if not job:
        return None
    return {
        "w_mm": job["w_mm"],
        "h_mm": job["h_mm"],
        "layers": [
            {
                "color_rgb": list(color_rgb),
                "polygons":  [_ser_poly(p) for p in polys],
            }
            for color_rgb, polys in job["layers"]
        ],
    }


def deserialize_layers(data):
    """
    Reconstruct layers from a serialized dict (fetched from Wasabi).
    Returns (layers, w_mm, h_mm) in the same format as vectorize_image().
    """
    from shapely.geometry import Polygon

    layers = []
    for layer in data["layers"]:
        color_rgb = tuple(layer["color_rgb"])
        polys = []
        for pd in layer["polygons"]:
            try:
                poly = Polygon(pd["exterior"], pd.get("interiors", []))
                if poly.is_valid and not poly.is_empty:
                    polys.append(poly)
            except Exception:
                pass
        if polys:
            layers.append((color_rgb, polys))
    return layers, float(data["w_mm"]), float(data["h_mm"])


def _ser_poly(poly):
    return {
        "exterior":  [list(c) for c in poly.exterior.coords],
        "interiors": [[list(c) for c in ring.coords] for ring in poly.interiors],
    }
