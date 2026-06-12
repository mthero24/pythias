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

export async function sendOrderToProvider(providerSlug, order, items) {
    const cfg = PROVIDER_INGEST[providerSlug];
    if (!cfg?.url || !cfg?.secret) return { skipped: true, reason: "no_ingest_config" };

    // The seller's return address — provider ships blind under the seller's brand.
    let returnAddress = order.returnAddress ?? null;
    if (!returnAddress && order.orgId) {
        const { Organization } = await import("@pythias/mongo");
        const org = await Organization.findById(order.orgId).select("returnAddress").lean();
        returnAddress = org?.returnAddress ?? null;
    }

    const payload = {
        poNumber:        order.poNumber,
        orderId:         order.orderId,
        customerEmail:   order.customerEmail,
        total:           order.total,
        shippingCost:    order.shippingCost,
        discountAmount:  order.discountAmount,
        discountName:    order.discountName,
        shippingType:    order.shippingType,
        shipByDate:      order.shipByDate,
        shippingAddress: order.shippingAddress,
        returnAddress,
        items: items.map((i) => ({
            sku:       i.sku,
            styleCode: i.styleCode,
            colorName: i.colorName,
            sizeName:  i.sizeName,
            design:    i.design,
            printType: i.type,
            price:     i.price,
            discount:  i.discount,
            quantity:  1,
        })),
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
