// Hands a routed Commerce Cloud order off to a provider's production system.
// Items are sent as NAMES (styleCode/colorName/sizeName) + inline design artwork —
// the provider re-resolves against its own catalog (platform ObjectIds don't cross DBs).
//
// Provider ingest config is per-provider-slug. For the internal bootstrap providers
// these come from env; later this can move onto the provider's Organization record.
const PROVIDER_INGEST = {
    "premier-printing": { url: process.env.PREMIER_INGEST_URL,      secret: process.env.PROVIDER_INGEST_SECRET },
    "print-oracle":     { url: process.env.PRINT_ORACLE_INGEST_URL, secret: process.env.PROVIDER_INGEST_SECRET },
};

export function providerHasIngest(slug) {
    const cfg = PROVIDER_INGEST[slug];
    return !!(cfg?.url && cfg?.secret);
}

// Tell a provider to cancel a Commerce Cloud order it received (seller cancelled, or accepted return).
// Provider keys its copy on poNumber; it won't cancel one that already shipped.
export async function cancelOrderAtProvider(providerSlug, { poNumber, reason } = {}) {
    const cfg = PROVIDER_INGEST[providerSlug];
    if (!cfg?.url || !cfg?.secret) return { skipped: true, reason: "no_ingest_config" };
    if (!poNumber) return { skipped: true, reason: "no_poNumber" };
    try {
        const res = await fetch(cfg.url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", "x-pythias-secret": cfg.secret },
            body: JSON.stringify({ poNumber, reason: reason || "cancelled" }),
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { const body = await res.text().catch(() => ""); return { ok: false, status: res.status, error: body || `HTTP ${res.status}` }; }
        return { ok: true, ...(await res.json().catch(() => ({}))) };
    } catch (e) { return { ok: false, error: e.message }; }
}

// Resolve which provider an order was routed to (RoutingLog) and cancel it there. Safe no-op if the
// order was never routed/handed off. Used by order cancel + accepted returns on Commerce Cloud.
export async function cancelRoutedOrder(orderId, { poNumber, reason } = {}) {
    const { RoutingLog, Organization, PlatformOrder } = await import("@pythias/mongo");
    const log = await RoutingLog.findOne({ orderId, selectedProviderId: { $ne: null } }).sort({ _id: -1 }).lean();
    if (!log?.selectedProviderId) return { skipped: true, reason: "not_routed" };
    const prov = await Organization.findById(log.selectedProviderId).select("slug").lean();
    if (!prov?.slug) return { skipped: true, reason: "no_provider_slug" };
    let po = poNumber;
    if (!po) { const o = await PlatformOrder.findById(orderId).select("poNumber").lean(); po = o?.poNumber; }
    return cancelOrderAtProvider(prov.slug, { poNumber: po, reason });
}

export async function sendOrderToProvider(providerSlug, order, items) {
    const cfg = PROVIDER_INGEST[providerSlug];
    if (!cfg?.url || !cfg?.secret) return { skipped: true, reason: "no_ingest_config" };

    const { Organization, PlatformBlank, ProviderCatalog } = await import("@pythias/mongo");

    // The seller's return address — provider ships blind under the seller's brand.
    let returnAddress = order.returnAddress ?? null;
    if (!returnAddress && order.orgId) {
        const org = await Organization.findById(order.orgId).select("returnAddress").lean();
        returnAddress = org?.returnAddress ?? null;
    }

    // Resolve each item's MANUFACTURER STYLE (provider-agnostic garment id) + CANONICAL blank, so we
    // can price the order at the PROVIDER's wholesale (Premier's order must show what THEY earn, not the
    // seller's retail) and attach a ready-to-display image (Premier's DB can't re-render the seller's design).
    const blankIds = [...new Set(items.map(i => i.blank?.toString()).filter(Boolean))];
    const blanks = blankIds.length
        ? await PlatformBlank.find({ _id: { $in: blankIds } }).select("manufacturerStyle code type blanks").lean()
        : [];
    const bMap = Object.fromEntries(blanks.map(b => [b._id.toString(), b]));
    const mfrOf = (id) => { const b = bMap[id]; return (b?.manufacturerStyle?.trim() || b?.code || ""); };
    const canonicalOf = (id) => { const b = bMap[id]; return (b?.type === "alias" && b?.blanks?.length) ? String(b.blanks[0]) : id; };

    // Provider wholesale per (canonical, color, size) from ProviderCatalog (cents) = the provider's revenue.
    const provOrg = await Organization.findOne({ slug: providerSlug }).select("_id").lean();
    const wholesale = new Map();
    if (provOrg) {
        for (const i of items) {
            const key = `${canonicalOf(i.blank?.toString())}|${i.color}|${i.sizeName}`;
            if (wholesale.has(key)) continue;
            const cat = await ProviderCatalog.findOne({ providerId: provOrg._id, blankId: canonicalOf(i.blank?.toString()), colorId: i.color, size: i.sizeName, active: true }).select("wholesalePrice").lean();
            wholesale.set(key, cat?.wholesalePrice != null ? cat.wholesalePrice / 100 : null);
        }
    }
    const wholesaleOf = (i) => wholesale.get(`${canonicalOf(i.blank?.toString())}|${i.color}|${i.sizeName}`);

    let providerTotal = 0;
    const payloadItems = items.map((i) => {
        const w = wholesaleOf(i);
        const price = w != null ? w : (i.price || 0);   // fall back to line price if not in the catalog
        providerTotal += price;
        return {
            sku:       i.sku,
            manufacturerStyle: mfrOf(i.blank?.toString()) || i.styleCode || "",
            styleCode: i.styleCode,
            colorName: i.colorName,
            sizeName:  i.sizeName,
            // Design artwork map travels with the order — the provider renders the mockup from this +
            // its own blank (no need to push product/image data into its DB).
            design:    i.design,
            personalization: i.personalization || undefined,
            printType: i.type,
            price,                 // provider wholesale — what Premier earns, not the seller's retail
            quantity:  1,
        };
    });

    const payload = {
        poNumber:        order.poNumber,
        orderId:         order.orderId,
        customerEmail:   order.customerEmail,
        total:           Math.round(providerTotal * 100) / 100,   // provider's wholesale total
        shippingType:    order.shippingType,
        shipByDate:      order.shipByDate,
        shippingAddress: order.shippingAddress,
        returnAddress,
        items: payloadItems,
    };

    try {
        const res = await fetch(cfg.url, {
            method:  "POST",
            headers: { "Content-Type": "application/json", "x-pythias-secret": cfg.secret },
            body:    JSON.stringify(payload),
            signal:  AbortSignal.timeout(15000),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            return { ok: false, status: res.status, error: body || `HTTP ${res.status}` };
        }
        const data = await res.json().catch(() => ({}));
        return { ok: true, providerOrderId: data.orderId ?? null };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
