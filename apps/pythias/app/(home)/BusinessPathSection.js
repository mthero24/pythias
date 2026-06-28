import Link from "next/link";

// "Which business are you?" fork — placed right under the hero to cut the decision fatigue of
// five products. Two primary paths (own equipment -> Fulfillment, sell-without -> Commerce);
// Storefront Cloud is offered secondarily so it doesn't compete with the main two.
const PATHS = [
    {
        emoji: "🏭",
        title: "I own production equipment",
        desc: "Run your print shop or fulfillment floor — production queues, inventory, shipping labels, and orders from every marketplace, all in one place.",
        cta: "Explore Fulfillment Cloud",
        href: "/fulfillment-cloud",
        bg: "#D3A73D",
        text: "#111",
    },
    {
        emoji: "🛒",
        title: "I sell, but don't own equipment",
        desc: "List products, publish to marketplaces, and route orders to vetted fulfillment partners who print, pack, and ship for you.",
        cta: "Explore Commerce Cloud",
        href: "/commerce-cloud",
        bg: "#6366f1",
        text: "#fff",
    },
];

export default function BusinessPathSection() {
    return (
        <section style={{ background: "#fff", padding: "64px 24px" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
                <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)", fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
                    What kind of business are you?
                </h2>
                <p style={{ color: "#4b5563", fontSize: "1.05rem", margin: "0 auto 36px", maxWidth: 560 }}>
                    Pick your path and we&apos;ll take you straight to the right product.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, textAlign: "left" }}>
                    {PATHS.map((p) => (
                        <div key={p.title} style={{ background: "#f8faff", border: "1px solid #e6e9f2", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: "2rem", marginBottom: 10 }}>{p.emoji}</div>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>{p.title}</h3>
                            <p style={{ color: "#4b5563", lineHeight: 1.6, margin: "0 0 20px", flex: 1 }}>{p.desc}</p>
                            <Link href={p.href} style={{ display: "inline-block", background: p.bg, color: p.text, fontWeight: 700, textDecoration: "none", padding: "12px 22px", borderRadius: 10, textAlign: "center" }}>
                                {p.cta} →
                            </Link>
                        </div>
                    ))}
                </div>

                <p style={{ color: "#6b7280", fontSize: "0.92rem", marginTop: 26 }}>
                    Want an AI-built online store that flows straight into fulfillment?{" "}
                    <Link href="/storefront-cloud" style={{ color: "#0e9f6e", fontWeight: 600, textDecoration: "none" }}>Meet Storefront Cloud →</Link>
                </p>
            </div>
        </section>
    );
}
