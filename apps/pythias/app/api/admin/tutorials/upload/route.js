export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const BUCKET = process.env.WASABI_BUCKET || "images1.pythiastechnologies.com";

export async function POST(req) {
    try {
        const { searchParams } = new URL(req.url);
        const folder      = searchParams.get("folder")      || "videos";
        const filename    = searchParams.get("filename")    || `file-${Date.now()}`;
        const contentType = searchParams.get("contentType") || "application/octet-stream";

        const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
        const key = `tutorials/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const buf = Buffer.from(await req.arrayBuffer());
        if (!buf.length) return NextResponse.json({ error: "Empty body" }, { status: 400 });

        await s3.send(new PutObjectCommand({
            Bucket:      BUCKET,
            Key:         key,
            Body:        buf,
            ACL:         "public-read",
            ContentType: contentType,
        }));

        return NextResponse.json({ url: `https://${BUCKET}/${key}` });
    } catch (err) {
        console.error("[tutorials/upload]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
