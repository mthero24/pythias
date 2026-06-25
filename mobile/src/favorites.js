import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFavorites, putFavorites } from "./api";
import { useAuth } from "./auth";

// Wishlist with the same model as the web FavoritesProvider: AsyncStorage when logged out, merged +
// synced to the buyer's account (PUT /api/account/favorites) when signed in, so favorites follow the
// buyer across devices and between the app and the website. Toggles are optimistic; the server push
// is debounced.
const FavCtx = createContext(null);
const KEY = "pythias_favorites_v1";

function union(a = [], b = []) {
    const map = new Map();
    for (const it of [...a, ...b]) if (it?.productId && !map.has(String(it.productId))) map.set(String(it.productId), { ...it });
    return [...map.values()];
}

export function FavoritesProvider({ children }) {
    const { customer, ready: authReady } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [ready, setReady] = useState(false);
    const mergedFor = useRef(null);

    // Load the locally persisted wishlist first (works fully offline / logged out).
    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((raw) => { if (raw) { try { setFavorites(JSON.parse(raw)); } catch { /* ignore */ } } })
            .finally(() => setReady(true));
    }, []);
    useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(favorites)).catch(() => {}); }, [favorites, ready]);

    // On sign-in, merge the server wishlist into the local one (so nothing is lost either way).
    useEffect(() => {
        if (!ready || !authReady) return;
        if (!customer) { mergedFor.current = null; return; }
        const cid = customer.id || customer._id;
        if (mergedFor.current === cid) return;
        mergedFor.current = cid;
        (async () => {
            try {
                const d = await getFavorites();
                if (!d.error) setFavorites((local) => union(local, d.favorites || []));
            } catch { /* offline / unauthorized — keep local */ }
        })();
    }, [ready, authReady, customer]);

    // Debounced push to the account when signed in (only after the merge for this customer ran).
    useEffect(() => {
        if (!ready || !customer || mergedFor.current !== (customer.id || customer._id)) return;
        const id = setTimeout(() => { putFavorites(favorites).catch(() => {}); }, 800);
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

export const useFavorites = () => useContext(FavCtx);
