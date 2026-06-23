// Auto-reorder + manual reorder (Phase 3): place CJ orders to restock catalog products. Orders are
// CJ DRAFTS (unpaid until the seller pays in CJ); a pendingReorderQty flag blocks duplicate orders
// until the restock is received (receiveReorder bumps stock + clears the flag).

import { PlatformProduct, Organization } from "@pythias/mongo";
import { cjFreight, cjCreateOrder } from "./cjDropship.js";

function shipToFrom(ra = {}) {
    return {
        name: ra.name || ra.businessName || "",
        country: ra.country === "US" || !ra.country ? "United States" : ra.country,
        countryCode: ra.country || "US",
        province: ra.state || "", city: ra.city || "", address: ra.address || "",
        zip: ra.postalCode || "", phone: ra.phone || "",
    };
}

async function orgShipTo(orgId) {
    const org = await Organization.findById(orgId).select("returnAddress").lean();
    const ra = org?.returnAddress || {};
    if (!ra.address || !ra.city || !ra.postalCode) return null;
    return shipToFrom(ra);
}

// Freight-quote + place a draft CJ order for one variant, then flag it pending.
async function placeOneReorder(shipTo, p, v, qty) {
    const freight = await cjFreight({ endCountryCode: shipTo.countryCode, zip: shipTo.zip, products: [{ vid: v.supplierVid, quantity: qty }] });
    const logisticName = freight[0]?.logisticName;
    if (!logisticName) return { product: p.title, sku: v.sku, qty, ok: false, error: "No shipping option available" };
    const orderNumber = `RO-${String(p._id).slice(-6)}-${String(v.sku || "").slice(-8)}-${Date.now().toString(36)}`;
    const r = await cjCreateOrder({ orderNumber, shipTo, products: [{ vid: v.supplierVid, quantity: qty }], logisticName });
    const cjOrderId = String(r?.orderId || r?.id || "");
    await PlatformProduct.updateOne({ _id: p._id, "variantsArray.sku": v.sku }, {
        $set: { "variantsArray.$.pendingReorderQty": qty, "variantsArray.$.lastReorderAt": new Date(), "variantsArray.$.lastReorderId": cjOrderId },
    });
    return { product: p.title, sku: v.sku, qty, cjOrderId, logistic: logisticName, ok: true };
}

// Sweep: restock every tracked CJ-sourced variant at/below its reorder point.
export async function runCjReorder(orgId) {
    const shipTo = await orgShipTo(orgId);
    if (!shipTo) return { ok: false, error: "Set your return address in Settings before reordering." };
    const prods = await PlatformProduct.find({ orgId, isCatalogProduct: true, trackInventory: true, "source.supplier": "cj" })
        .select("title variantsArray").lean();
    const results = [];
    for (const p of prods) for (const v of (p.variantsArray || [])) {
        const stock = Number(v.stock) || 0, rp = Number(v.reorderPoint) || 0, rt = Number(v.reorderTo) || 0;
        if (!v.supplierVid || rp <= 0 || (Number(v.pendingReorderQty) || 0) > 0 || stock > rp || rt <= stock) continue;
        try { results.push(await placeOneReorder(shipTo, p, v, rt - stock)); }
        catch (e) { results.push({ product: p.title, sku: v.sku, qty: rt - stock, ok: false, error: e.message }); }
    }
    return { ok: true, placed: results.filter((r) => r.ok).length, results };
}

// Manually order a specific quantity of one variant.
export async function placeReorder(orgId, productId, sku, qty) {
    qty = Math.max(1, Number(qty) || 0);
    const shipTo = await orgShipTo(orgId);
    if (!shipTo) return { ok: false, error: "Set your return address in Settings first." };
    const p = await PlatformProduct.findOne({ _id: productId, orgId }).select("title variantsArray").lean();
    const v = (p?.variantsArray || []).find((x) => x.sku === sku);
    if (!v?.supplierVid) return { ok: false, error: "This variant has no supplier link to order from." };
    if ((Number(v.pendingReorderQty) || 0) > 0) return { ok: false, error: "A reorder is already pending for this variant." };
    try { return await placeOneReorder(shipTo, p, v, qty); }
    catch (e) { return { ok: false, error: e.message }; }
}

// Mark a pending reorder received: add the pending qty to on-hand stock and clear the pending flag.
export async function receiveReorder(orgId, productId, sku) {
    const p = await PlatformProduct.findOne({ _id: productId, orgId }).select("variantsArray").lean();
    const v = (p?.variantsArray || []).find((x) => x.sku === sku);
    const pending = Number(v?.pendingReorderQty) || 0;
    if (!v || pending <= 0) return { ok: false, error: "No pending reorder for that variant." };
    await PlatformProduct.updateOne({ _id: productId, orgId, "variantsArray.sku": sku }, {
        $inc: { "variantsArray.$.stock": pending },
        $set: { "variantsArray.$.pendingReorderQty": 0 },
    });
    return { ok: true, added: pending };
}
