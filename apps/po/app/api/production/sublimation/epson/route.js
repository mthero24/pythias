export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { processEpsonPair } from "@pythias/sublimation/server";

async function pushToFileWriter(base64, pieceId, folder) {
  const res = await fetch(`http://${process.env.localIP}/api/sublimation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.localKey}`,
    },
    body: JSON.stringify({ base64, pieceId, folder, printer: "printer1" }),
  });
  return res.json().catch(() => ({}));
}

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { items } = await req.json();

  if (!items?.length) return NextResponse.json({ error: true, msg: "No items provided" });

  try {
    const { base64, folder } = await processEpsonPair(items);
    const pieceId = items.map(i => i.pieceId).join("-");
    await pushToFileWriter(base64, pieceId, folder);
    logActivity({ action: "epson_sent", entity: "order", entityName: pieceId, userName, email, provider: "po" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
