"use client";
import { createContext, useContext, useEffect, useState } from "react";

// A/B testing: fetch running experiments, bucket the visitor into a sticky variant per
// experiment, report exposure once, and expose the assigned variant's config so surfaces (e.g.
// the signup popup) can render it. Purchase conversions are attributed via the tracker.
const ExpCtx = createContext({ ready: false, configFor: () => ({}) });

function beacon(payload) {
    try {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics/collect", new Blob([body], { type: "application/json" }));
        else fetch("/api/analytics/collect", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch { /* ignore */ }
}
// Weighted, sticky variant assignment.
function assign(exp) {
    const key = `sf_exp_${exp.id}`;
    const saved = localStorage.getItem(key);
    if (saved && exp.variants.some((v) => v.key === saved)) return saved;
    const total = exp.variants.reduce((s, v) => s + (v.weightPct || 0), 0) || exp.variants.length;
    let r = Math.random() * total, chosen = exp.variants[0]?.key;
    for (const v of exp.variants) { r -= (v.weightPct || total / exp.variants.length); if (r <= 0) { chosen = v.key; break; } }
    localStorage.setItem(key, chosen);
    return chosen;
}

export function ExperimentProvider({ children }) {
    const [byType, setByType] = useState({});   // type → assigned variant config
    const [ready, setReady] = useState(false);

    useEffect(() => {
        fetch("/api/experiments/active").then((r) => r.json()).then((d) => {
            const exps = d.experiments || [];
            const types = {}, assignments = [];
            const seenKey = "sf_exp_seen";
            let seen = {};
            try { seen = JSON.parse(sessionStorage.getItem(seenKey) || "{}"); } catch { /* ignore */ }

            for (const exp of exps) {
                if (!exp.variants?.length) continue;
                const variant = assign(exp);
                const cfg = exp.variants.find((v) => v.key === variant)?.config || {};
                if (!(exp.type in types)) types[exp.type] = cfg;   // first running exp of a type wins
                assignments.push({ id: exp.id, variant });
                if (!seen[exp.id]) { beacon({ type: "experiment_exposure", sessionId: "exp", experimentId: exp.id, variant }); seen[exp.id] = 1; }
            }
            try { sessionStorage.setItem(seenKey, JSON.stringify(seen)); } catch { /* ignore */ }
            try { localStorage.setItem("sf_experiments", JSON.stringify(assignments)); } catch { /* ignore */ }
            setByType(types);
        }).catch(() => {}).finally(() => setReady(true));
    }, []);

    return <ExpCtx.Provider value={{ ready, configFor: (type) => byType[type] || {} }}>{children}</ExpCtx.Provider>;
}

export function useExperiment() { return useContext(ExpCtx); }
