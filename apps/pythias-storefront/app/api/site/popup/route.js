export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/site/popup — public, safe popup config for the resolved storefront (used by the
// client-side signup popup). Returns only display fields, never internal config.
export async function GET(req) {
    const ctx = await resolveOrg(req);
    const p = ctx?.site?.popup;
    if (!p?.enabled) return NextResponse.json({ enabled: false });
    return NextResponse.json({
        enabled: true,
        headline: p.headline,
        body: p.body,
        collectPhone: !!p.collectPhone,
        requirePhone: !!p.requirePhone,
        buttonText: p.buttonText,
        delaySeconds: p.delaySeconds ?? 5,
        hasDiscount: p.discountType !== "none" && p.discountValue > 0,
        emailConsentText: p.emailConsentText,
        smsConsentText: p.smsConsentText,
    });
}
