"use client";
import { useState } from "react";

// Soft, low-friction capture for the /founding page: people who read the offer but
// aren't ready to fill the full register form can leave just an email and get a
// personal follow-up. Posts to /api/contact (source: founding_interest) so it lands
// in Contact Messages + the lead sequence, and fires generate_lead only on success.
export default function FoundingInterestCapture() {
    const [email, setEmail]     = useState("");
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
                    message: "Founding-member interest — requested a personal walkthrough before committing (from /founding).",
                    source: "founding_interest",
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Something went wrong.");
            // Real lead captured — fire GA4 conversion only on a successful save.
            try { window.gtag?.("event", "generate_lead", { method: "founding_interest" }); } catch {}
            setDone(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <p style={{ marginTop: 28, color: "#D3A73D", fontWeight: 600, fontSize: "1rem" }}>
                Got it — I&apos;ll personally reach out shortly. Talk soon. — Michael
            </p>
        );
    }

    return (
        <div style={{ marginTop: 30, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.95rem", marginBottom: 12, lineHeight: 1.5 }}>
                Not ready to commit? Have questions? Drop your email and I&apos;ll personally walk you through it — no pressure, no sales gauntlet.
            </p>
            <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourshop.com"
                    aria-label="Email"
                    style={{
                        flex: "1 1 230px", minWidth: 0, padding: "12px 14px", borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)",
                        color: "#fff", fontSize: "1rem", outline: "none",
                    }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "12px 22px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: "#D3A73D", color: "#111", fontWeight: 700, fontSize: "1rem",
                        opacity: loading ? 0.7 : 1, whiteSpace: "nowrap",
                    }}
                >
                    {loading ? "Sending…" : "Talk to the founder"}
                </button>
            </form>
            {error && <p style={{ color: "#ff8a8a", fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}
        </div>
    );
}
