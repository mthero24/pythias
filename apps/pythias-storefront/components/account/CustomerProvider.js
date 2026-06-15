"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Buyer auth for the storefront. The token (scoped to one customer of this org) lives in
// localStorage under `sf_token` — the same key the checkout reads — so logging in here also
// enables saved cards, rewards redemption, and order history at checkout.
const CustomerCtx = createContext(null);
const TOKEN_KEY = "sf_token";

export const getToken = () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
export const authHeaders = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

export function CustomerProvider({ children }) {
    const [customer, setCustomer] = useState(null);
    const [ready, setReady] = useState(false);

    const refresh = useCallback(async () => {
        const t = getToken();
        if (!t) { setCustomer(null); setReady(true); return null; }
        try {
            const r = await fetch("/api/account/me", { headers: { Authorization: `Bearer ${t}` } });
            const d = await r.json();
            if (d.error || !d.customer) { localStorage.removeItem(TOKEN_KEY); setCustomer(null); }
            else setCustomer(d.customer);
            return d.customer ?? null;
        } catch { setCustomer(null); return null; }
        finally { setReady(true); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // Presence beacon (powers abandoned-session). Fire once when a signed-in customer loads.
    useEffect(() => {
        if (customer) fetch("/api/account/seen", { method: "POST", headers: authHeaders() }).catch(() => {});
    }, [customer?.id]);

    // Shared handler for login + signup (same response shape: { token, customer }).
    const authenticate = useCallback(async (path, payload) => {
        const r = await fetch(`/api/account/${path}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (d.error) throw new Error(typeof d.error === "string" ? d.error : "Something went wrong");
        localStorage.setItem(TOKEN_KEY, d.token);
        setCustomer(d.customer);
        return d.customer;
    }, []);

    const login = useCallback((email, password) => authenticate("login", { email, password }), [authenticate]);
    const signup = useCallback((payload) => authenticate("signup", payload), [authenticate]);

    const logout = useCallback(async () => {
        try { await fetch("/api/account/logout", { method: "POST", headers: authHeaders() }); } catch { /* ignore */ }
        localStorage.removeItem(TOKEN_KEY);
        setCustomer(null);
    }, []);

    return (
        <CustomerCtx.Provider value={{ customer, ready, login, signup, logout, refresh }}>
            {children}
        </CustomerCtx.Provider>
    );
}

export function useCustomer() {
    const ctx = useContext(CustomerCtx);
    if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
    return ctx;
}
