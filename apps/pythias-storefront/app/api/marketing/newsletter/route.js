export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { clientIp } from "@/lib/auth";

// POST /api/marketing/newsletter — footer newsletter capture. Body: { email }. List-building only (no
// discount): upserts a lead with provable email marketing consent (source "footer"). Honors the
// footer newsletter being enabled.
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    if (ctx.site?.footer?.newsletter?.enabled === false) return NextResponse.json({ error: "Newsletter is not enabled" }, { status: 400 });

    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();
    if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });

    const consent = { optedIn: true, at: new Date(), source: "footer", ip: clientIp(req), text: ctx.site?.footer?.newsletter?.consentText || "I agree to receive marketing emails. Unsubscribe anytime." };
    const existing = await StorefrontCustomer.findOne({ orgId: ctx.orgId, email });
    if (existing) { existing.set("marketingConsent.email", consent); await existing.save(); }
    else { const c = new StorefrontCustomer({ orgId: ctx.orgId, email, isLead: true }); c.set("marketingConsent.email", consent); await c.save(); }

    return NextResponse.json({ ok: true });
}
