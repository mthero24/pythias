export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { createPoster } from "@pythias/sublimation/server";

async function pushToFileWriter(base64, pieceId, folder) {
  const res = await fetch(`http://${process.env.localIP}/api/sublimation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.localKey}`,
    },
    body: JSON.stringify({ base64, pieceId, folder, printer: "printer1", print: true }),
  });
  return res.json().catch(() => ({}));
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { image, bgColor, size, sku } = await req.json();

  try {
    const { base64, folder } = await createPoster(image, bgColor, size, sku);
    await pushToFileWriter(base64, sku, folder);
    logActivity({ action: "poster_sent", entity: "order", entityName: sku, userName, email, provider: "po" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
