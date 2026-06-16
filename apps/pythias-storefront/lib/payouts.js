import { Organization, PlatformOrder } from "@pythias/mongo";
import { storefrontStripe } from "@/lib/stripe";

// Stripe Connect Express payouts for storefront sellers. Pythias (the marketplace account)
// collects buyer payments and transfers each seller's net to their connected account.

// Create the seller's Express account if they don't have one yet; returns the account id.
export async function ensureConnectAccount(orgId) {
    const stripe = storefrontStripe();
    if (!stripe) throw new Error("Payments not configured");
    const org = await Organization.findById(orgId).select("name billingEmail storefrontConnect").lean();
    if (org?.storefrontConnect?.accountId) return org.storefrontConnect.accountId;
    const acct = await stripe.accounts.create({
        type: "express",
        email: org?.billingEmail || undefined,
        business_profile: { name: org?.name || undefined },
        capabilities: { transfers: { requested: true } },
    });
    await Organization.updateOne({ _id: orgId }, { $set: { "storefrontConnect.accountId": acct.id, "storefrontConnect.status": "pending" } });
    return acct.id;
}

// A hosted onboarding link the seller completes (KYC/bank). Call from the platform's Payouts UI.
export async function connectOnboardingLink(orgId, { returnUrl, refreshUrl } = {}) {
    const stripe = storefrontStripe();
    if (!stripe) throw new Error("Payments not configured");
    const accountId = await ensureConnectAccount(orgId);
    const link = await stripe.accountLinks.create({
        account: accountId, type: "account_onboarding",
        return_url: returnUrl, refresh_url: refreshUrl || returnUrl,
    });
    return link.url;
}

// Re-check whether the account can receive payouts; updates org status.
export async function refreshConnectStatus(orgId) {
    const stripe = storefrontStripe();
    if (!stripe) return { status: "none" };
    const org = await Organization.findById(orgId).select("storefrontConnect").lean();
    const id = org?.storefrontConnect?.accountId;
    if (!id) return { status: "none" };
    const acct = await stripe.accounts.retrieve(id);
    const active = !!(acct.charges_enabled && acct.payouts_enabled);
    await Organization.updateOne({ _id: orgId }, { $set: { "storefrontConnect.status": active ? "active" : "pending", ...(active ? { "storefrontConnect.onboardedAt": new Date() } : {}) } });
    return { status: active ? "active" : "pending", payouts_enabled: acct.payouts_enabled, charges_enabled: acct.charges_enabled, accountId: id };
}

// Transfer the seller's net for an order to their connected account.
//   net = subtotal − wholesale(cost basis) − (actual Stripe fee + 1% of subtotal)
// Tax (remitted by Pythias) and shipping are handled separately.
// ⚠️ Trigger this at FULFILLMENT-SHIP settlement (when ship/handling are known), mirroring
// the Commerce Cloud reverse flow — not at order placement. Returns the Transfer or null.
export async function payoutToSeller({ orgId, subtotalCents, wholesaleCents = 0, stripeFeeCents = 0, orderId }) {
    const stripe = storefrontStripe();
    if (!stripe) return null;
    const org = await Organization.findById(orgId).select("storefrontConnect").lean();
    const dest = org?.storefrontConnect?.accountId;
    if (!dest || org.storefrontConnect.status !== "active") return null;   // seller hasn't onboarded payouts
    const platformFee = stripeFeeCents + Math.round(subtotalCents * 0.01); // Stripe fee + 1% of subtotal
    const net = subtotalCents - wholesaleCents - platformFee;
    if (net <= 0) return null;
    return stripe.transfers.create({
        amount: net, currency: "usd", destination: dest,
        transfer_group: String(orderId), metadata: { orgId: String(orgId), orderId: String(orderId || "") },
    });
}

// Settle a single order's payout to its seller. Reads the inputs captured at payment time
// (order.storefrontPayout), transfers the net, and marks the order paid. Idempotent — a
// second call on an already-paid order is a no-op.
//
// ⚠️ THIS IS THE PAYOUT TRIGGER. Call it from the fulfillment-ship settlement step (once
// the provider-routing handoff exists), not at order placement. Returns the result status.
export async function settleOrderPayout(orderId) {
    const order = await PlatformOrder.findById(orderId).select("orgId storefrontPayout").lean();
    if (!order) return { status: "not_found" };
    const p = order.storefrontPayout;
    if (!p || p.status === "paid") return { status: p?.status === "paid" ? "already_paid" : "no_payout" };

    const transfer = await payoutToSeller({
        orgId: order.orgId,
        subtotalCents: p.subtotalCents || 0,
        wholesaleCents: p.wholesaleCents || 0,
        stripeFeeCents: p.stripeFeeCents || 0,
        orderId,
    });

    if (!transfer) {
        // Seller not onboarded or net <= 0 — record so it doesn't retry forever.
        await PlatformOrder.updateOne({ _id: orderId }, { $set: { "storefrontPayout.status": "skipped" } });
        return { status: "skipped" };
    }
    await PlatformOrder.updateOne({ _id: orderId }, { $set: { "storefrontPayout.status": "paid", "storefrontPayout.transferId": transfer.id, "storefrontPayout.paidAt": new Date() } });
    return { status: "paid", transferId: transfer.id, amount: transfer.amount };
}

// Merchant-of-record clawback: on a LOST dispute, reverse the seller's payout transfer (Pythias
// ate the chargeback as MoR; the seller's share is recovered). Idempotent + best-effort.
export async function clawbackOrderPayout(orderId, reason = "dispute_lost") {
    const order = await PlatformOrder.findById(orderId).select("storefrontPayout").lean();
    const tid = order?.storefrontPayout?.transferId;
    if (!tid || order.storefrontPayout.status === "clawed_back") return { status: "no_transfer" };
    const stripe = storefrontStripe();
    if (!stripe) return { status: "no_stripe" };
    try {
        await stripe.transfers.createReversal(tid, { metadata: { reason } });
        await PlatformOrder.updateOne({ _id: orderId }, { $set: { "storefrontPayout.status": "clawed_back" } });
        return { status: "clawed_back" };
    } catch (e) {
        return { status: "error", error: e.message };
    }
}
