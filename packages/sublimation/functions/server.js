import sharp from "sharp";
import PDFDocument from "pdfkit";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  PAPER_COLORS, SUBLIMATION_COLORS, COASTER_COLORS,
  MOUSEPAD_COLORS, SOCK_COLORS, ORNAMENT_COLORS, resolveColor,
} from "./colors.js";
import { create as createPattern } from "./patterns.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const PPI       = 72;
const FONT_PATH = `${__dirname}/public/fonts/LibreBarcode39-Regular.ttf`;
const S3_BASE   = "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev";
const CDN       = "https://images2.teeshirtpalacec.com";

const POSTER_SIZES = {
  "12x17":               { w: 12, h: 17 },
  "12x17P":              { w: 12, h: 17 },
  "11x17":               { w: 11, h: 17 },
  "11x17P":              { w: 11, h: 17 },
  "17x12":               { w: 17, h: 12, horizontal: true },
  "17x12P":              { w: 17, h: 12, horizontal: true },
  "17x11":               { w: 17, h: 11, horizontal: true },
  "17x11P":              { w: 17, h: 11, horizontal: true },
  "17x11 (Horizontal)":  { w: 17, h: 11, horizontal: true },
  "17x11P (Horizontal)": { w: 17, h: 11, horizontal: true },
  "16x20":               { w: 16, h: 20 },
  "16x20P":              { w: 16, h: 20 },
  "18x24":               { w: 18, h: 24 },
  "18x24P":              { w: 18, h: 24 },
  "16x24":               { w: 16, h: 24 },
  "16x24P":              { w: 16, h: 24 },
  "24x36":               { w: 24, h: 36 },
  "24x36P":              { w: 24, h: 36 },
  "20x16":               { w: 20, h: 16, horizontal: true },
  "20x16P":              { w: 20, h: 16, horizontal: true },
  "20x16 (Horizontal)":  { w: 20, h: 16, horizontal: true },
  "20x16P (Horizontal)": { w: 20, h: 16, horizontal: true },
  "24x16":               { w: 24, h: 16, horizontal: true },
  "24x16P":              { w: 24, h: 16, horizontal: true },
  "24x16 (Horizontal)":  { w: 24, h: 16, horizontal: true },
  "24x16P (Horizontal)": { w: 24, h: 16, horizontal: true },
};

