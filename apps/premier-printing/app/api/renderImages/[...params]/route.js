export const dynamic = "force-dynamic";
import sharp from "sharp";
import { NextResponse } from "next/server";
import axios from "axios";
import { Design, Blank as Blanks } from "@pythias/mongo";

const CDN = (url) => url?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");

const fetchBuf = async (url) => {
    const res = await axios.get(url, { responseType: "arraybuffer" }).catch(() => null);
    return res ? Buffer.from(res.data, "binary") : null;
};

const readImage = async (url) => {
    const buf = await fetchBuf(url);
    return buf ? sharp(buf) : null;
};

const createImage = async (data) => {
    let multiplier = 1;
    if (data.width && data.box) {
        multiplier = data.width / 400;
    } else {
        data.width = 400;
    }

    const styleUrl = `${CDN(data.styleImage)}?width=${data.width}&height=${data.width}`;
    const style = await readImage(styleUrl);
    if (!style) return null;

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
            const designUrl = `${CDN(data.designImage[box.side])}?width=${parseInt(box.boxWidth * multiplier)}&height=${parseInt(box.boxHeight * multiplier)}`;
            try {
                const rawDesignBuf = await fetchBuf(designUrl);
                if (!rawDesignBuf) continue;
                originalSize = await sharp(rawDesignBuf).metadata();
                if (box.rotation && box.rotation !== 0) {
                    const { width: ow, height: oh } = originalSize;
                    const rotated = await sharp(rawDesignBuf).blur(0.5).rotate(parseInt(box.rotation), { background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer();
                    const rotatedMeta = await sharp(rotated).metadata();
                    designBuf = rotated;
                    const angle = (parseInt(box.rotation) * Math.PI) / 180;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    const cx = ow / 2, cy = oh / 2;
                    const rtlx = cx + ((0 - cx) * cos) - ((0 - cy) * sin);
                    const rtly = cy + ((0 - cx) * sin) + ((0 - cy) * cos);
                    x -= (rtlx + (rotatedMeta.width - ow) / 2);
                    y -= (rtly + (rotatedMeta.height - oh) / 2);
                } else {
                    designBuf = await sharp(rawDesignBuf).blur(0.5).toBuffer();
                }
            } catch (e) {
                continue;
            }
            const offset = (originalSize.width - box.boxWidth * multiplier) / 2;
            composits.push({ input: designBuf, blend: "atop", top: parseInt(y), left: parseInt(x - offset) });
        }

        if (composits.length === 0) {
            const out = await style.jpeg({ quality: 100, effort: 5 }).toBuffer();
            return `data:image/jpeg;base64,${out.toString("base64")}`;
        }

        let rendered;
        try {
            rendered = await style.composite(composits).jpeg({ quality: 90, effort: 5 }).toBuffer();
        } catch (e) {
            return null;
        }

        try {
            const STRENGTH = 0.45;
            const shadowBuf = await sharp(await fetchBuf(`${CDN(data.styleImage)}?width=${data.width}&height=${data.width}`))
                .greyscale().toColorspace("srgb")
                .linear(STRENGTH, Math.round(128 * (1 - STRENGTH))).png().toBuffer();
            rendered = await sharp(rendered).composite([{ input: shadowBuf, blend: "soft-light" }]).jpeg({ quality: 90, effort: 5 }).toBuffer();
        } catch (e) {}

        return `data:image/jpeg;base64,${Buffer.from(rendered).toString("base64")}`;

    } else if (data.styleImage) {
        const out = await style.jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${out.toString("base64")}`;
    }

    return null;
};

export async function GET(req) {
    const url = req.url;
    const base = url.split("/").pop().split(".")[0].replace(/%20/g, " ");
    const params = base.split("-");
    const width = parseInt(req.nextUrl.searchParams.get("width")) || 400;
    const side = req.nextUrl.searchParams.get("side");
    const sides = side ? [side] : (params[3] ? [params[3]] : []);

    const blankCode = req.nextUrl.searchParams.get("blank");
    const bm = req.nextUrl.searchParams.get("blankImage");
    const designImage = req.nextUrl.searchParams.get("design");

    const blank = await Blanks.findOne({ code: blankCode }).lean();
    if (!blank) return new NextResponse(null, { status: 404 });

    let blankImage = bm
        ? blank.images?.find(i => i.image === bm) ?? null
        : blank.images?.find(i => i.boxes && i.boxes[side]) ?? null;

    if (!blankImage) return new NextResponse(null, { status: 404 });

    const boxEntries = blankImage.boxes
        ? Object.keys(blankImage.boxes).filter(k => sides.includes(k)).map(k => ({ ...blankImage.boxes[k], side: k }))
        : [];

    const designImageObj = side ? { [side]: designImage } : designImage;
    const data = { box: boxEntries, styleImage: blankImage.image, designImage: designImageObj, width };
    const result = await createImage(data);

    if (result) {
        const buffer = Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
        return new NextResponse(buffer, {
            headers: { "Content-Type": "image/jpeg", "Access-Control-Allow-Origin": "*" },
        });
    }

    return new NextResponse(null, { status: 500 });
}
