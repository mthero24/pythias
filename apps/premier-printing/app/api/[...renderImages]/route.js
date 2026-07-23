export const dynamic = "force-dynamic";
import sharp from "sharp";
import { NextResponse } from "next/server";
import axios from "axios";
import { Blank, Design } from "@pythias/mongo";

const CDN = (url) => url?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");

const readImage = async (url) => {
    const response = await axios.get(url, { responseType: "arraybuffer" }).catch(() => null);
    if (!response) return null;
    return sharp(Buffer.from(response.data, "binary"));
};

// Composite an "AI Generated" disclosure badge (bottom-left) onto a rendered image. Sized relative
// to the image width so it reads at any resolution. Never fails the image if the overlay errors.
const applyAiBadge = async (buffer, width) => {
    try {
        const img  = sharp(buffer);
        const meta = await img.metadata();
        const w    = meta.width  || width || 400;
        const h    = meta.height || w;
        const bh   = Math.max(18, Math.round(w * 0.055));
        const fs   = Math.round(bh * 0.55);
        const text = "AI Generated";
        const bw   = Math.round(fs * text.length * 0.62 + bh * 0.8);
        const r    = Math.round(bh * 0.22);
        const m    = Math.round(w * 0.02);
        const svg  = Buffer.from(
            `<svg width="${bw}" height="${bh}" xmlns="http://www.w3.org/2000/svg">` +
            // Dark-grey letter watermark — no filled box behind the text.
            `<text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" fill="#3a3a3a" fill-opacity="0.7" text-anchor="middle" dominant-baseline="central">${text}</text>` +
            `</svg>`
        );
        return await img.composite([{ input: svg, top: Math.max(0, h - bh - m), left: m }]).jpeg({ quality: 100 }).toBuffer();
    } catch {
        return buffer;
    }
};

