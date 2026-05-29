import sharp from "sharp";
import { createCanvas, loadImage } from "canvas";
import { jsPDF } from "jspdf";
import { BUTTON_COLORS } from "./colors.js";

export class GenerateButtons {
  constructor() {
    this.cropped    = null;
    this.design     = null;
    this.lastDesign = "";
    this.i          = 0;
    this.lastBg     = "";
    this.bg         = null;
  }

  async generate(buttons) {
    const style = {
      box: {
        garment: {
          height:       7625.531914893619,
          width:        7625.531914893619,
          left:         1254.78723404255,
          margin:       2796.27659574468,
          designWidth:  2800,
          designHeight: 3023.40425531915,
        },
      },
    };

    const BUTTON_SIZE          = 2370;
    const scale_image_to_button = 3300 / BUTTON_SIZE;
    const c                    = createCanvas(7230, 9672);
    const ctx                  = c.getContext("2d");
    const MAX_COL              = Math.floor(c.width / BUTTON_SIZE);
    const PADDING              = (c.width - BUTTON_SIZE * MAX_COL) / MAX_COL;

    let row = 1;
    let col = 1;

    for (const btn of buttons) {
      this.i++;

      if (btn.design_image !== this.lastDesign) {
        this.cropped    = await cropDesign(btn.design_image);
        this.design     = await loadImage(this.cropped.design);
        this.lastDesign = btn.design_image;
      }

      let coordinates    = { ...style.box.garment };
      const scaleWidth   = 2100 / this.cropped.width;
      const fitResult    = fitDesign(
        coordinates.designHeight * 1.1,
        coordinates.designWidth  * 1.1,
        this.cropped.height * scaleWidth,
        this.cropped.width  * scaleWidth
      );
      coordinates.designWidth  = fitResult.width;
      coordinates.designHeight = fitResult.height;

      if (col > MAX_COL) {
        col = 1;
        row++;
      }

      const radius = BUTTON_SIZE / 2;
      const x      = BUTTON_SIZE * col - radius + PADDING * (col - 1);
      const y      = BUTTON_SIZE * row - radius + PADDING * (row - 1);

      ctx.beginPath();
      ctx.save();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.clip();

      const colorVal = BUTTON_COLORS[(btn.color || "").toLowerCase()];
      if (typeof colorVal === "string") {
        ctx.fillStyle = colorVal;
        ctx.fill();
      } else if (colorVal?.url) {
        if (this.lastBg !== colorVal.url) {
          this.bg     = await loadImage(colorVal.url);
          this.lastBg = colorVal.url;
        }
        ctx.drawImage(this.bg, x - radius, y - radius, BUTTON_SIZE, BUTTON_SIZE);
      }

      ctx.stroke();
      ctx.restore();

      const scale_button  = (BUTTON_SIZE * scale_image_to_button) / style.box.garment.width;
      const designWidth   = coordinates.designWidth  * scale_button;
      const designHeight  = coordinates.designHeight * scale_button;
      ctx.drawImage(this.design, x - designWidth / 2, y - designHeight / 2, designWidth, designHeight);

      col++;
    }

    const heightInches = 11;
    const widthInches  = 8.5;
    const dataUrl      = c.toDataURL("image/png", 0.8);
    return { image: dataUrl, heightInches, widthInches };
  }
}

export async function createButtonsPdf(poNumber, buttons) {
  const allButtons = [];
  for (const btn of buttons) {
    const qty = Number(btn.quantity) * Number(btn.size.replace(/[a-zA-Z\s]/gi, ""));
    for (let i = 0; i < qty; i++) allButtons.push(btn);
  }

  const CHUNK     = 12;
  const chunks    = [];
  const generator = new GenerateButtons();
  for (let i = 0; i < allButtons.length; i += CHUNK) {
    chunks.push(await generator.generate(allButtons.slice(i, i + CHUNK)));
  }

  const doc = new jsPDF({
    orientation:  "p",
    unit:         "in",
    format:       [chunks[0].widthInches, chunks[0].heightInches],
    compressPdf:  true,
  });

  chunks.forEach((chunk, i) => {
    doc.addImage(chunk.image, "PNG", 0, 0, chunk.widthInches, chunk.heightInches, undefined, "FAST");
    if (i < chunks.length - 1) doc.addPage();
  });

  const buf = Buffer.from(doc.output("arraybuffer"));
  return { base64: buf.toString("base64"), folder: "buttons" };
}

function fitDesign(boxHeight, boxWidth, designHeight, designWidth) {
  const heightDiff = Math.abs(boxHeight - designHeight);
  const widthDiff  = Math.abs(boxWidth  - designWidth);
  let scale;
  if (heightDiff > widthDiff) {
    scale = boxHeight / designHeight;
    if (scale > boxWidth / designWidth) scale = boxWidth / designWidth;
  } else {
    scale = boxWidth / designWidth;
    if (scale > boxHeight / designHeight) scale = boxHeight / designHeight;
  }
  return { height: scale * designHeight, width: scale * designWidth, scale };
}

async function cropDesign(url) {
  const resp    = await fetch(url);
  const buf     = Buffer.from(await resp.arrayBuffer());
  const trimmed = await sharp(buf).trim().png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const data = `data:image/png;base64,${trimmed.toString("base64")}`;
  return { design: data, width, height };
}
