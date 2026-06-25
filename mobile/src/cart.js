import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCart, putCart } from "./api";
import { useAuth } from "./auth";

// App cart. Persisted to AsyncStorage so it survives restarts and works logged-out. When signed in it
// syncs to the buyer's account (GET/PUT /api/account/cart) — same model as the web cart — so the basket
// follows the buyer across devices and between the app and the website, and is recorded for the
// abandoned-cart reminders.
const CartContext = createContext(null);
const KEY = "pythias_cart_v1";

// The server stores color + size separately; the app shows a single variantLabel. Map between them.
const fromServer = (l) => ({
    productId: l.productId, sku: l.sku, qty: Math.max(1, Number(l.qty) || 1),
    title: l.title || "", image: l.image || "", priceCents: Number(l.priceCents) || 0,
    color: l.color || "", size: l.size || "",
    variantLabel: l.variantLabel || [l.color, l.size].filter(Boolean).join(" / "),
});
const toServer = (l) => ({
    productId: l.productId, sku: l.sku, qty: l.qty,
    title: l.title || "", image: l.image || "", priceCents: l.priceCents || 0,
    color: l.color || "", size: l.size || "",
});

// Union two carts by sku; for a sku in both, keep the higher qty (so nothing is lost on first merge).
function mergeCarts(a = [], b = []) {
    const map = new Map();
    for (const it of [...a, ...b]) {
        if (!it?.sku) continue;
        const k = String(it.sku);
        if (map.has(k)) { const e = map.get(k); e.qty = Math.max(e.qty, Math.max(1, it.qty || 1)); }
        else map.set(k, { ...it, qty: Math.max(1, it.qty || 1) });
    }
    return [...map.values()];
}

export function CartProvider({ children }) {
    const { customer, ready: authReady } = useAuth();
    const [items, setItems] = useState([]);
    const [ready, setReady] = useState(false);
    const mergedFor = useRef(null);

    // Local first (works fully offline / logged out).
    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((raw) => { if (raw) { try { setItems(JSON.parse(raw)); } catch { /* ignore */ } } })
            .finally(() => setReady(true));
    }, []);
    useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {}); }, [items, ready]);

    // On sign-in, merge the account cart into the local one (basket follows the buyer across devices/apps).
    useEffect(() => {
        if (!ready || !authReady) return;
        if (!customer) { mergedFor.current = null; return; }
        const cid = customer.id || customer._id;
        if (mergedFor.current === cid) return;
        mergedFor.current = cid;
        (async () => {
            try {
                const d = await getCart();
                if (!d.error) setItems((local) => mergeCarts(local, (d.cart || []).map(fromServer)));
            } catch { /* offline / unauthorized — keep local */ }
        })();
    }, [ready, authReady, customer]);

    // Debounced push to the account when signed in (only after the merge for this customer ran). Custom
    // design lines (no productId) are dropped by the server sanitizer and simply stay local.
    useEffect(() => {
        if (!ready || !customer || mergedFor.current !== (customer.id || customer._id)) return;
        const id = setTimeout(() => { putCart(items.map(toServer)).catch(() => {}); }, 800);
        return () => clearTimeout(id);
    }, [items, ready, customer]);

    // A line is keyed by sku. { sku, productId, title, variantLabel, color, size, image, priceCents, qty }
    const add = useCallback((line, qty) => setItems((cur) => {
        const addQty = qty || line.qty || 1;
        const i = cur.findIndex((x) => x.sku === line.sku);
        if (i >= 0) { const n = [...cur]; n[i] = { ...n[i], qty: n[i].qty + addQty }; return n; }
        return [...cur, { ...line, qty: addQty }];
    }), []);
    const setQty = useCallback((sku, qty) => setItems((cur) =>
        qty <= 0 ? cur.filter((x) => x.sku !== sku) : cur.map((x) => (x.sku === sku ? { ...x, qty } : x))), []);
    const remove = useCallback((sku) => setItems((cur) => cur.filter((x) => x.sku !== sku)), []);
    const clear = useCallback(() => setItems([]), []);

    const count = items.reduce((s, x) => s + x.qty, 0);
    const subtotalCents = items.reduce((s, x) => s + (x.priceCents || 0) * x.qty, 0);

    return (
        <CartContext.Provider value={{ items, add, setQty, remove, clear, count, subtotalCents, ready }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
