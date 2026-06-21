import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PlatformDesign as Design } from "@pythias/mongo";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_WASABI_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET,
  },
  region: "us-west-1",
  endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function createSku() {
  return Array.from({ length: 10 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join("");
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  if (!token?.permissions?.designs) {
    return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 403 });
  }
  const orgId = token.orgId;

  try {
    const { dataUrl, name, printType, embroideryFileBase64, vinylSvgContent, polygonsJson, embTextLayersJson } = await req.json();
    if (!dataUrl) {
      return NextResponse.json({ error: true, msg: "dataUrl required" }, { status: 400 });
    }

    const ts = Date.now();

    // Upload canvas PNG to Wasabi
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64, "base64");
    const key = `designs/${ts}.png`;
    await s3.send(new PutObjectCommand({
      Bucket: "images1.pythiastechnologies.com",
      Key: key,
      Body: buf,
      ACL: "public-read",
      ContentType: "image/png",
    }));
    const cdnUrl = `https://images1.pythiastechnologies.com/${key}`;

    // Upload DST file if provided (embroidery)
    let embroideryFiles = {};
    if (embroideryFileBase64) {
      const dstKey = `designs/${ts}.dst`;
      await s3.send(new PutObjectCommand({
        Bucket: "images1.pythiastechnologies.com",
        Key: dstKey,
        Body: Buffer.from(embroideryFileBase64, "base64"),
        ACL: "public-read",
        ContentType: "application/octet-stream",
      }));
      embroideryFiles.dst = `https://images1.pythiastechnologies.com/${dstKey}`;
    }

    // Upload polygon JSON for persistent customer-order generation
    if (polygonsJson) {
      const polKey = `designs/${ts}_polygons.json`;
      await s3.send(new PutObjectCommand({
        Bucket: "images1.pythiastechnologies.com",
        Key: polKey,
        Body: Buffer.from(polygonsJson, "utf-8"),
        ACL: "public-read",
        ContentType: "application/json",
      }));
      embroideryFiles.polygonsUrl = `https://images1.pythiastechnologies.com/${polKey}`;
    }

    // Upload vinyl SVG if provided
    if (vinylSvgContent) {
      const svgKey = `designs/${ts}.svg`;
      await s3.send(new PutObjectCommand({
        Bucket: "images1.pythiastechnologies.com",
        Key: svgKey,
        Body: Buffer.from(vinylSvgContent, "utf-8"),
        ACL: "public-read",
        ContentType: "image/svg+xml",
      }));
      embroideryFiles.vinylSvg = `https://images1.pythiastechnologies.com/${svgKey}`;
    }

    // Upload text layer definitions (font/position/fieldId per layer) for customer text regeneration
    if (embTextLayersJson) {
      const tlKey = `designs/${ts}_textlayers.json`;
      await s3.send(new PutObjectCommand({
        Bucket: "images1.pythiastechnologies.com",
        Key: tlKey,
        Body: Buffer.from(embTextLayersJson, "utf-8"),
        ACL: "public-read",
        ContentType: "application/json",
      }));
      embroideryFiles.textLayersUrl = `https://images1.pythiastechnologies.com/${tlKey}`;
    }

    // Create Design record with the template image as the front
    const sku = createSku();
    const designName = name || sku;
    const design = await Design.create({
      orgId,
      date: new Date(),
      sku,
      name: designName,
      images: { front: cdnUrl },
      printType: Array.isArray(printType) ? printType[0] : (printType || "DTF"),
      ...(Object.keys(embroideryFiles).length > 0 && { embroideryFiles }),
    });

    logActivity({ action: "design_create", entity: "design", entityId: design._id, entityName: sku, userName, email, orgId });
    logChange({ entityType: "design", entityId: design._id, entityName: sku, action: "create", userName, email, provider: "premierPrinting" });

    return NextResponse.json({ error: false, design: { _id: design._id, sku: design.sku } });
  } catch (e) {
    console.error("[create-design]", e);
    return NextResponse.json({ error: true, msg: e?.message || String(e) }, { status: 500 });
  }
}
