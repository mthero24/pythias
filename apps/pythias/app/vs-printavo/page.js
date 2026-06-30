export const metadata = {
    title: "Pythias vs Printavo — A Modern Print Shop Alternative",
    description:
        "Looking for a Printavo alternative? Pythias turns customer requests into production-ready orders — visual quote intake, e-commerce and marketplace order import, online approval and payment, production queues, auto shipping labels, and built-in fulfillment.",
    alternates: { canonical: "https://pythiastechnologies.com/vs-printavo" },
    openGraph: {
        title: "Pythias vs Printavo — A Modern Print Shop Alternative",
        description:
            "Printavo manages jobs. Pythias turns customer requests into production-ready orders — quote to fulfillment in one platform.",
        url: "https://pythiastechnologies.com/vs-printavo",
        type: "website",
    },
};

const GOLD = "#D3A73D";
const CARD_BG = "linear-gradient(145deg, #0d0d1f 0%, #08081a 100%)";

// Honest positioning: ✓ = Pythias does this; for Printavo we only mark what we're
// confident about and otherwise leave it blank ("—"). We do not claim Printavo
// lacks features we're unsure of.
const ROWS = [
    { feature: "Visual customer quote intake (artwork, blanks, sizes, colors)", pythias: "yes", printavo: "no" },
    { feature: "Online quote approval + payment", pythias: "yes", printavo: "partial" },
    { feature: "E-commerce / marketplace order import (18+ channels)", pythias: "yes", printavo: "no" },
    { feature: "Production queue by deadline + print method", pythias: "yes", printavo: "partial" },
    { feature: "Auto shipping labels on barcode scan", pythias: "yes", printavo: "no" },
    { feature: "Built-in fulfillment workflow", pythias: "yes", printavo: "no" },
    { feature: "Bring-your-own-blanks pricing", pythias: "yes", printavo: "no" },
];

function Mark({ kind }) {
    if (kind === "yes") {
        return <span style={{ color: "#10b981", fontSize: "1.25rem", fontWeight: 800 }} aria-label="Yes">✓</span>;
    }
    if (kind === "partial") {
        return <span style={{ color: GOLD, fontWeight: 700, fontSize: "0.82rem" }} aria-label="Partial">Partial</span>;
    }
    return <span style={{ color: "#6b7280", fontSize: "1.2rem" }} aria-label="Not a focus">—</span>;
}

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

export default function VsPrintavoPage() {
    return (
        <div style={{ background: "#050510", minHeight: "100vh" }}>
            {/* ── Hero ── */}
            <section
                style={{
                    background: "linear-gradient(180deg, #050510 0%, #08081a 100%)",
                    padding: "104px 20px 80px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
            >
                <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
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
                        Pythias vs Printavo
                    </span>
                    <h1
                        style={{
                            color: "#fff",
                            fontSize: "clamp(2rem, 5vw, 3rem)",
                            fontWeight: 800,
                            letterSpacing: -0.8,
                            margin: "20px auto 16px",
                            lineHeight: 1.12,
                            maxWidth: 820,
                        }}
                    >
                        Printavo manages jobs. Pythias turns customer requests into{" "}
                        <span style={{ color: GOLD }}>production-ready orders.</span>
                    </h1>
                    <p
                        style={{
                            color: "#9ca3af",
                            fontSize: "1.15rem",
                            maxWidth: 720,
                            margin: "0 auto 34px",
                            lineHeight: 1.6,
                        }}
                    >
                        Printavo is a well-known shop-management tool for tracking jobs and invoices.
                        Pythias takes a different angle: it starts where the customer does — a visual
                        quote request — and carries that job through e-commerce checkout, a production
                        queue, shipping labels, fulfillment, and 18+ marketplace integrations, all in
                        one platform.
                    </p>
                    <CtaButton>Book a Free Workflow Audit →</CtaButton>
                </div>
            </section>

            {/* ── Comparison table ── */}
            <section
                style={{
                    background: "linear-gradient(180deg, #08081a 0%, #050510 100%)",
                    padding: "88px 20px",
                }}
            >
                <div style={{ maxWidth: 920, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                        <h2
                            style={{
                                color: "#fff",
                                fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
                                fontWeight: 800,
                                letterSpacing: -0.5,
                                margin: "0 0 10px",
                                lineHeight: 1.15,
                            }}
                        >
                            How the two approaches compare.
                        </h2>
                        <p style={{ color: "#9ca3af", fontSize: "1.05rem", maxWidth: 620, margin: "0 auto" }}>
                            Where Pythias leans into customer-facing intake, checkout, and fulfillment.
                        </p>
                    </div>

                    <div
                        style={{
                            background: CARD_BG,
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 16,
                            overflow: "hidden",
                        }}
                    >
                        {/* header row */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0,1fr) 110px 110px",
                                alignItems: "center",
                                padding: "16px 20px",
                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(255,255,255,0.02)",
                            }}
                        >
                            <span style={{ color: "#9ca3af", fontWeight: 600, fontSize: "0.8rem", letterSpacing: 0.4, textTransform: "uppercase" }}>
                                Capability
                            </span>
                            <span style={{ color: GOLD, fontWeight: 800, fontSize: "0.95rem", textAlign: "center" }}>Pythias</span>
                            <span style={{ color: "#9ca3af", fontWeight: 700, fontSize: "0.95rem", textAlign: "center" }}>Printavo</span>
                        </div>

                        {/* data rows */}
                        {ROWS.map((row, i) => (
                            <div
                                key={row.feature}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0,1fr) 110px 110px",
                                    alignItems: "center",
                                    padding: "16px 20px",
                                    borderBottom: i < ROWS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                }}
                            >
                                <span style={{ color: "#e5e7eb", fontSize: "0.95rem", lineHeight: 1.45, paddingRight: 12 }}>
                                    {row.feature}
                                </span>
                                <span style={{ textAlign: "center" }}><Mark kind={row.pythias} /></span>
                                <span style={{ textAlign: "center" }}><Mark kind={row.printavo} /></span>
                            </div>
                        ))}
                    </div>

                    <p style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.5, marginTop: 18, textAlign: "center", maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
                        This comparison reflects Pythias&apos;s positioning and product focus, not an
                        exhaustive audit of Printavo. &quot;Partial&quot; indicates the capability may
                        exist in a different form; a dash (—) means it isn&apos;t a focus of that
                        approach as we understand it. Product capabilities change — check each
                        vendor&apos;s current site for the latest details.
                    </p>
                </div>
            </section>

            {/* ── Closing CTA band ── */}
            <section
                style={{
                    background: "linear-gradient(180deg, #050510 0%, #08081a 100%)",
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
                        See the quote-to-fulfillment flow on your own jobs.
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: "1.08rem", margin: "0 auto 32px", maxWidth: 560, lineHeight: 1.6 }}>
                        Book a free workflow audit and we&apos;ll walk through exactly how Pythias would
                        handle your shop&apos;s intake, approval, production, and shipping.
                    </p>
                    <CtaButton>Book a Free Workflow Audit →</CtaButton>
                </div>
            </section>
        </div>
    );
}
