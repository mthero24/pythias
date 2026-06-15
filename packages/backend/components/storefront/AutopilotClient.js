"use client";
import { useState, useEffect } from "react";

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 };
const btn = { padding: "10px 16px", borderRadius: 9, border: "none", background: "#635bff", color: "#fff", fontWeight: 700, cursor: "pointer" };
const IMPACT = { high: { bg: "#dcfce7", fg: "#166534" }, medium: { bg: "#fef9c3", fg: "#854d0e" }, low: { bg: "#f1f5f9", fg: "#475569" } };
const TYPE_LABEL = { automatic_discount: "Discount", create_flow: "Automation", create_campaign: "Campaign", translate: "Translate", popup_experiment: "A/B test" };

function Toggle({ on, onChange, label, hint }) {
    return (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <span onClick={() => onChange(!on)} style={{ flex: "0 0 auto", width: 38, height: 22, borderRadius: 999, background: on ? "#635bff" : "#cbd5e1", position: "relative", transition: "background .15s", marginTop: 2 }}>
                <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
            </span>
            <span><b style={{ fontSize: "0.92rem" }}>{label}</b>{hint && <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{hint}</div>}</span>
        </label>
    );
}

export default function AutopilotClient() {
    const [config, setConfig] = useState({ autonomous: false, autoApply: false });
    const [run, setRun] = useState(null);            // latest run { recommendations, applied, pending, note, trigger, createdAt }
    const [loading, setLoading] = useState(false);
    const [booting, setBooting] = useState(true);
    const [state, setState] = useState({});          // pending-index → "applying"|"done:msg"|"error:msg"

    useEffect(() => {
        (async () => {
            try { const d = await (await fetch("/api/storefront/autopilot")).json(); if (!d.error) { setConfig(d.config || config); setRun(d.lastRun || null); } }
            catch { /* ignore */ } finally { setBooting(false); }
        })();
    }, []); // eslint-disable-line

    const saveConfig = async (patch) => {
        const next = { ...config, ...patch };
        setConfig(next);
        try { await fetch("/api/storefront/autopilot", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }); } catch { /* ignore */ }
    };
    const runNow = async () => {
        setLoading(true); setState({});
        try { const d = await (await fetch("/api/storefront/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ run: true }) })).json();
            if (d.error) throw new Error(d.error); setRun(d.run); }
        catch (e) { setRun({ note: e.message, pending: [], applied: [] }); }
        finally { setLoading(false); }
    };
    const apply = async (i, action) => {
        setState((s) => ({ ...s, [i]: "applying" }));
        try { const d = await (await fetch("/api/storefront/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) })).json();
            setState((s) => ({ ...s, [i]: d.error ? `error:${d.error}` : `done:${d.message || "Applied"}` }));
        } catch (e) { setState((s) => ({ ...s, [i]: `error:${e.message}` })); }
    };

    const pending = run?.pending || [];
    const applied = run?.applied || [];
    const when = run?.createdAt ? new Date(run.createdAt).toLocaleString() : null;

    return (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Store autopilot ✨</h1>
                    <p style={{ color: "#64748b", margin: "2px 0 0" }}>AI reviews your store and proposes high-impact moves — apply any with one click, or let it run on its own.</p>
                </div>
                <button onClick={runNow} disabled={loading} style={btn}>{loading ? "Analyzing…" : run ? "Re-run now" : "Run autopilot"}</button>
            </div>

            {/* Autonomous schedule */}
            <div style={{ ...card, marginTop: 18, display: "grid", gap: 14 }}>
                <Toggle on={config.autonomous} onChange={(v) => saveConfig({ autonomous: v })}
                    label="Run autopilot automatically (daily)"
                    hint="Each day, autopilot analyzes your store and stocks your recommendations here — no click needed." />
                {config.autonomous && (
                    <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 14 }}>
                        <Toggle on={config.autoApply} onChange={(v) => saveConfig({ autoApply: v })}
                            label="Auto-apply zero-risk improvements"
                            hint="Automatically applies translations & popup A/B tests. Discounts, automations & campaigns always wait for your review." />
                    </div>
                )}
            </div>

            {booting && <div style={{ ...card, marginTop: 18, color: "#64748b" }}>Loading…</div>}

            {!booting && run && (
                <>
                    {when && <div style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "18px 2px 0" }}>Last run {when}{run.trigger === "scheduled" ? " · automatic" : ""}</div>}
                    {run.note && <div style={{ ...card, marginTop: 8, color: "#64748b" }}>{run.note}</div>}

                    {applied.length > 0 && (
                        <div style={{ ...card, marginTop: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <b style={{ color: "#166534" }}>Applied automatically</b>
                            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#15803d", fontSize: "0.88rem" }}>
                                {applied.map((a, i) => <li key={i}>{a.message}</li>)}
                            </ul>
                        </div>
                    )}

                    {pending.length > 0 && <div style={{ fontWeight: 700, margin: "18px 2px 0" }}>Recommended for you</div>}
                    <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                        {pending.map((r, i) => {
                            const im = IMPACT[r.impact] || IMPACT.low;
                            const st = state[i] || "";
                            return (
                                <div key={i} style={card}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ background: im.bg, color: im.fg, fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" }}>{r.impact}</span>
                                            <b>{r.title}</b>
                                            <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>· {TYPE_LABEL[r.action?.type] || r.action?.type}</span>
                                        </div>
                                        {!st.startsWith("done") && <button onClick={() => apply(i, r.action)} disabled={st === "applying"} style={btn}>{st === "applying" ? "Applying…" : "Apply"}</button>}
                                    </div>
                                    <div style={{ color: "#475569", fontSize: "0.9rem", marginTop: 6 }}>{r.why}</div>
                                    {st.startsWith("done") && <div style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.86rem", marginTop: 8 }}>✓ {st.slice(5)}</div>}
                                    {st.startsWith("error") && <div style={{ color: "#dc2626", fontSize: "0.86rem", marginTop: 8 }}>{st.slice(6)}</div>}
                                </div>
                            );
                        })}
                        {pending.length === 0 && applied.length === 0 && !run.note && <div style={card}>No recommendations right now — check back as more data comes in.</div>}
                    </div>
                </>
            )}

            {!booting && !run && <div style={{ ...card, marginTop: 18, color: "#64748b" }}>Run autopilot to get your first set of recommendations.</div>}
        </div>
    );
}
