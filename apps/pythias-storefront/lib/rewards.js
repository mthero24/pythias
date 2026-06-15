import { StorefrontCustomer, RewardLedger } from "@pythias/mongo";

// Apply a signed reward change to a customer's balance + write the ledger entry.
async function apply({ orgId, customerId, type, amountCents, orderId, note }) {
    if (!amountCents) return 0;
    const updated = await StorefrontCustomer.findOneAndUpdate(
        { _id: customerId, orgId },
        { $inc: { rewardsBalance: amountCents } },
        { new: true }
    ).select("rewardsBalance").lean();
    if (!updated) return 0;
    await RewardLedger.create({ orgId, customerId, type, amountCents, balanceAfter: updated.rewardsBalance, orderId, note });
    return amountCents;
}

// Granted once when a customer creates an account (if the seller configured a bonus).
export async function grantSignupBonus(customer, site) {
    const r = site?.rewards;
    if (!r?.enabled || !(r.signupBonusCents > 0)) return 0;
    return apply({ orgId: customer.orgId, customerId: customer._id, type: "signup", amountCents: r.signupBonusCents, note: "Account signup bonus" });
}

// Pure: how much reward credit can be applied to this order (clamped to balance + cap).
export function computeRedeemable(site, balanceCents, subtotalCents, requestedCents) {
    const r = site?.rewards;
    if (!r?.enabled) return 0;
    const cap = Math.floor((subtotalCents * (r.maxRedeemPercent ?? 100)) / 100);
    const want = requestedCents == null ? (balanceCents || 0) : requestedCents;
    return Math.max(0, Math.min(want, balanceCents || 0, cap));
}

// Earn reward $ on a completed order.
export async function earnForOrder({ orgId, customerId }, site, subtotalCents, orderId) {
    const r = site?.rewards;
    if (!r?.enabled || !(r.earnPercent > 0)) return 0;
    const earned = Math.round((subtotalCents * r.earnPercent) / 100);
    return apply({ orgId, customerId, type: "earn", amountCents: earned, orderId, note: `Earned on order` });
}

// Redeem reward $ against an order (amount already validated via computeRedeemable).
export async function redeemForOrder({ orgId, customerId }, amountCents, orderId) {
    if (!(amountCents > 0)) return 0;
    return apply({ orgId, customerId, type: "redeem", amountCents: -amountCents, orderId, note: "Redeemed on order" });
}
