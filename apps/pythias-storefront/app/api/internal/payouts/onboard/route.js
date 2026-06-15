export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { assertInternal } from "@/lib/internal";
import { connectOnboardingLink } from "@/lib/payouts";

// POST /api/internal/payouts/onboard  (server-to-server, from the platform Payouts UI)
// Body: { orgId, returnUrl, refreshUrl? }  →  { url }
// Mints a Stripe Connect Express onboarding link for the seller's marketplace account.
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json().catch(() => null);
    const orgId = body?.orgId;
    const returnUrl = body?.returnUrl;
    if (!orgId || !returnUrl) return NextResponse.json({ error: "orgId and returnUrl are required" }, { status: 400 });

    try {
        const url = await connectOnboardingLink(orgId, { returnUrl, refreshUrl: body?.refreshUrl });
        return NextResponse.json({ url });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