const CANVAS_SIZES = {
  "12x16":  { w: 12, h: 16 },
  "12x20":  { w: 12, h: 20 },
  "20x12":  { w: 20, h: 12, horizontal: true },
  "12x36":  { w: 12, h: 36 },
  "16x24":  { w: 16, h: 24 },
  "16x36":  { w: 16, h: 36 },
  "20x36":  { w: 20, h: 36 },
  "10x12":  { w: 10, h: 12 },
  "16x12":  { w: 16, h: 12, horizontal: true },
  "12x12":  { w: 12, h: 12 },
  "12x24":  { w: 12, h: 24 },
  "16x16":  { w: 16, h: 16 },
  "36x12":  { w: 36, h: 12, horizontal: true },
  "24x16":  { w: 24, h: 16, horizontal: true },
  "36x16":  { w: 36, h: 16, horizontal: true },
  "36x20":  { w: 36, h: 20, horizontal: true },
  "12x10":  { w: 12, h: 10, horizontal: true },
  "10x10":  { w: 10, h: 10 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inchesToPx = (inches) => Math.round(inches * PPI);

function rewriteUrl(url) {
  return (url || "").replace(S3_BASE, CDN);
}

async function fetchBuf(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch: ${url} (${resp.status})`);
  return Buffer.from(await resp.arrayBuffer());
}

function parseCssColor(val) {
  if (typeof val === "number") {
    return { r: (val >>> 24) & 0xff, g: (val >>> 16) & 0xff, b: (val >>> 8) & 0xff, alpha: ((val & 0xff) / 255) };
  }
  const h = String(val).replace("#", "");
  if (h.length === 3) return { r: parseInt(h[0]+h[0], 16), g: parseInt(h[1]+h[1], 16), b: parseInt(h[2]+h[2], 16), alpha: 1 };
  return { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16), alpha: 1 };
}

async function blankCanvas(width, height, background = { r: 255, g: 255, b: 255, alpha: 1 }) {
  return sharp({ create: { width: Math.round(width), height: Math.round(height), channels: 4, background } })
    .png().toBuffer();
}

async function meta(buf) {
  return sharp(buf).metadata();
}

async function resolveBackground(colorMap, name, width, height) {
  const val = resolveColor(colorMap, name);
  if (!val) throw new Error(`Unknown color: ${name}`);
  if (typeof val === "string") return blankCanvas(width, height, parseCssColor(val));
  const imgBuf = await fetchBuf(val.url);
  return sharp(imgBuf).resize(Math.round(width), Math.round(height)).png().toBuffer();
}

function pdfToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const bufs = [];
    doc.on("data", d => bufs.push(d));
    doc.on("end",  () => resolve(Buffer.concat(bufs)));
    doc.on("error", reject);
    doc.end();
  });
}

// ─── Coaster ──────────────────────────────────────────────────────────────────

export async function createCoster(url, bgColor, sku, index = 0) {
  const MARGIN = 1.4;
  const WIDTH  = Math.round((4.2 * 1000) / 2);
  const HEIGHT = Math.round((4.2 * 1000) / 2);

  let bgBuf = await resolveBackground(COASTER_COLORS, bgColor, WIDTH, HEIGHT);
  bgBuf = await sharp(bgBuf).rotate(90).png().toBuffer();
  const bgMeta = await meta(bgBuf);

  let frontBuf = await fetchBuf(rewriteUrl(url));
  frontBuf = await sharp(frontBuf).trim().rotate(90).png().toBuffer();
  const frontMeta = await meta(frontBuf);

  const ratio       = bgMeta.width  / bgMeta.height;
  const designRatio = frontMeta.width / frontMeta.height;
  if (ratio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(HEIGHT / MARGIN)).png().toBuffer();
  else                     frontBuf = await sharp(frontBuf).resize(Math.round(WIDTH / MARGIN), null).png().toBuffer();

  const fMeta = await meta(frontBuf);
  const x = Math.round(bgMeta.width  / 2 - fMeta.width  / 2);
  const y = Math.round(bgMeta.height / 2 - fMeta.height / 2);

  return sharp(bgBuf)
    .composite([{ input: frontBuf, left: x, top: Math.round(bgMeta.height - fMeta.height - y) }])
    .jpeg({ quality: 60 })
    .flop()
    .toBuffer();
}

// ─── Mouse Pad ────────────────────────────────────────────────────────────────

export async function createMousePad(url, bgColor, sku) {
  const MARGIN         = 1.15;
  const MAX_STRETCH    = 1.0;
  const WIDTH          = 2401;
  const HEIGHT         = 2851;
  const DESIRED_HEIGHT = WIDTH / MARGIN;

  let bgBuf = await resolveBackground(MOUSEPAD_COLORS, bgColor, WIDTH, HEIGHT);
  const bgMeta = await meta(bgBuf);

  let frontBuf = await fetchBuf(rewriteUrl(url));
  frontBuf = await sharp(frontBuf).trim().rotate(90).png().toBuffer();
  const frontMeta = await meta(frontBuf);

  const ratio       = bgMeta.width  / bgMeta.height;
  const designRatio = frontMeta.width / frontMeta.height;
  if (ratio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(HEIGHT / MARGIN)).png().toBuffer();
  else                     frontBuf = await sharp(frontBuf).resize(Math.round(WIDTH / MARGIN), null).png().toBuffer();

  const fMeta  = await meta(frontBuf);
  const stretch = Math.min(DESIRED_HEIGHT / fMeta.height, MAX_STRETCH);
  frontBuf = await sharp(frontBuf).resize(Math.round(fMeta.width), Math.round(fMeta.height * stretch)).png().toBuffer();

  const fMeta2 = await meta(frontBuf);
  const x = Math.round(bgMeta.width  / 2 - fMeta2.width  / 2);
  const y = Math.round(bgMeta.height / 2 - fMeta2.height / 2);

  return sharp(bgBuf)
    .composite([{ input: frontBuf, left: x, top: Math.round(bgMeta.height - fMeta2.height - y) }])
    .jpeg()
    .flop()
    .toBuffer();
}

// ─── Epson pair (mousepad + coaster, up to 2 items per page) ──────────────────

export async function processEpsonPair(items) {
  const images = await Promise.all(items.map(it =>
    it.styleCode === "MSP"
      ? createMousePad(it.design?.front || it.design?.back, it.colorName, it.pieceId)
      : createCoster(it.design?.front || it.design?.back, it.colorName, it.pieceId)
  ));

  const [a, b] = items;
  const [img1, img2] = images;

  const doc = new PDFDocument({ size: [24 * PPI, 12 * PPI] });
  doc.font(FONT_PATH).fontSize(30).text(`*${a.pieceId}*`, 5, 0);
  doc.font("Times-Roman").fontSize(10)
    .text(`${a.pieceId} ${a.styleCode} ${a.shippingType || ""} ${a.order?.items?.length || 1}`, 7, 35);

  if (b) {
    doc.font(FONT_PATH).fontSize(30).text(`*${b.pieceId}*`, 8 * PPI + 20, 0);
    doc.font("Times-Roman").fontSize(10)
      .text(`${b.pieceId} ${b.styleCode} ${b.shippingType || ""} ${b.order?.items?.length || 1}`, 8 * PPI + 20, 35);
  }

  doc.image(img1, 0, PPI, { width: 8 * PPI, height: 11.5 * PPI });
  if (img2) doc.image(img2, 8 * PPI + 20, PPI, { width: 8.25 * PPI, height: 11 * PPI });

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "epson" };
}

// ─── Poster ───────────────────────────────────────────────────────────────────

export async function createPoster(url, bgColor, size, sku) {
  const dim = POSTER_SIZES[size];
  if (!dim) throw new Error(`Unknown poster size: ${size}`);

  const MARGIN      = 1.1;
  const MAX_STRETCH = 1.0;
  const horizontal  = dim.horizontal ?? false;
  const width       = inchesToPx(dim.w);
  const height      = inchesToPx(dim.h);

  let bgBuf = await resolveBackground(PAPER_COLORS, bgColor, 24 * PPI, 16 * PPI);
  if (horizontal) bgBuf = await sharp(bgBuf).rotate(90).png().toBuffer();
  bgBuf = await sharp(bgBuf).resize(width, height).png().toBuffer();
  const bgMeta = await meta(bgBuf);

  let frontBuf = await fetchBuf(rewriteUrl(url));
  frontBuf = await sharp(frontBuf).trim().png().toBuffer();
  const frontMeta = await meta(frontBuf);

  const posterRatio = bgMeta.width  / bgMeta.height;
  const designRatio = frontMeta.width / frontMeta.height;
  if (posterRatio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(height / MARGIN)).png().toBuffer();
  else                           frontBuf = await sharp(frontBuf).resize(Math.round(width / MARGIN), null).png().toBuffer();

  const fMeta   = await meta(frontBuf);
  const stretchH = Math.min(height / MARGIN / fMeta.height, MAX_STRETCH);
  const stretchW = Math.min(width  / MARGIN / fMeta.width,  MAX_STRETCH);
  frontBuf = await sharp(frontBuf).resize(Math.round(fMeta.width * stretchW), Math.round(fMeta.height * stretchH)).png().toBuffer();

  const fMeta2 = await meta(frontBuf);
  const x = Math.round(width  / 2 - fMeta2.width  / 2);
  const y = Math.round(height / 2 - fMeta2.height / 2);
  let result = await sharp(bgBuf)
    .composite([{ input: frontBuf, left: x, top: Math.round(height - fMeta2.height - y) }])
    .jpeg()
    .toBuffer();

  if (!horizontal && size !== "24x36" && size !== "24x36P") {
    result = await sharp(result).rotate(90).jpeg().toBuffer();
  }

  const folder = size.includes("P") ? "poster-epsonhot" : "poster-pagewide";
  return { base64: result.toString("base64"), folder };
}

// ─── Canvas print ─────────────────────────────────────────────────────────────

export async function createCanvasPrint(url, bgColor, size, sku, full = false) {
  const dim = CANVAS_SIZES[size];
  if (!dim) throw new Error(`Unknown canvas size: ${size}`);

  const MARGIN      = 1.1;
  const MAX_STRETCH = 1.0;
  const horizontal  = dim.horizontal ?? false;
  const width       = inchesToPx(dim.w);
  const height      = inchesToPx(dim.h);

  let contentBuf;

  if (!full) {
    let bgBuf = await blankCanvas(width, height);
    if (horizontal) bgBuf = await sharp(bgBuf).rotate(90).png().toBuffer();
    bgBuf = await sharp(bgBuf).resize(width, height).png().toBuffer();
    const bgMeta = await meta(bgBuf);

    let frontBuf = await fetchBuf(rewriteUrl(url, "https://images2.teeshirtpalace.com"));
    frontBuf = await sharp(frontBuf).trim().png().toBuffer();
    const frontMeta = await meta(frontBuf);

    const posterRatio = bgMeta.width  / bgMeta.height;
    const designRatio = frontMeta.width / frontMeta.height;
    if (posterRatio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(height / MARGIN)).png().toBuffer();
    else                           frontBuf = await sharp(frontBuf).resize(Math.round(width / MARGIN), null).png().toBuffer();

    const fMeta   = await meta(frontBuf);
    const stretchH = Math.min(height / MARGIN / fMeta.height, MAX_STRETCH);
    const stretchW = Math.min(width  / MARGIN / fMeta.width,  MAX_STRETCH);
    frontBuf = await sharp(frontBuf).resize(Math.round(fMeta.width * stretchW), Math.round(fMeta.height * stretchH)).png().toBuffer();

    const fMeta2 = await meta(frontBuf);
    const cx = Math.round(width  / 2 - fMeta2.width  / 2);
    const cy = Math.round(height / 2 - fMeta2.height / 2);
    bgBuf = await sharp(bgBuf)
      .composite([{ input: frontBuf, left: cx, top: Math.round(height - fMeta2.height - cy) }])
      .png().toBuffer();

    const expanseBuf = await resolveBackground(PAPER_COLORS, bgColor, (dim.w + 5) * PPI, (dim.h + 5) * PPI);
    contentBuf = await sharp(expanseBuf)
      .composite([{ input: bgBuf, left: Math.round(2.5 * PPI), top: Math.round(2.5 * PPI) }])
      .png().toBuffer();
  } else {
    let frontBuf = await fetchBuf(url);
    frontBuf = await sharp(frontBuf).trim().resize(width, height).png().toBuffer();

    const expanseBuf = await resolveBackground(PAPER_COLORS, bgColor, (dim.w + 5) * PPI, (dim.h + 5) * PPI);
    contentBuf = await sharp(expanseBuf)
      .composite([{ input: frontBuf, left: Math.round(2.5 * PPI), top: Math.round(2.5 * PPI) }])
      .png().toBuffer();
  }

  const tiffBuf = await sharp(contentBuf)
    .withMetadata({ density: PPI })
    .tiff({ compression: "lzw" })
    .toBuffer();

  return { base64: tiffBuf.toString("base64"), folder: "canvas", ext: "tiff" };
}

// ─── Bears ────────────────────────────────────────────────────────────────────

export async function setupBears(colorName, design_url, sku, code, shipping, qty) {
  const colorHex = resolveColor(SUBLIMATION_COLORS, colorName) ?? "#E40702";
  const bgColor  = parseCssColor(colorHex);

  let bgBuf     = await blankCanvas(3653, 1704, bgColor);
  let bgBackBuf = await blankCanvas(3653, 1704, bgColor);

  if (design_url) {
    let designBuf = await fetchBuf(rewriteUrl(design_url));
    designBuf = await sharp(designBuf).trim().png().toBuffer();
    const dMeta = await meta(designBuf);

    const des_w = 1000 * 0.8;
    const des_h = 550;
    const scale = Math.min(des_w / dMeta.width, des_h / dMeta.height);
    designBuf = await sharp(designBuf)
      .resize(Math.round(dMeta.width * scale), Math.round(dMeta.height * scale))
      .png().toBuffer();

    const dMeta2 = await meta(designBuf);
    bgBuf = await sharp(bgBuf)
      .composite([{ input: designBuf, left: Math.round(3653 / 2 - dMeta2.width / 2), top: 575 }])
      .png().toBuffer();
  }

  const templateBuf = await fetchBuf("https://images2.teeshirtpalace.com/sublimationTemplates/GZYF01.png");
  bgBuf     = await sharp(bgBuf).composite([{ input: templateBuf, left: 0, top: 0 }]).png().toBuffer();
  bgBackBuf = await sharp(bgBackBuf).composite([{ input: templateBuf, left: 0, top: 0 }]).png().toBuffer();
  const frontBuf = await sharp(bgBuf).flop().png().toBuffer();

  const doc = new PDFDocument({ size: [23 * PPI, 2 * Math.ceil(7.5 * PPI) + 50] });
  doc.font(FONT_PATH).fontSize(30).text(`*${sku}*`, 0, 10);
  doc.font("Times-Roman").fontSize(10).text(`${sku} ${code} ${shipping} ${qty}`, 0, 35);
  doc.image(frontBuf,  0, 50,          { width: Math.ceil(11.5 * PPI), height: Math.ceil(6.5 * PPI) });
  doc.image(bgBackBuf, 0, 6 * PPI + 50, { width: Math.ceil(11.5 * PPI), height: Math.ceil(6.5 * PPI) });

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "epson" };
}

// ─── Mug ──────────────────────────────────────────────────────────────────────

export async function createMug(item) {
  const MUG_PPI = 300;
  let widthInches, heightInches;
  if (item.sizeName === "11 oz" || item.sizeName === "12 oz") {
    widthInches = 3.5; heightInches = 9.125;
  } else {
    widthInches = 4;   heightInches = 9.5;
  }

  const halfHeight = Math.round((heightInches * MUG_PPI) / 2);
  const fullWidth  = Math.round(widthInches  * MUG_PPI);
  const marginY    = Math.round(halfHeight * 0.25);
  const marginX    = Math.round(fullWidth  * 0.125);

  let frontBuf = await fetchBuf(item.design.front);
  let backBuf  = await fetchBuf(item.design.back ?? item.design.front);

  frontBuf = await sharp(frontBuf).trim()
    .resize(Math.round(halfHeight - marginY), Math.round(fullWidth - marginX), { fit: "inside" })
    .rotate(90).png().toBuffer();
  backBuf = await sharp(backBuf).trim()
    .resize(Math.round(halfHeight - marginY), Math.round(fullWidth - marginX), { fit: "inside" })
    .rotate(90).png().toBuffer();

  const fMeta = await meta(frontBuf);
  const bMeta = await meta(backBuf);

  const compositeBuf = await sharp({
    create: {
      width: Math.round(widthInches * MUG_PPI), height: Math.round(heightInches * MUG_PPI),
      channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
  .composite([
    { input: frontBuf, left: Math.round(marginX / 2), top: Math.round(marginY / 2) },
    { input: backBuf,  left: Math.round(marginX / 2), top: Math.round(halfHeight + marginY / 2) },
  ])
  .flop().png().toBuffer();

  const doc = new PDFDocument({ size: [widthInches * PPI, heightInches * PPI] });
  doc.image(compositeBuf, 0, 0, { width: doc.page.width, height: doc.page.height });
  doc.font(FONT_PATH).fontSize(25).text(`*${item.pieceId}*`, 20, 8);
  doc.font("Times-Roman").fontSize(8)
    .text(`${item.pieceId} ${item.styleCode} ${item.colorName} ${item.sizeName} ${item.shippingType || ""} ${item.order?.items?.length || 1}`, 20, 24);

  const buf    = await pdfToBuffer(doc);
  const folder = (item.sizeName === "11 oz" || item.sizeName === "12 oz") ? "11 oz" : "15 oz";
  return { base64: buf.toString("base64"), folder };
}

// ─── Beer Stein ───────────────────────────────────────────────────────────────

export async function createBeerStein(url, widthInches, heightInches, backUrl, sku, shipping, qty) {
  const MARGINH  = 1.38;
  const MARGINW  = 1.38;
  const WIDTH    = 900;
  const multiply = heightInches / widthInches;
  const total_h  = Math.round(900 * multiply);
  const half     = total_h / 2;

  let bgBuf    = await blankCanvas(WIDTH, total_h);
  let frontBuf = await fetchBuf(rewriteUrl(url));
  let backBuf  = await fetchBuf(rewriteUrl(backUrl ?? url));
  frontBuf = await sharp(frontBuf).trim().rotate(90).png().toBuffer();
  backBuf  = await sharp(backBuf).trim().rotate(90).png().toBuffer();

  const fMeta     = await meta(frontBuf);
  const bMeta     = await meta(backBuf);
  const ratio     = WIDTH / half;
  const frontRatio = fMeta.width / fMeta.height;
  const backRatio  = bMeta.width / bMeta.height;

  if (ratio > frontRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(half / MARGINH)).png().toBuffer();
  else                    frontBuf = await sharp(frontBuf).resize(Math.round(WIDTH / MARGINW), null).png().toBuffer();
  if (ratio > backRatio)  backBuf  = await sharp(backBuf).resize(null, Math.round(half / MARGINH)).png().toBuffer();
  else                    backBuf  = await sharp(backBuf).resize(Math.round(WIDTH / MARGINW), null).png().toBuffer();

  const fMeta2 = await meta(frontBuf);
  const bMeta2 = await meta(backBuf);

  const cx     = WIDTH / 2;
  const x      = Math.round(cx - fMeta2.width  / 1.9);
  const xback  = Math.round(cx - bMeta2.width  / 1.9);
  const centerY = half / 2;
  const y      = Math.round(centerY - fMeta2.height / 2);
  const yback  = Math.round(centerY - bMeta2.height  / 2);
  const closer = 60;

  const resultBuf = await sharp(bgBuf)
    .composite([
      { input: frontBuf, left: x,     top: Math.round(total_h - fMeta2.height - (y + closer)) },
      { input: backBuf,  left: xback, top: yback + closer },
    ])
    .flop().jpeg().toBuffer();

  const doc = new PDFDocument({ size: [widthInches * PPI, heightInches * PPI] });
  doc.font(FONT_PATH).fontSize(30).text(`*${sku}*`, 20, 10);
  doc.font("Times-Roman").fontSize(10).text(`${sku} BST ${shipping} ${qty}`, 20, 35);
  doc.image(resultBuf, 0, 0, { width: doc.page.width, height: doc.page.height });

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "11 oz" };
}

// ─── Hat ──────────────────────────────────────────────────────────────────────

export async function createHat(url, sku, color, shipping, qty) {
  const MARGIN         = 1.15;
  const MAX_STRETCH    = 1.0;
  const WIDTH          = 900;
  const HEIGHT         = 2346;
  const DESIRED_HEIGHT = 1100;

  let bgBuf    = await blankCanvas(WIDTH, HEIGHT);
  let frontBuf = await fetchBuf(rewriteUrl(url));
  frontBuf = await sharp(frontBuf).trim().rotate(90).png().toBuffer();
  const fMeta = await meta(frontBuf);

  const ratio       = WIDTH / HEIGHT;
  const designRatio = fMeta.width / fMeta.height;
  if (ratio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(HEIGHT / MARGIN)).png().toBuffer();
  else                     frontBuf = await sharp(frontBuf).resize(Math.round(WIDTH / MARGIN), null).png().toBuffer();

  const fMeta2  = await meta(frontBuf);
  const stretch = Math.min(DESIRED_HEIGHT / fMeta2.height, MAX_STRETCH);
  frontBuf = await sharp(frontBuf).resize(Math.round(fMeta2.width), Math.round(fMeta2.height * stretch)).png().toBuffer();

  const fMeta3 = await meta(frontBuf);
  const x = Math.round(WIDTH  / 2 - fMeta3.width  / 2);
  const y = Math.round(HEIGHT / 2 - fMeta3.height / 2);

  const resultBuf = await sharp(bgBuf)
    .composite([{ input: frontBuf, left: x, top: Math.round(HEIGHT - fMeta3.height - y) }])
    .flop().jpeg().toBuffer();

  const doc = new PDFDocument({ size: [3.5 * PPI, 9.125 * PPI] });
  doc.font(FONT_PATH).fontSize(30).text(`*${sku}*`, 20, 10);
  doc.font("Times-Roman").fontSize(10).text(`${sku} TH ${color} ${shipping} ${qty}`, 20, 35);
  doc.image(resultBuf, 0, 0, { width: doc.page.width, height: doc.page.height });

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "sawgrass" };
}

// ─── Stainless/Slim/Tall bottle ───────────────────────────────────────────────

export async function createSSB(url, sku, size, shipping, qty, code) {
  const MARGIN         = 1.15;
  const MAX_STRETCH    = 1.0;
  const large          = size === "500ML" || size === "600ML";
  const WIDTH          = large ? 900 : 450;
  const HEIGHT         = large ? 2346 : 1173;
  const DESIRED_HEIGHT = large ? 1100 : 550;

  let bgBuf    = await blankCanvas(WIDTH, HEIGHT);
  let frontBuf = await fetchBuf(rewriteUrl(url));
  frontBuf = await sharp(frontBuf).trim().rotate(90).png().toBuffer();
  const fMeta = await meta(frontBuf);

  const ratio       = WIDTH / HEIGHT;
  const designRatio = fMeta.width / fMeta.height;
  if (ratio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(HEIGHT / MARGIN)).png().toBuffer();
  else                     frontBuf = await sharp(frontBuf).resize(Math.round(WIDTH / MARGIN), null).png().toBuffer();

  const fMeta2  = await meta(frontBuf);
  const stretch = Math.min(DESIRED_HEIGHT / fMeta2.height, MAX_STRETCH);
  frontBuf = await sharp(frontBuf).resize(Math.round(fMeta2.width), Math.round(fMeta2.height * stretch)).png().toBuffer();

  const fMeta3 = await meta(frontBuf);
  const x = Math.round(WIDTH  / 2 - fMeta3.width  / 2);
  const y = Math.round(HEIGHT / 2 - fMeta3.height / 2);

  const resultBuf = await sharp(bgBuf)
    .composite([{ input: frontBuf, left: x, top: Math.round(HEIGHT - fMeta3.height - y) }])
    .flop().jpeg().toBuffer();

  const doc = new PDFDocument({ size: [3.5 * PPI, 9.125 * PPI] });
  doc.font(FONT_PATH).fontSize(30).text(`*${sku}*`, 20, 10);
  doc.font("Times-Roman").fontSize(10).text(`${sku} ${code} ${size} ${shipping} ${qty}`, 20, 35);
  if (size === "350ML") doc.image(resultBuf, 20, 50, { width: doc.page.width - 50, height: doc.page.height - 100 });
  else                  doc.image(resultBuf, 0, 0,   { width: doc.page.width,      height: doc.page.height });

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "sawgrass" };
}

// ─── Ornament ─────────────────────────────────────────────────────────────────

export async function createOrn(bgColor, url, heightInches, widthInches, margin = 2.1, offsetTop = 0, sku, style, shipping, qty) {
  const MARGIN = margin;
  const WIDTH  = Math.round((heightInches * 3 * 1000) / 2);
  const HEIGHT = Math.round((widthInches  * 3 * 1000) / 2);

  let bgBuf = await resolveBackground(ORNAMENT_COLORS, bgColor, WIDTH, HEIGHT);
  bgBuf = await sharp(bgBuf).rotate(90).png().toBuffer();
  const bgMeta = await meta(bgBuf);

  let frontBuf = await fetchBuf(url);
  frontBuf = await sharp(frontBuf).trim().rotate(90).png().toBuffer();
  const fMeta = await meta(frontBuf);

  const ratio       = bgMeta.width  / bgMeta.height;
  const designRatio = fMeta.width   / fMeta.height;
  if (ratio > designRatio) frontBuf = await sharp(frontBuf).resize(null, Math.round(HEIGHT / MARGIN)).png().toBuffer();
  else                     frontBuf = await sharp(frontBuf).resize(Math.round(WIDTH / MARGIN), null).png().toBuffer();

  const fMeta2 = await meta(frontBuf);
  let x = Math.round(bgMeta.width / 2 - fMeta2.width / 2 + (offsetTop * 1000) / 2);
  if (style === "ORT") x += 300;
  const y = Math.round(bgMeta.height / 2 - fMeta2.height / 2);

  bgBuf = await sharp(bgBuf)
    .composite([{ input: frontBuf, left: x, top: Math.round(bgMeta.height - fMeta2.height - y) }])
    .jpeg({ quality: 60 }).toBuffer();

  let paperBuf = await blankCanvas(WIDTH * 2, HEIGHT, { r: 255, g: 255, b: 255, alpha: 1 });
  paperBuf = await sharp(paperBuf)
    .composite([{ input: bgBuf, left: 0, top: 0 }])
    .rotate(90).flop()
    .withMetadata({ density: 288 })
    .jpeg().toBuffer();

  const posX = style === "ORO" ? 0 : 10;
  const doc = new PDFDocument({ size: [4 * PPI, 9 * PPI] });
  doc.image(paperBuf, posX, 0, { width: heightInches * PPI, height: widthInches * 2 * PPI });
  doc.font(FONT_PATH).fontSize(30).text(`*${sku}*`, 20, 0);
  doc.font("Times-Roman").fontSize(10).text(`${sku} ${style} ${shipping} ${qty}`, 20, 35);

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "15 oz" };
}

// ─── Socks ────────────────────────────────────────────────────────────────────

export async function setupSocks(design_url, color, sku) {
  const patternBuf = await createPattern(design_url, {
    cols:            20,
    rows:            24,
    padding:         75,
    size:            56 * PPI,
    height:          48 * 100,
    backgroundColor: resolveColor(SOCK_COLORS, color.toLowerCase()),
    mirror:          true,
  });

  const finalBuf = await sharp(patternBuf)
    .withMetadata({ density: 144 })
    .png().toBuffer();

  return { base64: finalBuf.toString("base64"), folder: "socks", ext: "png" };
}

// ─── Wrapping Paper ───────────────────────────────────────────────────────────

export async function setupWrappingPaper(width, design_url, sku, color) {
  const height      = inchesToPx(30);
  const effectiveW  = width === 30 ? 15 : width;
  const widthPixels = Math.min(inchesToPx(effectiveW * 11), inchesToPx(6 * 11));
  const col         = (effectiveW === 15) ? 48 : 24;

  const patternBuf = await createPattern(design_url, {
    size:            widthPixels * 2,
    cols:            col,
    rows:            col,
    padding:         75,
    backgroundColor: resolveColor(PAPER_COLORS, color),
  });

  const section = await sharp(patternBuf)
    .withMetadata({ density: 144 })
    .png().toBuffer();

  const doc = new PDFDocument({ size: [widthPixels, height] });
  doc.image(section, 0, 0, { width: widthPixels, height: widthPixels });

  const buf = await pdfToBuffer(doc);
  return { base64: buf.toString("base64"), folder: "pagewide" };
}

// ─── Dispatch helper (item → { base64, folder }) ──────────────────────────────

export async function processItem(item) {
  const code  = item.styleCode;
  const url   = item.design?.front || item.design?.back;
  const sku   = item.pieceId;
  const color = item.colorName;
  const size  = item.sizeName;
  const ship  = item.shippingType || "";
  const qty   = item.order?.items?.length || 1;

  if (code === "BST") {
    return createBeerStein(url, 8.5, 3.75, item.design?.back, sku, ship, qty);
  }
  if (code === "TMUG" || code === "BYEH300W" || code === "21150") {
    return createMug(item);
  }
  if (code === "TH") {
    return createHat(url, sku, color, ship, qty);
  }
  if (["SSB", "AWB", "SLT"].includes(code)) {
    return createSSB(url, sku, size, ship, qty, code);
  }
  if (code === "TEDB") {
    return setupBears(color, url, sku, code, ship, qty);
  }
  if (code === "WRPP") {
    const wrapSizes = { "30 inches x 6 feet": 6, "30 inches x 15 feet": 15, "30 inches x 30 feet": 30 };
    return setupWrappingPaper(wrapSizes[size] ?? 6, url, sku, color);
  }
  if (code === "CANV") {
    return createCanvasPrint(url, color, size, sku);
  }
  // Ornaments and anything else
  const ornDims = { height: 3.5, width: 3.5, margin: 2.1, offset: 0 };
  return createOrn(color, url, ornDims.height, ornDims.width, ornDims.margin, ornDims.offset, sku, code, ship, qty);
}
