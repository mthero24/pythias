import { NextResponse } from "next/server";
import axios from "axios";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const EMB = process.env.EMBROIDERY_SERVICE_URL || "http://localhost:8765";

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.WASABI_ACCESS_KEY || process.env.NEXT_PUBLIC_WASABI_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_KEY || process.env.NEXT_PUBLIC_WASABI_SECRET,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});
const BUCKET = process.env.WASABI_BUCKET || "images1.pythiastechnologies.com";

async function upload(buffer, key, contentType, disposition) {
    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ACL:         "public-read",
        ContentType: contentType,
        ...(disposition ? { ContentDisposition: disposition } : {}),
    }));
    return `https://${BUCKET}/${key}`;
}

export async function POST(request) {
    try {
        const { artworkUrl, widthMm = 100, fillAngle = 45 } = await request.json();
        if (!artworkUrl) return NextResponse.json({ error: "artworkUrl required" }, { status: 400 });

        const ts = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const vecRes = await axios.post(`${EMB}/vectorize`, {
            url:      artworkUrl,
            width_mm: widthMm,
        }, { timeout: 60000 });

        const { job_id, preview_svg, layers } = vecRes.data;
        if (!job_id) return NextResponse.json({ error: "Vectorize failed — no job_id returned" }, { status: 500 });

        const colors = (layers || []).map(l => ({
            index:      l.index,
            thread_hex: l.closest_thread?.hex || l.color_hex,
        }));

        const dstRes = await axios.post(`${EMB}/generate/from-job`, {
            job_id,
            fill_angle:  fillAngle,
            colors,
            text_layers: [],
        }, { responseType: "arraybuffer", timeout: 120000 });

        let previewPngUrl = null;
        if (preview_svg) {
            try {
                const pngBuf = await sharp(Buffer.from(preview_svg)).png().toBuffer();
                previewPngUrl = await upload(pngBuf, `embroidery/${ts}-preview.png`, "image/png");
            } catch (e) {
                console.warn("[generate-embroidery] SVG→PNG failed:", e.message);
            }
        }

        const dstUrl = await upload(
            Buffer.from(dstRes.data),
            `embroidery/${ts}.dst`,
            "application/octet-stream",
            `attachment; filename="embroidery.dst"`
        );

        return NextResponse.json({ dstUrl, previewPngUrl });
    } catch (err) {
        const detail = err.response?.data
            ? (Buffer.isBuffer(err.response.data) ? err.response.data.toString() : JSON.stringify(err.response.data))
            : err.message;
        console.error("[generate-embroidery]", detail);
        return NextResponse.json({ error: detail }, { status: 500 });
    }
}
