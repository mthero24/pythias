import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getLabelRates } from "@pythias/backend/server";
import { shipmentForOrder } from "@/lib/shippingLabel";

export const dynamic = "force-dynamic";

// POST /api/admin/shipping/rates  Body: { orderId } → { shipmentId, rates[], markupCents, parcelWeightOz }
// Rate-shops discounted carrier labels for a self-ship order. No charge here (buy does that).
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    try {
        const { from, to, parcel } = await shipmentForOrder(token.orgId, orderId);
        const { shipmentId, rates, markupCents } = await getLabelRates({ from, to, parcel });
        return NextResponse.json({ shipmentId, rates, markupCents, parcelWeightOz: parcel.weight });
    } catch (e) {
        return NextResponse.json({ error: e.message, code: e.code || null }, { status: e.code ? 400 : 500 });
    }
}
