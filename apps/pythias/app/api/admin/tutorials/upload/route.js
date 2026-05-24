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

async function uploadFile(file, folder) {
    const ext  = file.name.split(".").pop();
    const key  = `tutorials/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buf  = Buffer.from(await file.arrayBuffer());
    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buf,
        ACL:         "public-read",
        ContentType: file.type,
    }));
    return `https://${BUCKET}/${key}`;
}

export async function POST(req) {
    const formData = await req.formData();
    const result   = {};

    const video     = formData.get("video");
    const thumbnail = formData.get("thumbnail");

    if (video && video.size > 0)         result.videoUrl     = await uploadFile(video,     "videos");
    if (thumbnail && thumbnail.size > 0) result.thumbnailUrl = await uploadFile(thumbnail, "thumbnails");

    return NextResponse.json(result);
}
