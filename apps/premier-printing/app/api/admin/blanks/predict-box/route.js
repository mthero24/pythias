import { NextResponse } from "next/server";

const CANVAS = 400;

// Locations whose boxes are computed from shirt boundaries — no AI guessing needed
const COMPUTED = new Set(["front", "back", "modelFront", "modelBack", "center", "centermini", "pocket", "embfull", "centerfull"]);

const LOCATION_HINTS = {
    hood:         "the back panel of the hood",
    upperSleeve:  "the upper portion of one sleeve near the shoulder",
    lowerSleeve:  "the lower portion of one sleeve near the cuff",
    fullSleeve:   "the full length of one sleeve from shoulder to cuff",
    centerSleeve: "the center of one sleeve",
    leg:          "the thigh area of one leg panel",
    side:         "the side panel of the garment",
};

// Compute print-area box from shirt boundaries.
// b = { collar_y, hem_y, shirt_left, shirt_right } — all fractions 0–1 of image dimensions
const computeBox = (side, b) => {
    // If Claude returned sleeve edges instead of body seams, sw balloons past 0.55.
    // Collapse symmetrically to 0.50 so margin math stays inside the actual shirt body.
    const rawSw = b.shirt_right - b.shirt_left;
    const center = (b.shirt_left + b.shirt_right) / 2;
    const clampedSw = rawSw > 0.55 ? 0.50 : rawSw;
    const sl = center - clampedSw / 2;

    const sw = clampedSw;
    const sh = b.hem_y - b.collar_y;
    const cy = b.collar_y;

    switch (side) {
        case "front":
        case "modelFront":
        case "back":
        case "modelBack":
            return { x: sl + sw * 0.075, y: cy + sh * 0.07, width: sw * 0.85, height: sh * 0.50 };

        case "center":
            // centered horizontally (5% margin each side of fw), 35% of front height
            return { x: sl + sw * 0.1175, y: cy + sh * 0.07, width: sw * 0.765, height: sh * 0.175 };

        case "centermini":
            // same height as center, 35% of front width, centered
            return { x: sl + sw * 0.351, y: cy + sh * 0.07, width: sw * 0.2975, height: sh * 0.175 };

        case "pocket":
            // right side, 35% of front width and height
            return { x: sl + sw * 0.075 + sw * 0.85 * 0.65, y: cy + sh * 0.07, width: sw * 0.2975, height: sh * 0.175 };

        case "embfull":
            // centered, 50% of front width and height
            return { x: sl + sw * 0.075 + sw * 0.85 * 0.25, y: cy + sh * 0.07, width: sw * 0.425, height: sh * 0.25 };

        case "centerfull":
            // full front width, 35% of front height
            return { x: sl + sw * 0.075, y: cy + sh * 0.07, width: sw * 0.85, height: sh * 0.175 };

        default:
            return null;
    }
};

const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

// Detect real image format from magic bytes — ignores unreliable Content-Type headers
const sniffMediaType = (buf) => {
    const b = buf;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return "image/png";
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)                   return "image/jpeg";
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46)                   return "image/gif";
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
    return "image/jpeg";
};

const MAX_BYTES = 5 * 1024 * 1024; // Anthropic 5 MB limit

// For Wasabi CDN images, swap to the image-optimizer endpoint so the CDN
// delivers a pre-resized version — no server-side processing needed.
const toCDNResizeUrl = (url, width = 1500) => {
    if (!url || url.startsWith("data:")) return url;
    return url
        .replace("images1.pythiastechnologies.com", "images2.pythiastechnologies.com/origin")
        .replace(/(\?.*)?$/, `?width=${width}`);
};

