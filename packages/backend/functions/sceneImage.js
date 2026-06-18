// AI lifestyle-scene generator for storefront merchandising tiles.
//
// There is no Anthropic image model, so scene generation uses Google's Gemini 2.5 Flash Image
// ("nano banana"), which is strong at compositing a REFERENCE image (the client's real design art)
// into a brand-new photographic scene. We render e.g. "a family watching fireworks wearing a tee
// featuring THIS design", then store the result in Wasabi and return its public URL.
//
// Everything here fails soft: if the key is missing or the API errors, callers fall back to a plain
// catalog photo, so the editor never breaks because of image generation.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const GEMINI_MODEL = "gemini-2.5-flash-image";
const WASABI_BUCKET = "images1.pythiastechnologies.com";

const geminiKey = () =>
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";

// True when we can both generate (Gemini key) and persist (Wasabi creds) an image.
export function sceneGenAvailable() {
    return !!geminiKey() && !!process.env.NEXT_PUBLIC_WASABI_KEY_ID && !!process.env.NEXT_PUBLIC_WASABI_SECRET;
}

let _s3;
function s3() {
    if (_s3) return _s3;
    _s3 = new S3Client({
        credentials: { accessKeyId: process.env.NEXT_PUBLIC_WASABI_KEY_ID, secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET },
        region: "us-west-1",
        endpoint: "https://s3.us-west-1.wasabisys.com/",
    });
    return _s3;
}

async function uploadGenerated(buffer, mime, orgId) {
    const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
    const key = `platform/${orgId || "shared"}/ai-scenes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    try {
        await s3().send(new PutObjectCommand({ Bucket: WASABI_BUCKET, Key: key, Body: buffer, ACL: "public-read", ContentType: mime }));
        return `https://${WASABI_BUCKET}/${key}`;
    } catch { return null; }
}

// Download a reference image (the design art) and base64-encode it for an inline Gemini part.
async function fetchInline(url) {
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        const buf = Buffer.from(await r.arrayBuffer());
        if (!buf.length || buf.length > 8 * 1024 * 1024) return null;
        const mime = (r.headers.get("content-type") || "image/png").split(";")[0];
        return { mime_type: mime, data: buf.toString("base64") };
    } catch { return null; }
}

const MAX_REFS = 4;   // how many distinct design references we'll hand the model in one render

// Core: render `promptText` (with 0..MAX_REFS reference images) via Gemini. Returns { buffer, mime }|null.
async function renderImage({ promptText, referenceUrls = [] }) {
    const key = geminiKey();
    if (!key || !promptText) return null;

    const urls = (Array.isArray(referenceUrls) ? referenceUrls : [referenceUrls]).filter(Boolean).slice(0, MAX_REFS);
    const inlines = (await Promise.all(urls.map(fetchInline))).filter(Boolean);
    const parts = [{ text: promptText }, ...inlines.map((inline) => ({ inline_data: inline }))];

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        for (const p of (data?.candidates?.[0]?.content?.parts || [])) {
            const d = p.inlineData || p.inline_data;
            if (d?.data) return { buffer: Buffer.from(d.data, "base64"), mime: d.mimeType || d.mime_type || "image/png" };
        }
    } catch { return null; }
    return null;
}

// Render + persist to Wasabi. Returns a public URL|null.
async function renderAndStore({ promptText, referenceUrls, orgId }) {
    const out = await renderImage({ promptText, referenceUrls });
    if (!out) return null;
    return uploadGenerated(out.buffer, out.mime, orgId);
}

// Instruction for how to use the supplied design reference(s): faithfully, one-per-person when several.
const designInstruction = (n) =>
    n <= 0 ? ""
    : n === 1 ? `Faithfully incorporate the graphic/design shown in the reference image onto the apparel — reproduce it accurately, do not redesign it.\n`
    : `${n} different design references are provided. If the image shows multiple people, give EACH person a DIFFERENT design from these references (one design per person); if only one person, use any one. Reproduce each design faithfully — do not redesign or merge them.\n`;

