export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, giftCards: await storefront.listGiftCards(orgId) }); }
    catch (e) { return svcError(e); }
}

export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, giftCard: await storefront.issueGiftCard(orgId, b) }, { status: 201 }); }
    catch (e) { return svcError(e); }
}
