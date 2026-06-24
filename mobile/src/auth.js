import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken, login as apiLogin, signup as apiSignup, getMe } from "./api";

// Customer auth: bearer token + customer, persisted to AsyncStorage. The token is pushed into the
// api client (setAuthToken) so all requests are authenticated once logged in.
const AuthContext = createContext(null);
const TOKEN_KEY = "pythias_sf_token";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(TOKEN_KEY).then(async (t) => {
            if (t) {
                setAuthToken(t); setToken(t);
                try { const me = await getMe(); setCustomer(me.customer || null); }
                catch { setAuthToken(null); setToken(null); await AsyncStorage.removeItem(TOKEN_KEY); }
            }
        }).finally(() => setReady(true));
    }, []);

    const persist = useCallback(async (t, c) => {
        setAuthToken(t); setToken(t); setCustomer(c);
        if (t) await AsyncStorage.setItem(TOKEN_KEY, t); else await AsyncStorage.removeItem(TOKEN_KEY);
    }, []);

    const login = useCallback(async (email, password) => {
        const r = await apiLogin(email, password);
        await persist(r.token, r.customer);
    }, [persist]);

    const signup = useCallback(async (payload) => {
        const r = await apiSignup(payload);
        if (r.token) await persist(r.token, r.customer);
        return r;
    }, [persist]);

    const logout = useCallback(async () => { await persist(null, null); }, [persist]);

    return (
        <AuthContext.Provider value={{ token, customer, ready, login, signup, logout, isAuthed: !!customer }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
