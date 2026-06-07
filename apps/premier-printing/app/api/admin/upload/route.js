import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.NEXT_PUBLIC_WASABI_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const BUCKET = "images1.pythiastechnologies.com";
const MAX_MB = 50;

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const form   = await req.formData();
    const file   = form.get("file");
    const folder = form.get("folder") ?? "uploads";

    if (!file) return NextResponse.json({ error: true, msg: "No file provided" });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.byteLength > MAX_MB * 1024 * 1024)
        return NextResponse.json({ error: true, msg: `File exceeds ${MAX_MB} MB` });

    const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .toLowerCase();

    const key = `premier/${folder}/${Date.now()}-${safeName}`;

    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ACL:         "public-read",
        ContentType: file.type || "application/octet-stream",
    }));

    return NextResponse.json({
        error: false,
        url:      `https://${BUCKET}/${key}`,
        key,
        fileName: file.name,
        fileType: file.type,
        fileSize: buffer.byteLength,
    });
}
