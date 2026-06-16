export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";

// POST /api/internal/supplier/verify — Pythias ops KYC decision for a seller-as-supplier.
// Body: { orgId, approve: bool, reason?: string }. Shared-secret guarded. On approve, the supplier
// goes live (acceptsCommerceCloud flips on so the routing engine can send them orders).
export async function POST(req) {
    if (!process.env.PYTHIAS_INTERNAL_KEY || req.headers.get("x-pythias-internal-key") !== process.env.PYTHIAS_INTERNAL_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const b = await req.json().catch(() => ({}));
    if (!b.orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    try { return NextResponse.json({ error: false, ...(await storefront.verifySupplierKyc(b.orgId, { approve: !!b.approve, reason: b.reason })) }); }
    catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
