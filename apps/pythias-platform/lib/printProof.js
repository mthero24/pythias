import sharp from "sharp";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Server-rendered PLACEMENT PROOF for custom ("create your own") items: composites the buyer's
// already-cropped art onto the garment mockup at the EXACT placement they designed, so production
// (DTF Find) can see how the finished piece should look. The physical print stays size-only — this
// is a visual proof only. Generated lazily once per side and cached on personalization.sides[].proofUrl.
// Compositing math mirrors the [...renderImages] mockup route so the proof matches the live preview.

const REF = 400; // the 400-reference frame box geometry + placement are expressed in
const CDN = (url) => url?.replace("https://images1.pythiastechnologies.com", "https://images2.pythiastechnologies.com/origin");

const s3 = new S3Client({
    credentials: {
        accessKeyId:     process.env.NEXT_PUBLIC_WASABI_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET,
    },
    region:   "us-west-1",
    endpoint: "https://s3.us-west-1.wasabisys.com/",
});
const BUCKET = "images1.pythiastechnologies.com";

const readImage = async (url) => {
    const r = await axios.get(url, { responseType: "arraybuffer" }).catch(() => null);
    return r ? sharp(Buffer.from(r.data, "binary")) : null;
};

// Compare image URLs ignoring host/CDN + query so a stored styleImage matches a blank.images[].image.
const norm = (u) => (u || "").split("?")[0].replace(/^https?:\/\/[^/]+/, "");

function matchBlankImage(images, styleImage, location) {
    if (!images?.length) return null;
    const target = norm(styleImage);
    return images.find((i) => norm(i.image) === target && i.boxes?.[location])
        || images.find((i) => norm(i.image) === target)
        || images.find((i) => i.boxes?.[location])
        || null;
}

// Composite the cropped art onto the garment at box + normalized placement. Returns a JPEG buffer.
async function compositeProof({ styleImage, box, place, artUrl, width = 800 }) {
    const multiplier = width / REF;
    const base = await readImage(`${CDN(styleImage)}?width=${width}&height=${width}`);
    if (!base) return null;

    const boxW = box.boxWidth ?? box.width ?? box.w;
    const boxH = box.boxHeight ?? box.height ?? box.h;
    if (!boxW || !boxH) return base.jpeg({ quality: 92 }).toBuffer();

    let bx = box.x, by = box.y, bw = boxW, bh = boxH;
    if (place && place.wPct > 0 && place.hPct > 0) {
        bx = box.x + (place.xPct || 0) * boxW;
        by = box.y + (place.yPct || 0) * boxH;
        bw = place.wPct * boxW;
        bh = place.hPct * boxH;
    }
    let x = bx * multiplier, y = by * multiplier;

    const art = await readImage(`${CDN(artUrl)}?width=${parseInt(bw * multiplier)}&height=${parseInt(bh * multiplier)}`);
    if (!art) return base.jpeg({ quality: 92 }).toBuffer();

    const meta = await art.metadata();
    let artBuf;
    const rot = parseInt(box.rotation || 0);
    if (rot) {
        const { width: ow, height: oh } = meta;
        artBuf = await art.rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
        const rm = await sharp(artBuf).metadata();
        const a = (rot * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
        const cx = ow / 2, cy = oh / 2;
        x -= (cx + ((0 - cx) * cos) - ((0 - cy) * sin) + (rm.width - ow) / 2);
        y -= (cy + ((0 - cx) * sin) + ((0 - cy) * cos) + (rm.height - oh) / 2);
    } else {
        artBuf = await art.toBuffer();
    }
    const offset = (meta.width - bw * multiplier) / 2;
    return base
        .composite([{ input: artBuf, blend: "atop", top: parseInt(y), left: parseInt(x - offset) }])
        .jpeg({ quality: 92 })
        .toBuffer();
}

/**
 * Ensure every custom side of `item` has a cached placement proof. Mutates personalization.sides[].proofUrl
 * (caller is responsible for item.save()). Returns a { location: proofUrl } map, or null when not custom.
 * `item.blank` must be populated with `images`.
 */
export async function ensureItemProofs(item) {
    const sides = item?.personalization?.sides;
    if (!Array.isArray(sides) || !sides.length) return null;
    const images = item.blank?.images || [];
    const proofs = {};
    for (const s of sides) {
        if (!s || !s.artworkUrl || !s.location) continue;
        if (s.proofUrl) { proofs[s.location] = s.proofUrl; continue; }
        const blankImage = matchBlankImage(images, s.styleImage, s.location);
        const box = blankImage?.boxes?.[s.location];
        if (!box) continue;
        const buf = await compositeProof({
            styleImage: s.styleImage || blankImage.image,
            box,
            place: s.place,
            artUrl: s.artworkUrl,
        }).catch(() => null);
        if (!buf) continue;
        const key = `platform/proofs/${item.pieceId || item._id}-${s.location}-${Date.now()}.jpg`;
        const ok = await s3.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key, Body: buf, ACL: "public-read", ContentType: "image/jpeg",
        })).then(() => true).catch(() => false);
        if (!ok) continue;
        s.proofUrl = `https://${BUCKET}/${key}`;
        proofs[s.location] = s.proofUrl;
    }
    return Object.keys(proofs).length ? proofs : null;
}
