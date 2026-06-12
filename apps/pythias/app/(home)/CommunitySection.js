import s from "./home.module.css";

const FLOW = [
    {
        icon: "📦",
        title: "You get slammed",
        body: "Orders flood in faster than your team can handle. Instead of turning work away or missing ship dates, you tap the network.",
    },
    {
        icon: "🔄",
        title: "Overflow routes out",
        body: "With one click, excess orders route to a vetted shop in the network that has open capacity — same quality standards, same platform.",
    },
    {
        icon: "💰",
        title: "Both shops win",
        body: "You keep your margin on the sale. The receiving shop earns wholesale on every item they fulfill. No one loses work.",
    },
];

export default function CommunitySection() {
    return (
        <section style={{ background: "#0f172a", padding: "96px 0", position: "relative", overflow: "hidden" }}>
            {/* Background glow */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(211,167,61,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

            <div className={s.wrapMd} style={{ position: "relative" }}>

                {/* Label + heading */}
                <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", textAlign: "center", marginBottom: 12 }}>
                    The Pythias Network
                </p>
                <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 800, color: "#fff", textAlign: "center", letterSpacing: "-0.025em", lineHeight: 1.2, margin: "0 auto 20px", maxWidth: 720 }}>
                    Shops helping shops.<br />
                    <span style={{ color: "#D3A73D" }}>Everyone grows together.</span>
                </h2>
                <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.75, maxWidth: 600, margin: "0 auto 64px" }}>
                    Pythias isn{"'"}t just software — it{"'"}s a network of independent print shops sharing capacity. When you{"'"}re overwhelmed, the network picks up the slack. When you{"'"}re slow, the network sends you work.
                </p>

                {/* Flow cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 64 }}>
                    {FLOW.map((step, i) => (
                        <div key={i} style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(211,167,61,0.15)",
                            borderRadius: 16,
                            padding: "32px 28px",
                            position: "relative",
                        }}>
                            <div style={{ fontSize: "2rem", marginBottom: 16 }}>{step.icon}</div>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", marginBottom: 10 }}>{step.title}</h3>
                            <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                        </div>
                    ))}
                </div>

                {/* Test new products callout */}
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20,
                    padding: "40px 48px",
                    marginBottom: 24,
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "24px 32px",
                    alignItems: "start",
                }}>
                    <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>🧪</div>
                    <div>
                        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                            Test new products before buying equipment
                        </p>
                        <p style={{ fontSize: "0.925rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, margin: 0 }}>
                            Want to sell UV DTF mugs but don{"'"}t own a UV DTF machine? List them, route the orders to a network member who does, and see if there{"'"}s real demand — before spending $20k on equipment. If it sells, buy the machine knowing it{"'"}ll pay for itself. If it doesn{"'"}t, you saved yourself the risk entirely.
                        </p>
                    </div>
                    <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>🤝</div>
                    <div>
                        <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                            Offer capabilities you don{"'"}t have yet
                        </p>
                        <p style={{ fontSize: "0.925rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, margin: 0 }}>
                            Embroidery, sublimation, screen print, wide-format — if a customer asks for it and someone in the network has it, you can say yes. Expand what you sell without expanding your floor space or payroll.
                        </p>
                    </div>
                </div>

                {/* Bottom callout */}
                <div style={{
                    background: "linear-gradient(135deg, rgba(211,167,61,0.08) 0%, rgba(211,167,61,0.03) 100%)",
                    border: "1px solid rgba(211,167,61,0.2)",
                    borderRadius: 20,
                    padding: "40px 48px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                }}>
                    <div style={{ maxWidth: 560 }}>
                        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.35 }}>
                            The shop down the street isn{"'"}t your competition.<br />
                            <span style={{ color: "#D3A73D" }}>Amazon is.</span>
                        </p>
                        <p style={{ fontSize: "0.925rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>
                            Independent shops sharing capacity through Pythias can collectively fulfill at a scale that no single shop could match alone — and keep the customer relationship local.
                        </p>
                    </div>
                    <a href="/fulfillment-cloud" style={{
                        display: "inline-block",
                        background: "#D3A73D",
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        padding: "14px 28px",
                        borderRadius: 10,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}>
                        Join the network →
                    </a>
                </div>
            </div>
        </section>
    );
}
