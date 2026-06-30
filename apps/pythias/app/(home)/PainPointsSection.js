const PAINS = [
    {
        pain: "I'm tired of quotes being wrong.",
        title: "Quote it right, once.",
        fix: "Build a quote with pricing, setup fees, and discounts built in. The customer approves and pays online, and it drops straight into production — no re-dos.",
    },
    {
        pain: "I'm tired of customers sending bad artwork.",
        title: "Customers design it themselves.",
        fix: "They upload and position their own art in your studio. What they submit is print-ready and already approved — no blurry logos, no back-and-forth.",
    },
    {
        pain: "I'm tired of chasing sizes and colors.",
        title: "Every detail, captured up front.",
        fix: "Colors, sizes, and quantities come in complete with every order. Nothing to chase, nothing to guess.",
    },
    {
        pain: "I'm tired of managing orders through emails and spreadsheets.",
        title: "All your orders in one place.",
        fix: "Every order from Shopify, Etsy, Amazon, TikTok Shop and 18+ channels lands in one organized queue. No more inbox archaeology.",
    },
    {
        pain: "I'm tired of manually creating labels.",
        title: "Labels print themselves.",
        fix: "Scan a finished job — the shipping label prints and the order closes on the marketplace automatically.",
    },
    {
        pain: "I'm losing money because jobs are disorganized.",
        title: "A floor that runs itself.",
        fix: "Jobs auto-sort by due date and print method, tracked by barcode, so nothing's late and nothing gets reprinted.",
    },
];

export default function PainPointsSection() {
    return (
        <section style={{ background: "linear-gradient(180deg, #050510 0%, #08081a 100%)", padding: "88px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <span style={{ display: "inline-block", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontWeight: 600, fontSize: "0.8rem", padding: "5px 14px", borderRadius: 999, letterSpacing: 0.3 }}>
                        Sound familiar?
                    </span>
                    <h2 style={{ color: "#fff", fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: -0.5, margin: "18px 0 10px", lineHeight: 1.15 }}>
                        Running your shop on email and chaos?
                    </h2>
                    <p style={{ color: "#9ca3af", fontSize: "1.05rem", maxWidth: 640, margin: "0 auto" }}>
                        If any of this sounds like your shop, Pythias was built for you.
                    </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
                    {PAINS.map((p) => (
                        <div key={p.pain} style={{ background: "linear-gradient(145deg, #0d0d1f 0%, #08081a 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                            <p style={{ color: "#e5e7eb", fontSize: "1.05rem", fontStyle: "italic", margin: "0 0 16px", lineHeight: 1.4 }}>
                                <span style={{ color: "#f87171", fontWeight: 700, marginRight: 4 }}>“</span>{p.pain}<span style={{ color: "#f87171", fontWeight: 700, marginLeft: 2 }}>”</span>
                            </p>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 16px" }} />
                            <h3 style={{ color: "#D3A73D", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px" }}>{p.title}</h3>
                            <p style={{ color: "#9ca3af", fontSize: "0.95rem", margin: 0, lineHeight: 1.55 }}>{p.fix}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
