export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { createMug } from "@pythias/sublimation/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

async function pushToFileWriter(base64, pieceId, folder, localIP, localKey) {
  const res = await fetch(`http://${localIP}/api/sublimation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localKey}`,
    },
    body: JSON.stringify({ base64, pieceId, folder, printer: "printer1" }),
  });
  return res.json().catch(() => ({}));
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { item } = await req.json();
  const sc = await getShippingCreds();

  const MUG_CODES = ["CFM", "TMUG", "BYEH300W", "21150"];
  if (!MUG_CODES.includes(item.styleCode)) {
    return NextResponse.json({ error: true, msg: "Not a mug style code" });
  }

  try {
    const { base64, folder } = await createMug(item);
    await pushToFileWriter(base64, item.pieceId, folder, sc.localIP, sc.localKey);
    logActivity({ action: "sublimation_sent", entity: "order", entityName: item.pieceId, userName, email, provider: "po" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
