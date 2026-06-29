import { NextResponse } from "next/server";
import { Order, Item, Inventory, Organization } from "@pythias/mongo";
import { updateInventory, recomputeStockStatus } from "@/functions/pullOrders";
import Stripe from "stripe";

// POST /api/pay/verify { t, sessionId } — PUBLIC. Confirms the Stripe Checkout session is paid on
// the seller's connected account, then marks the order paid + awaiting_shipment. Safe to call by
// anyone: it only acts when Stripe reports payment_status === "paid" for a session whose
// metadata.orderId matches the order found by the (unguessable) invoice token.
export async function POST(request) {
    try {
        const { t, sessionId } = await request.json();
        if (!t || !sessionId) return NextResponse.json({ error: "Missing token" }, { status: 400 });

        const order = await Order.findOne({ invoiceToken: t });
        if (!order) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        const org       = await Organization.findOne({ slug: process.env.PREMIER_ORG_SLUG || "premier-printing" }).select("name storefrontConnect").lean();
        const acctId    = org?.storefrontConnect?.accountId;
        const brandName = org?.name || "Premier Printing";
        const poNumber  = order.poNumber || order.orderId;
        if (!acctId) return NextResponse.json({ error: "Payout account not found" }, { status: 400 });

        if (order.paid) return NextResponse.json({ paid: true, brandName, poNumber });

        const stripe  = new Stripe(process.env.STOREFRONT_STRIPE_SECRET);
        const session = await stripe.checkout.sessions.retrieve(sessionId, { stripeAccount: acctId });

        if (String(session?.metadata?.orderId) !== String(order._id))
            return NextResponse.json({ error: "Session mismatch" }, { status: 400 });
        if (session.payment_status !== "paid")
            return NextResponse.json({ paid: false, brandName, poNumber });

        // Mark paid + awaiting_shipment (mirror of custom-order/[id] PATCH paid path).
        order.paid   = true;
        order.status = "awaiting_shipment";
        await order.save();
        await Item.updateMany({ order: order._id }, { $set: { paid: true, status: "awaiting_shipment" } });

        // Slot each item into an inventory record so the recompute can place it correctly.
        const items = await Item.find({ order: order._id });
        for (const item of items) {
            if (item.inventory?.inventory) continue;
            const inv = await Inventory.findOne({ color_name: item.colorName, size_name: item.sizeName, style_code: item.styleCode });
            if (inv) { item.inventory = { inventoryType: "inventory", inventory: inv._id }; await item.save(); }
        }
        updateInventory().then(() => recomputeStockStatus()).catch(err => console.error("[pay verify recompute]", err));

        return NextResponse.json({ paid: true, brandName, poNumber });
    } catch (err) {
        console.error("[pay verify]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
