import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const DEEP_IMAGE_URL      = "https://deep-image.ai/rest_api/process_result";
const DEEP_IMAGE_POLL     = "https://deep-image.ai/rest_api/result";
const DEEP_IMAGE_REMOVE_BG = "https://deep-image.ai/rest_api/remove_background";
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 30; // 90 seconds max

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.WASABI_ACCESS_KEY || process.env.NEXT_PUBLIC_WASABI_KEY_ID,
        secretAccessKey: process.env.WASABI_SECRET_KEY || process.env.NEXT_PUBLIC_WASABI_SECRET,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const BUCKET = process.env.WASABI_BUCKET || "images1.pythiastechnologies.com";

/**
 * Upscale an image using Deep-Image.ai and store the result in Wasabi S3.
 *
 * @param {string} imageUrl  - Public URL of the source image
 * @param {object} opts
 * @param {number} [opts.factor=4]         - Upscale factor (2 or 4; beyond 4 uses bicubic)
 * @param {boolean} [opts.denoise=true]    - Apply AI denoising
 * @param {boolean} [opts.deblur=true]     - Apply AI sharpening/deblur
 * @param {string} [opts.folder="upscaled"] - S3 folder prefix
 * @returns {{ url: string, key: string }} - Permanent S3 URL and key
 */
export async function upscaleImage(imageUrl, opts = {}) {
    const {
        factor           = 4,
        denoise          = true,
        deblur           = true,
        removeBackground = false,
        folder           = "upscaled",
    } = opts;

    const apiKey = process.env.DEEP_IMAGE_API_KEY;
    if (!apiKey) throw new Error("DEEP_IMAGE_API_KEY is not set");

    const enhancements = [];
    if (denoise) enhancements.push("denoise");
    if (deblur)  enhancements.push("deblur");

    // ── Step 1: upscale ───────────────────────────────────────────────────────
    const body = {
        url:   imageUrl,
        width: `${factor * 100}%`,
        ...(enhancements.length ? { enhancements } : {}),
    };

    let submitRes;
    try {
        submitRes = await axios.post(DEEP_IMAGE_URL, body, {
            headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        });
    } catch (err) {
        const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        throw new Error(`Deep-Image.ai upscale failed (${err.response?.status ?? "?"}): ${detail}`);
    }

    let resultUrl;

    if (submitRes.data.status === "complete" && submitRes.data.result_url) {
        // Synchronous response
        resultUrl = submitRes.data.result_url;
    } else if (submitRes.data.job) {
        // Async — poll until done
        const jobId = submitRes.data.job;
        let attempts = 0;
        while (attempts < POLL_MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            const poll = await axios.get(`${DEEP_IMAGE_POLL}/${jobId}`, {
                headers: { "x-api-key": apiKey },
            });
            if (poll.data.status === "complete" && poll.data.result_url) {
                resultUrl = poll.data.result_url;
                break;
            }
            if (poll.data.status === "failed") {
                throw new Error(`Deep-Image.ai job failed: ${poll.data.message || jobId}`);
            }
            attempts++;
        }
        if (!resultUrl) throw new Error("Deep-Image.ai timed out after 90 seconds");
    } else {
        throw new Error(`Unexpected Deep-Image.ai response: ${JSON.stringify(submitRes.data)}`);
    }

    // ── Step 2 (optional): remove background from the upscaled result ─────────
    if (removeBackground) {
        try {
            const bgRes = await axios.post(
                DEEP_IMAGE_REMOVE_BG,
                { url: resultUrl },
                { headers: { "x-api-key": apiKey, "Content-Type": "application/json" } }
            );
            // The remove-bg endpoint returns result_url synchronously or via job
            if (bgRes.data.result_url) {
                resultUrl = bgRes.data.result_url;
            } else if (bgRes.data.job) {
                const jobId = bgRes.data.job;
                let attempts = 0;
                while (attempts < POLL_MAX_ATTEMPTS) {
                    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
                    const poll = await axios.get(`${DEEP_IMAGE_POLL}/${jobId}`, {
                        headers: { "x-api-key": apiKey },
                    });
                    if (poll.data.status === "complete" && poll.data.result_url) {
                        resultUrl = poll.data.result_url;
                        break;
                    }
                    if (poll.data.status === "failed") break;
                    attempts++;
                }
            }
        } catch {
            // BG removal failed — continue with the upscaled image without transparency
        }
    }

    // Download the final image
    const download = await axios.get(resultUrl, { responseType: "arraybuffer" });
    const buffer   = Buffer.from(download.data);

    // Force PNG when background removal was requested (transparency needs PNG)
    const contentType = removeBackground
        ? "image/png"
        : (download.headers["content-type"] || "image/png");
    const ext = removeBackground
        ? "png"
        : (contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png");

    // Upload to Wasabi
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ACL:         "public-read",
        ContentType: contentType,
    }));

    return { url: `https://${BUCKET}/${key}`, key };
}
