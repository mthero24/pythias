import { Order, Item } from "@pythias/mongo";
import { generatePieceID } from "@pythias/integrations";

// Build a paid production Order + Items from an approved/paid quote.
// Shared by the customer page-verify path and the Stripe webhook backstop.
export async function convertQuoteToOrder(quote) {
    const orderId = `QUOTE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const addr = quote.shippingAddress || {};
    const order = await new Order({
        orderId,
        poNumber:      quote.quoteId,
        marketplace:   "customer service",
        status:        "awaiting_shipment",
        paid:          true,
        date:          new Date(),
        total:         quote.total || 0,
        discountAmount: quote.discountAmount || 0,
        discountName:  quote.discountName,
        shippingCost:  quote.shippingCost || 0,
        taxRate:       quote.taxRate || 0,
        customerEmail: quote.customer?.email || "",
        inStorePickup: !!quote.inStorePickup,
        // shippingType is required on the Order schema — quotes don't always carry one, so fall back.
        shippingType:  quote.inStorePickup ? "In-Store Pickup" : (quote.shippingType || "Standard"),
        shippingAddress: {
            name:     addr.name     || quote.customer?.name    || quote.customer?.email || "Customer",
            phone:    addr.phone    || quote.customer?.phone   || "",
            address1: addr.address1 || (quote.inStorePickup ? "In-store pickup" : "—"),
            address2: addr.address2 || quote.customer?.company || "",
            city:     addr.city     || "—",
            state:    addr.state    || "",
            zip:      addr.zip      || "",
            country:  addr.country  || "US",
        },
        items: [],
    }).save();

    const itemIds = [];
    for (const l of (quote.lines || [])) {
        const qty = Math.max(1, parseInt(l.quantity) || 1);
        for (let u = 0; u < qty; u++) {
            const item = await new Item({
                pieceId:   generatePieceID(),
                status:    "awaiting_shipment",
                paid:      true,
                custom:    true,
                byob:      !!l.byob,
                order:     order._id,
                poNumber:  quote.quoteId,
                name:      l.title || "",
                sku:       l.sku || "",
                blank:     l.blank || null,
                styleCode: l.styleCode || "",
                color:     l.color || null,
                colorName: l.colorName || "",
                size:      l.size || null,
                sizeName:  l.sizeName || "",
                design:          l.design && Object.keys(l.design).length ? l.design : undefined,
                personalization: l.personalization || undefined,
                price:     l.unitPrice || 0,
                quantity:  "1",
                type:      l.printType || "",
                designRef: null,
                date:      new Date(),
            }).save();
            itemIds.push(item._id);
        }
    }
    order.items = itemIds;
    await order.save();
    return order;
}
