"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Currency (display conversion) + language (UI dictionary) for the storefront. Prices are stored
// in base currency; we convert for display only. Selections persist in localStorage.
const I18nCtx = createContext(null);
const CUR_KEY = "sf_currency", LANG_KEY = "sf_lang";

export function I18nProvider({ children }) {
    const [cfg, setCfg] = useState({ baseCurrency: "USD", currencies: [{ code: "USD", symbol: "$", rate: 1 }], defaultLang: "en", languages: ["en"] });
    const [currency, setCurrencyState] = useState("USD");
    const [lang, setLangState] = useState("en");
    const [strings, setStrings] = useState({});
    const [ready, setReady] = useState(false);

    useEffect(() => {
        fetch("/api/site/i18n").then((r) => r.json()).then((d) => {
            setCfg(d);
            const savedCur = localStorage.getItem(CUR_KEY);
            setCurrencyState(savedCur && d.currencies.some((c) => c.code === savedCur) ? savedCur : d.baseCurrency);
            const savedLang = localStorage.getItem(LANG_KEY);
            setLangState(savedLang && d.languages.includes(savedLang) ? savedLang : (d.defaultLang || "en"));
        }).catch(() => {}).finally(() => setReady(true));
    }, []);

    // Load the UI dictionary whenever language changes.
    useEffect(() => {
        fetch(`/api/i18n/strings?lang=${encodeURIComponent(lang)}`).then((r) => r.json()).then((d) => setStrings(d.strings || {})).catch(() => setStrings({}));
    }, [lang]);

    const setCurrency = useCallback((code) => { setCurrencyState(code); try { localStorage.setItem(CUR_KEY, code); } catch { /* ignore */ } }, []);
    const setLang = useCallback((l) => { setLangState(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } }, []);

    const cur = cfg.currencies.find((c) => c.code === currency) || cfg.currencies[0] || { code: "USD", symbol: "$", rate: 1 };
    // Display price from base cents → selected currency.
    const price = useCallback((cents) => {
        const v = ((cents || 0) / 100) * (cur.rate || 1);
        const sym = cur.symbol || "";
        const body = v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return sym ? `${sym}${body}` : `${body} ${cur.code}`;
    }, [cur.code, cur.rate, cur.symbol]);
    // Translate a UI key with {var} interpolation; falls back to the provided default.
    const t = useCallback((key, fallback, vars) => {
        let s = strings[key] ?? fallback ?? key;
        if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, vars[k]);
        return s;
    }, [strings]);

    return (
        <I18nCtx.Provider value={{ ready, cfg, currency, setCurrency, lang, setLang, currencies: cfg.currencies, languages: cfg.languages, price, t }}>
            {children}
        </I18nCtx.Provider>
    );
}

export function useI18n() {
    const ctx = useContext(I18nCtx);
    if (!ctx) throw new Error("useI18n must be used within I18nProvider");
    return ctx;
}
