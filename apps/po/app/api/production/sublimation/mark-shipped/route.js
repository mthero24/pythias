export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Items from "@/models/Items";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";

export async function POST(req) {
  const token = await getToken({ req });
  const { userName, email } = userFromToken(token);
  const { pieceId } = await req.json();
  await Items.updateOne(
    { pieceId },
    { shipped: true, shippedDate: new Date(), $push: { steps: { status: "Shipped", date: new Date() } } }
  );
  logActivity({ action: "mark_shipped", entity: "order", entityName: pieceId, userName, email, provider: "po" });
  return NextResponse.json({ error: false });
}