const resizeBuffer = async (buf) => {
    try {
        const sharp = (await import("sharp")).default;
        return await sharp(buf)
            .resize({ width: 1500, height: 1500, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
    } catch (e) {
        console.error("[predict-box] sharp resize failed:", e.message);
        return buf;
    }
};

const downloadImage = async (url) => {
    let buf;
    if (url.startsWith("data:")) {
        const commaIdx = url.indexOf(",");
        buf = Buffer.from(url.slice(commaIdx + 1), "base64");
    } else {
        // For CDN images, request a pre-resized version to avoid downloading large originals
        const fetchUrl = toCDNResizeUrl(url);
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        buf = Buffer.from(await res.arrayBuffer());
    }
    if (buf.length > MAX_BYTES) {
        buf = await resizeBuffer(buf);
    }
    return { buf, mediaType: sniffMediaType(buf) };
};

export async function POST(req) {
    const { imageUrl, side, examples = [] } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

    // Download main image server-side (CDN/Wasabi URLs aren't reachable by Anthropic directly)
    let mainImg;
    try { mainImg = await downloadImage(imageUrl); }
    catch (e) { return NextResponse.json({ error: `Image fetch failed: ${e.message}` }, { status: 400 }); }

    // Download example images (silently skip any that fail)
    const exampleImgs = (await Promise.all(
        examples.slice(0, 3).map(async (ex) => {
            try { return { ...(await downloadImage(ex.imageUrl)), box: ex.box }; }
            catch { return null; }
        })
    )).filter(Boolean);

    let content;
    const useFewShot = exampleImgs.length > 0;

    if (useFewShot) {
        // Few-shot: show labelled examples, then ask Claude to match the same placement
        content = [{
            type: "text",
            text: `You are placing a print area box for the "${side}" location on a garment image. `
                + `Here ${exampleImgs.length === 1 ? "is 1 example" : `are ${exampleImgs.length} examples`} showing the correct box (all values are fractions 0–1, origin top-left):`,
        }];
        exampleImgs.forEach((ex, i) => {
            const b = ex.box;
            content.push({ type: "text", text: `Example ${i + 1}: x=${b.x.toFixed(3)}, y=${b.y.toFixed(3)}, width=${b.width.toFixed(3)}, height=${b.height.toFixed(3)}, rotation=${b.rotation ?? 0}°` });
            content.push({ type: "image", source: { type: "base64", media_type: ex.mediaType, data: ex.buf.toString("base64") } });
        });
        content.push({
            type: "text",
            text: "Now analyze this new garment image and apply the same placement logic. Return ONLY this JSON with no explanation:\n"
                + '{"area_x":float,"area_y":float,"area_width":float,"area_height":float,"rotation_deg":float}',
        });
        content.push({ type: "image", source: { type: "base64", media_type: mainImg.mediaType, data: mainImg.buf.toString("base64") } });
    } else {
        // No examples — use rule-based prompts
        const prompt = COMPUTED.has(side)
            ? `Analyze this garment image. Find the shirt body's key boundaries and return ONLY this JSON with no explanation:
{"collar_y":float,"hem_y":float,"shirt_left":float,"shirt_right":float,"rotation_deg":float}
collar_y = y fraction of the shoulder seam line — the horizontal line across the top of the shirt body where the sleeves attach, NOT the collar or neckline
hem_y = y fraction of the shirt's bottom hem edge
shirt_left = x fraction of the shirt's LEFT side seam — the vertical seam running from the armpit down to the hem on the left side of the body. Do NOT use the sleeve edge; use the body side seam only.
shirt_right = x fraction of the shirt's RIGHT side seam — the vertical seam running from the armpit down to the hem on the right side of the body. Do NOT use the sleeve edge; use the body side seam only.
rotation_deg = clockwise tilt of the garment in degrees (0 if upright, negative for counter-clockwise)`
            : `Analyze this garment image. Return ONLY this JSON with no explanation:
{"collar_y":float,"hem_y":float,"shirt_left":float,"shirt_right":float,"rotation_deg":float,"area_x":float,"area_y":float,"area_width":float,"area_height":float}
collar_y = the shoulder seam line (where sleeves attach to the body), NOT the neckline.
shirt_left/shirt_right = body SIDE SEAMS (vertical seam from armpit to hem), NOT the sleeve edges.
All fractions 0–1, origin top-left. rotation_deg clockwise.
area_x/y/width/height describe the print box for "${side}" which is: ${LOCATION_HINTS[side] ?? side}.`;

        content = [
            { type: "image", source: { type: "base64", media_type: mainImg.mediaType, data: mainImg.buf.toString("base64") } },
            { type: "text", text: prompt },
        ];
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 256,
            messages: [{ role: "user", content }],
        }),
    });

    if (!anthropicRes.ok) {
        const body = await anthropicRes.text();
        return NextResponse.json({ error: body }, { status: 502 });
    }

    const data = await anthropicRes.json();
    const text = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return NextResponse.json({ error: "No prediction returned" }, { status: 500 });

    let parsed;
    try { parsed = JSON.parse(match[0]); } catch {
        return NextResponse.json({ error: "Could not parse response" }, { status: 500 });
    }

    let fractions;
    if (useFewShot) {
        fractions = { x: parsed.area_x, y: parsed.area_y, width: parsed.area_width, height: parsed.area_height };
    } else if (COMPUTED.has(side)) {
        fractions = computeBox(side, parsed);
        if (!fractions) return NextResponse.json({ error: "computeBox returned null" }, { status: 500 });
    } else {
        fractions = { x: parsed.area_x, y: parsed.area_y, width: parsed.area_width, height: parsed.area_height };
    }

    const rotation = Math.round(Number(parsed.rotation_deg) || 0);
    return NextResponse.json({
        x:        Math.round(clamp01(fractions.x)      * CANVAS),
        y:        Math.round(clamp01(fractions.y)      * CANVAS),
        width:    Math.round(clamp01(fractions.width)  * CANVAS),
        height:   Math.round(clamp01(fractions.height) * CANVAS),
        rotation,
    });
}
