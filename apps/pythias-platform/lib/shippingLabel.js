import { Organization, PlatformOrder, PlatformItem, PlatformProduct } from "@pythias/mongo";

// Map an order to an EasyPost shipment: ship-from (org return address), ship-to (order shipping
// address), and a parcel whose weight sums the ordered variants' weights (oz), falling back to the
// org's default parcel. Throws coded errors the UI can show plainly.
const err = (code, message) => { const e = new Error(message); e.code = code; return e; };

function fromAddr(org) {
    const a = org?.returnAddress || {};
    return {
        name: a.name || a.businessName || org?.name || "",
        company: a.businessName || undefined,
        street1: a.address || "",
        street2: a.address2 || undefined,
        city: a.city || "",
        state: a.state || "",
        zip: a.postalCode || "",
        country: a.country || "US",
    };
}
function toAddr(o) {
    const a = o?.shippingAddress || {};
    return {
        name: a.name || "",
        street1: a.address1 || "",
        street2: a.address2 || undefined,
        city: a.city || "",
        state: a.state || "",
        zip: a.zip || "",
        country: a.country || "US",
        phone: a.phone || undefined,
    };
}

export async function shipmentForOrder(orgId, orderId) {
    const org = await Organization.findById(orgId).lean();
    if (!org?.shippingLabels?.enabled) throw err("not_enabled", "Shipping labels aren't enabled for this account yet.");
    const from = fromAddr(org);
    if (!from.street1 || !from.city || !from.zip) throw err("no_from", "Add your return address in Settings before buying labels.");

    const order = await PlatformOrder.findOne({ _id: orderId, orgId }).lean();
    if (!order) throw err("no_order", "Order not found.");
    const to = toAddr(order);
    if (!to.street1 || !to.city || !to.zip) throw err("no_to", "This order is missing a complete shipping address.");

    // Parcel weight (oz) = Σ variant.weight × qty across the order's items; fall back to default parcel.
    const items = await PlatformItem.find({ order: order._id, orgId }).select("sku quantity product").lean();
    let weight = 0;
    if (items.length) {
        const pids = [...new Set(items.map((i) => i.product && String(i.product)).filter(Boolean))];
        const prods = pids.length ? await PlatformProduct.find({ _id: { $in: pids }, orgId }).select("variantsArray.sku variantsArray.weight").lean() : [];
        const wBySku = {};
        for (const p of prods) for (const v of (p.variantsArray || [])) if (v.sku) wBySku[v.sku] = Number(v.weight) || 0;
        for (const it of items) weight += (wBySku[it.sku] || 0) * (it.quantity || 1);
    }
    const dp = org.shippingLabels.defaultParcel || {};
    if (!(weight > 0)) weight = Number(dp.weight) || 8;
    const parcel = { length: Number(dp.length) || 6, width: Number(dp.width) || 4, height: Number(dp.height) || 4, weight };

    return { from, to, parcel, order, org };
}
