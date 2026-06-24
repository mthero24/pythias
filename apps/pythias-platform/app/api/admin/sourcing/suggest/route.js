import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { suggestReorderLevels } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/suggest { productId } → AI-suggested reorder point + restock-to per variant
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (!body?.productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    try {
        return NextResponse.json(await suggestReorderLevels(token.orgId, body.productId));
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message || "Suggestion failed" }, { status: 500 });
    }
}
