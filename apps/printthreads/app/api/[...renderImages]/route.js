import sharp from "sharp"
import { NextResponse } from "next/server"
import { Blank, Design } from "@pythias/mongo";

const CDN = "https://images1.pythiastechnologies.com";
const ORIGIN = "https://images2.pythiastechnologies.com/origin";

const toOrigin = (url) => url?.replace(CDN, ORIGIN) ?? url;

const readBuffer = async (url) => {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return Buffer.from(await res.arrayBuffer());
    } catch {
        return null;
    }
};

const readImage = async (url) => {
    const buf = await readBuffer(url);
    return buf ? sharp(buf) : null;
};

const createSide = async ({ points, baseImage, subImage, type, side, layers, multiplier }) => {
    const size = 400 * multiplier;

    const [baseBuf, colorBuf] = await Promise.all([
        readBuffer(`${toOrigin(baseImage)}?width=${size}&height=${size}`),
        readBuffer(subImage),
    ]);
    if (!baseBuf || !colorBuf) return null;

    const coords = [];
    for (let p = 0; p < points.length - 1; p += 2) coords.push({ x: points[p], y: points[p + 1] });

    const minx = parseInt(coords.reduce((min, b) => b.x * multiplier < min ? b.x * multiplier : min, Infinity));
    const miny = parseInt(coords.reduce((min, b) => b.y * multiplier < min ? b.y * multiplier : min, Infinity));
    const maxx = parseInt(coords.reduce((max, b) => b.x * multiplier > max ? b.x * multiplier : max, 0));
    const maxy = parseInt(coords.reduce((max, b) => b.y * multiplier > max ? b.y * multiplier : max, 0));

    let color = sharp(colorBuf);

    if (type === "sleeve") {
        const sleeveMeta = await color.metadata();
        if (side === "right") {
            const w = Math.min(parseInt(sleeveMeta.width / 2) + parseInt(sleeveMeta.width / 4), sleeveMeta.width);
            color = sharp(colorBuf).extract({ left: 0, top: 0, width: w, height: sleeveMeta.height });
        } else if (side === "left") {
            const left = Math.max(0, parseInt(sleeveMeta.width / 4));
            color = sharp(colorBuf).extract({ left, top: 0, width: parseInt(sleeveMeta.width * 3 / 4), height: sleeveMeta.height });
        }
        color = color.resize(maxx - minx, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    } else if (type === "collar") {
        color = color.rotate(90).resize(parseInt((maxx - minx) / 2), maxy - miny, { fit: 'cover' });
    } else {
        color = color.resize(maxx - minx, maxy - miny, { fit: 'cover' });
    }

    const resizedColorBuf = await color.toBuffer();

    const colorImageBuf = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 2, g: 2, b: 2, alpha: 0 } }
    }).png()
      .composite([{ input: resizedColorBuf, left: minx, top: miny }])
      .modulate({ brightness: 1.0, saturation: 1.1 })
      .toBuffer();

    let finalBuf;
    try {
        const cutoutBuf = await sharp(baseBuf)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .composite([{ input: colorImageBuf, blend: 'in', opacity: 1 }])
            .toBuffer();
        finalBuf = await sharp(baseBuf)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .composite([{ input: cutoutBuf, blend: 'darken', opacity: 1 }])
            .toBuffer();
    } catch {
        return null;
    }

    const layerImages = layers?.length > 0
        ? (await Promise.all(layers.filter(l => l.url).map(async (layer) => {
            const layerBuf = await readBuffer(layer.url);
            if (!layerBuf) return null;
            if (layer.sublimated) {
                try {
                    const lCutout = await sharp(layerBuf)
                        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .composite([{ input: colorImageBuf, blend: 'in', opacity: 1 }])
                        .toBuffer();
                    return sharp(layerBuf)
                        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .composite([{ input: lCutout, blend: 'darken', opacity: 1 }]);
                } catch {
                    return null;
                }
            }
            return sharp(layerBuf).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
        }))).filter(Boolean)
        : [];

    return { final: sharp(finalBuf), layerImages };
};

