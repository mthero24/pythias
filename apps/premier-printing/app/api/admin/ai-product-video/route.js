import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Products } from "@pythias/mongo";
import crypto from "crypto";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const s3 = new S3Client({
    credentials: {
        accessKeyId: "XWHXU4FP7MT2V842ITN9",
        secretAccessKey: "kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3",
    },
    region: "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});
const BUCKET = "images1.pythiastechnologies.com";

function klingToken() {
    const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const p = Buffer.from(JSON.stringify({
        iss: process.env.KlingAccessKey,
        exp: now + 1800,
        nbf: now - 5,
    })).toString("base64url");
    const sig = crypto.createHmac("sha256", process.env.KlingSecretKey)
        .update(`${h}.${p}`)
        .digest("base64url");
    return `${h}.${p}.${sig}`;
}

async function uploadToS3(buffer, contentType = "video/mp4", ext = "mp4") {
    const key = `products/videos/${Date.now()}.${ext}`;
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
    }));
    return `https://images1.pythiastechnologies.com/${key}`;
}

async function fetchImageAsBase64(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    return Buffer.from(await res.arrayBuffer()).toString("base64");
}

// Add background music to an existing video buffer. Music is looped and faded out.
async function addMusicToBuffer(videoBuf, musicUrl, duration) {
    const { default: ffmpeg } = await import("fluent-ffmpeg");
    const { default: ffmpegPath } = await import("ffmpeg-static");
    ffmpeg.setFfmpegPath(ffmpegPath);

    const tmpDir = join(tmpdir(), `music-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    const videoPath = join(tmpDir, "video.mp4");
    const musicPath = join(tmpDir, "music.mp3");
    const outputPath = join(tmpDir, "output.mp4");

    const musicRes = await fetch(musicUrl);
    if (!musicRes.ok) throw new Error("Could not fetch music track");

    await Promise.all([
        writeFile(videoPath, videoBuf),
        writeFile(musicPath, Buffer.from(await musicRes.arrayBuffer())),
    ]);

    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(musicPath).inputOptions(["-stream_loop -1"])
            .outputOptions([
                "-map 0:v",
                "-map 1:a",
                "-c:v copy",
                "-c:a aac", "-b:a 128k",
                `-af afade=t=out:st=${Math.max(0, duration - 2)}:d=2`,
                `-t ${duration}`,
            ])
            .output(outputPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
    });

    const buf = await readFile(outputPath);
    await Promise.all([videoPath, musicPath, outputPath].map(p => unlink(p).catch(() => {})));
    await unlink(tmpDir).catch(() => {});
    return buf;
}

async function createSlideshow(imageUrls, musicUrl) {
    const { default: ffmpeg } = await import("fluent-ffmpeg");
    const { default: ffmpegPath } = await import("ffmpeg-static");
    ffmpeg.setFfmpegPath(ffmpegPath);

    const tmpDir = join(tmpdir(), `slideshow-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    const imagePaths = [];
    for (let i = 0; i < imageUrls.length; i++) {
        const res = await fetch(imageUrls[i]);
        if (!res.ok) continue;
        const p = join(tmpDir, `img${i}.jpg`);
        await writeFile(p, Buffer.from(await res.arrayBuffer()));
        imagePaths.push(p);
    }
    if (!imagePaths.length) throw new Error("No images could be fetched for slideshow");

    let musicPath;
    if (musicUrl) {
        const musicRes = await fetch(musicUrl);
        if (musicRes.ok) {
            musicPath = join(tmpDir, "music.mp3");
            await writeFile(musicPath, Buffer.from(await musicRes.arrayBuffer()));
        }
    }

    const outputPath = join(tmpDir, "slideshow.mp4");
    const IMAGE_DURATION = 3.0;
    const XFADE_DURATION = 0.8;
    const n = imagePaths.length;
    const totalDuration = n * IMAGE_DURATION;

    await new Promise((resolve, reject) => {
        let cmd = ffmpeg();

        // Long input duration so xfade never runs out of source frames at the transition boundary
        imagePaths.forEach(p => cmd = cmd.input(p).inputOptions(["-loop 1", "-t 999"]));
        if (musicPath) cmd = cmd.input(musicPath).inputOptions(["-stream_loop -1"]);

        const filterParts = [];

        // Normalize each image: scale, pad, fix SAR, then lock to 30fps so xfade timing is frame-accurate
        for (let i = 0; i < n; i++) {
            filterParts.push(
                `[${i}:v]scale=1080:1080:force_original_aspect_ratio=decrease,` +
                `pad=1080:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[s${i}]`
            );
        }

        if (n === 1) {
            filterParts.push(`[s0]copy[vout]`);
        } else {
            let prev = "[s0]";
            for (let i = 1; i < n; i++) {
                const offset = i * IMAGE_DURATION;
                const out = i < n - 1 ? `[x${i}]` : "[vout]";
                filterParts.push(`${prev}[s${i}]xfade=transition=fade:duration=${XFADE_DURATION}:offset=${offset}${out}`);
                prev = `[x${i}]`;
            }
        }

        // Audio in the complex filter so it's properly mapped with the video output
        if (musicPath) {
            filterParts.push(
                `[${n}:a]atrim=0:${totalDuration},` +
                `afade=t=out:st=${Math.max(0, totalDuration - 2)}:d=2[aout]`
            );
        }

        const maps = musicPath ? ["vout", "aout"] : "vout";

        cmd
            .complexFilter(filterParts.join(";"), maps)
            .outputOptions([
                "-c:v libx264", "-crf 20", "-preset medium",
                "-pix_fmt yuv420p",
                `-t ${totalDuration}`,
                ...(musicPath ? ["-c:a aac", "-b:a 128k"] : []),
            ])
            .output(outputPath)
            .on("end", resolve)
            .on("error", reject)
            .run();
    });

    const buf = await readFile(outputPath);
    const videoUrl = await uploadToS3(buf);
    await Promise.all([...imagePaths, outputPath, musicPath].filter(Boolean).map(p => unlink(p).catch(() => {})));
    await unlink(tmpDir).catch(() => {});
    return videoUrl;
}

// POST — submit generation task
// Body: { type: "ai" | "slideshow", imageUrl?, imageUrls?, musicUrl?, productId? }
export async function POST(req) {
    const { type, imageUrl, imageUrls = [], musicUrl, productId } = await req.json();

    if (type === "ai") {
        if (!process.env.KlingAccessKey || !process.env.KlingSecretKey) {
            return NextResponse.json({ error: "Kling API keys not configured" }, { status: 500 });
        }
        const token = klingToken();
        let imageData;
        try {
            imageData = await fetchImageAsBase64(imageUrl);
        } catch (e) {
            return NextResponse.json({ error: `Could not fetch product image: ${e.message}` }, { status: 400 });
        }
        const res = await fetch("https://api.klingai.com/v1/videos/image2video", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                model_name: "kling-v1-6",
                image: imageData,
                prompt: "Product showcase, smooth flowing camera movement, elegant reveal of the design, soft studio lighting, clean background, professional commercial style",
                negative_prompt: "blurry, distorted, low quality, text, watermark, shaky camera, jerky motion, stuttering",
                cfg_scale: 0.5,
                mode: "pro",
                duration: "10",
            }),
        });
        const data = await res.json();
        if (data.code !== 0) return NextResponse.json({ error: data.message }, { status: 500 });
        const taskId = data.data.task_id;
        // Persist taskId so polling can resume even if the client navigates away
        if (productId) {
            Products.findByIdAndUpdate(productId, {
                $set: { pendingVideoTask: { taskId, musicUrl: musicUrl ?? null } },
            }).catch(() => {});
        }
        return NextResponse.json({ taskId });
    }

    if (type === "slideshow") {
        const urls = imageUrls.length ? imageUrls : [imageUrl].filter(Boolean);
        if (!urls.length) return NextResponse.json({ error: "No images provided" }, { status: 400 });
        try {
            const videoUrl = await createSlideshow(urls, musicUrl ?? null);
            return NextResponse.json({ videoUrl });
        } catch (e) {
            return NextResponse.json({ error: e.message }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "type must be ai or slideshow" }, { status: 400 });
}

// GET — poll AI video task status
// Query: ?taskId=string&musicUrl=string(optional)
export async function GET(req) {
    const taskId = req.nextUrl.searchParams.get("taskId");
    const musicUrl = req.nextUrl.searchParams.get("musicUrl");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const token = klingToken();
    const res = await fetch(`https://api.klingai.com/v1/videos/image2video/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.code !== 0) return NextResponse.json({ error: data.message }, { status: 500 });

    const { task_status, task_result } = data.data;

    if (task_status === "succeed") {
        const klingUrl = task_result?.videos?.[0]?.url;
        if (!klingUrl) return NextResponse.json({ error: "No video URL in result" }, { status: 500 });

        const videoRes = await fetch(klingUrl);
        let buf = Buffer.from(await videoRes.arrayBuffer());

        if (musicUrl) {
            try { buf = await addMusicToBuffer(buf, musicUrl, 10); } catch { /* upload without music on failure */ }
        }

        const videoUrl = await uploadToS3(buf);
        return NextResponse.json({ status: "done", videoUrl });
    }

    if (task_status === "failed") {
        return NextResponse.json({ status: "failed", error: task_result?.error || "Generation failed" });
    }

    return NextResponse.json({ status: "processing" });
}
