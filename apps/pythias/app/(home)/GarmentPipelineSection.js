// Pull → Produce → Ship → Sync — the real production pipeline, as four stations.
const MONO = 'ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';
const GOLD = "#D3A73D";

const STATIONS = [
    { no: "STATION 01", title: "Pull", body: "Every order from every channel drops into one queue — auto-acknowledged, de-duped, and sorted by ship-by date. No exports, no copy-paste.", tags: ["Shopify", "TikTok", "Walmart", "Etsy", "+more"] },
    { no: "STATION 02", title: "Produce", body: "Your floor on rails: print labels, DTF send, embroidery load, screen burn, fold & bin. Scan a piece ID at each station — nothing gets lost.", tags: ["DTG", "DTF", "Screen", "Embroidery"] },
    { no: "STATION 03", title: "Ship", body: "Live rates across USPS, UPS & FedEx. One scan buys and prints the label. Reships reset the shipping and rebuy — without a whole new order.", tags: ["Rates", "Bins", "Reship", "Manifest"] },
    { no: "STATION 04", title: "Sync", body: "Tracking is pushed back to every marketplace automatically — beat TikTok's LSR and Walmart's cutoffs without a human ever retyping a number.", tags: ["Auto-tracking", "LSR-safe", "Webhooks"] },
];

export default function GarmentPipelineSection() {
    return (
        <section style={{ background: "linear-gradient(180deg,#08081a 0%,#050510 100%)", padding: "88px 20px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
                <div style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ color: "#a5b4fc" }}>02</span> How it works
                </div>
                <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem,4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, margin: 0 }}>
                    Pull → Produce → Ship → Sync.
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "1.1rem", lineHeight: 1.55, marginTop: 16, maxWidth: "56ch" }}>
                    One system carries a garment from a marketplace order to a scanned, shipped, tracked package — through the exact stations a real print shop runs.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 44 }}>
                    {STATIONS.map((st) => (
                        <div key={st.no} className="gm-card" style={{ background: "linear-gradient(145deg,#0d0d1f 0%,#08081a 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "24px 22px" }}>
                            <div style={{ fontFamily: MONO, fontSize: "0.72rem", color: GOLD, letterSpacing: "0.1em" }}>{st.no}</div>
                            <h3 style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 700, margin: "12px 0 8px", letterSpacing: "-0.01em" }}>{st.title}</h3>
                            <p style={{ color: "#9ca3af", fontSize: "0.92rem", lineHeight: 1.55, margin: 0 }}>{st.body}</p>
                            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {st.tags.map((t) => (
                                    <span key={t} style={{ fontFamily: MONO, fontSize: "0.65rem", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 7px", borderRadius: 5 }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
