const STEPS = [
    { icon: "🧾", label: "Quote",   note: "Customer builds a visual request — art, blanks, sizes, colors" },
    { icon: "✅", label: "Approve", note: "You price it; they approve the final quote" },
    { icon: "💳", label: "Pay",     note: "They pay online — no chasing invoices" },
    { icon: "🖨️", label: "Produce", note: "The job drops straight into your production queue" },
    { icon: "📦", label: "Fulfill", note: "Scan, label, and ship — tracking syncs back" },
];

export default function QuoteToProductionSection() {
    return (
        <section style={{ background: "linear-gradient(180deg, #08081a 0%, #050510 100%)", padding: "92px 20px" }}>
            <div style={{ maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
                <span style={{ display: "inline-block", background: "rgba(211,167,61,0.12)", border: "1px solid rgba(211,167,61,0.3)", color: "#D3A73D", fontWeight: 600, fontSize: "0.8rem", padding: "5px 14px", borderRadius: 999, letterSpacing: 0.3 }}>
                    Quote-to-Production
                </span>
                <h2 style={{ color: "#fff", fontSize: "clamp(1.9rem, 4.5vw, 3rem)", fontWeight: 800, letterSpacing: -0.8, margin: "18px auto 14px", lineHeight: 1.1, maxWidth: 800 }}>
                    Custom print orders without the back-and-forth.
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "1.12rem", maxWidth: 720, margin: "0 auto 14px", lineHeight: 1.55 }}>
                    Pythias helps print shops collect better quote requests, approve artwork, finalize pricing,
                    take payment, and send jobs straight into production.
                </p>
                <p style={{ color: "#D3A73D", fontSize: "1.15rem", fontWeight: 700, letterSpacing: 0.5, margin: "0 0 44px" }}>
                    Quote. Approve. Pay. Produce. Fulfill.
                </p>

                {/* Flow */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "stretch", gap: 10, marginBottom: 48 }}>
                    {STEPS.map((st, i) => (
                        <div key={st.label} style={{ display: "flex", alignItems: "stretch" }}>
                            <div style={{ width: 190, background: "linear-gradient(145deg, #0d0d1f 0%, #08081a 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
                                <div style={{ fontSize: 30, marginBottom: 8 }}>{st.icon}</div>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", marginBottom: 6 }}>{st.label}</div>
                                <div style={{ color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.45 }}>{st.note}</div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ display: "flex", alignItems: "center", color: "#D3A73D", fontSize: 22, padding: "0 2px" }}>→</div>
                            )}
                        </div>
                    ))}
                </div>

                <a href="#calendar-booking-section" style={{ display: "inline-block", background: "linear-gradient(135deg, #D3A73D 0%, #b8860b 100%)", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: "1.05rem", padding: "15px 34px", borderRadius: 12 }}>
                    Book a Free Workflow Audit →
                </a>
                <p style={{ color: "#6b7280", fontSize: "0.85rem", marginTop: 14 }}>
                    See exactly where your shop is losing time between quoting, approval, production, and shipping.
                </p>
            </div>
        </section>
    );
}
