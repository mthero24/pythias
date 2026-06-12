import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformOrder as Order } from "@pythias/mongo";
import { shapeOrder } from "@/lib/partnerShape";

const isObjectId = (v) => /^[a-f0-9]{24}$/i.test(v ?? "");

// GET /api/partner/orders/:orderId
// Accepts the Mongo _id, the orderId, or the poNumber — all scoped to this org.
export async function GET(req, { params }) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { orderId } = await params;
    const key = decodeURIComponent(orderId ?? "").trim();
    if (!key) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const or = [{ orderId: key }, { poNumber: key }];
    if (isObjectId(key)) or.push({ _id: key });

    const order = await Order.findOne({ orgId, $or: or })
        .populate("items", "sku name colorName sizeName styleCode quantity status price discount discountName")
        .lean();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ order: shapeOrder(order) });
}