const createSublimationImage = async (sublimationBoxes, sublimationImages, multiplier, styleBuf) => {
    const size = 400 * multiplier;

    const pieces = await Promise.all(
        Object.keys(sublimationBoxes)
            .filter(key => sublimationBoxes[key].layers.length > 0 && sublimationBoxes[key].layers[0].url)
            .map(key => createSide({
                points: sublimationBoxes[key].layers[0].points,
                baseImage: sublimationBoxes[key].layers[0].url,
                subImage: sublimationImages[key],
                type: key.includes("Sleeve") || key.includes("sleeve") ? "sleeve"
                    : key.includes("Hood") ? "hood"
                    : key.includes("Collar") ? "collar"
                    : "front",
                side: key.includes("Left") ? "left" : key.includes("Right") ? "right" : "center",
                layers: sublimationBoxes[key].layers.slice(1),
                multiplier,
            }))
    );

    const images = [];
    for (const piece of pieces.filter(Boolean)) {
        images.push({ input: await piece.final.toBuffer(), blend: 'atop', x: 0, y: 0 });
        for (const im of piece.layerImages) {
            images.push({ input: await im.toBuffer(), blend: 'atop', x: 0, y: 0 });
        }
    }

    return sharp(
        await sharp(styleBuf)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .composite(images)
            .toBuffer()
    );
};

const createImage = async (data) => {
    let multiplier = 1;
    if (data.width && data.box) {
        multiplier = data.width / 400;
    } else {
        data.width = 400;
    }

    const styleBuf = await readBuffer(`${toOrigin(data.styleImage)}?width=${data.width}&height=${data.width}`);
    if (!styleBuf) return null;

    let base64;
    if (data.sublimationImages && data.sublimationBoxes) {
        base64 = await createSublimationImage(data.sublimationBoxes, data.sublimationImages, multiplier, styleBuf);
    } else {
        base64 = sharp(styleBuf);
    }

    if (data.box && data.box.length > 0 && data.designImage && data.designImage !== "undefined" && data.designImage !== "null") {
        const composites = (await Promise.all(
            data.box
                .filter(box => data.designImage[box.side] !== undefined)
                .map(async (box) => {
                    const bw = box.boxWidth ?? box.width;
                    const bh = box.boxHeight ?? box.height;

                    let x = box.x * multiplier;
                    let y = box.y * multiplier;
                    let designBuf, originalSize;

                    const rawBuf = await readBuffer(`${toOrigin(data.designImage[box.side])}?width=${parseInt(bw * multiplier)}&height=${parseInt(bh * multiplier)}`);
                    if (!rawBuf) return null;

                    if (box.rotation && box.rotation !== 0) {
                        originalSize = await sharp(rawBuf).metadata();
                        const rotBuf = await sharp(rawBuf)
                            .rotate(parseInt(box.rotation), { background: { r: 255, g: 255, b: 255, alpha: 0 } })
                            .toBuffer();
                        const newSize = await sharp(rotBuf).metadata();
                        const rad = (parseInt(box.rotation) * Math.PI) / 180;
                        const cos = Math.cos(rad), sin = Math.sin(rad);
                        const cx = originalSize.width / 2, cy = originalSize.height / 2;
                        x -= (cx + (0 - cx) * cos - (0 - cy) * sin) + (newSize.width - originalSize.width) / 2;
                        y -= (cy + (0 - cx) * sin + (0 - cy) * cos) + (newSize.height - originalSize.height) / 2;
                        designBuf = rotBuf;
                        originalSize = newSize;
                    } else {
                        originalSize = await sharp(rawBuf).metadata();
                        designBuf = rawBuf;
                    }

                    const offset = (originalSize.width - bw * multiplier) / 2;
                    return {
                        input: designBuf,
                        blend: 'multiply',
                        top: parseInt(y),
                        left: parseInt(x - offset),
                        gravity: "center",
                    };
                })
        )).filter(Boolean);

        let buf;
        if (composites.length > 0) {
            const withDesign = await base64.composite(composites).toBuffer();
            // Re-overlay garment luminance to restore fabric fold/shadow depth after multiply blend
            const textureBuf = await sharp(styleBuf).grayscale().toBuffer();
            buf = await sharp(withDesign)
                .composite([{ input: textureBuf, blend: 'soft-light', opacity: 0.15 }])
                .sharpen({ sigma: 0.4 })
                .jpeg({ quality: 85 })
                .toBuffer();
        } else {
            buf = await base64.jpeg({ quality: 85 }).toBuffer();
        }

        return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } else if (data.styleImage && base64) {
        const buf = await base64.jpeg({ quality: 85 }).toBuffer();
        return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } else if (data.designImage && data.designImage !== "undefined" && data.designImage != null) {
        const rawBuf = await readBuffer(`${toOrigin(data.designImage.front)}?width=${data.width}&height=${data.width}`);
        if (!rawBuf) return null;
        const buf = await sharp(rawBuf).jpeg({ quality: 85 }).toBuffer();
        return `data:image/jpeg;base64,${buf.toString("base64")}`;
    }

    return null;
};

