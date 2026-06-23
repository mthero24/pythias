import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { runCjReorder, receiveReorder } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/reorder           → run the auto-reorder sweep for this org
// POST /api/admin/sourcing/reorder { receive: { productId, sku } } → mark a pending reorder received
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    try {
        if (body?.receive?.productId && body?.receive?.sku) {
            return NextResponse.json(await receiveReorder(token.orgId, body.receive.productId, body.receive.sku));
        }
        return NextResponse.json(await runCjReorder(token.orgId));
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message || "Reorder failed" }, { status: 500 });
    }
}
