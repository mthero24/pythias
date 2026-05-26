# Embroidery DST Generator

Converts logos (PNG/JPG) and text to DST embroidery files.

## Setup

```bash
pip install -r requirements.txt
# Also needs potrace as a system binary:
# macOS:   brew install potrace
# Ubuntu:  apt install potrace
# Windows: choco install potrace
```

## Run

```bash
uvicorn api:app --host 0.0.0.0 --port 8765
```

## API

### Logo → DST
```bash
curl -X POST http://localhost:8765/generate/image \
  -F "file=@logo.png" \
  -F "n_colors=6" \
  -F "size_mm=80" \
  -F "fill_angle=45" \
  --output embroidery.dst
```

### Text → DST
```bash
curl -X POST http://localhost:8765/generate/text \
  -F "text=HELLO" \
  -F "font=@Arial.ttf" \
  -F "size_mm=25" \
  -F "color_r=0" \
  -F "color_g=0" \
  -F "color_b=0" \
  --output embroidery.dst
```

## Tuning constants (stitches.py)

| Constant | Default | Effect |
|---|---|---|
| `SATIN_MAX_WIDTH` | 7mm | Regions narrower than this get satin stitch |
| `SATIN_SPACING` | 0.45mm | Satin stitch density |
| `FILL_ROW_SPACING` | 0.4mm | Fill row density |
| `FILL_STITCH_LEN` | 4.0mm | Max fill stitch length |
| `PULL_COMP` | 0.5mm | Satin expansion to compensate fabric pull |

After your first test stitchout, adjust `PULL_COMP` and `SATIN_SPACING` first — those have the biggest visible impact.
