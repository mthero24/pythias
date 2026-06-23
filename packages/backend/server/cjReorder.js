// Auto-reorder sweep (Phase 3): for an org's catalog products sourced from CJ, place a CJ order to
// refill any variant whose on-hand stock has dropped to its reorder point. Orders are CJ DRAFTS
// (unpaid until the seller pays/confirms in CJ), and a pendingReorderQty flag blocks duplicate orders
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

export async function runCjReorder(orgId) {
    const org = await Organization.findById(orgId).select("returnAddress").lean();
    const ra = org?.returnAddress || {};
    if (!ra.address || !ra.city || !ra.postalCode) return { ok: false, error: "Set your return address in Settings before auto-reorder." };
    const shipTo = shipToFrom(ra);

    const prods = await PlatformProduct.find({ orgId, isCatalogProduct: true, trackInventory: true, "source.supplier": "cj" })
        .select("title variantsArray").lean();

    const results = [];
    for (const p of prods) {
        for (const v of (p.variantsArray || [])) {
            const stock = Number(v.stock) || 0, rp = Number(v.reorderPoint) || 0, rt = Number(v.reorderTo) || 0;
            // Skip: no supplier link, reorder off, already pending, above point, or nothing to add.
            if (!v.supplierVid || rp <= 0 || (Number(v.pendingReorderQty) || 0) > 0 || stock > rp || rt <= stock) continue;
            const qty = rt - stock;
            try {
                const freight = await cjFreight({ endCountryCode: shipTo.countryCode, zip: shipTo.zip, products: [{ vid: v.supplierVid, quantity: qty }] });
                const logisticName = freight[0]?.logisticName;
                if (!logisticName) { results.push({ product: p.title, sku: v.sku, qty, ok: false, error: "No shipping option available" }); continue; }
                const orderNumber = `RO-${String(p._id).slice(-6)}-${String(v.sku || "").slice(-8)}-${Date.now().toString(36)}`;
                const r = await cjCreateOrder({ orderNumber, shipTo, products: [{ vid: v.supplierVid, quantity: qty }], logisticName });
                const cjOrderId = String(r?.orderId || r?.id || "");
                await PlatformProduct.updateOne({ _id: p._id, "variantsArray.sku": v.sku }, {
                    $set: { "variantsArray.$.pendingReorderQty": qty, "variantsArray.$.lastReorderAt": new Date(), "variantsArray.$.lastReorderId": cjOrderId },
                });
                results.push({ product: p.title, sku: v.sku, qty, cjOrderId, logistic: logisticName, ok: true });
            } catch (e) {
                results.push({ product: p.title, sku: v.sku, qty, ok: false, error: e.message });
            }
        }
    }
    return { ok: true, placed: results.filter((r) => r.ok).length, results };
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
