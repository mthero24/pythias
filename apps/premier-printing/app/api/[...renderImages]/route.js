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
            if (!data.designImage[box.side]) continue;
            if (!box.boxWidth) box.boxWidth = box.width;
            if (!box.boxHeight) box.boxHeight = box.height;
            let x = box.x * multiplier;
            let y = box.y * multiplier;
            let designBuf;
            let originalSize;
            try {
                const designImg = await readImage(`${CDN(data.designImage[box.side])}?width=${parseInt(box.boxWidth * multiplier)}&height=${parseInt(box.boxHeight * multiplier)}`);
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
            const offset = (originalSize.width - box.boxWidth * multiplier) / 2;
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
        designImage      = req.nextUrl.searchParams.get("design");
        if (side) { sides = [side]; designImage = { [side]: designImage }; }
        const blank = await Blank.findOne({ code: blankCode }).lean();
        if (!blank) return new NextResponse(null, { status: 404 });
        blankImage = bm
            ? blank.images?.find(i => i.image === bm) ?? blank.images?.find(i => side && i.boxes?.[side])
            : blank.images?.find(i => side && i.boxes?.[side]);
    }

    if (!blankImage) return new NextResponse(null, { status: 404 });

    const box = Object.keys(blankImage.boxes ?? {})
        .filter(k => sides.includes(k))
        .map(k => ({ ...blankImage.boxes[k], side: k }));

    const result = await createImage({ box, styleImage: blankImage.image, designImage, width });
    if (!result) return new NextResponse(null, { status: 500 });

    const buffer = Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
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
