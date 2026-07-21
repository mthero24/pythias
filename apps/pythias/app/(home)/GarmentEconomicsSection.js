// "Keep what you print" — the margin argument vs POD networks, plus a deadline band.
const MONO = 'ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';
const GOLD = "#D3A73D";

const POD = [
    ["Base cost per shirt", "$9.50", "muted"],
    ["Their production margin", "— theirs", "bad"],
    ["You control the floor?", "No", "bad"],
    ["Blank + method flexibility", "Their catalog", "bad"],
];
const YOU = [
    ["Base cost per shirt", "your wholesale", "muted"],
    ["Production margin", "yours", "good"],
    ["You control the floor?", "Every station", "good"],
    ["Blank + method flexibility", "Anything you stock", "good"],
];

function Card({ title, sub, rows, featured }) {
    return (
        <div style={{ border: featured ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 30, background: "linear-gradient(145deg,#0d0d1f 0%,#08081a 100%)" }}>
            <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px" }}>{title}</h3>
            <div style={{ fontFamily: MONO, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: featured ? GOLD : "#6b7280", marginBottom: 20 }}>{sub}</div>
            {rows.map((r, i) => (
                <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: "0.9rem", color: "#9ca3af" }}>
                    <span>{r[0]}</span>
                    <b style={{ fontFamily: MONO, fontVariantNumeric: "tabular-nums", color: r[2] === "good" ? GOLD : r[2] === "bad" ? "#6b7280" : "#e5e7eb" }}>{r[1]}</b>
                </div>
            ))}
        </div>
    );
}

export default function GarmentEconomicsSection() {
    return (
        <section style={{ background: "linear-gradient(180deg,#050510 0%,#08081a 100%)", padding: "88px 20px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ color: "#a5b4fc" }}>04</span> The economics
                </div>
                <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem,4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, margin: 0 }}>Keep what you print.</h2>
                <p style={{ color: "#9ca3af", fontSize: "1.1rem", lineHeight: 1.55, marginTop: 16, maxWidth: "56ch" }}>
                    Print-on-demand networks take a cut of every garment you sell. You already own the presses — Pythias is just the system that runs them. No per-item markup, no middleman between you and your customer.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40 }} className="gm-two">
                    <Card title="POD network" sub="You sell, they print" rows={POD} />
                    <Card title="Your shop on Pythias" sub="You sell, you print" rows={YOU} featured />
                </div>

                <div style={{ marginTop: 40, background: "linear-gradient(145deg,#0d0d1f 0%,#08081a 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 40, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32, alignItems: "center" }} className="gm-band">
                    <div style={{ fontFamily: MONO, fontSize: "2.4rem", fontWeight: 600, color: GOLD, lineHeight: 1 }}>00:00</div>
                    <div>
                        <h3 style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 6px" }}>Never miss a marketplace deadline.</h3>
                        <p style={{ color: "#9ca3af", margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
                            TikTok Late Shipment Rate, Walmart on-time cutoffs, Etsy ship-by — Pythias sorts by the clock that matters and pushes tracking the moment a label prints. The countdown is on your side.
                        </p>
                    </div>
                    <a href="#calendar-booking-section" className="gm-btn gm-btn-ghost" style={{ display: "inline-flex", alignItems: "center", background: "transparent", color: "#fff", fontWeight: 650, fontSize: "0.95rem", padding: "12px 22px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.22)", textDecoration: "none", whiteSpace: "nowrap" }}>Get set up</a>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: "@media(max-width:760px){.gm-band{grid-template-columns:1fr!important;gap:20px!important}}" }} />
        </section>
    );
}
