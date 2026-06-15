export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

export async function PUT(req, { params }) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, giftCard: await storefront.updateGiftCard(orgId, id, b) }); }
    catch (e) { return svcError(e); }
}
