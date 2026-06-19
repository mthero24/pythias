"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useCustomer, authHeaders } from "@/components/account/CustomerProvider";
import { track } from "@/components/analytics/tracker";

// Client-side cart (localStorage) that ALSO syncs to the buyer's account when signed in, so
// the basket follows them across devices and the white-label app. Save-for-later lives here too.
const CartCtx = createContext(null);
const KEY = "sf_cart_v1";
const SAVED_KEY = "sf_saved_v1";
const ADDONS_KEY = "sf_addons_v1";   // selected cart add-ons: { [addOnId]: true (toggle) | "text" (message) }
const lineKey = (i) => `${i.productId || i.blankId || ""}::${i.sku || ""}::${i.customKey || ""}`;

// Union two line lists by lineKey; for cart overlaps take the larger qty (avoids runaway
// doubling when the same item was added on two devices).
function mergeLines(a = [], b = [], { sumQty = false } = {}) {
    const map = new Map();
    for (const it of [...a, ...b]) {
        const k = lineKey(it);
        const prev = map.get(k);
        if (!prev) map.set(k, { ...it });
        else prev.qty = sumQty ? Math.min(99, (prev.qty || 0) + (it.qty || 0)) : Math.max(prev.qty || 0, it.qty || 0);
    }
    return [...map.values()];
}

export function CartProvider({ children }) {
    const { customer, ready: customerReady } = useCustomer();
    const [items, setItems] = useState([]);
    const [savedForLater, setSaved] = useState([]);
    const [addOns, setAddOnsState] = useState({});   // { addOnId: true | "message text" }
    const [ready, setReady] = useState(false);
    const [modal, setModal] = useState(null);   // last-added item for the optional add-to-cart modal
    const [drawerOpen, setDrawerOpen] = useState(false);   // slide-out cart drawer
    const mergedFor = useRef(null);   // customer id we've merged the server cart for

    // Load local state on mount.
    useEffect(() => {
        try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
        try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")); } catch { /* ignore */ }
        try { setAddOnsState(JSON.parse(localStorage.getItem(ADDONS_KEY) || "{}")); } catch { /* ignore */ }
        setReady(true);
    }, []);

    // Persist to localStorage.
    useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(items)); }, [items, ready]);
    useEffect(() => { if (ready) localStorage.setItem(SAVED_KEY, JSON.stringify(savedForLater)); }, [savedForLater, ready]);
    useEffect(() => { if (ready) localStorage.setItem(ADDONS_KEY, JSON.stringify(addOns)); }, [addOns, ready]);

    // Set/clear a cart add-on (toggle → true/false, message → string/"").
    const setAddOn = useCallback((id, value) => setAddOnsState((p) => {
        const next = { ...p };
        if (value === false || value === "" || value == null) delete next[id]; else next[id] = value;
        return next;
    }), []);

    // On sign-in: merge the server-stored cart into the local one (cross-device restore).
    useEffect(() => {
        if (!ready || !customerReady) return;
        if (!customer) { mergedFor.current = null; return; }          // logged out → allow re-merge next login
        if (mergedFor.current === customer.id) return;                 // already merged this session
        mergedFor.current = customer.id;
        (async () => {
            try {
                const d = await (await fetch("/api/account/cart", { headers: authHeaders() })).json();
                if (!d.error) {
                    setItems((local) => mergeLines(local, d.cart));
                    setSaved((local) => mergeLines(local, d.savedForLater));
                }
            } catch { /* offline — keep local */ }
        })();
    }, [ready, customerReady, customer]);

    // Debounced push to the server whenever the cart changes while signed in.
    useEffect(() => {
        if (!ready || !customer || mergedFor.current !== customer.id) return;
        const id = setTimeout(() => {
            fetch("/api/account/cart", {
                method: "PUT", headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ cart: items, savedForLater }),
            }).catch(() => {});
        }, 800);
        return () => clearTimeout(id);
    }, [items, savedForLater, ready, customer]);

    const add = useCallback((item, qty = 1, opts = {}) => {
        setItems((prev) => {
            const k = lineKey(item);
            const found = prev.find((p) => lineKey(p) === k);
            if (found) return prev.map((p) => (lineKey(p) === k ? { ...p, qty: Math.min(99, p.qty + qty) } : p));
            return [...prev, { ...item, qty: Math.min(99, qty) }];
        });
        track("add_to_cart", { productId: item.productId });
        // Confirmation modal on EVERY add (product page + card quick-add), unless silenced (Buy now).
        if (!opts.silent && typeof window !== "undefined" && window.__SF__?.cartModal) setModal({ ...item, qty });
    }, []);

    // Cards in @pythias/storefront dispatch window events to add/buy without importing this app-only
    // context across the package boundary. "buy-now" adds silently then jumps straight to checkout.
    useEffect(() => {
        const onAdd = (e) => { if (e?.detail?.productId) add(e.detail, e.detail.qty || 1); };
        const onBuyNow = (e) => { if (e?.detail?.productId) { add(e.detail, e.detail.qty || 1, { silent: true }); setTimeout(() => { window.location.href = "/checkout"; }, 50); } };
        window.addEventListener("sf:add-to-cart", onAdd);
        window.addEventListener("sf:buy-now", onBuyNow);
        return () => { window.removeEventListener("sf:add-to-cart", onAdd); window.removeEventListener("sf:buy-now", onBuyNow); };
    }, [add]);
    const setQty = useCallback((k, qty) => {
        setItems((prev) => prev.flatMap((p) => (lineKey(p) === k ? (qty <= 0 ? [] : [{ ...p, qty: Math.min(99, qty) }]) : [p])));
    }, []);
    const remove = useCallback((k) => setItems((prev) => prev.filter((p) => lineKey(p) !== k)), []);
    const clear = useCallback(() => { setItems([]); setAddOnsState({}); }, []);

    // Save for later: move a line from the cart into the saved list (and back).
    const saveForLater = useCallback((k) => {
        setItems((prev) => {
            const it = prev.find((p) => lineKey(p) === k);
            if (it) setSaved((s) => (s.some((x) => lineKey(x) === k) ? s : [...s, { ...it }]));
            return prev.filter((p) => lineKey(p) !== k);
        });
    }, []);
    const moveToCart = useCallback((k) => {
        setSaved((prev) => {
            const it = prev.find((p) => lineKey(p) === k);
            if (it) setItems((c) => {
                const found = c.find((p) => lineKey(p) === k);
                return found ? c.map((p) => (lineKey(p) === k ? { ...p, qty: Math.min(99, p.qty + (it.qty || 1)) } : p)) : [...c, { ...it }];
            });
            return prev.filter((p) => lineKey(p) !== k);
        });
    }, []);
    const removeSaved = useCallback((k) => setSaved((prev) => prev.filter((p) => lineKey(p) !== k)), []);

    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotalCents = items.reduce((n, i) => n + (i.priceCents || 0) * i.qty, 0);

    return (
        <CartCtx.Provider value={{
            items, savedForLater, ready, add, setQty, remove, clear,
            saveForLater, moveToCart, removeSaved,
            addOns, setAddOn,
            count, subtotalCents, lineKey,
            modal, closeModal: () => setModal(null),
            drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
        }}>
            {children}
        </CartCtx.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartCtx);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
