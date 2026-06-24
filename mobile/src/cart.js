import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// App-side cart (the web cart is browser-only). Persisted to AsyncStorage so it survives app restarts.
const CartContext = createContext(null);
const KEY = "pythias_cart_v1";

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((raw) => { if (raw) { try { setItems(JSON.parse(raw)); } catch { /* ignore */ } } })
            .finally(() => setReady(true));
    }, []);
    useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {}); }, [items, ready]);

    // A line is keyed by sku. { sku, productId, title, variantLabel, image, priceCents, qty }
    const add = useCallback((line) => setItems((cur) => {
        const i = cur.findIndex((x) => x.sku === line.sku);
        if (i >= 0) { const n = [...cur]; n[i] = { ...n[i], qty: n[i].qty + (line.qty || 1) }; return n; }
        return [...cur, { ...line, qty: line.qty || 1 }];
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
