"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useCustomer, authHeaders } from "@/components/account/CustomerProvider";

// Wishlist with the same model as the cart: localStorage when logged out, merged + synced to
// the buyer's account when signed in (so favorites follow them across devices and the app).
const FavCtx = createContext(null);
const KEY = "sf_favorites_v1";

function union(a = [], b = []) {
    const map = new Map();
    for (const it of [...a, ...b]) if (it?.productId && !map.has(String(it.productId))) map.set(String(it.productId), { ...it });
    return [...map.values()];
}

export function FavoritesProvider({ children }) {
    const { customer, ready: customerReady } = useCustomer();
    const [favorites, setFavorites] = useState([]);
    const [ready, setReady] = useState(false);
    const mergedFor = useRef(null);

    useEffect(() => {
        try { setFavorites(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
        setReady(true);
    }, []);
    useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(favorites)); }, [favorites, ready]);

    // Merge server wishlist into local on sign-in.
    useEffect(() => {
        if (!ready || !customerReady) return;
        if (!customer) { mergedFor.current = null; return; }
        if (mergedFor.current === customer.id) return;
        mergedFor.current = customer.id;
        (async () => {
            try {
                const d = await (await fetch("/api/account/favorites", { headers: authHeaders() })).json();
                if (!d.error) setFavorites((local) => union(local, d.favorites));
            } catch { /* offline — keep local */ }
        })();
    }, [ready, customerReady, customer]);

    // Debounced push when signed in.
    useEffect(() => {
        if (!ready || !customer || mergedFor.current !== customer.id) return;
        const id = setTimeout(() => {
            fetch("/api/account/favorites", {
                method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ favorites }),
            }).catch(() => {});
        }, 800);
        return () => clearTimeout(id);
    }, [favorites, ready, customer]);

    const isFavorite = useCallback((productId) => favorites.some((f) => String(f.productId) === String(productId)), [favorites]);
    const remove = useCallback((productId) => setFavorites((prev) => prev.filter((f) => String(f.productId) !== String(productId))), []);
    const toggle = useCallback((fav) => {
        setFavorites((prev) => prev.some((f) => String(f.productId) === String(fav.productId))
            ? prev.filter((f) => String(f.productId) !== String(fav.productId))
            : [...prev, { ...fav, productId: String(fav.productId) }]);
    }, []);

    return (
        <FavCtx.Provider value={{ favorites, ready, isFavorite, toggle, remove, count: favorites.length }}>
            {children}
        </FavCtx.Provider>
    );
}

export function useFavorites() {
    const ctx = useContext(FavCtx);
    if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
    return ctx;
}
