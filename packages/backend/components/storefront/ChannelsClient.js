"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "9px 15px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" };
const ghost = { ...btn, background: "#f1f5f9", color: "#334155" };
const input = { padding: "7px 9px", border: "1px solid #cbd5e1", borderRadius: 7, fontSize: "0.84rem" };
const money = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Channels that consume the universal feed today (no OAuth) — shown so sellers know coverage.
const FEED_CHANNELS = ["Google", "Microsoft / Bing", "Meta (Facebook/Instagram)", "Pinterest", "TikTok", "Snapchat", "Reddit"];

export default function ChannelsClient() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState("");
    const [copied, setCopied] = useState(false);
    const [msg, setMsg] = useState("");

    const load = async () => {
        try { const d = await (await fetch("/api/storefront/channels")).json(); if (!d.error) setData(d); }
        catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => {
        load();
        const p = new URLSearchParams(window.location.search);
        if (p.get("connected")) setMsg(`Connected ${p.get("connected")} ✓`);
        if (p.get("error")) setMsg(`Couldn't connect: ${p.get("error")}`);
    }, []); // eslint-disable-line

    const post = async (body) => {
        const d = await (await fetch("/api/storefront/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
        if (d.error) throw new Error(d.error); return d;
    };
    const sync = async (channel) => {
        setBusy(channel + ":sync"); setMsg("");
        try { const d = await post({ op: "sync", channel }); const r = d.result || {};
            setMsg(r.note || `Synced ${r.synced || 0} products${r.failed ? `, ${r.failed} failed${r.error ? ` (${r.error})` : ""}` : ""}.`); await load(); }
        catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };
    const disconnect = async (channel) => {
        setBusy(channel + ":dis");
        try { await post({ op: "disconnect", channel }); await load(); } catch { /* ignore */ } finally { setBusy(""); }
    };
    const optimize = async (channel) => {
        setBusy(channel + ":opt"); setMsg("");
        try { const d = await post({ op: "optimize", channel }); setMsg(`AI-optimized ${d.optimized || 0} listings for ${channel}.`); } catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };
    const saveAccount = async (channel, accountId) => {
        setBusy(channel + ":acct");
        try { await post({ op: "set-account", channel, accountId }); await load(); } catch { /* ignore */ } finally { setBusy(""); }
    };
    const saveAdsAccount = async (channel, adsCustomerId) => {
        setBusy(channel + ":adsacct");
        try { await post({ op: "set-ads-account", channel, adsCustomerId }); await load(); } catch { /* ignore */ } finally { setBusy(""); }
    };
    const syncAdSpend = async (channel) => {
        setBusy(channel + ":adsync"); setMsg("");
        try { const d = await post({ op: "sync-adspend", channel }); setMsg(`Pulled ${d.result?.dates || 0} days of ad spend (${money(d.result?.totalCents)}).`); await load(); }
        catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };
    const [preview, setPreview] = useState(null);   // { channel, method, endpoint, body, note }
    const doPreview = async (channel) => {
        setBusy(channel + ":prev"); setMsg("");
        try { const d = await post({ op: "preview", channel }); setPreview(d.preview); }
        catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };
    const [spend, setSpend] = useState({ channel: "google", amount: "", date: "" });
    const addSpend = async () => {
        if (!(Number(spend.amount) >= 0)) return;
        setBusy("spend");
        try { await post({ op: "ad-spend", channel: spend.channel, amountCents: Math.round(Number(spend.amount) * 100), date: spend.date || undefined }); setSpend({ ...spend, amount: "" }); await load(); }
        catch (e) { setMsg(e.message); } finally { setBusy(""); }
    };
    const copyFeed = () => { if (data?.feedUrl) { navigator.clipboard?.writeText(data.feedUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } };

    const channelRoiRows = () => data?.roi?.rows || [];
    if (loading) return <div style={{ padding: 28 }}>Loading channels…</div>;
    const channels = data?.channels || [];

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
            <h1 style={{ margin: 0 }}>Sales channels 📡</h1>
            <p style={{ color: "#64748b", margin: "2px 0 0" }}>Sync your catalog to Google, social, and shopping channels — AI-optimized, with ROI folded back into your analytics.</p>

            {msg && <div style={{ ...card, marginTop: 16, color: msg.includes("Couldn't") || msg.includes("failed") ? "#dc2626" : "#16a34a" }}>{msg}</div>}

            {/* Universal feed — works everywhere with zero setup */}
            {data?.feedUrl && (
                <div style={{ ...card, marginTop: 16, background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                    <b style={{ color: "#0f766e" }}>Universal product feed</b>
                    <p style={{ color: "#64748b", fontSize: "0.84rem", margin: "4px 0 10px" }}>Paste this URL into any channel's "scheduled feed" — works today with no connection needed: {FEED_CHANNELS.join(", ")}.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <code style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 7, padding: "8px 10px", fontSize: "0.8rem", flex: 1, minWidth: 220, overflow: "auto" }}>{data.feedUrl}</code>
                        <button onClick={copyFeed} style={ghost}>{copied ? "Copied ✓" : "Copy"}</button>
                    </div>
                </div>
            )}

            {/* Connected channels (OAuth push) */}
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {channels.map((c) => (
                    <div key={c.channel} style={card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <div>
                                <b>{c.name}</b>
                                {c.feedOnly
                                    ? <span style={{ marginLeft: 8, background: "#ecfeff", color: "#0e7490", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>Via feed</span>
                                    : c.connected
                                        ? <span style={{ marginLeft: 8, background: "#dcfce7", color: "#166534", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>Connected{c.accountId ? ` · ${c.accountId}` : ""}</span>
                                        : <span style={{ marginLeft: 8, color: "#94a3b8", fontSize: "0.78rem" }}>Real-time push (OAuth)</span>}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {!c.feedOnly && !c.configured && <span style={{ color: "#b45309", fontSize: "0.78rem", alignSelf: "center" }}>Setup required by Pythias</span>}
                                {!c.feedOnly && c.configured && !c.connected && <a href={`/api/storefront/channels/${c.channel}/connect`} style={{ ...btn, textDecoration: "none", display: "inline-block" }}>Connect</a>}
                                {c.connected && <button onClick={() => optimize(c.channel)} disabled={!!busy} style={ghost}>{busy === c.channel + ":opt" ? "Optimizing…" : "✨ AI-optimize"}</button>}
                                {c.connected && <button onClick={() => sync(c.channel)} disabled={!!busy} style={btn}>{busy === c.channel + ":sync" ? "Syncing…" : "Sync now"}</button>}
                                {c.connected && <button onClick={() => doPreview(c.channel)} disabled={!!busy} style={ghost} title="Show the exact request that would be sent (dry-run) to validate the shape">Preview</button>}
                                {c.connected && <button onClick={() => disconnect(c.channel)} disabled={!!busy} style={ghost}>Disconnect</button>}
                            </div>
                        </div>
                        {preview?.channel === c.channel && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: 4 }}>{preview.note || `${preview.method || "POST"} ${preview.endpoint || ""}`} <button onClick={() => setPreview(null)} style={{ ...ghost, padding: "2px 8px", fontSize: "0.72rem", marginLeft: 6 }}>close</button></div>
                                {preview.body && <pre style={{ background: "#0f172a", color: "#cbd5e1", borderRadius: 8, padding: 12, fontSize: "0.72rem", overflow: "auto", maxHeight: 280, margin: 0 }}>{JSON.stringify(preview.body, null, 2)}</pre>}
                            </div>
                        )}
                        {c.feedOnly && c.feedNote && <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 8 }}>{c.feedNote}</div>}
                        {c.connected && c.needsAccountId && (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                                <span style={{ fontSize: "0.82rem", color: "#475569" }}>{c.accountLabel || "Account ID"}</span>
                                <input defaultValue={c.accountId || ""} placeholder="e.g. 1234567" style={{ ...input, width: 160 }}
                                    onBlur={(e) => e.target.value !== (c.accountId || "") && saveAccount(c.channel, e.target.value)} />
                                {!c.accountId && <span style={{ color: "#b45309", fontSize: "0.76rem" }}>required to sync</span>}
                            </div>
                        )}
                        {c.connected && c.adsAuto && (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.82rem", color: "#475569" }}>{c.adsLabel || "Ads Account ID"}</span>
                                <input defaultValue={c.adsCustomerId || ""} placeholder={c.channel === "meta" ? "act_1234567890" : "123-456-7890"} style={{ ...input, width: 140 }}
                                    onBlur={(e) => e.target.value !== (c.adsCustomerId || "") && saveAdsAccount(c.channel, e.target.value)} />
                                {c.adsCustomerId && <button onClick={() => syncAdSpend(c.channel)} disabled={!!busy} style={ghost}>{busy === c.channel + ":adsync" ? "Pulling…" : "Sync ad spend"}</button>}
                                <span style={{ color: "#94a3b8", fontSize: "0.74rem" }}>auto-pulls daily once set</span>
                            </div>
                        )}
                        {c.connected && c.lastSyncAt && <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: 8 }}>Last sync {new Date(c.lastSyncAt).toLocaleString()} — {c.lastSyncResult?.synced ?? 0} products{c.lastSyncResult?.failed ? `, ${c.lastSyncResult.failed} failed` : ""}.</div>}
                    </div>
                ))}
            </div>

            {/* Closed-loop ROI: ad spend → revenue → true profit, per channel */}
            <div style={{ ...card, marginTop: 16, overflowX: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                    <b>Channel ROI</b>
                    <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Revenue &amp; profit attributed to each channel vs your ad spend (last 30 days)</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", marginTop: 10, minWidth: 640 }}>
                    <thead><tr style={{ textAlign: "left", color: "#64748b" }}><th style={{ padding: "5px 8px" }}>Channel</th><th style={{ textAlign: "right" }}>Orders</th><th style={{ textAlign: "right" }}>Revenue</th><th style={{ textAlign: "right" }}>Refunds</th><th style={{ textAlign: "right" }}>Profit</th><th style={{ textAlign: "right" }}>Ad spend</th><th style={{ textAlign: "right" }}>ROAS</th><th style={{ textAlign: "right" }}>Profit after ads</th></tr></thead>
                    <tbody>
                        {(channelRoiRows()).map((r) => (
                            <tr key={r.channel} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "7px 8px", fontWeight: 600 }}>{r.name}</td>
                                <td style={{ textAlign: "right" }}>{r.orders || 0}</td>
                                <td style={{ textAlign: "right" }}>{money(r.revenueCents)}</td>
                                <td style={{ textAlign: "right", color: r.refundsCents ? "#dc2626" : "#94a3b8" }}>{r.refundsCents ? `−${money(r.refundsCents)}` : "—"}</td>
                                <td style={{ textAlign: "right" }}>{money(r.profitCents)}</td>
                                <td style={{ textAlign: "right" }}>{money(r.spendCents)}</td>
                                <td style={{ textAlign: "right", fontWeight: 700 }}>{r.roas != null ? `${r.roas}×` : "—"}</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: r.profitAfterSpendCents >= 0 ? "#16a34a" : "#dc2626" }}>{money(r.profitAfterSpendCents)}</td>
                            </tr>
                        ))}
                        {channelRoiRows().length === 0 && <tr><td colSpan={8} style={{ padding: 14, color: "#64748b" }}>No attributed orders or ad spend yet. Tag your channel links with UTM (utm_source=google) and log ad spend below.</td></tr>}
                    </tbody>
                </table>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px dashed #e2e8f0" }}>
                    <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>Log ad spend:</span>
                    <select value={spend.channel} onChange={(e) => setSpend({ ...spend, channel: e.target.value })} style={input}>
                        {channels.map((c) => <option key={c.channel} value={c.channel}>{c.name}</option>)}
                    </select>
                    <input type="number" placeholder="Amount $" value={spend.amount} onChange={(e) => setSpend({ ...spend, amount: e.target.value })} style={{ ...input, width: 110 }} />
                    <input type="date" value={spend.date} onChange={(e) => setSpend({ ...spend, date: e.target.value })} style={input} />
                    <button onClick={addSpend} disabled={busy === "spend"} style={btn}>{busy === "spend" ? "Saving…" : "Add"}</button>
                    <span style={{ color: "#94a3b8", fontSize: "0.74rem" }}>Real per-order landed-cost figures by acquisition channel — profit is net of returns refunded to each channel's orders.</span>
                </div>
            </div>

            <div style={{ ...card, marginTop: 16, color: "#64748b", fontSize: "0.84rem" }}>
                <b style={{ color: "#334155" }}>More one-click channels coming</b> — Microsoft/Bing, Meta, Pinterest, TikTok Shop, Snapchat, YouTube. Until then, the universal feed above already lists your products on them.
            </div>
        </div>
    );
}
