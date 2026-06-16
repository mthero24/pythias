export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { getStripe } from "@/lib/stripe";
import { sessionOrgId, svcError } from "@/lib/storefrontRoute";

// Apply the "extra store" add-on on the org's Stripe subscription: one item, quantity = stores
// beyond the plan's included count, priced at the plan's per-store rate. Idempotent.
async function applyExtraBilling({ subscriptionId, extraStoreItemId, extras, extraStoreCents, plan }) {
    if (!subscriptionId) return extraStoreItemId || null;   // dev/price_data path — no live subscription
    const stripe = getStripe();
    if (extraStoreItemId) {
        if (extras <= 0) { try { await stripe.subscriptionItems.del(extraStoreItemId); } catch { /* already gone */ } return null; }
        await stripe.subscriptionItems.update(extraStoreItemId, { quantity: extras });
        return extraStoreItemId;
    }
    if (extras <= 0) return null;
    const item = await stripe.subscriptionItems.create({
        subscription: subscriptionId, quantity: extras,
        price_data: { currency: "usd", recurring: { interval: "month" }, product_data: { name: `Additional storefront — ${plan}` }, unit_amount: extraStoreCents },
    });
    return item.id;
}

export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, ...(await storefront.listStores(orgId)) }); } catch (e) { return svcError(e); }
}

export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.op === "add" || b.op === "remove") {
            const r = b.op === "add" ? await storefront.addStore(orgId, b) : await storefront.removeStore(orgId, b.siteId);
            const itemId = await applyExtraBilling(r);
            if (itemId !== (r.extraStoreItemId || null)) await storefront.setExtraStoreItemId(orgId, itemId);
            return NextResponse.json({ error: false, ...(await storefront.listStores(orgId)) });
        }
        return NextResponse.json({ error: "Unknown op" }, { status: 400 });
    } catch (e) { return svcError(e); }
}
