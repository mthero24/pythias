// Garment-print-shop hero — dark gold+indigo brand, with a live "floor monitor"
// panel and a channel→station ticker. Primary CTA books a demo; secondary starts
// a trial (same targets as the rest of the homepage).
const MONO = 'ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';
const GOLD = "#D3A73D";
const INDIGO = "#6366f1";

const ROWS = [
    { ch: "SHOPIFY", po: "#6719860461", st: "Print labels", pill: "Queued", tone: "queued" },
    { ch: "TIKTOK", po: "#TT-88420-A", st: "DTF send · LSR 4h", pill: "Printing", tone: "prod" },
    { ch: "KOHL'S", po: "#6717274564", st: "Embroidery load", pill: "Printing", tone: "prod" },
    { ch: "WALMART", po: "#WM-10774", st: "Fold · Bin 12", pill: "Ready", tone: "ready" },
    { ch: "ETSY", po: "#84120-EG", st: "9200 1903 8812 · synced", pill: "Shipped", tone: "ship" },
];

const TICK = [
    ["SHOPIFY", "#6719860461", "PRINT LABELS"],
    ["TIKTOK SHOP", "#TT-88420", "DTF SEND"],
    ["WALMART", "#WM-10774", "FOLD · BIN 12"],
    ["ETSY", "#84120-EG", "SHIPPED · TRACKING SYNCED"],
    ["KOHL'S", "#6717274564", "EMBROIDERY LOAD"],
    ["TARGET PLUS", "#TP-55219", "SCREEN BURN"],
];

function pillStyle(tone) {
    const map = {
        queued: { c: "#9ca3af", b: "rgba(156,163,175,0.14)" },
        prod: { c: INDIGO, b: "rgba(99,102,241,0.16)" },
        ready: { c: GOLD, b: "rgba(211,167,61,0.16)" },
        ship: { c: "#111", b: GOLD, solid: true },
    }[tone];
    return {
        fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.05em", textTransform: "uppercase",
        padding: "4px 8px", borderRadius: 5, whiteSpace: "nowrap", color: map.c,
        background: map.b, fontWeight: 600,
    };
}

export default function GarmentHeroSection() {
    return (
        <section style={{ background: "linear-gradient(180deg,#050510 0%,#08081a 100%)", padding: "96px 20px 72px", position: "relative", overflow: "hidden" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 52, alignItems: "center" }} className="gm-hero-grid">
                    <div>
                        <span style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: INDIGO }}>⊹</span> Production-floor OS for print shops
                        </span>
                        <h1 style={{ color: "#fff", fontSize: "clamp(2.4rem,6vw,4.1rem)", fontWeight: 800, letterSpacing: "-0.028em", lineHeight: 1.02, margin: "18px 0 18px" }}>
                            The order-to-ship platform built to run a <span style={{ color: GOLD }}>garment print shop</span>.
                        </h1>
                        <p style={{ color: "#9ca3af", fontSize: "clamp(1.05rem,2vw,1.25rem)", lineHeight: 1.5, maxWidth: "34ch", margin: 0 }}>
                            Pull every order from every channel into one production floor — print, fold, label, ship, and auto-sync tracking.
                        </p>
                        <div style={{ marginTop: 22, padding: "14px 18px", borderLeft: `3px solid ${GOLD}`, background: "rgba(255,255,255,0.03)", borderRadius: "0 8px 8px 0", color: "#e5e7eb", fontSize: "1.02rem", lineHeight: 1.45 }}>
                            <b style={{ color: "#fff" }}>Printful prints <span style={{ color: "#6b7280" }}>for</span> you.</b> Pythias lets you print <b style={{ color: "#fff" }}>for yourself</b> — and runs the whole floor.
                        </div>
                        <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
                            <a href="#calendar-booking-section" className="gm-btn gm-btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${GOLD} 0%,#b8860b 100%)`, color: "#111", fontWeight: 700, fontSize: "1rem", padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}>
                                Book a Free Demo <span className="gm-arw">→</span>
                            </a>
                            <a href="https://platform.pythiastechnologies.com/register" className="gm-btn gm-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "#fff", fontWeight: 650, fontSize: "1rem", padding: "14px 26px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.22)", textDecoration: "none" }}>
                                Start Free Trial
                            </a>
                        </div>
                        <div style={{ marginTop: 38 }}>
                            <div style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b7280", marginBottom: 12 }}>Every channel your shop already sells on</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {["Shopify", "TikTok Shop", "Walmart", "Etsy", "Kohl's", "Target Plus"].map((c) => (
                                    <span key={c} style={{ fontFamily: MONO, fontSize: "0.74rem", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)", padding: "5px 10px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Floor monitor */}
                    <div style={{ background: "linear-gradient(145deg,#0d0d1f 0%,#08081a 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 70px -34px rgba(0,0,0,0.6)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                            <span style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af" }}>Floor · Live</span>
                            <span style={{ display: "flex", gap: 6 }}>
                                <i style={{ width: 9, height: 9, borderRadius: "50%", background: INDIGO }} />
                                <i style={{ width: 9, height: 9, borderRadius: "50%", background: GOLD }} />
                                <i style={{ width: 9, height: 9, borderRadius: "50%", background: "#3f9d6b" }} />
                            </span>
                        </div>
                        {ROWS.map((r) => (
                            <div key={r.po} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <span style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.06em", color: "#6b7280", width: 62 }}>{r.ch}</span>
                                <span style={{ minWidth: 0 }}>
                                    <div style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: "#e5e7eb", fontSize: "0.78rem" }}>{r.po}</div>
                                    <div style={{ fontFamily: MONO, fontSize: "0.66rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{r.st}</div>
                                </span>
                                <span style={pillStyle(r.tone)}>{r.pill}</span>
                            </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", fontFamily: MONO, fontSize: "0.66rem", color: "#6b7280", background: "rgba(255,255,255,0.02)" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#3f9d6b" }}>
                                <i className="gm-blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#3f9d6b" }} /> 238 orders on the floor
                            </span>
                            <span>0 late today</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticker */}
            <div className="gm-ticker" style={{ marginTop: 56, borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }} aria-hidden="true">
                <div className="gm-ticker-track">
                    {[...TICK, ...TICK].map((t, i) => (
                        <span key={i} style={{ fontFamily: MONO, fontSize: "0.76rem", color: "#9ca3af", padding: "13px 26px", borderRight: "1px solid rgba(255,255,255,0.07)", display: "inline-flex", gap: 12, alignItems: "center" }}>
                            <b style={{ color: GOLD, fontWeight: 600 }}>{t[0]}</b> <span style={{ color: "#6b7280" }}>{t[1]} →</span> {t[2]}
                        </span>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: "@media(max-width:940px){.gm-hero-grid{grid-template-columns:1fr!important;gap:40px!important}}" }} />
        </section>
    );
}
