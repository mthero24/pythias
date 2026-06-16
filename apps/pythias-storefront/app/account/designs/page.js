"use client";
import { useEffect, useState } from "react";
import { AccountShell, card, ghostBtn, fmtDate } from "@/components/account/ui";
import { useCustomer, authHeaders } from "@/components/account/CustomerProvider";
import DesignThumb from "@/components/customizer/DesignThumb";

// "My Designs" — the buyer's saved "Create your own" designs. They can re-open one for editing
// (deep-links into the studio) or delete it.
export default function MyDesignsPage() {
    const { customer, ready } = useCustomer();
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ready || !customer) return;
        (async () => {
            try { const d = await (await fetch("/api/account/designs", { headers: authHeaders() })).json(); if (!d.error) setDesigns(d.designs || []); }
            catch { /* ignore */ } finally { setLoading(false); }
        })();
    }, [ready, customer]);

    const remove = async (id) => {
        setDesigns((l) => l.filter((x) => String(x._id) !== String(id)));
        try { await fetch(`/api/account/designs/${id}`, { method: "DELETE", headers: authHeaders() }); } catch { /* ignore */ }
    };

    return (
        <AccountShell active="/account/designs">
            <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>My Designs</h2>
                        <div style={{ color: "#64748b", fontSize: "0.88rem" }}>Pick up where you left off, or start a fresh one.</div>
                    </div>
                    <a href="/create-your-own" style={ghostBtn}>+ New design</a>
                </div>

                {loading ? <div style={{ color: "#64748b", padding: "30px 0", textAlign: "center" }}>Loading…</div>
                    : designs.length === 0 ? <div style={{ color: "#64748b", padding: "30px 0", textAlign: "center" }}>No saved designs yet. Create one in the <a href="/create-your-own" style={{ color: "var(--sf-accent, #f59e0b)" }}>design studio</a>.</div>
                        : <div style={{ display: "grid", gap: 10 }}>
                            {designs.map((d) => (
                                <div key={d._id} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 12 }}>
                                    <DesignThumb thumbnail={d.thumbnail} preview={d.preview} size={56} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                                        <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{d.productTitle}{d.colorName ? ` · ${d.colorName}` : ""}{d.sizeName ? ` · ${d.sizeName}` : ""}</div>
                                        <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Updated {fmtDate(d.updatedAt)}</div>
                                    </div>
                                    <a href={`/create-your-own?design=${d._id}`} style={ghostBtn}>Edit</a>
                                    <button onClick={() => remove(d._id)} title="Delete" style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
                                </div>
                            ))}
                        </div>}
            </div>
        </AccountShell>
    );
}
