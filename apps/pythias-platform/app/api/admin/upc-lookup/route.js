import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { lookupUpc } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/admin/upc-lookup  Body: { upc } → { found, upc, source, product }
// Looks up a UPC for the buy-not-build (reseller) product creator. UPCitemdb first, Claude
// web_search to fill gaps. Returns a normalized product the UI prefills (seller edits before save).
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { upc } = await req.json().catch(() => ({}));
    try {
        return NextResponse.json(await lookupUpc(upc));
    } catch (e) {
        return NextResponse.json({ found: false, error: e.message || "Lookup failed" }, { status: 500 });
    }
}
