import { getStripe } from "@/lib/stripe";
import { Organization } from "@pythias/mongo";

// Ensure the org's wallet can cover `neededCents`. If the balance is below the
// minimum (or below what's needed) and auto-recharge is enabled with a saved card,
// charge the card off-session and credit the wallet. Returns the current balance.
// Never throws into the caller — a failed charge just leaves the balance as-is.
export async function ensureWalletFunds(orgId, neededCents = 0) {
    const org = await Organization.findById(orgId).select("wallet stripeCustomerId").lean();
    const w = org?.wallet ?? {};
    const balance = w.balance ?? 0;

    const needsTopUp = balance < neededCents || balance < (w.minimumBalance ?? 0);
    if (!needsTopUp) return balance;
    if (!w.autoRechargeEnabled || !w.stripePaymentMethodId || !org.stripeCustomerId) return balance;

    const amount = w.autoRechargeAmount ?? 50000;
    try {
        const stripe = getStripe();
        const pi = await stripe.paymentIntents.create({
            amount,
            currency:       "usd",
            customer:       org.stripeCustomerId,
            payment_method: w.stripePaymentMethodId,
            confirm:        true,
            off_session:    true,
            description:    "Wallet auto-recharge",
            metadata:       { orgId: String(orgId), kind: "wallet_autorecharge" },
        });
        if (pi.status === "succeeded") {
            await Organization.updateOne(
                { _id: orgId },
                { $inc: { "wallet.balance": amount }, $set: { "wallet.lastRechargedAt": new Date() } }
            );
            return balance + amount;
        }
    } catch (e) {
        console.error("[walletRecharge] auto-recharge failed:", e.message);
    }
    return balance;
}
