export const dynamic = "force-dynamic";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import axios from "axios";
import { PlatformBlank, PlatformDesign } from "@pythias/mongo";

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

    let base64 = await readImage(
        `${data.styleImage?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${data.width}&height=${data.width}`
    );

    if (data.box && data.box.length > 0 && data.designImage && data.designImage !== "undefined" && data.designImage !== "null" && base64) {
        const composits = [];
        for (const box of data.box) {
            if (!data.designImage[box.side]) continue;
            if (!box.boxWidth) box.boxWidth = box.width;
            if (!box.boxHeight) box.boxHeight = box.height;

            let x = box.x * multiplier;
            let y = box.y * multiplier;
            let designBase64;
            let originalSize;

            if (box.rotation && box.rotation !== 0) {
                designBase64 = await readImage(
                    `${data.designImage[box.side].replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(box.boxWidth * multiplier)}&height=${parseInt(box.boxHeight * multiplier)}`
                );
                originalSize = await designBase64.metadata();
                const originalWidth = originalSize.width;
                const originalHeight = originalSize.height;
                designBase64 = await designBase64.rotate(parseInt(box.rotation), { background: { r: 255, g: 255, b: 255, alpha: 0 } }).toBuffer();
                designBase64 = sharp(designBase64);
                const newSize = await designBase64.metadata();
                designBase64 = await designBase64.toBuffer();

                const angleInRadians = (parseInt(box.rotation) * Math.PI) / 180;
                const cosTheta = Math.cos(angleInRadians);
                const sinTheta = Math.sin(angleInRadians);
                const centerX = originalWidth / 2;
                const centerY = originalHeight / 2;
                const rotatedTopLeftX = centerX + ((0 - centerX) * cosTheta) - ((0 - centerY) * sinTheta);
                const rotatedTopLeftY = centerY + ((0 - centerX) * sinTheta) + ((0 - centerY) * cosTheta);
                const offsetH = (newSize.height - originalHeight) / 2;
                const offsetW = (newSize.width - originalWidth) / 2;
                x -= (rotatedTopLeftX + offsetW);
                y -= (rotatedTopLeftY + offsetH);
            } else {
                designBase64 = await readImage(
                    `${data.designImage[box.side]?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(box.boxWidth * multiplier)}&height=${parseInt(box.boxHeight * multiplier)}`
                );
                originalSize = await designBase64.metadata();
                designBase64 = await designBase64.toBuffer();
            }

            const offset = (originalSize.width - (box.boxWidth * multiplier)) / 2;
            composits.push({ input: designBase64, blend: "atop", top: parseInt(y), left: parseInt(x - offset), gravity: "center" });
        }

        base64 = await base64.composite(composits);
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${base64.toString("base64")}`;
    } else if (data.styleImage && base64) {
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${base64.toString("base64")}`;
    } else if (data.designImage && data.designImage !== "undefined" && data.designImage !== "null") {
        const frontUrl = typeof data.designImage === "object" ? data.designImage.front : data.designImage;
        base64 = await readImage(
            `${frontUrl?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin")}?width=${parseInt(data.width)}&height=${parseInt(data.width)}`
        );
        if (!base64) return null;
        base64 = await base64.jpeg({ quality: 100, effort: 5 }).toBuffer();
        return `data:image/jpeg;base64,${base64.toString("base64")}`;
    }
    return null;
};

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const url = req.url;
    const base = url.split("/").pop().split(".")[0].replace(/%20/g, " ");
    const params = base.split("-");
    const width = parseInt(req.nextUrl.searchParams.get("width")) || 400;

    let blankImage = null;
    let designImage = null;
    const sides = params[4] ? params[4].split("_") : [];

    if (params.length >= 5) {
        const [designSku, blankCodeRaw, fileBase, colorName] = params;
        const blankCode = blankCodeRaw.replace(/_/g, "-");

        const [design, blank] = await Promise.all([
            PlatformDesign.findOne({ sku: designSku, orgId }).select("images threadImages sublimationImages").lean(),
            PlatformBlank.findOne({ code: blankCode, orgId }).lean(),
        ]);

        if (params.length === 6) {
            // Thread color variant
            const threadColor = params[5];
            designImage = design?.threadImages?.[threadColor];
        } else {
            designImage = design?.images ?? null;
        }

        if (blank?.images?.length > 0) {
            blankImage = blank.images.find(i => i.image?.includes(fileBase)) ?? null;
        }
    } else {
        // Query-param form
        const blankCode = req.nextUrl.searchParams.get("blank");
        const bm = req.nextUrl.searchParams.get("blankImage");
        const colorName = req.nextUrl.searchParams.get("colorName");
        const side = req.nextUrl.searchParams.get("side");
        designImage = req.nextUrl.searchParams.get("design");

        if (side) {
            sides.push(side);
            designImage = { [side]: designImage };
        }

        const blank = await PlatformBlank.findOne({ code: blankCode, orgId }).lean();
        if (blank?.images?.length > 0) {
            blankImage = bm
                ? blank.images.find(i => i.image === bm) ?? null
                : blank.images.find(i => i.boxes && i.boxes[side]) ?? null;
        }
    }

    if (!blankImage) return new NextResponse(null, { status: 404 });

    const boxEntries = blankImage.boxes
        ? Object.keys(blankImage.boxes).filter(k => sides.includes(k)).map(k => ({ ...blankImage.boxes[k], side: k }))
        : [];

    const data = { box: boxEntries, styleImage: blankImage.image, designImage, width };
    const result = await createImage(data);

    if (result) {
        const buffer = Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
        return new NextResponse(buffer, {
            headers: { "Content-Type": "image/jpeg", "Access-Control-Allow-Origin": "*" },
        });
    }

    return new NextResponse(null, { status: 500 });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const base64 = await createImage(data);
    return NextResponse.json({ error: false, base64 });
}
