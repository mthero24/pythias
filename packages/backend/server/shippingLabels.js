// Self-ship discounted shipping labels (Phase 2 upgrade) via EasyPost.
// Usage-based: Pythias keeps a small per-label spread on top of the already-discounted carrier rate;
// the seller's org wallet is charged (carrier cost + spread). REST via fetch — no SDK dependency.

const EASYPOST_BASE = "https://api.easypost.com/v2";
const MARKUP_CENTS = Number(process.env.SHIPPING_LABEL_MARKUP_CENTS) || 40;

function authHeader() {
    const key = process.env.EASYPOST_API_KEY;
    if (!key) throw new Error("Shipping labels are not configured yet (missing EASYPOST_API_KEY).");
    return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

async function ep(path, method = "GET", body) {
    const res = await fetch(`${EASYPOST_BASE}${path}`, {
        method,
        headers: { Authorization: authHeader(), "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `EasyPost error ${res.status}`);
    return data;
}

// Address shape: { name, company?, street1, street2?, city, state, zip, country, phone? }
// Parcel shape:  { length, width, height, weight }  (inches + OUNCES — matches variant.weight unit).
export async function getLabelRates({ from, to, parcel }) {
    const shipment = await ep("/shipments", "POST", { shipment: { to_address: to, from_address: from, parcel } });
    const rates = (shipment.rates || []).map((r) => ({
        rateId: r.id,
        carrier: r.carrier,
        service: r.service,
        rateCents: Math.round(parseFloat(r.rate) * 100),
        deliveryDays: r.delivery_days ?? r.est_delivery_days ?? null,
    })).sort((a, b) => a.rateCents - b.rateCents);
    return { shipmentId: shipment.id, rates, markupCents: MARKUP_CENTS };
}

// Buy a chosen rate → label + tracking. billedCents = carrier cost + spread (what the wallet is charged).
export async function buyShippingLabel({ shipmentId, rateId }) {
    const bought = await ep(`/shipments/${shipmentId}/buy`, "POST", { rate: { id: rateId } });
    const rate = bought.selected_rate || (bought.rates || []).find((r) => r.id === rateId) || {};
    const costCents = Math.round(parseFloat(rate.rate || 0) * 100);
    return {
        labelUrl: bought.postage_label?.label_url || "",
        trackingCode: bought.tracking_code || "",
        trackingUrl: bought.tracker?.public_url || "",
        carrier: rate.carrier || "",
        service: rate.service || "",
        costCents,
        markupCents: MARKUP_CENTS,
        billedCents: costCents + MARKUP_CENTS,
    };
}

export const labelMarkupCents = () => MARKUP_CENTS;
export const shippingLabelsConfigured = () => !!process.env.EASYPOST_API_KEY;