// Prompt shared by the URL and data-URL general generators.
const generalPrompt = (prompt, refCount, aspect) =>
    `Create a high-quality, photorealistic image for an online store's promotional tile.\n` +
    `Description: ${prompt}.\n` +
    designInstruction(refCount) +
    `Crisp and well-lit, high detail, no text overlays, no watermarks, no borders.` + orientationHint(aspect);

const orientationHint = (aspect) => {
    const a = Number(aspect);
    if (!a || Number.isNaN(a)) return "";
    if (a >= 1.3) return " Use a wide horizontal composition.";
    if (a <= 0.77) return " Use a tall vertical composition.";
    return " Use a balanced square composition.";
};

/**
 * Generate one lifestyle scene image and return its Wasabi URL (or null on any failure).
 * @param {string}   scene         Short scene description, e.g. "a family watching fireworks".
 * @param {string[]} designArtUrls Client design artwork(s) to place on the apparel (one per person if several).
 * @param {string}   theme         Campaign theme for tone, e.g. "4th of July".
 * @param {string}   orgId         Owning org (storage path).
 */
export async function generateSceneImage({ scene, designArtUrls = [], theme = "", orgId } = {}) {
    if (!scene) return null;
    const urls = (Array.isArray(designArtUrls) ? designArtUrls : [designArtUrls]).filter(Boolean);
    const n = urls.length;
    const wearLine = n === 0
        ? `The people are wearing tasteful t-shirts fitting the theme.\n`
        : n === 1
            ? `The people are wearing t-shirts that prominently feature the EXACT graphic design shown in the reference image — reproduce that artwork faithfully, centered on the chest. Do not redesign it or add extra text.\n`
            : `${n} different design references are provided. Give EACH person a DIFFERENT design from these references (one design per person), reproduced faithfully on their shirt, centered on the chest. Do not redesign, merge, or add extra text.\n`;
    const promptText =
        `Create a warm, photorealistic lifestyle photograph for an online apparel store's promotional banner.\n` +
        `Scene: ${scene}.${theme ? ` Seasonal theme: ${theme}.` : ""}\n` +
        wearLine +
        `Candid and natural, soft natural lighting, shallow depth of field, high detail, no text overlays, no watermarks. Composition should work as a wide banner.`;
    return renderAndStore({ promptText, referenceUrls: urls, orgId });
}

/**
 * General-purpose tile image generator from a free-text description (manual "describe this image").
 * @param {string}   prompt         What the user wants to see.
 * @param {string[]} referenceUrls  Optional design art(s) to incorporate (one per person if several).
 * @param {number}   aspect         Tile aspect ratio (width/height) to hint composition.
 * @param {string}   orgId          Owning org (storage path).
 */
export async function generateImage({ prompt, referenceUrls = [], aspect, orgId } = {}) {
    if (!prompt) return null;
    const urls = (Array.isArray(referenceUrls) ? referenceUrls : [referenceUrls]).filter(Boolean);
    return renderAndStore({ promptText: generalPrompt(prompt, urls.length, aspect), referenceUrls: urls, orgId });
}

/**
 * Same as generateImage, but returns a base64 data URL instead of persisting to Wasabi — used so the
 * editor can load the result straight into its cropper (same-origin data URL → no canvas CORS taint).
 * The cropped result is what actually gets uploaded.
 */
export async function generateImageDataUrl({ prompt, referenceUrls = [], aspect } = {}) {
    if (!prompt) return null;
    const urls = (Array.isArray(referenceUrls) ? referenceUrls : [referenceUrls]).filter(Boolean);
    const out = await renderImage({ promptText: generalPrompt(prompt, urls.length, aspect), referenceUrls: urls });
    if (!out) return null;
    return `data:${out.mime};base64,${out.buffer.toString("base64")}`;
}
