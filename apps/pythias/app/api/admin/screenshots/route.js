export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const BUCKET  = process.env.WASABI_BUCKET || "images1.pythiastechnologies.com";
const CDN_BASE = `https://${BUCKET}`;
const PREFIX  = "screenshots/";

const ALLOWED_SLOTS = [
    "fc-production-queue",
    "fc-order-detail",
    "fc-analytics",
    "cc-order-routing",
    "cc-product-studio",
    "cc-analytics",
    "sf-ai-builder",
    "sf-storefront",
    "sf-analytics",
];

const CONTENT_TYPES = {
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
};

export async function GET() {
    try {
        const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX }));
        const objects = (res.Contents || []).map(obj => ({
            key:  obj.Key,
            url:  `${CDN_BASE}/${obj.Key}`,
            slot: obj.Key.replace(PREFIX, "").split(".")[0],
            size: obj.Size,
            lastModified: obj.LastModified,
        }));
        return NextResponse.json({ objects });
    } catch (err) {
        console.error("[screenshots GET]", err);
        return NextResponse.json({ objects: [] });
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const slot = formData.get("slot");

        if (!file || !slot) {
            return NextResponse.json({ error: "Missing file or slot" }, { status: 400 });
        }
        if (!ALLOWED_SLOTS.includes(slot)) {
            return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
        }

        const ext = file.name.split(".").pop()?.toLowerCase();
        const contentType = CONTENT_TYPES[ext];
        if (!contentType) {
            return NextResponse.json({ error: "Only png, jpg, or webp allowed" }, { status: 400 });
        }

        const key  = `${PREFIX}${slot}.${ext}`;
        const body = Buffer.from(await file.arrayBuffer());

        await s3.send(new PutObjectCommand({
            Bucket:      BUCKET,
            Key:         key,
            Body:        body,
            ACL:         "public-read",
            ContentType: contentType,
        }));

        const url = `${CDN_BASE}/${key}`;
        return NextResponse.json({ ok: true, url, key, slot });
    } catch (err) {
        console.error("[screenshots POST]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { key } = await request.json();
        if (!key || !key.startsWith(PREFIX) || key.includes("..")) {
            return NextResponse.json({ error: "Invalid key" }, { status: 400 });
        }
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[screenshots DELETE]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
