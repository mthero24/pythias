// CJdropshipping connector (Phase 3 wholesale sourcing). REST via fetch, no SDK.
// Auth: POST /authentication/getAccessToken { apiKey } → access token (long-lived, ~months) sent as
// a CJ-Access-Token header. getAccessToken is heavily rate-limited, so the token is cached in-process
// and refreshed via refreshAccessToken. Field names verified against a live response 2026-06-23.

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
let _tok = null; // { accessToken, accessExpiry, refreshToken, refreshExpiry }

const cents = (v) => Math.round((parseFloat(v) || 0) * 100);
const gToOz = (g) => (g ? Math.round((parseFloat(g) / 28.3495) * 10) / 10 : 0); // CJ weights are grams
// Platform margin folded into the cost the reseller sees/pays (we pay the supplier the raw wholesale
// and keep the difference). Applied ONCE here, so import/reorder both use the marked-up cost.
const MARGIN_MULT = 1 + (Number(process.env.CATALOG_SOURCING_MARGIN_PCT) || 2) / 100;
const costWithMargin = (v) => Math.round(cents(v) * MARGIN_MULT);

export const cjConfigured = () => !!process.env.CJ_API_KEY;

async function authCall(path, body) {
    const r = await fetch(`${CJ_BASE}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!j?.result || !j.data) throw new Error(j?.message || `CJ auth failed (${path})`);
    return j.data;
}
function setTok(d) {
    _tok = {
        accessToken: d.accessToken, refreshToken: d.refreshToken,
        accessExpiry: Date.parse(d.accessTokenExpiryDate) || Date.now() + 14 * 864e5,
        refreshExpiry: Date.parse(d.refreshTokenExpiryDate) || Date.now() + 179 * 864e5,
    };
}
async function token() {
    if (_tok && _tok.accessExpiry - Date.now() > 36e5) return _tok.accessToken;           // valid >1h
    if (_tok?.refreshToken && _tok.refreshExpiry - Date.now() > 36e5) {
        try { setTok(await authCall("/authentication/refreshAccessToken", { refreshToken: _tok.refreshToken })); return _tok.accessToken; } catch { /* fall through to re-auth */ }
    }
    if (!process.env.CJ_API_KEY) throw new Error("CJ sourcing isn't configured yet (missing CJ_API_KEY).");
    setTok(await authCall("/authentication/getAccessToken", { apiKey: process.env.CJ_API_KEY }));
    return _tok.accessToken;
}
async function cj(path, { method = "GET", query, body } = {}) {
    let url = `${CJ_BASE}${path}`;
    if (query) {
        const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)])).toString();
        if (qs) url += `?${qs}`;
    }
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json", "CJ-Access-Token": await token() }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!j?.result) throw new Error(j?.message || `CJ ${path} error ${r.status}`);
    return j.data;
}

// Search the CJ catalog → lightweight cards for the browse UI.
export async function cjSearch({ keyword = "", categoryId = "", page = 1, pageSize = 20 } = {}) {
    const d = await cj("/product/list", { query: { pageNum: page, pageSize, productNameEn: keyword, categoryId } });
    const list = d?.list || [];
    return {
        page, total: d?.total ?? null,
        products: list.map((p) => ({
            pid: p.pid, title: p.productNameEn || p.productName || "", image: p.productImage || "",
            sku: p.productSku || "", costCents: costWithMargin(p.sellPrice), category: p.categoryName || "", supplier: p.supplierName || "",
        })),
    };
}

// Full product detail normalized to our catalog-product shape: wholesale cost prefilled, CJ's
// suggested retail surfaced, barcode → upc, grams → oz. The import flow seeds CatalogProductCreate.
export async function cjGetProduct(pid) {
    const p = await cj("/product/query", { query: { pid } });
    const images = (Array.isArray(p.productImageSet) ? p.productImageSet : []).filter(Boolean);
    if (!images.length && p.productImage) images.push(p.productImage);
    const variants = (p.variants || []).map((v) => {
        // CJ "combo" variants (combineNum > 1) are multi-packs — the price covers the whole bundle, so
        // label it so the cost never looks misleadingly high for "1 item".
        const packN = Number(v.combineNum) || 0;
        return {
            cjVid: v.vid, sku: v.variantSku || v.vid,
            name: (v.variantNameEn || "") + (packN > 1 ? ` (pack of ${packN})` : ""),
            upc: v.barcode || "",
            costCents: costWithMargin(v.variantSellPrice), suggestedRetailCents: cents(v.variantSugSellPrice),
            weightOz: gToOz(v.variantWeight), image: v.variantImage || images[0] || "", inventory: Number(v.inventoryNum) || 0,
        };
    });
    return {
        pid, title: p.productNameEn || "", description: p.description || "", images,
        category: p.categoryName || "", suggestedRetailCents: cents(p.suggestSellPrice), variants,
    };
}

export async function cjInventoryBySku(sku) { return cj("/product/stock/queryBySku", { query: { sku } }); }

// Freight options for a shipment → [{ logisticName, priceCents, days }], cheapest first.
export async function cjFreight({ endCountryCode = "US", zip, products, startCountryCode = "CN" }) {
    const d = await cj("/logistic/freightCalculate", { method: "POST", body: { startCountryCode, endCountryCode, zip, products } });
    return (Array.isArray(d) ? d : [])
        .map((o) => ({ logisticName: o.logisticName, priceCents: cents(o.logisticPrice), days: o.logisticAging || "" }))
        .filter((o) => o.logisticName)
        .sort((a, b) => a.priceCents - b.priceCents);
}

// Place a CJ order (reorder / dropship). createOrderV2 wants TOP-LEVEL shipping fields + a logisticName
// (verified live). shipTo: { name, country, countryCode, province, city, address, zip, phone }.
export async function cjCreateOrder({ orderNumber, shipTo = {}, products, logisticName, fromCountryCode = "CN" }) {
    return cj("/shopping/order/createOrderV2", { method: "POST", body: {
        orderNumber, fromCountryCode, logisticName,
        shippingCountryCode: shipTo.countryCode || "US",
        shippingCountry: shipTo.country || "United States",
        shippingProvince: shipTo.province || "",
        shippingCity: shipTo.city || "",
        shippingAddress: shipTo.address || "",
        shippingCustomerName: shipTo.name || "",
        shippingPhone: shipTo.phone || "",
        shippingZip: shipTo.zip || "",
        products,
    } });
}
export async function cjOrderDetail({ orderId, orderNumber }) {
    const d = await cj("/shopping/order/getOrderDetail", { query: { orderId, orderNumber } });
    return { status: d?.orderStatus, trackNumber: d?.trackNumber, trackingProvider: d?.logisticName, raw: d };
}
