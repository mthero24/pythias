"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "9px 15px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };
const input = { padding: "9px 11px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.9rem" };
const money = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function StoresClient({ editBase = "/storefront" }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", subdomain: "" });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");

    const load = async () => {
        try { const d = await (await fetch("/api/storefront/stores")).json(); if (!d.error) setData(d); }
        catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []); // eslint-disable-line

    const post = async (body) => { const d = await (await fetch("/api/storefront/stores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(); if (d.error) throw new Error(d.error); return d; };
    const add = async (e) => {
        e.preventDefault(); if (!form.subdomain.trim()) return;
        setBusy(true); setMsg("");
        try { const d = await post({ op: "add", ...form }); setData(d); setForm({ name: "", subdomain: "" }); setMsg("Store added."); }
        catch (e) { setMsg(e.message); } finally { setBusy(false); }
    };
    const remove = async (id) => {
        if (!confirm("Remove this store? Its storefront will be taken down.")) return;
        setBusy(true);
        try { const d = await post({ op: "remove", siteId: id }); setData(d); } catch (e) { setMsg(e.message); } finally { setBusy(false); }
    };

    if (loading) return <div style={{ padding: 28 }}>Loading stores…</div>;
    const d = data || {};
    const usedOfIncluded = `${Math.min(d.count || 0, d.includedStores || 0)} / ${d.includedStores || 0}`;
    const nextIsExtra = (d.count || 0) >= (d.includedStores || 0);

    if (!d.plan) {
        return <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Stores</h1>
            <div style={{ ...card, marginTop: 16, color: "#64748b" }}>Subscribe to a storefront plan to create and manage stores.</div>
        </div>;
    }

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Stores 🏪</h1>
            <p style={{ color: "#64748b", margin: "2px 0 0" }}>Run multiple storefronts on one account — they share your catalog, customers, and orders. Your <b>{d.plan}</b> plan includes <b>{d.includedStores}</b>; extras are {money(d.extraStoreCents)}/mo each.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginTop: 18 }}>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Stores</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{d.count}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Included used</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{usedOfIncluded}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Extra (billed)</div><div style={{ fontSize: "1.5rem", fontWeight: 800, color: d.extraBilled ? "#b45309" : "#16a34a" }}>{d.extraBilled || 0}</div></div>
                <div style={card}><div style={{ color: "#64748b", fontSize: "0.78rem" }}>Extra cost / mo</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{money((d.extraBilled || 0) * (d.extraStoreCents || 0))}</div></div>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {(d.stores || []).map((s) => (
                    <div key={s.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div>
                            <b>{s.name}</b>
                            {s.primary && <span style={{ marginLeft: 8, background: "#eef2ff", color: "#4338ca", fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>PRIMARY</span>}
                            <span style={{ marginLeft: 8, fontSize: "0.7rem", color: s.status === "published" ? "#166534" : "#94a3b8" }}>{s.status}</span>
                            <div style={{ color: "#64748b", fontSize: "0.82rem", marginTop: 2 }}>{s.customDomain || (s.subdomain ? `${s.subdomain}.pythias.store` : "—")}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <a href={`${editBase}?store=${s.id}`} style={{ ...btn, textDecoration: "none", display: "inline-block" }}>Edit</a>
                            {!s.primary && <button onClick={() => remove(s.id)} disabled={busy} style={ghost}>Remove</button>}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={add} style={{ ...card, marginTop: 16 }}>
                <b>Add a store</b>
                <p style={{ color: "#94a3b8", fontSize: "0.78rem", margin: "4px 0 12px" }}>{nextIsExtra ? `This store is beyond your included ${d.includedStores} — it adds ${money(d.extraStoreCents)}/mo (prorated).` : `Included in your plan (${usedOfIncluded} used).`}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Store name" style={{ ...input, flex: 1, minWidth: 160 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="subdomain" style={{ ...input, width: 150 }} />
                        <span style={{ color: "#94a3b8", fontSize: "0.84rem" }}>.pythias.store</span>
                    </div>
                    <button type="submit" disabled={busy} style={btn}>{busy ? "Adding…" : nextIsExtra ? `Add store (+${money(d.extraStoreCents)}/mo)` : "Add store"}</button>
                </div>
                {msg && <div style={{ marginTop: 10, color: msg.includes("added") ? "#16a34a" : "#dc2626", fontSize: "0.86rem" }}>{msg}</div>}
            </form>
        </div>
    );
}
