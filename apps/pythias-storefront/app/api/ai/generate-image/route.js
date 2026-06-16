export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { resolveOrg } from "@/lib/resolveOrg";

// POST /api/ai/generate-image { prompt } — generate apparel artwork via OpenAI (transparent PNG),
// store it on our CDN (so the design canvas can export it without CORS taint), return the URL.
const ENDPOINT = process.env.WASABI_ENDPOINT || "https://s3.us-west-1.wasabisys.com/";
const REGION = process.env.WASABI_REGION || "us-west-1";
const BUCKET = process.env.STOREFRONT_UPLOAD_BUCKET;
const PUBLIC_BASE = process.env.WASABI_PUBLIC_BASE;

function s3() {
    const accessKeyId = process.env.WASABI_ACCESS_KEY, secretAccessKey = process.env.WASABI_SECRET_KEY;
    if (!accessKeyId || !secretAccessKey || !BUCKET) return null;
    return new S3Client({ credentials: { accessKeyId, secretAccessKey }, region: REGION, endpoint: ENDPOINT });
}

export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI image generation isn't enabled for this store." }, { status: 503 });
    const store = s3();
    if (!store) return NextResponse.json({ error: "Image storage isn't configured." }, { status: 503 });

    const { prompt } = await req.json().catch(() => ({}));
    if (!prompt || !String(prompt).trim()) return NextResponse.json({ error: "Describe the design you want." }, { status: 400 });

    try {
        const r = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-image-1",
                prompt: `${String(prompt).slice(0, 800)} — design for apparel printing, isolated on a transparent background, crisp edges, no mockup, no garment.`,
                size: "1024x1024", n: 1, background: "transparent", output_format: "png",
            }),
            signal: AbortSignal.timeout(120000),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) return NextResponse.json({ error: j.error?.message || `Generation failed (HTTP ${r.status})` }, { status: 400 });
        const b64 = j.data?.[0]?.b64_json;
        if (!b64) return NextResponse.json({ error: "No image returned." }, { status: 502 });

        const key = `custom/${ctx.orgId}/ai-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.png`;
        await store.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: Buffer.from(b64, "base64"), ContentType: "image/png", ACL: "public-read" }));
        const base = PUBLIC_BASE || `${ENDPOINT.replace(/\/$/, "")}/${BUCKET}`;
        return NextResponse.json({ error: false, url: `${base}/${key}` });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
