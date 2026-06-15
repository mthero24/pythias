export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { resolveOrg } from "@/lib/resolveOrg";

// POST /api/reviews/upload — accepts a base64 data URL image, stores it server-side (S3/Wasabi
// via env credentials — never expose keys client-side), returns the public URL for a review photo.
const ENDPOINT = process.env.WASABI_ENDPOINT || "https://s3.us-west-1.wasabisys.com/";
const REGION = process.env.WASABI_REGION || "us-west-1";
const BUCKET = process.env.STOREFRONT_UPLOAD_BUCKET;
const PUBLIC_BASE = process.env.WASABI_PUBLIC_BASE;   // e.g. https://cdn.example.com  (no trailing slash)
const MAX_BYTES = 6 * 1024 * 1024;

function client() {
    const accessKeyId = process.env.WASABI_ACCESS_KEY, secretAccessKey = process.env.WASABI_SECRET_KEY;
    if (!accessKeyId || !secretAccessKey || !BUCKET) return null;
    return new S3Client({ credentials: { accessKeyId, secretAccessKey }, region: REGION, endpoint: ENDPOINT });
}

export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const s3 = client();
    if (!s3) return NextResponse.json({ error: "Uploads are not configured for this store" }, { status: 503 });

    const { dataUrl } = await req.json().catch(() => ({}));
    const m = /^data:(image\/(png|jpe?g|webp|gif));base64,(.+)$/.exec(dataUrl || "");
    if (!m) return NextResponse.json({ error: "Send a base64 image data URL" }, { status: 400 });
    const contentType = m[1];
    const ext = m[2].replace("jpeg", "jpg");
    const buffer = Buffer.from(m[3], "base64");
    if (buffer.length > MAX_BYTES) return NextResponse.json({ error: "Image too large (max 6MB)" }, { status: 400 });

    const key = `reviews/${ctx.orgId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    try {
        await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType, ACL: "public-read" }));
        const base = PUBLIC_BASE || `${ENDPOINT.replace(/\/$/, "")}/${BUCKET}`;
        return NextResponse.json({ error: false, url: `${base}/${key}` });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
