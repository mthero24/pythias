"use client";
import { useState } from "react";

// Lead magnet: a free, no-pitch "print shop analysis." Lower commitment than a demo or full
// signup, so it converts the interested-but-not-ready. Posts to /api/contact (source:
// free_analysis) — lands in Contact Messages + lead sequence and emails Michael. Fires
// generate_lead only on a real saved submission.
export default function FreeAnalysisSection() {
    const [email, setEmail]     = useState("");
    const [setup, setSetup]     = useState("");
    const [done, setDone]       = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");

    async function submit(e) {
        e.preventDefault();
        if (!email.trim()) { setError("Please enter your email."); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: email,
                    email,
                    message: `Free print shop analysis request.${setup ? `\nCurrent setup: ${setup}` : ""}`,
                    source: "free_analysis",
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Something went wrong.");
            try { window.gtag?.("event", "generate_lead", { method: "free_analysis" }); } catch {}
            setDone(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2a2418 100%)", padding: "72px 24px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
                <span style={{
                    display: "inline-block", padding: "5px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 700,
                    letterSpacing: 0.5, color: "#D3A73D", background: "rgba(211,167,61,0.14)", border: "1px solid rgba(211,167,61,0.4)", marginBottom: 18,
                }}>
                    FREE · NO PITCH
                </span>
                <h2 style={{ color: "#fff", fontSize: "clamp(1.7rem, 4vw, 2.5rem)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 14px" }}>
                    Free Print Shop Analysis
                </h2>
                <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "1.05rem", lineHeight: 1.6, margin: "0 auto 28px", maxWidth: 600 }}>
                    Tell me what you sell and where, and I&apos;ll personally show you where you&apos;re losing
                    time and money in your workflow — and whether Pythias can fix it. No sales pitch, no cost.
                </p>

                {done ? (
                    <p style={{ color: "#D3A73D", fontWeight: 600, fontSize: "1.05rem" }}>
                        Got it — I&apos;ll review your setup and personally reach out with your analysis. Talk soon. — Michael
                    </p>
                ) : (
                    <form onSubmit={submit} style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
                        <input
                            type="text"
                            value={setup}
                            onChange={(e) => setSetup(e.target.value)}
                            placeholder="What do you sell, and where? (e.g. DTF apparel on Etsy + Shopify)"
                            aria-label="What you sell and where"
                            style={{ padding: "13px 15px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "1rem", outline: "none" }}
                        />
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@yourshop.com"
                                aria-label="Email"
                                required
                                style={{ flex: "1 1 240px", minWidth: 0, padding: "13px 15px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "1rem", outline: "none" }}
                            />
                            <button type="submit" disabled={loading} style={{
                                padding: "13px 26px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                                background: "linear-gradient(90deg, #D3A73D, #f0c66a)", color: "#111", fontWeight: 800, fontSize: "1rem", opacity: loading ? 0.7 : 1,
                            }}>
                                {loading ? "Sending…" : "Get my free analysis"}
                            </button>
                        </div>
                        {error && <p style={{ color: "#ff8a8a", fontSize: "0.85rem", margin: 0 }}>{error}</p>}
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", margin: "2px 0 0" }}>
                            Reviewed personally by Michael, the founder. We&apos;ll never share your email.
                        </p>
                    </form>
                )}
            </div>
        </section>
    );
}
