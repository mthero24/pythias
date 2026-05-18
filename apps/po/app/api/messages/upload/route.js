import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId:     "XWHXU4FP7MT2V842ITN9",
        secretAccessKey: "kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3",
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const BUCKET = "images1.pythiastechnologies.com";
const MAX_MB = 20;

export async function POST(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: true, msg: "No file" });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.byteLength > MAX_MB * 1024 * 1024)
        return NextResponse.json({ error: true, msg: `File exceeds ${MAX_MB} MB` });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `messages/${Date.now()}-${safeName}`;

    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ACL:         "public-read",
        ContentType: file.type || "application/octet-stream",
    }));

    const url = `https://${BUCKET}/${key}`;
    return NextResponse.json({ error: false, url, fileName: file.name, fileType: file.type, fileSize: buffer.byteLength });
}
