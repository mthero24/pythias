export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { clientIp } from "@/lib/auth";
import { createPopupDiscount } from "@/lib/discounts";
import { enqueuePopupDiscount } from "@/lib/emailFlows";

// POST /api/marketing/subscribe — signup-popup capture. Body: { email, phone?, emailOptIn, smsOptIn }
// Creates/updates a lead (passwordless customer) with provable consent, issues the configured
// discount, and emails the code. Returns { ok, code? }.
export async function POST(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });
    const popup = ctx.site?.popup;
    if (!popup?.enabled) return NextResponse.json({ error: "Signups are not enabled" }, { status: 400 });

    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();
    const phone = body?.phone?.toString().trim() || undefined;
    if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    if (popup.requirePhone && !phone) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });

    const ip = clientIp(req);
    const now = new Date();
    const consent = {};
    if (body?.emailOptIn) consent["marketingConsent.email"] = { optedIn: true, at: now, source: "popup", ip, text: popup.emailConsentText || "" };
    if (phone && body?.smsOptIn) consent["marketingConsent.sms"] = { optedIn: true, at: now, source: "popup", ip, text: popup.smsConsentText || "" };

    // Upsert the contact. New ones are leads; existing accounts just get consent/phone updates.
    const existing = await StorefrontCustomer.findOne({ orgId: ctx.orgId, email });
    let customer;
    if (existing) {
        Object.entries(consent).forEach(([k, v]) => existing.set(k, v));
        if (phone && !existing.phone) existing.phone = phone;
        await existing.save();
        customer = existing;
    } else {
        customer = new StorefrontCustomer({ orgId: ctx.orgId, email, phone, isLead: true, emailVerified: false });
        Object.entries(consent).forEach(([k, v]) => customer.set(k, v));
        await customer.save();
    }

    // Issue the discount + email the code.
    const code = await createPopupDiscount(ctx.orgId, popup);
    if (code) await enqueuePopupDiscount(ctx.site, { email, code, customerId: customer._id }).catch(() => {});

    return NextResponse.json({ ok: true, code: code || null });
}
