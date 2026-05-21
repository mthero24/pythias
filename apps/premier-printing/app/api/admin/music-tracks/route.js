import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MusicTrack } from "@pythias/mongo";

const s3 = new S3Client({
    credentials: {
        accessKeyId: "XWHXU4FP7MT2V842ITN9",
        secretAccessKey: "kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3",
    },
    region: "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});
const BUCKET = "images1.pythiastechnologies.com";

// CC0-licensed tracks from OpenGameArt.org
const SEED_TRACKS = [
    {
        name: "Upbeat",
        category: "upbeat",
        srcUrl: "https://opengameart.org/sites/default/files/Happy%20Upbeat%20Short.mp3",
    },
    {
        name: "Corporate",
        category: "corporate",
        srcUrl: "https://opengameart.org/sites/default/files/pleasant_contrast_1.mp3",
    },
    {
        name: "Ambient",
        category: "ambient",
        srcUrl: "https://opengameart.org/sites/default/files/caller_0.mp3",
    },
    {
        name: "Cinematic",
        category: "cinematic",
        srcUrl: "https://opengameart.org/sites/default/files/keyframe_audio-inspirational-cinematic-ambient-after-the-storm-133540.mp3",
    },
];

async function uploadToS3(buffer, key) {
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "audio/mpeg",
        ACL: "public-read",
    }));
    return `https://images1.pythiastechnologies.com/${key}`;
}

export async function GET() {
    const tracks = await MusicTrack.find({}).sort({ isDefault: -1, createdAt: 1 }).lean();
    return NextResponse.json({ tracks });
}

export async function POST(req) {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const { action } = await req.json();
        if (action !== "seed") return NextResponse.json({ error: "unknown action" }, { status: 400 });

        const results = [];
        for (const track of SEED_TRACKS) {
            try {
                const res = await fetch(track.srcUrl);
                if (!res.ok) {
                    results.push({ name: track.name, success: false, error: `HTTP ${res.status}` });
                    continue;
                }
                const buf = Buffer.from(await res.arrayBuffer());
                const url = await uploadToS3(buf, `music/${track.category}.mp3`);
                await MusicTrack.findOneAndUpdate(
                    { category: track.category, isDefault: true },
                    { name: track.name, category: track.category, url, isDefault: true },
                    { upsert: true, new: true }
                );
                results.push({ name: track.name, success: true, url });
            } catch (e) {
                results.push({ name: track.name, success: false, error: e.message });
            }
        }
        return NextResponse.json({ results });
    }

    // File upload
    const formData = await req.formData();
    const file = formData.get("file");
    const name = (formData.get("name") || "").trim();
    if (!file || !name) return NextResponse.json({ error: "file and name required" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const allowed = ["mp3", "m4a", "ogg", "wav"];
    if (!allowed.includes(ext)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const key = `music/${Date.now()}.${ext}`;
    const url = await uploadToS3(buf, key);
    const track = await MusicTrack.create({ name, url });
    return NextResponse.json({ track });
}

export async function DELETE(req) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const track = await MusicTrack.findByIdAndDelete(id).lean();
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
}
