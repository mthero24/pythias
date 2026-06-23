import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { runCjReorder, placeReorder, receiveReorder } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/reorder                                  → run the low-stock sweep
// POST /api/admin/sourcing/reorder { order:   { productId, sku, qty } } → manually order one variant
// POST /api/admin/sourcing/reorder { receive: { productId, sku } }      → mark a pending reorder received
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    try {
        if (body?.receive?.productId && body?.receive?.sku) {
            return NextResponse.json(await receiveReorder(token.orgId, body.receive.productId, body.receive.sku));
        }
        if (body?.order?.productId && body?.order?.sku) {
            return NextResponse.json(await placeReorder(token.orgId, body.order.productId, body.order.sku, body.order.qty));
        }
        return NextResponse.json(await runCjReorder(token.orgId));
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message || "Reorder failed" }, { status: 500 });
    }
}
