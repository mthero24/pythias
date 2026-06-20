export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const status = await storefront.supplierStatus(orgId);
        const [orders, eligibility] = await Promise.all([
            status.enrolled ? storefront.supplierOrders(orgId) : null,
            status.enrolled ? null : storefront.supplierEligibility(orgId),
        ]);
        return NextResponse.json({ error: false, status, orders, eligibility });
    } catch (e) { return svcError(e); }
}
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.op === "enroll") return NextResponse.json({ error: false, status: await storefront.enrollAsSupplier(orgId) });
        if (b.op === "submit-kyc") return NextResponse.json({ error: false, status: await storefront.submitSupplierKyc(orgId, b.kyc || b) });
        return NextResponse.json({ error: "Unknown op" }, { status: 400 });
    } catch (e) { return svcError(e); }
}
export async function PUT(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, status: await storefront.updateSupplierControls(orgId, b) }); } catch (e) { return svcError(e); }
}
