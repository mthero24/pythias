"use client";
import { useCallback, useEffect, useState } from "react";

const input = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.92rem", boxSizing: "border-box" };
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const ghost = { padding: "8px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" };
const money = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export default function DiscountsClient() {
    const [tab, setTab] = useState("discounts");
    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Discounts &amp; gift cards</h1>
            <p style={{ color: "#64748b", margin: "2px 0 18px" }}>Codes, automatic discounts, free shipping, and gift cards — all built in.</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[["discounts", "Discounts"], ["giftcards", "Gift cards"]].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} style={{ ...ghost, ...(tab === k ? { background: "#eef2ff", borderColor: "#635bff", color: "#635bff" } : {}) }}>{l}</button>
                ))}
            </div>
            {tab === "discounts" ? <Discounts /> : <GiftCards />}
        </div>
    );
}

function Discounts() {
    const [list, setList] = useState(null);
    const [composing, setComposing] = useState(false);
    const load = useCallback(async () => { try { const d = await (await fetch("/api/storefront/discounts")).json(); setList(d.error ? [] : d.discounts); } catch { setList([]); } }, []);
    useEffect(() => { load(); }, [load]);

    const summary = (d) => d.type === "free_shipping" ? "Free shipping" : d.type === "percent" ? `${d.value}% off` : `${money(d.value)} off`;

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>{!composing && <button onClick={() => setComposing(true)} style={btn}>New discount</button>}</div>
            {composing && <DiscountForm onDone={() => { setComposing(false); load(); }} onCancel={() => setComposing(false)} />}
            {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 && !composing ? <div style={card}>No discounts yet.</div> :
                list.map((d) => (
                    <div key={d._id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>{d.automatic ? (d.title || "Automatic discount") : d.code} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.82rem" }}>· {summary(d)}{d.automatic ? " · automatic" : ""}{d.minSubtotalCents ? ` · min ${money(d.minSubtotalCents)}` : ""}</span></div>
                            <div style={{ fontSize: "0.8rem", color: d.active ? "#16a34a" : "#94a3b8" }}>{d.active ? "active" : "inactive"} · used {d.usedCount || 0}{d.maxUses ? `/${d.maxUses}` : ""}</div>
                        </div>
                        <button onClick={async () => { await fetch(`/api/storefront/discounts/${d._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !d.active }) }); load(); }} style={ghost}>{d.active ? "Disable" : "Enable"}</button>
                    </div>
                ))}
        </div>
    );
}

function DiscountForm({ onDone, onCancel }) {
    const [f, setF] = useState({ type: "percent", value: 10, valueDollars: "", automatic: false, code: "", title: "", minSubtotalDollars: "", maxUses: "" });
    const [goal, setGoal] = useState("");
    const [aiBusy, setAiBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const aiSuggest = async () => {
        setAiBusy(true); setError(null);
        try {
            const d = await (await fetch("/api/storefront/discounts/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goal: goal || "increase conversions" }) })).json();
            if (d.error) throw new Error(d.error);
            setF((s) => ({ ...s, type: d.type, value: d.type === "percent" ? d.value : s.value, valueDollars: d.type === "fixed" ? (d.value / 100).toFixed(2) : "", automatic: !!d.automatic, title: d.title || "", minSubtotalDollars: d.minSubtotalCents ? (d.minSubtotalCents / 100).toFixed(2) : "" }));
            if (d.reason) setError(`💡 ${d.reason}`);
        } catch (e) { setError(e.message); }
        finally { setAiBusy(false); }
    };

    const save = async () => {
        setBusy(true); setError(null);
        const payload = {
            type: f.type, automatic: f.automatic, title: f.title, code: f.automatic ? undefined : (f.code || undefined),
            value: f.type === "percent" ? Number(f.value) || 0 : f.type === "fixed" ? Math.round(Number(f.valueDollars) * 100) || 0 : 0,
            minSubtotalCents: f.minSubtotalDollars ? Math.round(Number(f.minSubtotalDollars) * 100) : 0,
            maxUses: f.maxUses ? Number(f.maxUses) : undefined, active: true,
        };
        try { const d = await (await fetch("/api/storefront/discounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })).json(); if (d.error) throw new Error(d.error); onDone(); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    };

    return (
        <div style={{ ...card, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>New discount</h3>
            <div style={{ ...card, background: "#f8fafc", display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>✨ Suggest a promo with AI</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...input, flex: 1 }} placeholder="Goal e.g. clear winter stock" value={goal} onChange={(e) => setGoal(e.target.value)} />
                    <button onClick={aiSuggest} disabled={aiBusy} style={ghost}>{aiBusy ? "Thinking…" : "Suggest"}</button>
                </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <Field label="Type" style={{ flex: 1 }}><select style={input} value={f.type} onChange={set("type")}><option value="percent">Percent off</option><option value="fixed">Amount off</option><option value="free_shipping">Free shipping</option></select></Field>
                {f.type === "percent" && <Field label="Percent" style={{ flex: 1 }}><input type="number" style={input} value={f.value} onChange={set("value")} /></Field>}
                {f.type === "fixed" && <Field label="Amount ($)" style={{ flex: 1 }}><input type="number" step="0.01" style={input} value={f.valueDollars} onChange={set("valueDollars")} /></Field>}
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.9rem" }}><input type="checkbox" checked={f.automatic} onChange={set("automatic")} /> Automatic (no code — applies when conditions met)</label>
            {f.automatic ? <Field label="Label shown to shoppers"><input style={input} value={f.title} onChange={set("title")} placeholder="Spring sale" /></Field>
                : <Field label="Code (blank = auto-generate)"><input style={input} value={f.code} onChange={set("code")} placeholder="SPRING20" /></Field>}
            <div style={{ display: "flex", gap: 10 }}>
                <Field label="Min subtotal ($, optional)" style={{ flex: 1 }}><input type="number" step="0.01" style={input} value={f.minSubtotalDollars} onChange={set("minSubtotalDollars")} /></Field>
                <Field label="Max uses (optional)" style={{ flex: 1 }}><input type="number" style={input} value={f.maxUses} onChange={set("maxUses")} /></Field>
            </div>
            {error && <div style={{ color: error.startsWith("💡") ? "#635bff" : "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}><button onClick={save} disabled={busy} style={btn}>{busy ? "Saving…" : "Create"}</button><button onClick={onCancel} style={ghost}>Cancel</button></div>
        </div>
    );
}

function GiftCards() {
    const [list, setList] = useState(null);
    const [f, setF] = useState({ amountDollars: "", recipientEmail: "", note: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const load = useCallback(async () => { try { const d = await (await fetch("/api/storefront/giftcards")).json(); setList(d.error ? [] : d.giftCards); } catch { setList([]); } }, []);
    useEffect(() => { load(); }, [load]);

    const issue = async () => {
        const cents = Math.round(Number(f.amountDollars) * 100);
        if (!(cents > 0)) { setError("Enter an amount."); return; }
        setBusy(true); setError(null);
        try { const d = await (await fetch("/api/storefront/giftcards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initialCents: cents, recipientEmail: f.recipientEmail || undefined, note: f.note || undefined }) })).json(); if (d.error) throw new Error(d.error); setF({ amountDollars: "", recipientEmail: "", note: "" }); load(); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    };

    return (
        <div style={{ display: "grid", gap: 12 }}>
            <div style={{ ...card, display: "grid", gap: 10 }}>
                <h3 style={{ margin: 0 }}>Issue a gift card</h3>
                <div style={{ display: "flex", gap: 10 }}>
                    <Field label="Amount ($)" style={{ flex: 1 }}><input type="number" step="0.01" style={input} value={f.amountDollars} onChange={(e) => setF((s) => ({ ...s, amountDollars: e.target.value }))} /></Field>
                    <Field label="Recipient email (optional)" style={{ flex: 2 }}><input style={input} value={f.recipientEmail} onChange={(e) => setF((s) => ({ ...s, recipientEmail: e.target.value }))} /></Field>
                </div>
                <Field label="Note (optional)"><input style={input} value={f.note} onChange={(e) => setF((s) => ({ ...s, note: e.target.value }))} /></Field>
                {error && <div style={{ color: "#dc2626", fontSize: "0.86rem" }}>{error}</div>}
                <div><button onClick={issue} disabled={busy} style={btn}>{busy ? "Issuing…" : "Issue gift card"}</button></div>
            </div>
            {list === null ? <div style={{ color: "#64748b" }}>Loading…</div> : list.length === 0 ? <div style={card}>No gift cards yet.</div> :
                list.map((g) => (
                    <div key={g._id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                            <div style={{ fontWeight: 700, fontFamily: "monospace" }}>{g.code}</div>
                            <div style={{ fontSize: "0.82rem", color: "#64748b" }}>Balance {money(g.balanceCents)} / {money(g.initialCents)}{g.recipientEmail ? ` · ${g.recipientEmail}` : ""}</div>
                        </div>
                        <button onClick={async () => { await fetch(`/api/storefront/giftcards/${g._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !g.active }) }); load(); }} style={ghost}>{g.active ? "Disable" : "Enable"}</button>
                    </div>
                ))}
        </div>
    );
}

function Field({ label, children, style }) {
    return <label style={{ display: "block", ...style }}><span style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>{label}</span>{children}</label>;
}
