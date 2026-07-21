// Founding cohort — real founder / early-bird / early-year tiers, to create urgency.
const MONO = 'ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,monospace';
const GOLD = "#D3A73D";

const COHORT = [
    { slot: "SLOTS 1–10", name: "Founder", perk: "25% off for life + free onboarding" },
    { slot: "SLOTS 11–60", name: "Early Bird", perk: "20% off / yr + 50% onboarding" },
    { slot: "SLOTS 61–100", name: "Early Year", perk: "10% off for a year" },
];

export default function GarmentPricingSection() {
    return (
        <section style={{ background: "#08081a", padding: "88px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "center", background: "linear-gradient(145deg,#0d0d1f 0%,#08081a 100%)", border: `1px solid ${GOLD}`, borderRadius: 16, padding: 44 }} className="gm-two">
                    <div>
                        <div style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6b7280", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <span style={{ color: "#a5b4fc" }}>05</span> Founding cohort
                        </div>
                        <h2 style={{ color: "#fff", fontSize: "clamp(1.8rem,4vw,2.7rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.08, margin: 0 }}>Get in while it&apos;s founder-priced.</h2>
                        <p style={{ color: "#9ca3af", fontSize: "1.1rem", lineHeight: 1.55, marginTop: 14, maxWidth: "48ch" }}>
                            14-day free trial, no card to start. The first 100 shops lock in founding rates — the earlier you join, the more you keep, for as long as you stay.
                        </p>
                        <div style={{ display: "flex", gap: 14, marginTop: 26, flexWrap: "wrap" }}>
                            <a href="https://platform.pythiastechnologies.com/register" className="gm-btn gm-btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${GOLD} 0%,#b8860b 100%)`, color: "#111", fontWeight: 700, fontSize: "1rem", padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}>Start your trial <span className="gm-arw">→</span></a>
                            <a href="#calendar-booking-section" className="gm-btn gm-btn-ghost" style={{ display: "inline-flex", alignItems: "center", background: "transparent", color: "#fff", fontWeight: 650, fontSize: "1rem", padding: "14px 26px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.22)", textDecoration: "none" }}>Talk to the shop</a>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {COHORT.map((c) => (
                            <div key={c.slot} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }} className="gm-crow">
                                <span style={{ fontFamily: MONO, fontSize: "0.72rem", color: "#a5b4fc", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{c.slot}</span>
                                <span style={{ color: "#fff", fontWeight: 650, fontSize: "0.92rem" }}>{c.name}</span>
                                <span style={{ fontFamily: MONO, fontSize: "0.72rem", color: GOLD, textAlign: "right", whiteSpace: "nowrap" }}>{c.perk}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: "@media(max-width:560px){.gm-crow{grid-template-columns:1fr!important;gap:4px!important}.gm-crow span:last-child{text-align:left!important}}" }} />
        </section>
    );
}
