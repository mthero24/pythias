// Shared marketing landing-page template — dark theme, inline styles.
// Matches the gold (#D3A73D) + indigo (#6366f1) accent system used in
// app/(home)/PainPointsSection.js and app/(home)/QuoteToProductionSection.js.
//
// Renders: hero (eyebrow chip + H1 + sub + primary CTA), a "pains" grid
// ([{ pain, fix }]), a "how Pythias helps" features grid ([{ icon, title, desc }]),
// and a closing CTA band. The primary CTA returns to the homepage booking
// section at /#calendar-booking-section.

const GOLD = "#D3A73D";
const CARD_BG = "linear-gradient(145deg, #0d0d1f 0%, #08081a 100%)";
const CARD_BORDER = "1px solid rgba(255,255,255,0.08)";

function CtaButton({ children }) {
    return (
        <a
            href="/#calendar-booking-section"
            style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #D3A73D 0%, #b8860b 100%)",
                color: "#111",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1.05rem",
                padding: "15px 34px",
                borderRadius: 12,
            }}
        >
            {children}
        </a>
    );
}

export default function LandingPage({
    eyebrow = "Pythias",
    headline = "Run your print shop on one platform.",
    sub = "From quote request to paid production order — without the back-and-forth.",
    pains = [],
    features = [],
    ctaText = "Book a Free Workflow Audit →",
    children,
}) {
    return (
        <div style={{ background: "#050510", minHeight: "100vh" }}>
            {/* ── Hero ── */}
            <section
                style={{
                    background: "linear-gradient(180deg, #050510 0%, #08081a 100%)",
                    padding: "104px 20px 88px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
                    <span
                        style={{
                            display: "inline-block",
                            background: "rgba(211,167,61,0.12)",
                            border: "1px solid rgba(211,167,61,0.3)",
                            color: GOLD,
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            padding: "5px 14px",
                            borderRadius: 999,
                            letterSpacing: 0.3,
                        }}
                    >
                        {eyebrow}
                    </span>
                    <h1
                        style={{
                            color: "#fff",
                            fontSize: "clamp(2rem, 5vw, 3.1rem)",
                            fontWeight: 800,
                            letterSpacing: -0.8,
                            margin: "20px auto 16px",
                            lineHeight: 1.1,
                            maxWidth: 760,
                        }}
                    >
                        {headline}
                    </h1>
                    <p
                        style={{
                            color: "#9ca3af",
                            fontSize: "1.15rem",
                            maxWidth: 660,
                            margin: "0 auto 34px",
                            lineHeight: 1.6,
                        }}
                    >
                        {sub}
                    </p>
                    <CtaButton>{ctaText}</CtaButton>
                    <p style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 14 }}>
                        A free, no-commitment look at where your shop is losing time between
                        quoting, approval, production, and shipping.
                    </p>
                </div>
            </section>

            {/* ── Optional injected content (e.g. the 5-step flow) ── */}
            {children}

            {/* ── Pains grid ── */}
            {pains.length > 0 && (
                <section
                    style={{
                        background: "linear-gradient(180deg, #08081a 0%, #050510 100%)",
                        padding: "88px 20px",
                    }}
                >
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 48 }}>
                            <span
                                style={{
                                    display: "inline-block",
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.25)",
                                    color: "#f87171",
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                    letterSpacing: 0.3,
                                }}
                            >
                                Sound familiar?
                            </span>
                            <h2
                                style={{
                                    color: "#fff",
                                    fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
                                    fontWeight: 800,
                                    letterSpacing: -0.5,
                                    margin: "18px 0 10px",
                                    lineHeight: 1.15,
                                }}
                            >
                                The everyday friction Pythias removes.
                            </h2>
                            <p style={{ color: "#9ca3af", fontSize: "1.05rem", maxWidth: 640, margin: "0 auto" }}>
                                If any of this sounds like your shop, you&apos;re in the right place.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                                gap: 18,
                            }}
                        >
                            {pains.map((p) => (
                                <div
                                    key={p.pain}
                                    style={{
                                        background: CARD_BG,
                                        border: CARD_BORDER,
                                        borderRadius: 16,
                                        padding: 24,
                                    }}
                                >
                                    <p
                                        style={{
                                            color: "#e5e7eb",
                                            fontSize: "1.05rem",
                                            fontStyle: "italic",
                                            margin: "0 0 16px",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        <span style={{ color: "#f87171", fontWeight: 700, marginRight: 4 }}>“</span>
                                        {p.pain}
                                        <span style={{ color: "#f87171", fontWeight: 700, marginLeft: 2 }}>”</span>
                                    </p>
                                    <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 16px" }} />
                                    <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0, lineHeight: 1.55 }}>
                                        <span style={{ color: GOLD, fontWeight: 700 }}>How Pythias fixes it: </span>
                                        {p.fix}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Features grid ── */}
            {features.length > 0 && (
                <section
                    style={{
                        background: "linear-gradient(180deg, #050510 0%, #08081a 100%)",
                        padding: "88px 20px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                >
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <div style={{ textAlign: "center", marginBottom: 48 }}>
                            <span
                                style={{
                                    display: "inline-block",
                                    background: "rgba(99,102,241,0.12)",
                                    border: "1px solid rgba(99,102,241,0.3)",
                                    color: "#a5b4fc",
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                    padding: "5px 14px",
                                    borderRadius: 999,
                                    letterSpacing: 0.3,
                                }}
                            >
                                How Pythias helps
                            </span>
                            <h2
                                style={{
                                    color: "#fff",
                                    fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
                                    fontWeight: 800,
                                    letterSpacing: -0.5,
                                    margin: "18px 0 10px",
                                    lineHeight: 1.15,
                                }}
                            >
                                One platform, end to end.
                            </h2>
                            <p style={{ color: "#9ca3af", fontSize: "1.05rem", maxWidth: 640, margin: "0 auto" }}>
                                Everything you need to take a job from request to shipped — in one place.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: 18,
                            }}
                        >
                            {features.map((f) => (
                                <div
                                    key={f.title}
                                    style={{
                                        background: CARD_BG,
                                        border: CARD_BORDER,
                                        borderRadius: 16,
                                        padding: 26,
                                    }}
                                >
                                    <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                                    <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}>
                                        {f.title}
                                    </h3>
                                    <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0, lineHeight: 1.55 }}>
                                        {f.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Closing CTA band ── */}
            <section
                style={{
                    background: "linear-gradient(180deg, #08081a 0%, #050510 100%)",
                    padding: "92px 20px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    textAlign: "center",
                }}
            >
                <div style={{ maxWidth: 680, margin: "0 auto" }}>
                    <h2
                        style={{
                            color: "#fff",
                            fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
                            fontWeight: 800,
                            letterSpacing: -0.5,
                            margin: "0 0 14px",
                            lineHeight: 1.15,
                        }}
                    >
                        See where your workflow is leaking time and money.
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: "1.08rem", margin: "0 auto 32px", maxWidth: 560, lineHeight: 1.6 }}>
                        Book a free workflow audit and we&apos;ll walk through exactly how Pythias fits
                        your shop — your channels, your equipment, your team.
                    </p>
                    <CtaButton>{ctaText}</CtaButton>
                </div>
            </section>
        </div>
    );
}
