// The trust close: Pythias runs Premier Printing, a real garment shop at volume.
const MONO = 'ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';
const GOLD = "#D3A73D";

const STATS = [
    { n: "1", l: "Shop we run on it, every day" },
    { n: "6+", l: "Marketplaces feeding one queue" },
    { n: "4", l: "Print methods on one floor" },
    { n: "0", l: "Orders retyped by hand" },
];

export default function GarmentProofSection() {
    return (
        <section style={{ background: "#08081a", padding: "88px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, alignItems: "center" }} className="gm-two">
                <div>
                    <div style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                        <span style={{ color: "#a5b4fc" }}>03</span> The proof
                    </div>
                    <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem,4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, margin: "0 0 20px" }}>
                        Built on a real floor, not a whiteboard.
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.6, margin: 0 }}>
                        Pythias runs <b style={{ color: "#fff" }}>Premier Printing</b> — a working garment shop that ships thousands of DTG, DTF, and embroidery orders a month across Shopify, TikTok Shop, Walmart, Kohl&apos;s, and Target Plus.
                    </p>
                    <p style={{ color: "#9ca3af", fontSize: "1.05rem", lineHeight: 1.6, marginTop: 16 }}>
                        The software you&apos;d buy is the software our own floor can&apos;t ship without. Every feature earned its place by surviving a Monday — not a roadmap.
                    </p>
                </div>
                <div style={{ background: "#050510", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 8 }}>
                    {STATS.map((s, i) => (
                        <div key={s.l} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: 20, borderBottom: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                            <span style={{ fontFamily: MONO, fontSize: "2rem", fontWeight: 600, color: GOLD, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{s.n}</span>
                            <span style={{ fontFamily: MONO, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", textAlign: "right", maxWidth: "20ch" }}>{s.l}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
