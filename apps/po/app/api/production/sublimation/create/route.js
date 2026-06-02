export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { processItem } from "@pythias/sublimation/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

async function pushToFileWriter(base64, pieceId, folder, ext, localIP, localKey) {
  const res = await fetch(`http://${localIP}/api/sublimation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localKey}`,
    },
    body: JSON.stringify({ base64, pieceId, folder, ext, printer: "printer1" }),
  });
  return res.json().catch(() => ({}));
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { item } = await req.json();
  const sc = await getShippingCreds();

  try {
    const result = await processItem(item);
    await pushToFileWriter(result.base64, item.pieceId, result.folder, result.ext, sc.localIP, sc.localKey);
    logActivity({ action: "sublimation_create", entity: "order", entityName: item.pieceId, userName, email, provider: "po" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
