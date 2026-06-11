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

// POST — digitize artwork → DST + embroidered preview PNG
// Body: { artworkUrl, widthMm?, fillAngle? }
export async function POST(request) {
    try {
        const { artworkUrl, widthMm = 100, fillAngle = 45 } = await request.json();
        if (!artworkUrl) return NextResponse.json({ error: "artworkUrl required" }, { status: 400 });

        const ts = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // 1. Fetch the artwork as a buffer
        const imgRes = await axios.get(artworkUrl, { responseType: "arraybuffer", timeout: 30000 });
        const imgBuffer = Buffer.from(imgRes.data);
        const imgContentType = imgRes.headers["content-type"] || "image/png";
        const imgExt = imgContentType.includes("jpeg") ? "jpg" : "png";

        // 2. Vectorize via multipart file upload
        const formData = new FormData();
        formData.append("file", new Blob([imgBuffer], { type: imgContentType }), `artwork.${imgExt}`);
        formData.append("size_mm", String(widthMm));

        const vecFetch = await fetch(`${EMB}/vectorize`, { method: "POST", body: formData });
        if (!vecFetch.ok) {
            const errText = await vecFetch.text();
            return NextResponse.json({ error: errText }, { status: 500 });
        }
        const { job_id, preview_svg, layers } = await vecFetch.json();
        if (!job_id) return NextResponse.json({ error: "Vectorize failed — no job_id returned" }, { status: 500 });

        // Auto-select closest thread per layer — API expects plain hex strings in layer order
        const colors = (layers || []).map(l => l.closest_thread?.hex || l.color_hex || "");

        // 2. Generate DST binary
        const dstRes = await axios.post(`${EMB}/generate/from-job`, {
            job_id,
            fill_angle:  fillAngle,
            colors,
            text_layers: [],
        }, { responseType: "arraybuffer", timeout: 120000 });

        // 3. Convert stitch preview SVG → PNG
        let previewPngUrl = null;
        if (preview_svg) {
            try {
                const pngBuf = await sharp(Buffer.from(preview_svg))
                    .png()
                    .toBuffer();
                const pngKey = `embroidery/${ts}-preview.png`;
                previewPngUrl = await upload(pngBuf, pngKey, "image/png");
            } catch (svgErr) {
                console.warn("[generate-embroidery] SVG→PNG conversion failed:", svgErr.message);
                // Non-fatal — DST still gets saved
            }
        }

        // 4. Upload DST
        const dstKey = `embroidery/${ts}.dst`;
        const dstUrl = await upload(
            Buffer.from(dstRes.data),
            dstKey,
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
