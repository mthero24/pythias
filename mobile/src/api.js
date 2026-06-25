import { APP_KEY, API_BASE } from "./config";

// Thin client for the headless storefront API. Every request carries the store's app key so the
// server resolves the tenant (resolveOrg → x-pythias-app-key). A logged-in customer's bearer token
// is attached automatically once set by the auth context.
let _token = null;
export function setAuthToken(t) { _token = t || null; }

async function req(path, opts = {}) {
    const headers = {
        "Content-Type": "application/json",
        "x-pythias-app-key": APP_KEY,
        ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
        ...(opts.headers || {}),
    };
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
    return data;
}

// Catalog
export const getConfig = () => req("/api/app/config");
export const getProducts = (query = "") => req(`/api/app/products${query ? `?${query}` : ""}`);
export const getProduct = (id) => req(`/api/app/products/${encodeURIComponent(id)}`);

// Account (bearer token attached when logged in)
export const login = (email, password) => req("/api/account/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const signup = (payload) => req("/api/account/signup", { method: "POST", body: JSON.stringify(payload) });
export const getMe = () => req("/api/account/me");
export const getOrders = () => req("/api/account/orders");
export const getFavorites = () => req("/api/account/favorites");
// Wishlist is replace-the-whole-array (mirrors the web FavoritesProvider): PUT { favorites }.
export const putFavorites = (favorites) => req("/api/account/favorites", { method: "PUT", body: JSON.stringify({ favorites }) });
// Cart follows the signed-in buyer across devices/apps (same endpoint the web cart uses): PUT { cart }.
export const getCart = () => req("/api/account/cart");
export const putCart = (cart) => req("/api/account/cart", { method: "PUT", body: JSON.stringify({ cart }) });

// Checkout confirmation (polled after payment — order is placed async by the webhook).
export const getConfirmation = (pi) => req(`/api/checkout/confirmation?pi=${encodeURIComponent(pi)}`);

// Register this device's Expo push token so the store can notify the buyer of order updates.
export const registerPushToken = (token, platform) => req("/api/app/push-token", { method: "POST", body: JSON.stringify({ token, platform }) });

// Raw POST helper for screens that need it (e.g. checkout).
export const postJson = (path, body) => req(path, { method: "POST", body: JSON.stringify(body) });
