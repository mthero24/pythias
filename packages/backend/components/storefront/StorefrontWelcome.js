"use client";
import { useState } from "react";

// Shared "Learn about Storefront" explainer + pricing, used by every app that surfaces the storefront
// add-on (platform, premier, and any future enterprise app). Apps just render <StorefrontWelcome />.
// Pass `subscribable` to show plan buttons that start Stripe checkout (POST /api/storefront/subscribe);
// omit it for a read-only marketing view. Override `plans` only if an app needs custom pricing.

const GROUPS = [
    {
        title: "Your store, built in minutes",
        blurb: "A real online store on your own domain — no Shopify, no Wix, no monthly app stack.",
        features: [
            ["Drag-and-drop site builder", "Pre-built themes, full control of pages, nav, and footer — publish to a free pythias.store subdomain or your own custom domain."],
            ["AI store designer", "Describe the change in plain English (\"make the hero bolder, add a sale banner\") and the AI edits your site for you."],
            ["Collections & smart search", "Group products into collections and give shoppers fast, typo-tolerant search."],
            ["Create your own", "Buyers design custom apparel — upload art, add text, or generate with AI — straight into the production pipeline."],
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
            ["Built-in fulfillment", "Orders flow straight into the Pythias production & fulfillment network — no third-party connector."],
            ["Merchant of record & payouts", "We handle checkout, tax, and Stripe Connect payouts to you — net of wholesale and fees, fully automated."],
            ["Channel syndication", "Sync your catalog to Google, Microsoft/Bing, Meta, Pinterest, TikTok, Snapchat, X, and Reddit — one universal product feed plus native API push and OAuth per channel, with ad-spend ROI pulled back in."],
        ],
    },
];

// Display pricing (kept in sync with platform lib/storefrontPlans, which is the billing source).
const DEFAULT_PLANS = [
    { key: "starter", name: "Starter", monthlyCents: 4900, includedStores: 1, extraStoreCents: 2500, blurb: "Everything to launch a real store.",
        features: ["1 storefront included", "Custom domain + themes", "Unlimited products & collections", "Discounts, gift cards & reviews", "Email & SMS marketing", "Site + profit analytics"] },
    { key: "pro", name: "Pro", monthlyCents: 14900, includedStores: 3, extraStoreCents: 7500, popular: true, blurb: "Scale with AI and automation.",
        features: ["3 storefronts included", "Everything in Starter", "AI Store Autopilot + concierge", "Demand forecasting + auto-restock", "Automations, segments & A/B testing", "International (multi-language/currency)"] },
    { key: "enterprise", name: "Enterprise", monthlyCents: 39900, includedStores: 5, extraStoreCents: 20000, blurb: "The full network advantage.",
        features: ["5 storefronts included", "Everything in Pro", "Merchant of Record (tax + chargebacks)", "Network fraud & deliverability shield", "Multi-vertical cart + earn as fulfiller", "Priority support & onboarding"] },
];

const money = (c) => `$${(c / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 22 };

// subscribable → in-app Stripe checkout (platform). signupUrl → buttons link to that signup URL
// with ?plan=<key> (used by apps that don't bill storefronts themselves, e.g. the fulfiller app).
export default function StorefrontWelcome({ plans = DEFAULT_PLANS, subscribable = false, signupUrl = "" }) {
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");

    const subscribe = async (key) => {
        setBusy(key); setError("");
        try {
            const d = await (await fetch("/api/storefront/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: key }) })).json();
            if (d.url) { window.location.href = d.url; return; }
            throw new Error(d.error || "Couldn't start checkout");
        } catch (e) { setError(e.message); setBusy(""); }
    };

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

            {/* Pricing */}
            <h2 style={{ textAlign: "center", fontSize: "1.6rem", margin: "44px 0 4px" }}>{(subscribable || signupUrl) ? "Launch your storefront" : "Pricing"}</h2>
            <p style={{ textAlign: "center", color: "#64748b", margin: "0 0 22px" }}>
                {subscribable ? "Pick a plan to turn it on instantly. Cancel anytime." : signupUrl ? "Pick a plan to get started." : "Monthly, per organization. Add extra stores at any tier for a per-store add-on."}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18 }}>
                {plans.map((p) => (
                    <div key={p.key || p.name} style={{ ...card, position: "relative", border: p.popular ? "2px solid #6366f1" : card.border, display: "flex", flexDirection: "column" }}>
                        {p.popular && <span style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: "0.7rem", padding: "3px 12px", borderRadius: 999 }}>MOST POPULAR</span>}
                        <h3 style={{ margin: "4px 0 2px", fontSize: "1.2rem" }}>{p.name}</h3>
                        <div style={{ margin: "6px 0" }}><span style={{ fontSize: "2rem", fontWeight: 800 }}>{money(p.monthlyCents)}</span><span style={{ color: "#94a3b8" }}>/mo</span></div>
                        <p style={{ color: "#64748b", margin: "0 0 10px", fontSize: "0.9rem" }}>{p.blurb}</p>
                        {(p.includedStores != null) && <div style={{ fontSize: "0.8rem", color: "#475569", marginBottom: 12 }}>{p.includedStores} store{p.includedStores > 1 ? "s" : ""} included · {money(p.extraStoreCents)}/mo per extra store</div>}
                        <div style={{ display: "grid", gap: 8, flex: 1, marginBottom: 16 }}>
                            {p.features.map((f) => <div key={f} style={{ display: "flex", gap: 9, fontSize: "0.86rem" }}><span style={{ color: "#6366f1", fontWeight: 800 }}>✓</span><span>{f}</span></div>)}
                        </div>
                        {subscribable ? <button onClick={() => subscribe(p.key)} disabled={!!busy}
                            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: p.popular ? "#6366f1" : "#111827", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: busy && busy !== p.key ? 0.5 : 1 }}>
                            {busy === p.key ? "Starting…" : `Choose ${p.name}`}
                        </button> : signupUrl ? <a href={`${signupUrl}${signupUrl.includes("?") ? "&" : "?"}plan=${p.key}`}
                            style={{ width: "100%", padding: "11px 0", borderRadius: 10, background: p.popular ? "#6366f1" : "#111827", color: "#fff", fontWeight: 700, textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box" }}>
                            Get Started
                        </a> : null}
                    </div>
                ))}
            </div>
            {subscribable
                ? <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.76rem", marginTop: 14 }}>Secure checkout by Stripe. Your storefront tools unlock the moment payment succeeds.{error && <><br /><span style={{ color: "#dc2626" }}>{error}</span></>}</p>
                : signupUrl
                ? <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", marginTop: 14 }}>You&apos;ll finish signup and billing on the Pythias platform.</p>
                : <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", marginTop: 14 }}>Storefront is managed and billed from the Pythias platform (seller) app.</p>}
        </div>
    );
}
