import crypto from "crypto";
import { StorefrontDiscount, StorefrontGiftCard } from "@pythias/mongo";

// Compute the value of a discount doc against a subtotal. free_shipping → 0 off but freeShipping flag.
function applyDiscount(d, subtotalCents) {
    const freeShipping = d.type === "free_shipping";
    const discountCents = d.type === "percent" ? Math.round((subtotalCents * d.value) / 100)
        : d.type === "fixed" ? Math.min(d.value, subtotalCents) : 0;
    return { discountCents: Math.max(0, Math.min(discountCents, subtotalCents)), freeShipping, type: d.type, code: d.code || null, title: d.title || null };
}
function usable(d, subtotalCents) {
    if (!d || !d.active) return false;
    if (d.expiresAt && new Date(d.expiresAt) < new Date()) return false;
    if (d.maxUses != null && d.usedCount >= d.maxUses) return false;
    if (subtotalCents < (d.minSubtotalCents || 0)) return false;
    return true;
}

// Validate a promo CODE against the cart subtotal. Returns { ok, discountCents, freeShipping, code } or { ok:false, reason }.
export async function validateDiscount(orgId, code, subtotalCents) {
    if (!code) return { ok: false, reason: "no_code" };
    const norm = String(code).toUpperCase().trim();
    const d = await StorefrontDiscount.findOne({ orgId, code: norm }).lean();
    if (!d || !d.active) return { ok: false, reason: "invalid" };
    if (d.expiresAt && new Date(d.expiresAt) < new Date()) return { ok: false, reason: "expired" };
    if (d.maxUses != null && d.usedCount >= d.maxUses) return { ok: false, reason: "used_up" };
    if (subtotalCents < (d.minSubtotalCents || 0)) return { ok: false, reason: "min_subtotal", minSubtotalCents: d.minSubtotalCents };
    return { ok: true, ...applyDiscount(d, subtotalCents) };
}

// Best automatic (codeless) discount for this subtotal — applied when no code is entered.
export async function bestAutomaticDiscount(orgId, subtotalCents) {
    const autos = await StorefrontDiscount.find({ orgId, automatic: true, active: true }).lean();
    let best = null;
    for (const d of autos) {
        if (!usable(d, subtotalCents)) continue;
        const r = applyDiscount(d, subtotalCents);
        const weight = r.discountCents + (r.freeShipping ? 1 : 0); // any free-shipping beats nothing
        if (!best || weight > best.weight) best = { ...r, weight };
    }
    return best ? { ok: true, ...best, automatic: true } : { ok: false };
}

// Active automatic discount for DISPLAY (badge / strikethrough on cards, PDP, cart popup).
// Ignores minSubtotal (that's enforced at checkout by bestAutomaticDiscount) — this is purely so
// buyers SEE the deal. Returns the strongest active one's { type, value, title } or null.
export async function activeAutomaticDiscount(orgId) {
    const autos = await StorefrontDiscount.find({ orgId, automatic: true, active: true }).lean();
    const now = new Date();
    const live = autos.filter((d) => (!d.expiresAt || new Date(d.expiresAt) >= now) && (d.maxUses == null || (d.usedCount || 0) < d.maxUses));
    if (!live.length) return null;
    live.sort((a, b) => (b.type === "percent" ? b.value : -1) - (a.type === "percent" ? a.value : -1));
    const d = live[0];
    return { type: d.type, value: d.value, title: d.title || null };
}

// Count a redemption (called once an order is placed with this code).
export async function consumeDiscount(orgId, code) {
    if (!code) return;
    await StorefrontDiscount.updateOne({ orgId, code: String(code).toUpperCase().trim() }, { $inc: { usedCount: 1 } });
}

// ── Gift cards ───────────────────────────────────────────────────────────────
export async function validateGiftCard(orgId, code) {
    if (!code) return { ok: false, reason: "no_code" };
    const gc = await StorefrontGiftCard.findOne({ orgId, code: String(code).toUpperCase().trim() }).lean();
    if (!gc || !gc.active) return { ok: false, reason: "invalid" };
    if (gc.expiresAt && new Date(gc.expiresAt) < new Date()) return { ok: false, reason: "expired" };
    if (!(gc.balanceCents > 0)) return { ok: false, reason: "empty" };
    return { ok: true, code: gc.code, balanceCents: gc.balanceCents };
}
// Redeem up to `amountCents` from a gift card (atomic; never below 0). Returns redeemed cents.
export async function redeemGiftCard(orgId, code, amountCents, orderId) {
    if (!code || !(amountCents > 0)) return 0;
    const gc = await StorefrontGiftCard.findOne({ orgId, code: String(code).toUpperCase().trim() });
    if (!gc || !gc.active || !(gc.balanceCents > 0)) return 0;
    const take = Math.min(amountCents, gc.balanceCents);
    gc.balanceCents -= take;
    gc.redemptions.push({ orderId, amountCents: take, at: new Date() });
    await gc.save();
    return take;
}

// Create a unique popup/welcome discount from the site's popup config. Returns the code or null.
export async function createPopupDiscount(orgId, popup) {
    if (!popup || popup.discountType === "none" || !(popup.discountValue > 0)) return null;
    const prefix = (popup.codePrefix || "WELCOME").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "WELCOME";
    for (let i = 0; i < 5; i++) {
        const code = `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        try {
            await StorefrontDiscount.create({
                orgId, code, type: popup.discountType, value: popup.discountValue,
                source: "popup", maxUses: 1, perCustomerLimit: 1,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            return code;
        } catch (e) { if (e?.code !== 11000) throw e; }   // retry on rare code collision
    }
    return null;
}
