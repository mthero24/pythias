import sharp from "sharp";

export async function create(url, options = {}) {
  const backgroundColor = options.backgroundColor ?? "#ffffff";
  const rows    = options.rows    ?? 8;
  const cols    = options.cols    ?? 8;
  const size    = options.size    ?? 3500;
  const padding = options.padding ?? 125;
  const height  = options.height  ?? size;
  const mirror  = options.mirror  ?? false;

  const d_width = Math.round((size / rows) - padding);

  let bg;
  if (typeof backgroundColor === "string") {
    const hex = (backgroundColor === "military" ? "#4B5320" : backgroundColor).replace("#", "");
    bg = await sharp({
      create: {
        width:    size,
        height,
        channels: 4,
        background: {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          alpha: 1,
        },
      },
    }).png().toBuffer();
  } else {
    const resp = await fetch(backgroundColor.url);
    const buf  = Buffer.from(await resp.arrayBuffer());
    bg = await sharp(buf).resize(size, height).png().toBuffer();
  }

  const resp      = await fetch(url);
  const designBuf = Buffer.from(await resp.arrayBuffer());
  const trimmed   = await sharp(designBuf).trim().png().toBuffer();

  const design1Buf = await sharp(trimmed)
    .resize(d_width, null)
    .rotate(-45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();

  const design2Buf = await sharp(trimmed)
    .resize(Math.round(d_width * 1.5), null)
    .rotate(45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();

  const composites = [];
  let x = 0, y = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row % 2 === 0 && col % 2 === 0) {
        const left = Math.round(x);
        const top  = Math.round(y);
        if (left >= 0 && top >= 0) composites.push({ input: design1Buf, left, top });
      } else if (row % 2 === 1 && col % 2 === 1) {
        const left = Math.round(x - d_width / 2);
        const top  = Math.round(y - d_width / 2);
        if (left >= 0 && top >= 0) composites.push({ input: design2Buf, left, top });
      }
      x += d_width + padding;
    }
    y += d_width + padding;
    x = 0;
  }

  let result = await sharp(bg).composite(composites).png().toBuffer();
  if (mirror) result = await sharp(result).flop().png().toBuffer();
  return result;
}
