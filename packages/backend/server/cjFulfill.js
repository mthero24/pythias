// CJ dropship fulfillment (Phase 3). When a buyer's order contains CJ-sourced catalog items and the
// seller opted into auto-dropship, we place ONE CJ order shipping straight to the BUYER and charge the
// seller's wallet (goods incl. margin + shipping). Mirrors placeOneReorder but ships to the customer
// instead of the seller's return address, and is triggered on order placement (not low stock).

import { PlatformProduct, PlatformItem, Organization, PlatformOrder } from "@pythias/mongo";
import { cjFreight, cjCreateOrder } from "./cjDropship.js";

function shipToFromOrder(a = {}) {
    const country = a.country || "US";
    return {
        name: a.name || "",
        phone: a.phone || "",
        country: country === "US" ? "United States" : country,
        countryCode: country,
        province: a.state || a.province || "",
        city: a.city || "",
        address: [a.address1, a.address2].filter(Boolean).join(" ").trim() || a.address || "",
        zip: a.zip || a.postalCode || "",
    };
}

async function mark(itemIds, status, extra = {}) {
    if (!itemIds.length) return;
    await PlatformItem.updateMany({ _id: { $in: itemIds } }, { $set: { supplierShipStatus: status, ...extra } });
}

// Find the order's CJ-sourced catalog items (not already supplier-ordered), with their vid + cost.
export async function findCjDropshipItems(items) {
    const skus = [...new Set(items.map((i) => i.sku).filter(Boolean))];
    if (!skus.length) return [];
    const prods = await PlatformProduct.find({ isCatalogProduct: true, "source.supplier": "cj", "variantsArray.sku": { $in: skus } })
        .select("title source variantsArray").lean();
    const bySku = {};
    for (const p of prods) for (const v of (p.variantsArray || [])) {
        if (v.supplierVid && skus.includes(v.sku)) bySku[v.sku] = { vid: v.supplierVid, cost: Number(v.costPerItem) || 0 };
    }
    return items.filter((i) => bySku[i.sku] && !i.supplierOrderId).map((i) => ({ item: i, vid: bySku[i.sku].vid, cost: bySku[i.sku].cost }));
}

// Place one CJ order to the buyer for all CJ items in an order; charge the wallet; mark the items.
// `order` is a PlatformOrder doc, `org` is a lean org with wallet + _id, `cjItems` from findCjDropshipItems.
export async function fulfillCjDropshipOrder(order, cjItems, org) {
    if (!cjItems?.length) return null;
    const ids = cjItems.map((c) => c.item._id);
    const base = { vertical: "dropship", handler: "cj", itemCount: cjItems.length };

    const addr = order.shippingAddress || {};
    if (!(addr.address1 || addr.address) || !addr.city) { await mark(ids, "failed"); return { ...base, status: "failed", reason: "Buyer shipping address is incomplete." }; }
    const shipTo = shipToFromOrder(addr);

    // Aggregate by CJ vid; storefront creates one Item doc per unit, but respect quantity defensively.
    const byVid = {};
    for (const c of cjItems) {
        byVid[c.vid] = byVid[c.vid] || { vid: c.vid, quantity: 0, cost: c.cost };
        byVid[c.vid].quantity += Number(c.item.quantity) || 1;
    }
    const products = Object.values(byVid).map((x) => ({ vid: x.vid, quantity: x.quantity }));
    const goodsCents = Object.values(byVid).reduce((s, x) => s + Math.round(x.cost * x.quantity * 100), 0);

    let freight;
    try { freight = await cjFreight({ endCountryCode: shipTo.countryCode, zip: shipTo.zip, products }); }
    catch (e) { await mark(ids, "failed"); return { ...base, status: "failed", reason: `Freight quote failed: ${e.message}` }; }
    const opt = freight?.[0];
    if (!opt?.logisticName) { await mark(ids, "failed"); return { ...base, status: "failed", reason: "No shipping option available to the buyer." }; }

    const billedCents = goodsCents + (opt.priceCents || 0);   // goods cost already includes the platform margin
    const balance = org.wallet?.balance || 0;
    if (balance < billedCents) { await mark(ids, "needs_funding"); return { ...base, status: "needs_funding", reason: `Wallet short $${(billedCents / 100).toFixed(2)} to fulfill this order.`, billedCents }; }

    const orderNumber = `DS-${String(order._id).slice(-8)}-${Date.now().toString(36)}`;
    let cjOrderId = "";
    try {
        const r = await cjCreateOrder({ orderNumber, shipTo, products, logisticName: opt.logisticName });
        cjOrderId = String(r?.orderId || r?.id || "");
    } catch (e) { await mark(ids, "failed"); return { ...base, status: "failed", reason: `CJ order failed: ${e.message}` }; }

    await Organization.updateOne({ _id: org._id }, { $inc: { "wallet.balance": -billedCents } });
    await mark(ids, "ordered", { supplierOrderId: cjOrderId });
    return { ...base, status: "ordered", ref: cjOrderId, logistic: opt.logisticName, billedCents };
}

