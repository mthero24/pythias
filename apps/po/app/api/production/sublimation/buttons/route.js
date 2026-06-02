export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { createButtonsPdf } from "@pythias/sublimation/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

async function pushToFileWriter(base64, pieceId, folder, localIP, localKey) {
  const res = await fetch(`http://${localIP}/api/sublimation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localKey}`,
    },
    body: JSON.stringify({ base64, pieceId, folder, printer: "printer1", print: true }),
  });
  return res.json().catch(() => ({}));
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { poNumber, buttons } = await req.json();
  const sc = await getShippingCreds();

  try {
    const { base64, folder } = await createButtonsPdf(poNumber, buttons);
    await pushToFileWriter(base64, poNumber, folder, sc.localIP, sc.localKey);
    logActivity({ action: "buttons_sent", entity: "order", entityName: poNumber, userName, email, provider: "po" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
