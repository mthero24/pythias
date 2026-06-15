export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontReturn, PlatformOrder, PlatformItem, StorefrontCustomer, RewardLedger, StorefrontSite } from "@pythias/mongo";
import { assertInternal } from "@/lib/internal";
import { storefrontStripe } from "@/lib/stripe";
import { routeOrderViaPlatform } from "@/lib/routing";
import { enqueueReturnStatus } from "@/lib/emailFlows";

// POST /api/internal/returns/process — seller action on a return (from platform/premier).
// Body: { returnId, action: approve|reject|receive|refund|credit|exchange, amountCents?, sellerNote? }
// Money/fulfillment actions run here because the marketplace Stripe key, rewards, and the
// provider-routing trigger all live in the storefront app.
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { returnId, action, amountCents, sellerNote } = await req.json().catch(() => ({}));
    if (!returnId || !action) return NextResponse.json({ error: "returnId and action are required" }, { status: 400 });

    const ret = await StorefrontReturn.findById(returnId);
    if (!ret) return NextResponse.json({ error: "Return not found" }, { status: 404 });
    if (sellerNote != null) ret.sellerNote = sellerNote;

    try {
        if (action === "approve") ret.status = "approved";
        else if (action === "reject") ret.status = "rejected";
        else if (action === "receive") ret.status = "received";

        else if (action === "refund") {
            const order = await PlatformOrder.findById(ret.orderId).select("paymentRef total storefrontPayout").lean();
            const cents = Math.max(0, Math.round(Number(amountCents) || Math.round((order?.total || 0) * 100)));
            const stripe = storefrontStripe();
            if (stripe && order?.paymentRef && cents > 0) {
                const refund = await stripe.refunds.create({ payment_intent: order.paymentRef, amount: cents });
                ret.stripeRefundId = refund.id;
                // Clawback: reverse the seller's payout for the refunded portion (if already paid out).
                const transferId = order.storefrontPayout?.transferId;
                if (transferId) {
                    try { await stripe.transfers.createReversal(transferId, { amount: Math.min(cents, order.storefrontPayout.subtotalCents || cents) }); }
                    catch (e) { console.warn("[returns] payout clawback failed:", e.message); }
                }
            }
            ret.refundCents = cents; ret.status = "refunded";

        } else if (action === "credit") {
            const order = await PlatformOrder.findById(ret.orderId).select("total").lean();
            const cents = Math.max(0, Math.round(Number(amountCents) || Math.round((order?.total || 0) * 100)));
            if (ret.customerId && cents > 0) {
                const updated = await StorefrontCustomer.findOneAndUpdate({ _id: ret.customerId, orgId: ret.orgId }, { $inc: { rewardsBalance: cents } }, { new: true }).select("rewardsBalance").lean();
                if (updated) await RewardLedger.create({ orgId: ret.orgId, customerId: ret.customerId, type: "return_credit", amountCents: cents, balanceAfter: updated.rewardsBalance, note: `Return ${ret.rmaNumber}` });
            }
            ret.creditCents = cents; ret.status = "credited";

        } else if (action === "exchange") {
            const replacementId = await createReplacementOrder(ret);
            if (replacementId) { ret.replacementOrderId = replacementId; await routeOrderViaPlatform(replacementId).catch(() => {}); }
            ret.status = "exchanged";

        } else {
            return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
        }

        await ret.save();

        // Email the buyer about the status change.
        if (ret.customerEmail) {
            const site = await StorefrontSite.findOne({ orgId: ret.orgId }).lean();
            if (site) await enqueueReturnStatus(site, { orgId: ret.orgId, rmaNumber: ret.rmaNumber, email: ret.customerEmail, customerId: ret.customerId, status: ret.status }).catch(() => {});
        }
        return NextResponse.json({ ok: true, status: ret.status });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// Clone the original order's items into a $0 replacement order, routed to a provider.
async function createReplacementOrder(ret) {
    const orig = await PlatformOrder.findById(ret.orderId).lean();
    if (!orig) return null;
    const items = await PlatformItem.find({ order: orig._id, orgId: ret.orgId }).lean();
    if (!items.length) return null;

    const poNumber = `EX${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
    const replacement = await PlatformOrder.create({
        orgId: ret.orgId, marketplace: "Commerce Cloud", source: "storefront",
        poNumber, orderId: poNumber, shippingType: "shipping", date: new Date(),
        status: "awaiting_shipment", paid: true, total: 0,
        customerEmail: orig.customerEmail, shippingAddress: orig.shippingAddress,
        storefrontCustomerId: orig.storefrontCustomerId,
        storefrontPayout: { subtotalCents: 0, wholesaleCents: 0, stripeFeeCents: 0, status: "skipped" }, // no seller payout on a replacement
    });
    let idx = 0;
    const docs = items.map((it) => ({
        pieceId: `${poNumber}-${idx++}`, status: "awaiting_shipment", quantity: "1",
        order: replacement._id, orgId: ret.orgId, marketplace: "Commerce Cloud", poNumber, orderId: poNumber,
        styleCode: it.styleCode, colorName: it.colorName, sizeName: it.sizeName,
        blank: it.blank, color: it.color, size: it.size, design: it.design, designRef: it.designRef, type: it.type,
        sku: it.sku, product: it.product, price: 0, name: it.name,
    }));
    if (docs.length) await PlatformItem.insertMany(docs);
    return replacement._id;
}
