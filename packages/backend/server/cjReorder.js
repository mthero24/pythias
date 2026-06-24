// Auto-reorder + manual reorder (Phase 3). Reorders route through Pythias: we place the supplier (CJ)
// order and charge the reseller's wallet the goods cost + shipping. The goods cost ALREADY includes the
// platform margin (folded in at product lookup in cjDropship); we pay the supplier the raw wholesale and
// keep the difference — disclosed in the Terms of Service. A pendingReorderQty flag blocks duplicates.

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

const loadOrg = (orgId) => Organization.findById(orgId).select("returnAddress wallet name").lean();

// Place a draft CJ order for one variant, charge the reseller's wallet (goods + margin + shipping),
// and flag it pending. Mutates org.wallet.balance locally so a sweep sees the running balance.
async function placeOneReorder(org, shipTo, p, v, qty) {
    const goodsCents = Math.round((Number(v.costPerItem) || 0) * qty * 100);
    const freight = await cjFreight({ endCountryCode: shipTo.countryCode, zip: shipTo.zip, products: [{ vid: v.supplierVid, quantity: qty }] });
    const opt = freight[0];
    if (!opt?.logisticName) return { product: p.title, sku: v.sku, qty, ok: false, error: "No shipping option available" };

    const billedCents = goodsCents + (opt.priceCents || 0);   // goods cost already includes the margin
    const balance = org.wallet?.balance || 0;
    if (balance < billedCents) return { product: p.title, sku: v.sku, qty, ok: false, error: `Insufficient wallet balance — $${(billedCents / 100).toFixed(2)} needed.` };

    const orderNumber = `RO-${String(p._id).slice(-6)}-${String(v.sku || "").slice(-8)}-${Date.now().toString(36)}`;
    const r = await cjCreateOrder({ orderNumber, shipTo, products: [{ vid: v.supplierVid, quantity: qty }], logisticName: opt.logisticName });
    const cjOrderId = String(r?.orderId || r?.id || "");

    await Organization.updateOne({ _id: org._id }, { $inc: { "wallet.balance": -billedCents } });
    org.wallet = { ...(org.wallet || {}), balance: balance - billedCents };   // keep running balance for the sweep
    await PlatformProduct.updateOne({ _id: p._id, "variantsArray.sku": v.sku }, {
        $set: { "variantsArray.$.pendingReorderQty": qty, "variantsArray.$.lastReorderAt": new Date(), "variantsArray.$.lastReorderId": cjOrderId },
    });
    return { product: p.title, sku: v.sku, qty, cjOrderId, logistic: opt.logisticName, billedCents, ok: true };
}

// Sweep: restock every tracked CJ-sourced variant at/below its reorder point.
export async function runCjReorder(orgId) {
    const org = await loadOrg(orgId);
    const ra = org?.returnAddress || {};
    if (!ra.address || !ra.city || !ra.postalCode) return { ok: false, error: "Set your return address in Settings before reordering." };
    const shipTo = shipToFrom(ra);
    const prods = await PlatformProduct.find({ orgId, isCatalogProduct: true, trackInventory: true, "source.supplier": "cj" })
        .select("title variantsArray").lean();
    const results = [];
    for (const p of prods) for (const v of (p.variantsArray || [])) {
        const stock = Number(v.stock) || 0, rp = Number(v.reorderPoint) || 0, rt = Number(v.reorderTo) || 0;
        if (!v.supplierVid || rp <= 0 || (Number(v.pendingReorderQty) || 0) > 0 || stock > rp || rt <= stock) continue;
        try { results.push(await placeOneReorder(org, shipTo, p, v, rt - stock)); }
        catch (e) { results.push({ product: p.title, sku: v.sku, qty: rt - stock, ok: false, error: e.message }); }
    }
    return { ok: true, placed: results.filter((r) => r.ok).length, results };
}

// Manually order a specific quantity of one variant.
export async function placeReorder(orgId, productId, sku, qty) {
    qty = Math.max(1, Number(qty) || 0);
    const org = await loadOrg(orgId);
    const ra = org?.returnAddress || {};
    if (!ra.address || !ra.city || !ra.postalCode) return { ok: false, error: "Set your return address in Settings first." };
    const shipTo = shipToFrom(ra);
    const p = await PlatformProduct.findOne({ _id: productId, orgId }).select("title variantsArray").lean();
    const v = (p?.variantsArray || []).find((x) => x.sku === sku);
    if (!v?.supplierVid) return { ok: false, error: "This variant has no supplier link to order from." };
    if ((Number(v.pendingReorderQty) || 0) > 0) return { ok: false, error: "A reorder is already pending for this variant." };
    try { return await placeOneReorder(org, shipTo, p, v, qty); }
    catch (e) { return { ok: false, error: e.message }; }
}

// Set a variant's reorder thresholds (reorder point + restock-to) from the inventory page.
export async function setReorderLevels(orgId, productId, sku, reorderPoint, reorderTo) {
    const rp = Math.max(0, Number(reorderPoint) || 0);
    const rt = Math.max(0, Number(reorderTo) || 0);
    const r = await PlatformProduct.updateOne({ _id: productId, orgId, "variantsArray.sku": sku }, {
        $set: { "variantsArray.$.reorderPoint": rp, "variantsArray.$.reorderTo": rt },
    });
    return { ok: r.matchedCount > 0, reorderPoint: rp, reorderTo: rt };
}

// Manually set a variant's on-hand stock (direct count adjustment from the inventory page).
export async function setOnHand(orgId, productId, sku, stock) {
    const s = Math.max(0, Math.round(Number(stock) || 0));
    const r = await PlatformProduct.updateOne({ _id: productId, orgId, "variantsArray.sku": sku }, {
        $set: { "variantsArray.$.stock": s },
    });
    return { ok: r.matchedCount > 0, stock: s };
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
