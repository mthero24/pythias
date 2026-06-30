import { NextResponse } from "next/server";
import { runCjReorder, placeReorder, receiveReorder, setReorderLevels, setOnHand } from "@pythias/backend/server";
import { premierAuthedOrg } from "@/lib/storefrontOrg";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/reorder — sweep / manual order / receive / set levels / set on-hand
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    try {
        if (body?.receive?.productId && body?.receive?.sku) {
            return NextResponse.json(await receiveReorder(orgId, body.receive.productId, body.receive.sku));
        }
        if (body?.order?.productId && body?.order?.sku) {
            return NextResponse.json(await placeReorder(orgId, body.order.productId, body.order.sku, body.order.qty));
        }
        if (body?.levels?.productId && body?.levels?.sku) {
            return NextResponse.json(await setReorderLevels(orgId, body.levels.productId, body.levels.sku, body.levels.reorderPoint, body.levels.reorderTo));
        }
        if (body?.onHand?.productId && body?.onHand?.sku) {
            return NextResponse.json(await setOnHand(orgId, body.onHand.productId, body.onHand.sku, body.onHand.stock));
        }
        return NextResponse.json(await runCjReorder(orgId));
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message || "Reorder failed" }, { status: 500 });
    }
}
