import { NextResponse } from "next/server";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.WASABI_ACCESS_KEY || process.env.NEXT_PUBLIC_WASABI_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_KEY || process.env.NEXT_PUBLIC_WASABI_SECRET,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});
const BUCKET = process.env.WASABI_BUCKET || "images1.pythiastechnologies.com";

// Font-family values passed to librsvg — use generic families that resolve reliably
const FONT_MAP = {
    "Sans Serif": "sans-serif",
    "Serif":      "serif",
    "Monospace":  "monospace",
    "Bold":       "sans-serif",     // handled via font-weight
    "Italic":     "sans-serif",     // handled via font-style
    "Condensed":  "Arial Narrow, sans-serif",
};

const FONT_WEIGHT = { "Bold": "bold" };
const FONT_STYLE  = { "Italic": "italic" };

// POST — render text to PNG and upload to Wasabi
// Body: { text, fontFamily, fontSize, color, bgColor? }
export async function POST(request) {
    try {
        const {
            text       = "",
            fontFamily = "Sans Serif",
            color      = "#000000",
            bgColor,
        } = await request.json();

        if (!text.trim()) return NextResponse.json({ error: "text is required" }, { status: 400 });

        const family = FONT_MAP[fontFamily] || "sans-serif";
        const weight = FONT_WEIGHT[fontFamily] || "normal";
        const style  = FONT_STYLE[fontFamily]  || "normal";

        // Auto-scale font size so text naturally fills 2500px
        // Avg char width ≈ 0.58× fontSize for most fonts; leave 2% side padding
        const usableWidth = 2500 * 0.96;
        const charRatio   = fontFamily === "Monospace" ? 0.6 : fontFamily === "Condensed" ? 0.45 : 0.58;
        const fSize       = Math.min(600, Math.floor(usableWidth / (text.length * charRatio)));

        const width  = 2500;
        const height = Math.ceil(fSize * 1.6);

        const bg = bgColor
            ? `<rect width="${width}" height="${height}" fill="${bgColor}" />`
            : "";

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:transparent">
  ${bg}
  <text
    x="${width / 2}"
    y="${height / 2}"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="${family}"
    font-size="${fSize}"
    font-weight="${weight}"
    font-style="${style}"
    fill="${color}"
  >${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
</svg>`;

        const pngBuf = await sharp(Buffer.from(svg))
            .ensureAlpha()
            .png()
            .toBuffer();

        const key = `text-images/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
        await s3.send(new PutObjectCommand({
            Bucket:      BUCKET,
            Key:         key,
            Body:        pngBuf,
            ACL:         "public-read",
            ContentType: "image/png",
        }));

        return NextResponse.json({ url: `https://${BUCKET}/${key}` });
    } catch (err) {
        console.error("[text-to-image]", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