// Convenience hook for order-ingestion paths that DON'T go through the routing dispatcher (marketplace
// pulls: pullOrders, TikTok). Given a just-saved order doc + its saved item docs, dropship any CJ items
// to the buyer if the seller opted in. Self-contained + never throws — safe to call inline after save.
export async function maybeDropshipOrder(order, items, orgId) {
    try {
        const useOrg = orgId || order?.orgId;
        if (!useOrg || !items?.length) return null;
        const org = await Organization.findById(useOrg).select("wallet _id autoDropship").lean();
        if (!org?.autoDropship?.enabled) return null;
        const cjItems = await findCjDropshipItems(items);
        if (!cjItems.length) return null;
        const g = await fulfillCjDropshipOrder(order, cjItems, org);
        if (g) {
            order.fulfillmentGroups = [...(order.fulfillmentGroups || []), g];
            await order.save();
        }
        return g;
    } catch (e) {
        console.error(`[dropship] order ${order?._id}: ${e.message}`);
        return null;
    }
}

// Retry sweep: re-attempt dropship orders that were left "needs_funding" (seller's wallet was short).
// Runs on a cron; once the wallet is topped up, the order ships. Idempotent — fulfilled items carry a
// supplierOrderId and are skipped. Skips orgs that have since turned dropship off.
export async function retryNeedsFunding() {
    const stuck = await PlatformItem.find({
        supplierShipStatus: "needs_funding",
        $or: [{ supplierOrderId: { $exists: false } }, { supplierOrderId: "" }, { supplierOrderId: null }],
    }).select("_id order sku quantity supplierOrderId").lean();
    if (!stuck.length) return { ok: true, orders: 0, fulfilled: 0 };

    const byOrder = {};
    for (const it of stuck) { const k = String(it.order); (byOrder[k] = byOrder[k] || []).push(it); }

    let fulfilled = 0; const results = [];
    for (const [orderId, items] of Object.entries(byOrder)) {
        try {
            const order = await PlatformOrder.findById(orderId);
            if (!order) continue;
            const org = await Organization.findById(order.orgId).select("wallet _id autoDropship").lean();
            if (!org?.autoDropship?.enabled) continue;            // seller turned dropship off — leave it
            const cjItems = await findCjDropshipItems(items);
            if (!cjItems.length) continue;
            const g = await fulfillCjDropshipOrder(order, cjItems, org);
            if (g?.status === "ordered") {
                fulfilled++;
                order.fulfillmentGroups = [...(order.fulfillmentGroups || []), g];
                await order.save();
            }
            results.push({ order: orderId, status: g?.status });
        } catch (e) { console.error(`[dropship-retry] order ${orderId}: ${e.message}`); }
    }
    return { ok: true, orders: Object.keys(byOrder).length, fulfilled, results };
}
