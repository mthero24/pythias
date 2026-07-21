// "Your orders are everywhere. Your floor isn't." — the problem, in the shop's words.
const MONO = 'ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';

const PAINS = [
    "Copy-pasting orders out of six marketplace dashboards",
    "A shipping tool that knows nothing about your presses",
    "Tracking numbers typed back into TikTok & Walmart by hand",
    "“Which bin is order 461 in?” — asked forty times a day",
    "Reships that mean rebuilding the whole order from scratch",
];

export default function GarmentProblemSection() {
    return (
        <section style={{ background: "#08081a", padding: "88px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="gm-two">
                <div>
                    <div style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                        <span style={{ color: "#a5b4fc" }}>01</span> The problem
                    </div>
                    <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem,4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, margin: 0 }}>
                        Your orders are everywhere. Your floor isn&apos;t.
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: "1.1rem", lineHeight: 1.55, marginTop: 16, maxWidth: "52ch" }}>
                        You print in-house — DTG, DTF, screen, embroidery — but the orders live in ten browser tabs, the floor runs on a whiteboard, and the marketplace clocks never stop. One missed cutoff is a penalty; one lost piece is a reship you eat.
                    </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PAINS.map((p) => (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "linear-gradient(145deg,#0d0d1f 0%,#08081a 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontFamily: MONO, fontSize: "0.9rem" }}>
                            <span style={{ color: "#f87171", fontWeight: 700, flex: "0 0 auto" }}>✕</span>
                            <span style={{ color: "#9ca3af" }}>{p}</span>
                        </div>
                    ))}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: "@media(max-width:860px){.gm-two{grid-template-columns:1fr!important;gap:28px!important}}" }} />
        </section>
    );
}
