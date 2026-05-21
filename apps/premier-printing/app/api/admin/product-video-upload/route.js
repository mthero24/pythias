import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    credentials: {
        accessKeyId: "XWHXU4FP7MT2V842ITN9",
        secretAccessKey: "kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3",
    },
    region: "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});
const BUCKET = "images1.pythiastechnologies.com";

export async function POST(req) {
    const formData = await req.formData();
    const file = formData.get("video");
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const allowed = ["mp4", "mov", "webm", "avi"];
    if (!allowed.includes(ext)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const key = `products/videos/${Date.now()}.${ext}`;

    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: file.type || "video/mp4",
        ACL: "public-read",
    }));

    return NextResponse.json({ videoUrl: `https://images1.pythiastechnologies.com/${key}` });
}
