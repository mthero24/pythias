// Branded cover-image generator for AI-written articles. Gemini 2.5 Flash Image renders a
// topic-relevant editorial photo, then we composite the REAL Pythias logo (public/logo.png — gold
// on transparent) over a dark bottom gradient with sharp (pixel-perfect, always legible), and
// store the result in Wasabi/CDN — served via images1.pythiastechnologies.com, NOT Next's public
// folder (which doesn't reliably serve files written at runtime). Returns the public URL.
// Fails soft everywhere: missing GEMINI/Wasabi creds or any error -> null, and the article is imageless.
import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const GEMINI_MODEL  = "gemini-2.5-flash-image";
const WASABI_BUCKET = "images1.pythiastechnologies.com";
const geminiKey = () =>
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";
const wasabiReady = () =>
    !!process.env.NEXT_PUBLIC_WASABI_KEY_ID && !!process.env.NEXT_PUBLIC_WASABI_SECRET;

const PROMPT = (topic) =>
    `A clean, modern, professional editorial photograph representing: ${topic}. ` +
    `Context: print shops and custom apparel decoration (DTG, DTF, screen print, embroidery), order ` +
    `fulfillment, warehousing, and ecommerce operations. Realistic, well-lit, high detail, a polished ` +
    `business/industrial aesthetic. No text, no logos, no watermarks, no borders. Wide horizontal composition.`;

async function renderGemini(promptText) {
    const key = geminiKey();
    if (!key) return null;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        for (const p of (data?.candidates?.[0]?.content?.parts || [])) {
            const d = p.inlineData || p.inline_data;
            if (d?.data) return Buffer.from(d.data, "base64");
        }
    } catch { /* fail soft */ }
    return null;
}

// Resize to 1200x630, darken the bottom, drop the gold logo bottom-right. Fails soft to the raw image.
async function brand(buffer) {
    let sharp;
    try { sharp = (await import("sharp")).default; } catch { return buffer; }
    try {
        const W = 1200, H = 630;
        const base = await sharp(buffer).resize(W, H, { fit: "cover" }).toBuffer();
        const gradient = Buffer.from(
            `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0.5" x2="0" y2="1">` +
            `<stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0a0a" stop-opacity="0.8"/>` +
            `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
        );
        const layers = [{ input: gradient, top: 0, left: 0 }];
        try {
            const logoRaw = await fs.readFile(path.join(process.cwd(), "public", "logo.png"));
            const LH = 150;
            const logo = await sharp(logoRaw).resize({ height: LH }).png().toBuffer();
            const meta = await sharp(logo).metadata();
            layers.push({ input: logo, top: H - LH - 22, left: W - (meta.width || 115) - 36 });
        } catch { /* no logo overlay if it can't be read */ }
        return await sharp(base).composite(layers).png().toBuffer();
    } catch {
        return buffer;
    }
}

async function uploadWasabi(buffer) {
    const s3 = new S3Client({
        credentials: { accessKeyId: process.env.NEXT_PUBLIC_WASABI_KEY_ID, secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET },
        region: "us-west-1",
        endpoint: "https://s3.us-west-1.wasabisys.com/",
    });
    const key = `article-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    await s3.send(new PutObjectCommand({ Bucket: WASABI_BUCKET, Key: key, Body: buffer, ACL: "public-read", ContentType: "image/png" }));
    return `https://${WASABI_BUCKET}/${key}`;
}

/**
 * Generate a branded cover image for an article topic.
 * @returns {Promise<string|null>} a public CDN URL, or null on any failure.
 */
export async function generateArticleImage({ topic } = {}) {
    if (!topic || !geminiKey() || !wasabiReady()) return null;
    const raw = await renderGemini(PROMPT(topic));
    if (!raw) return null;
    const branded = await brand(raw);
    try {
        return await uploadWasabi(branded);
    } catch {
        return null;
    }
}
