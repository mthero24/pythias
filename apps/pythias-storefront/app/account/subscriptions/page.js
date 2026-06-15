"use client";
import { useCallback, useEffect, useState } from "react";
import { authHeaders } from "@/components/account/CustomerProvider";
import { AccountShell, fmtDate, card, ghostBtn } from "@/components/account/ui";

export default function SubscriptionsPage() {
    return <AccountShell active="/account/subscriptions"><SubsList /></AccountShell>;
}

function SubsList() {
    const [subs, setSubs] = useState(null);
    const [busy, setBusy] = useState(null);
    const load = useCallback(async () => {
        try { const d = await (await fetch("/api/account/subscriptions", { headers: authHeaders() })).json(); setSubs(d.error ? [] : d.subscriptions); } catch { setSubs([]); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const act = async (id, action) => {
        if (action === "cancel" && !confirm("Cancel this subscription?")) return;
        setBusy(id);
        try { await fetch(`/api/account/subscriptions/${id}`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ action }) }); load(); }
        finally { setBusy(null); }
    };

    if (subs === null) return <div style={{ color: "#64748b" }}>Loading…</div>;
    if (subs.length === 0) return <div style={card}>No subscriptions. Subscribe &amp; save at checkout to get recurring deliveries.</div>;

    const COLOR = { active: "#166534", paused: "#854d0e", canceled: "#991b1b" };
    return (
        <div style={{ display: "grid", gap: 10 }}>
            {subs.map((s) => (
                <div key={s.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>{s.intervalLabel} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· save {s.discountPercent}% · {s.items.length} item(s)</span></div>
                            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                                <span style={{ color: COLOR[s.status], fontWeight: 600, textTransform: "capitalize" }}>{s.status}</span>
                                {s.status === "active" && s.nextBillingAt && ` · next ${fmtDate(s.nextBillingAt)}`} · {s.cyclesBilled} delivered
                            </div>
                        </div>
                        {s.status !== "canceled" && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {s.status === "active" && <button onClick={() => act(s.id, "skip")} disabled={busy === s.id} style={ghostBtn}>Skip next</button>}
                                {s.status === "active" ? <button onClick={() => act(s.id, "pause")} disabled={busy === s.id} style={ghostBtn}>Pause</button>
                                    : <button onClick={() => act(s.id, "resume")} disabled={busy === s.id} style={ghostBtn}>Resume</button>}
                                <button onClick={() => act(s.id, "cancel")} disabled={busy === s.id} style={{ ...ghostBtn, color: "#dc2626" }}>Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