export async function GET(req) {
    const segs = req.url.split("/");
    const base = segs[segs.length - 1].split(".")[0].replace(/%20/g, " ");
    const params = base.split("-");
    const width = parseInt(req.nextUrl.searchParams.get("width"));

    let designImage, blankImage, type, design;
    let sides = params[4] ? params[4].split("_") : [];

    if (params.length === 5) {
        const [d, blank] = await Promise.all([
            Design.findOne({ sku: params[0] }).select("images sublimationImages").lean(),
            Blank.findOne({ code: params[1].replace(/_/g, "-") }).populate("colors").lean(),
        ]);
        design = d;
        designImage = design?.images;
        blankImage = blank?.multiImages?.[params[4]]?.find(i => i.image.includes(params[2]));
        if (!blankImage) blankImage = blank?.multiImages?.[params[4] === "front" ? "modelFront" : "modelBack"]?.find(i => i.image.includes(params[2]));
        if (!blankImage) { blankImage = blank?.images?.find(i => i.image.includes(params[2])); if (blankImage) type = "images"; }
    } else if (params.length === 6) {
        const [d, blank] = await Promise.all([
            Design.findOne({ sku: params[0] }).lean(),
            Blank.findOne({ code: params[1] }).populate("colors").lean(),
        ]);
        design = d;
        designImage = design?.threadImages?.[params[5]];
        blankImage = blank?.multiImages?.[params[4]]?.find(i => i.image.includes(params[2]));
        if (!blankImage) blankImage = blank?.multiImages?.[params[4] === "front" ? "modelFront" : "modelBack"]?.find(i => i.image.includes(params[2]));
        if (!blankImage) { blankImage = blank?.images?.find(i => i.image.includes(params[2])); if (blankImage) type = "images"; }
    } else {
        const blankCode = req.nextUrl.searchParams.get("blank");
        const bm = req.nextUrl.searchParams.get("blankImage");
        const colorName = req.nextUrl.searchParams.get("colorName");
        const side = req.nextUrl.searchParams.get("side");
        designImage = req.nextUrl.searchParams.get("design");
        if (side != null) { sides.push(side); designImage = { [side]: designImage }; }
        const blank = await Blank.findOne({ code: blankCode }).populate("colors").lean();
        const color = blank?.colors?.find(c => c.name === colorName);
        if (bm && blank?.images?.length > 0) {
            type = "images";
            blankImage = blank.images.find(i => i.image === bm);
        } else if (bm) {
            blankImage = blank?.multiImages?.[side]?.find(i => i.color.toString() === color?._id.toString() && i.image === bm);
            if (!blankImage && side === "front") blankImage = blank?.multiImages?.modelFront?.find(i => i.color.toString() === color?._id.toString() && i.image === bm);
            if (!blankImage && side === "back") blankImage = blank?.multiImages?.modelBack?.find(i => i.color.toString() === color?._id.toString() && i.image === bm);
        } else if (blank?.images?.length > 0) {
            type = "images";
            blankImage = blank.images.find(i => i.color.toString() === color?._id.toString() && i.boxes?.[side]);
        } else {
            blankImage = blank?.multiImages?.[side]?.find(i => i.color.toString() === color?._id.toString());
        }
        if (side === "back" && !blankImage) blankImage = blank?.multiImages?.modelBack?.find(i => i.color.toString() === color?._id.toString());
    }

    if (!blankImage) return new NextResponse(null, { status: 404 });

    const data = {
        box: type === "images"
            ? Object.keys(blankImage?.boxes ?? {}).filter(k => sides.includes(k)).map(k => ({ ...blankImage.boxes[k], side: k }))
            : blankImage?.box ? [{ ...blankImage.box[0], side: sides[0] }] : null,
        styleImage: blankImage?.image,
        designImage,
        sublimationImages: design?.sublimationImages ?? null,
        sublimationBoxes: blankImage?.sublimationBoxes ?? null,
        width,
    };

    const result = await createImage(data);
    if (!result) return new NextResponse(null, { status: 404 });

    const buffer = Buffer.from(result.replace(/^data:image\/\w+;base64,/, ""), "base64");
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            'Access-Control-Allow-Origin': '*',
        }
    });
}

export async function POST(req) {
    const data = await req.json();
    const base64 = await createImage(data);
    return NextResponse.json({ error: false, base64 });
}
