import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Design } from "@pythias/mongo";
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

  try {
    const { dataUrl, name, printType } = await req.json();
    if (!dataUrl) {
      return NextResponse.json({ error: true, msg: "dataUrl required" }, { status: 400 });
    }

    // Upload canvas PNG to Wasabi
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64, "base64");
    const key = `designs/${Date.now()}.png`;
    await s3.send(new PutObjectCommand({
      Bucket: "images1.pythiastechnologies.com",
      Key: key,
      Body: buf,
      ACL: "public-read",
      ContentType: "image/png",
    }));
    const cdnUrl = `https://images1.pythiastechnologies.com/${key}`;

    // Create Design record with the template image as the front
    const sku = createSku();
    const designName = name || sku;
    const design = await Design.create({
      date: new Date(),
      sku,
      name: designName,
      images: { front: cdnUrl },
      printType: Array.isArray(printType) ? printType[0] : (printType || "DTF"),
    });

    logActivity({ action: "design_create", entity: "design", entityId: design._id, entityName: sku, userName, email });
    logChange({ entityType: "design", entityId: design._id, entityName: sku, action: "create", userName, email, provider: "premierPrinting" });

    return NextResponse.json({ error: false, design: { _id: design._id, sku: design.sku } });
  } catch (e) {
    console.error("[create-design]", e);
    return NextResponse.json({ error: true, msg: e?.message || String(e) }, { status: 500 });
  }
}
