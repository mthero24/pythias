export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const data = await req.json();
  try {
    const res = await fetch(
      `http://${process.env.localIP}/api/print-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.localKey}`,
        },
        body: JSON.stringify({ ...data, printer: "printer1" }),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!json.error) {
      logActivity({ action: "gift_message_printed", entity: "order", entityName: data.pieceId || "", userName, email, provider: "po" });
    }
    return NextResponse.json(json);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: true, msg: String(e) });
  }
}
