import StorefrontSubscribe from "@/components/StorefrontSubscribe";
import { STOREFRONT_PLANS, PLAN_ORDER } from "@/lib/storefrontPlans";

export const dynamic = "force-dynamic";

// "Learn about Storefront" — shown in the menu (in place of the storefront tools) until the
// org subscribes. Explainer of everything the storefront includes + plan selection to turn it on.

const GROUPS = [
    {
        title: "Your store, built in minutes",
        blurb: "A real online store on your own domain — no Shopify, no Wix, no monthly app stack.",
        features: [
            ["Drag-and-drop site builder", "Pre-built themes, full control of pages, nav, and footer — publish to a free pythias.store subdomain or your own custom domain."],
            ["AI store designer", "Describe the change in plain English (\"make the hero bolder, add a sale banner\") and the AI edits your site for you."],
            ["Collections & smart search", "Group products into collections and give shoppers fast, typo-tolerant search."],
            ["SEO landing pages", "Spin up keyword-targeted pages with built-in schema so you rank — not just product pages."],
        ],
    },
    {
        title: "Sell more, automatically",
        blurb: "Conversion and retention tools that Shopify charges extra apps for — built in.",
        features: [
            ["Discounts & gift cards", "Automatic and code discounts, free-shipping thresholds, and store gift cards."],
            ["Email & SMS marketing", "Order confirmations, shipping updates, abandoned-cart and abandoned-session win-backs, and AI-written campaigns — sent on a reputation-safe schedule."],
            ["Signup popups", "Capture email/phone from logged-out visitors with an opt-in discount you control."],
            ["Automations & segmentation", "Trigger flows (welcome, win-back, first-purchase) to the right customers at the right time."],
            ["Subscribe & save", "Turn one-time buyers into recurring revenue with subscriptions."],
            ["A/B testing", "Test popups and variants and auto-promote the winner."],
            ["Product reviews", "Verified-buyer reviews with AI pros/cons summaries and rich-result ratings."],
        ],
    },
    {
        title: "Know your numbers",
        blurb: "Analytics that go past vanity metrics — all the way to profit.",
        features: [
            ["Site analytics", "Live visitors, traffic sources, conversion funnel, top/landing/exit pages, and page-speed (Core Web Vitals) per page."],
            ["True profit analytics", "Real P&L per order: net sales minus wholesale, fees, and refunds — margin and profit-per-order, not just revenue."],
            ["AI demand forecasting", "Projects each product's sales so you can plan marketing and capacity — and, for made-to-order, rolls demand up to the exact blanks your fulfiller needs to stock."],
        ],
    },
    {
        title: "Buyers love it too",
        blurb: "A modern buyer experience that keeps customers coming back.",
        features: [
            ["Buyer accounts & rewards", "Order history with live tracking, loyalty rewards redeemable at checkout, and a cart that syncs across devices with save-for-later."],
            ["Favorites & wishlists", "Shoppers save products and add to cart straight from their favorites."],
            ["AI buyer concierge", "An on-site assistant that answers \"where's my order?\", returns, and product questions — grounded in the customer's real data."],
            ["Returns & RMA", "Self-service returns with seller-set windows and policies."],
            ["International", "Multi-language store UI and multi-currency display."],
        ],
    },
    {
        title: "Run on autopilot — only here",
        blurb: "Things Shopify and Wix simply don't do.",
        features: [
            ["AI Store Autopilot", "Watches your analytics and profit, then proposes high-impact moves — and applies the safe ones automatically. Closed-loop, not just suggestions."],
            ["Auto-restock", "For sellers who hold stock, autopilot opens reorders and emails your supplier before you sell out."],
            ["Built-in fulfillment", "Orders flow straight into the Pythias production & fulfillment network — no third-party connector."],
            ["Merchant of record & payouts", "We handle checkout, tax, and Stripe Connect payouts to you — net of wholesale and fees, fully automated."],
            ["Channel syndication", "One product feed that works across Google, Microsoft, Meta, Pinterest, and TikTok."],
        ],
    },
];

const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 22 };

export default function StorefrontWelcomePage() {
    return (
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 20px 60px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
                <span style={{ display: "inline-block", background: "#eef2ff", color: "#4338ca", fontWeight: 700, fontSize: "0.74rem", letterSpacing: ".06em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 999 }}>Add-on</span>
                <h1 style={{ fontSize: "2.1rem", margin: "14px 0 8px" }}>Pythias Storefront</h1>
                <p style={{ color: "#475569", fontSize: "1.05rem", maxWidth: 660, margin: "0 auto" }}>
                    Your own branded online store — with marketing, analytics, fulfillment, and AI built in.
                    Everything Shopify and Wix charge a stack of apps for, in one place, wired straight into your Pythias catalog and production.
                </p>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
                {GROUPS.map((g) => (
                    <div key={g.title} style={card}>
                        <h2 style={{ margin: "0 0 2px", fontSize: "1.25rem" }}>{g.title}</h2>
                        <p style={{ color: "#64748b", margin: "0 0 16px" }}>{g.blurb}</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
                            {g.features.map(([name, desc]) => (
                                <div key={name} style={{ display: "flex", gap: 10 }}>
                                    <span style={{ color: "#6366f1", fontWeight: 800, lineHeight: 1.4 }}>✓</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "0.94rem" }}>{name}</div>
                                        <div style={{ color: "#64748b", fontSize: "0.86rem", lineHeight: 1.45 }}>{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 26 }}>
                <StorefrontSubscribe plans={PLAN_ORDER.map((k) => {
                    const { key, name, monthlyCents, blurb, features, popular } = STOREFRONT_PLANS[k];
                    return { key, name, monthlyCents, blurb, features, popular: !!popular };
                })} />
            </div>
        </div>
    );
}
