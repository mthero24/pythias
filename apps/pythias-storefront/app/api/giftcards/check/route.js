export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";
import { validateGiftCard } from "@/lib/discounts";

// GET /api/giftcards/check?code= — public gift-card balance lookup.
export async function GET(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const code = new URL(req.url).searchParams.get("code");
    const r = await validateGiftCard(ctx.orgId, code);
    if (!r.ok) return NextResponse.json({ valid: false, reason: r.reason });
    return NextResponse.json({ valid: true, code: r.code, balanceCents: r.balanceCents });
}
