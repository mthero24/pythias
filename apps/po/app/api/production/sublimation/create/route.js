export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { processItem } from "@pythias/sublimation/server";

async function pushToFileWriter(base64, pieceId, folder, ext) {
  const res = await fetch(`http://${process.env.localIP}/api/sublimation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.localKey}`,
    },
    body: JSON.stringify({ base64, pieceId, folder, ext, printer: "printer1" }),
  });
  return res.json().catch(() => ({}));
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { item } = await req.json();

  try {
    const result = await processItem(item);
    await pushToFileWriter(result.base64, item.pieceId, result.folder, result.ext);
    logActivity({ action: "sublimation_create", entity: "order", entityName: item.pieceId, userName, email, provider: "po" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
