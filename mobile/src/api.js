import { APP_KEY, API_BASE } from "./config";

// Thin client for the headless storefront API. Every request carries the store's app key so the
// server resolves the tenant (resolveOrg → x-pythias-app-key). Mirrors what the web sends via Host.
async function req(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            "x-pythias-app-key": APP_KEY,
            ...(opts.headers || {}),
        },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export const getConfig = () => req("/api/app/config");
export const getProducts = (query = "") => req(`/api/app/products${query ? `?${query}` : ""}`);
export const getProduct = (id) => req(`/api/app/products/${encodeURIComponent(id)}`);
// Checkout + account endpoints already exist and accept the app key (see /api/checkout/*, /api/account/*).