const createImage = async (data) => {
    let multiplier = 1;
    if (data.width && data.box) {
        multiplier = data.width / 400;
    } else {
        data.width = 400;
    }

    const base64 = await readImage(`${CDN(data.styleImage)}?width=${data.width}&height=${data.width}`);
    if (!base64) return null;

    if (data.box && data.box.length > 0 && data.designImage && data.designImage !== "undefined" && data.designImage !== "null") {
        const composits = [];
        for (const box of data.box) {
            // srcSide: a single-image design (e.g. front-only) placed on a different spot uses that one
            // labeled art for whatever box we're rendering. Without it, art must be labeled for box.side.
            // If srcSide is given but that exact key isn't present, fall back to the design's only/first art.
            let artSide = data.srcSide || box.side;
            if (!data.designImage[artSide] && data.srcSide) artSide = Object.keys(data.designImage || {}).find((k) => data.designImage[k]);
            if (!artSide || !data.designImage[artSide]) continue;
            if (!box.boxWidth) box.boxWidth = box.width;
            if (!box.boxHeight) box.boxHeight = box.height;
            // Custom designs carry a normalized placement (0–1) within the print box. When present, the
            // box is the print AREA and the (already-cropped) art is positioned + sized inside it; without
            // it, the art fills the box (original pre-made-design behavior).
            let bx = box.x, by = box.y, bw = box.boxWidth, bh = box.boxHeight;
            if (box.place) {
                bx = box.x + (box.place.xPct || 0) * box.boxWidth;
                by = box.y + (box.place.yPct || 0) * box.boxHeight;
                bw = (box.place.wPct || 1) * box.boxWidth;
                bh = (box.place.hPct || 1) * box.boxHeight;
            }
            let x = bx * multiplier;
            let y = by * multiplier;
            let designBuf;
            let originalSize;
            try {
                const designImg = await readImage(`${CDN(data.designImage[artSide])}?width=${parseInt(bw * multiplier)}&height=${parseInt(bh * multiplier)}`);
                if (!designImg) continue;
                originalSize = await designImg.metadata();
                if (box.rotation && box.rotation !== 0) {
                    const { width: ow, height: oh } = originalSize;
                    const rotated = await designImg.rotate(parseInt(box.rotation), { background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer();
                    const rotatedMeta = await sharp(rotated).metadata();
                    designBuf = rotated;
                    const angle = (parseInt(box.rotation) * Math.PI) / 180;
                    const cos = Math.cos(angle), sin = Math.sin(angle);
                    const cx = ow / 2, cy = oh / 2;
                    x -= (cx + ((0 - cx) * cos) - ((0 - cy) * sin) + (rotatedMeta.width - ow) / 2);
                    y -= (cy + ((0 - cx) * sin) + ((0 - cy) * cos) + (rotatedMeta.height - oh) / 2);
                } else {
                    designBuf = await designImg.toBuffer();
                }
            } catch (e) { continue; }
            const offset = (originalSize.width - bw * multiplier) / 2;
            composits.push({ input: designBuf, blend: "atop", top: parseInt(y), left: parseInt(x - offset) });
        }
        if (composits.length === 0) {
            const out = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
            return `data:image/jpeg;base64,${out.toString("base64")}`;
        }
        const rendered = await base64.composite(composits).jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${rendered.toString("base64")}`;
    } else if (data.styleImage && base64) {
        const out = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${out.toString("base64")}`;
    } else if (data.designImage && data.designImage !== "undefined" && data.designImage !== "null") {
        const front = typeof data.designImage === "object" ? data.designImage.front : data.designImage;
        const img = await readImage(`${CDN(front)}?width=${data.width}&height=${data.width}`);
        if (!img) return null;
        const out = await img.jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${out.toString("base64")}`;
    }
    return null;
};

export async function GET(req) {
    const urlPart = req.url.split("/").pop().split(".")[0].replace(/%20/g, " ");
    const params  = urlPart.split("-");
    const width   = parseInt(req.nextUrl.searchParams.get("width")) || 400;

    let blankImage;
    let designImage;
    let sides = params[4] ? params[4].split("_") : [];

    if (params.length === 5) {
        const [design, blank] = await Promise.all([
            Design.findOne({ sku: params[0] }).select("images").lean(),
            Blank.findOne({ code: params[1].replace(/_/g, "-") }).lean()
                .then(b => b ?? Blank.findOne({ code: params[1] }).lean()),
        ]);
        designImage = design?.images;
        blankImage  = blank?.images?.find(i => i.image?.includes(params[2]));
        if (sides.length > 1 && (!blankImage || !sides.every(s => blankImage.boxes?.[s]))) {
            blankImage = blank?.images?.find(i => sides.every(s => i.boxes?.[s])) ?? blankImage;
        }
    } else if (params.length === 6) {
        const [design, blank] = await Promise.all([
            Design.findOne({ sku: params[0] }).select("threadImages").lean(),
            Blank.findOne({ code: params[1].replace(/_/g, "-") }).lean()
                .then(b => b ?? Blank.findOne({ code: params[1] }).lean()),
        ]);
        designImage = design?.threadImages?.[params[5]];
        blankImage  = blank?.images?.find(i => i.image?.includes(params[2]));
        if (sides.length > 1 && (!blankImage || !sides.every(s => blankImage.boxes?.[s]))) {
            blankImage = blank?.images?.find(i => sides.every(s => i.boxes?.[s])) ?? blankImage;
        }
    } else {
        // Query-params format
        const blankCode  = req.nextUrl.searchParams.get("blank");
        const bm         = req.nextUrl.searchParams.get("blankImage");
        const side       = req.nextUrl.searchParams.get("side");
        const colorName  = req.nextUrl.searchParams.get("colorName");
        designImage      = req.nextUrl.searchParams.get("design");
        if (side) { sides = [side]; designImage = { [side]: designImage }; }
        const blank = await Blank.findOne({ code: blankCode }).populate("colors").lean();
        if (!blank) return new NextResponse(null, { status: 404 });
        const colorObj = colorName
            ? blank.colors?.find(c => c.name?.toLowerCase() === colorName.toLowerCase())
            : null;
        // images[].color may be a Color id OR a name — match either so the right-color garment is pulled.
        const matchesColor = (img) => !colorName
            || String(img.color ?? "").toLowerCase() === colorName.toLowerCase()
            || (colorObj && String(img.color ?? "") === String(colorObj._id));
        blankImage = bm
            ? blank.images?.find(i => i.image === bm)
              ?? blank.images?.find(i => matchesColor(i) && side && i.boxes?.[side])
            : blank.images?.find(i => matchesColor(i) && side && i.boxes?.[side])
              ?? blank.images?.find(i => side && i.boxes?.[side]);
    }

    if (!blankImage) return new NextResponse(null, { status: 404 });

    const box = Object.keys(blankImage.boxes ?? {})
        .filter(k => sides.includes(k))
        .map(k => ({ ...blankImage.boxes[k], side: k }));

    // Custom "create your own" placement (0–1, within the print box) passed as query params — when
    // present the art is positioned + sized inside the box instead of filling it (matches the studio).
    const sp = req.nextUrl.searchParams;
    if (["xPct", "yPct", "wPct", "hPct"].every(k => sp.get(k) != null)) {
        const place = { xPct: parseFloat(sp.get("xPct")), yPct: parseFloat(sp.get("yPct")), wPct: parseFloat(sp.get("wPct")), hPct: parseFloat(sp.get("hPct")) };
        box.forEach(b => { b.place = place; });
    }

    // srcSide: render a single-image design's art onto the requested box(es) even if it isn't labeled for
    // that side (front-only design shown on the back). Only valid for single-location designs.
    const srcSide = sp.get("srcSide") || undefined;
    const result = await createImage({ box, styleImage: blankImage.image, designImage, width, srcSide });
    if (!result) return new NextResponse(null, { status: 500 });

    let buffer = Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
    if (blankImage.aiGenerated) buffer = await applyAiBadge(buffer, width);
    const cacheTag = blankImage.image?.match(/\/(\d+)\.\w+/)?.[1];
    return new NextResponse(buffer, {
        headers: {
            "Content-Type": "image/jpeg",
            "Access-Control-Allow-Origin": "*",
            ...(cacheTag ? { "Cache-Tag": cacheTag } : {}),
        },
    });
}

export async function POST(req) {
    const data   = await req.json();
    const base64 = await createImage(data);
    return NextResponse.json({ error: false, base64 });
}
