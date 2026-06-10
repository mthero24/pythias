"use client";
import { useState } from "react";
import Link from "next/link";
import s from "./pricing.module.css";

// ── Fulfillment Cloud data ────────────────────────────────────────────────
const FC_TIERS = [
    {
        name: "Starter", price: 199, popular: false,
        desc: "Perfect for growing shops ready to automate their first workflows.",
        href: "https://platform.pythiastechnologies.com/register?plan=starter",
        cta: "Get Started", ctaStyle: "outline",
        limits: [
            { label: "500 orders / mo" }, { label: "250 products" }, { label: "100 designs" },
            { label: "2 integrations" }, { label: "5 users included" }, { label: "$15 / extra user" },
        ],
    },
    {
        name: "Professional", price: 599, popular: true,
        desc: "For established shops scaling across multiple channels.",
        href: "https://platform.pythiastechnologies.com/register?plan=professional",
        cta: "Get Started", ctaStyle: "gold",
        limits: [
            { label: "3,000 orders / mo" }, { label: "1,500 products" }, { label: "500 designs" },
            { label: "5 integrations" }, { label: "10 users included" }, { label: "$12 / extra user" },
        ],
    },
    {
        name: "Business", price: 1499, popular: false,
        desc: "High-volume operations with complex multi-channel workflows.",
        href: "https://platform.pythiastechnologies.com/register?plan=business",
        cta: "Get Started", ctaStyle: "outline",
        limits: [
            { label: "15,000 orders / mo" }, { label: "10,000 products" }, { label: "2,000 designs" },
            { label: "All integrations", gold: true }, { label: "25 users included" }, { label: "$10 / extra user" },
        ],
    },
    {
        name: "Scale", price: 3000, popular: false,
        desc: "Unlimited everything for large, fast-growing fulfillment centers.",
        href: "https://platform.pythiastechnologies.com/register?plan=scale",
        cta: "Get Started", ctaStyle: "outline",
        limits: [
            { label: "Unlimited orders", gold: true }, { label: "Unlimited products", gold: true },
            { label: "Unlimited designs", gold: true }, { label: "All integrations", gold: true },
            { label: "50 users included" }, { label: "$8 / extra user" },
        ],
    },
    {
        name: "Enterprise", price: null, priceLabel: "Custom", popular: false,
        desc: "Dedicated database, your own branded app, and an on-site engineer.",
        href: "/contact", cta: "Contact Us", ctaStyle: "dark",
        limits: [
            { label: "Unlimited orders", gold: true }, { label: "Unlimited everything", gold: true },
            { label: "All integrations", gold: true }, { label: "Unlimited users", gold: true },
            { label: "Dedicated database", gold: true }, { label: "Own branded app", gold: true },
        ],
    },
];

const FC_OVERAGES = [
    { resource: "Extra Orders",      starter: "$0.25 / order",   pro: "$0.15 / order",   biz: "$0.08 / order" },
    { resource: "Extra Products",    starter: "$1.50 / product", pro: "$0.75 / product", biz: "$0.35 / product" },
    { resource: "Extra Designs",     starter: "$0.50 / design",  pro: "$0.25 / design",  biz: "$0.12 / design" },
    { resource: "Extra Integration", starter: "$75 / mo",        pro: "Upgrade required", biz: "Upgrade required" },
];

const FC_FAQS = [
    { q: "Can I change plans as my business grows?", a: "Yes — upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle." },
    { q: "What happens if I exceed my monthly limits?", a: "For Starter, Professional, and Business tiers, usage beyond your limits is billed at the overage rates shown above. You'll receive automated alerts at 75%, 90%, and 100% of each limit." },
    { q: "What integrations are included?", a: "Starter and Professional include up to 2 and 5 integrations respectively, chosen from our full library: Amazon, Etsy, Walmart, Shopify, TikTok, Faire, and more. Business, Scale, and Enterprise get all integrations." },
    { q: "Is there a setup fee?", a: "No setup fee for Starter through Scale. Enterprise plans include a setup fee starting at $15,000 for a dedicated engineer, data migration, and 30-day post-launch support." },
    { q: "How long does onboarding take?", a: "Most shops are fully live within 2 weeks. Remote onboarding ($3,000) covers 5 days of live sessions: data import, printer configuration, marketplace connections, and team training." },
];

// ── Commerce Cloud data ───────────────────────────────────────────────────
const CC_TIERS = [
    {
        name: "Free", price: 0, marginFee: "15%", popular: false,
        desc: "Try Commerce Cloud with no monthly cost — pay only when you make a sale.",
        href: "https://platform.pythiastechnologies.com/register?plan=free&type=commerce",
        cta: "Get Started Free", ctaStyle: "outline",
        features: [
            { label: "Unlimited orders" }, { label: "1 marketplace integration" },
            { label: "50 products" }, { label: "1 user" }, { label: "Standard routing" },
        ],
    },
    {
        name: "Launch", price: 79, marginFee: "8%", popular: false,
        desc: "Get your first channels live and test new product verticals with low commitment.",
        href: "https://platform.pythiastechnologies.com/register?plan=launch&type=commerce",
        cta: "Start Free Trial", ctaStyle: "outline",
        features: [
            { label: "Unlimited orders" }, { label: "3 marketplace integrations" },
            { label: "250 products" }, { label: "5 users" }, { label: "Standard routing" },
        ],
    },
    {
        name: "Growth", price: 299, marginFee: "5%", popular: true,
        desc: "For growing brands scaling across multiple channels.",
        href: "https://platform.pythiastechnologies.com/register?plan=growth&type=commerce",
        cta: "Start Free Trial", ctaStyle: "indigo",
        features: [
            { label: "Unlimited orders" }, { label: "All integrations", gold: true },
            { label: "1,500 products" }, { label: "15 users" }, { label: "Priority routing" },
        ],
    },
    {
        name: "Scale", price: 799, marginFee: "2%", popular: false,
        desc: "High-volume merchants where margin matters — 2% fee beats Growth above ~$53k/mo wholesale spend.",
        href: "https://platform.pythiastechnologies.com/register?plan=scale&type=commerce",
        cta: "Start Free Trial", ctaStyle: "outline",
        features: [
            { label: "Unlimited orders", gold: true }, { label: "All integrations", gold: true },
            { label: "Unlimited products", gold: true }, { label: "50 users" },
            { label: "Priority routing + dedicated score", gold: true },
        ],
    },
    {
        name: "Enterprise", price: null, priceLabel: "Custom", marginFee: "Negotiated", popular: false,
        desc: "High-volume operations, custom integrations, and dedicated account management.",
        href: "/contact", cta: "Contact Us", ctaStyle: "dark",
        features: [
            { label: "Unlimited everything", gold: true }, { label: "All integrations", gold: true },
            { label: "Unlimited users", gold: true }, { label: "Dedicated routing priority", gold: true },
            { label: "Custom net terms", gold: true },
        ],
    },
];

const CC_FAQS = [
    { q: "Do I need any equipment or a warehouse?", a: "No. Commerce Cloud is designed for sellers who want to sell without owning production. Fulfillment partners handle printing, packing, and shipping. You manage listings, designs, and customer experience." },
    { q: "How does the margin fee work?", a: "The fee is charged on your margin — your retail price minus the wholesale cost charged by the fulfillment partner. If you sell for $35 and wholesale is $18, your margin is $17. On Growth at 5%, the fee is $0.85. We never charge on a loss — if margin is zero or negative, the fee is zero." },
    { q: "How do fulfillment partners get selected?", a: "Every order is scored by geography (closest partner to the customer), price (lowest wholesale cost), and reliability (historical on-time rate). The highest-scoring available partner gets the job automatically." },
    { q: "Can I switch plans any time?", a: "Yes — upgrades take effect immediately. Downgrades apply at the start of your next billing cycle. The margin fee tier follows your current plan." },
    { q: "What marketplaces are supported?", a: "TikTok Shop, Shopify, Etsy, Amazon, Walmart Marketplace, eBay, Faire, and more. Free plan includes 1 integration; Launch includes 3; Growth and above get all integrations." },
];

// ── Card components ───────────────────────────────────────────────────────
function FCCard({ tier }) {
    const btnClass = tier.ctaStyle === "gold" ? s.btnGold
        : tier.ctaStyle === "dark"  ? s.btnDark
        : s.btnOutline;

    return (
        <div className={`${s.card} ${tier.popular ? s.cardPopular : ""}`}>
            {tier.popular && <span className={s.popularBadge}>Most Popular</span>}
            <p className={s.tierName}>{tier.name}</p>
            {tier.price !== null ? (
                <>
                    <p className={s.price}><span className={s.priceSup}>$</span>{tier.price.toLocaleString()}</p>
                    <span className={s.pricePer}>per month</span>
                </>
            ) : (
                <>
                    <p className={s.price}>{tier.priceLabel}</p>
                    <span className={s.pricePer}>&nbsp;</span>
                </>
            )}
            <p className={s.tierDesc}>{tier.desc}</p>
            <ul className={s.limits}>
                {tier.limits.map((l) => (
                    <li key={l.label} className={s.limit}>
                        <span className={l.gold ? s.checkGold : s.check}>✓</span>
                        {l.label}
                    </li>
                ))}
            </ul>
            <div className={s.cardFooter}>
                <a href={tier.href} className={btnClass}>{tier.cta}</a>
            </div>
        </div>
    );
}

function CCCard({ tier }) {
    const btnClass = tier.ctaStyle === "indigo" ? s.btnIndigo
        : tier.ctaStyle === "dark"   ? s.btnDark
        : s.btnOutline;

    return (
        <div className={`${s.card} ${tier.popular ? s.cardPopularCC : ""}`}>
            {tier.popular && <span className={s.popularBadgeCC}>Most Popular</span>}
            <p className={s.tierNameCC}>{tier.name}</p>
            {tier.price !== null ? (
                <>
                    <p className={s.price}><span className={s.priceSup}>$</span>{tier.price.toLocaleString()}</p>
                    <span className={s.pricePer}>per month</span>
                </>
            ) : (
                <>
                    <p className={s.price}>{tier.priceLabel}</p>
                    <span className={s.pricePer}>&nbsp;</span>
                </>
            )}
            <div className={s.marginBadge}>
                <span className={s.marginVal}>{tier.marginFee}</span>
                <span className={s.marginLabel}>margin fee</span>
            </div>
            <p className={s.tierDesc}>{tier.desc}</p>
            <ul className={s.limits}>
                {tier.features.map((f) => (
                    <li key={f.label} className={s.limit}>
                        <span className={f.gold ? s.checkGold : s.check}>✓</span>
                        {f.label}
                    </li>
                ))}
            </ul>
            <div className={s.cardFooter}>
                <a href={tier.href} className={btnClass}>{tier.cta}</a>
            </div>
        </div>
    );
}

// ── Content (client component — imported by server page.js) ──────────────
export default function PricingContent() {
    const [product, setProduct] = useState("fc");
    const isFC = product === "fc";

    return (
        <div className={s.bg}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={`${s.glow} ${s.glow1}`} />
                <div className={`${s.glow} ${s.glow2}`} />
                <div className={s.wrap}>
                    {/* Dual logo */}
                    <div className={s.heroLogos}>
                        <img
                            src="/fullfilment_cloud_transparant.png"
                            alt="Pythias Fulfillment Cloud"
                            className={`${s.heroLogo} ${isFC ? s.heroLogoActive : s.heroLogoDim}`}
                            onClick={() => setProduct("fc")}
                        />
                        <img
                            src="/commerce-cloud-logo.png"
                            alt="Pythias Commerce Cloud"
                            className={`${s.heroLogo} ${!isFC ? s.heroLogoActive : s.heroLogoDim}`}
                            onClick={() => setProduct("cc")}
                        />
                    </div>

                    <h1 className={s.h1}>
                        Simple, transparent pricing.<br />
                        <span className={s.accent}>No per-order fees.</span>
                    </h1>
                    <p className={s.heroSub}>
                        One flat monthly rate. Choose the product that fits your business model.
                    </p>

                    {/* Toggle */}
                    <div className={s.toggleWrap}>
                        <button
                            className={`${s.toggleBtn} ${isFC ? s.toggleBtnActiveFC : ""}`}
                            onClick={() => setProduct("fc")}
                        >
                            Fulfillment Cloud
                        </button>
                        <button
                            className={`${s.toggleBtn} ${!isFC ? s.toggleBtnActiveCC : ""}`}
                            onClick={() => setProduct("cc")}
                        >
                            Commerce Cloud
                        </button>
                    </div>

                    {/* Product explainer */}
                    {isFC ? (
                        <div className={s.explainerHero}>
                            <p className={s.explainerHeroTitle}>For print shops &amp; production operations</p>
                            <p className={s.explainerHeroDesc}>
                                You own the equipment — DTG printers, embroidery machines, DTF, sublimation.
                                Pythias runs the operating system: orders from every marketplace flow into one
                                production queue, labels print automatically, and tracking syncs back to every channel.
                            </p>
                            <ul className={s.explainerHeroBullets}>
                                <li><span className={s.explainerBulletDot} style={{ background: "#D3A73D" }} />18 marketplace integrations — Amazon, Etsy, TikTok, Shopify &amp; more</li>
                                <li><span className={s.explainerBulletDot} style={{ background: "#D3A73D" }} />DTG, DTF, embroidery, sublimation &amp; screen print production queues</li>
                                <li><span className={s.explainerBulletDot} style={{ background: "#D3A73D" }} />Automatic shipping labels (USPS, FedEx, UPS) on job completion</li>
                                <li><span className={s.explainerBulletDot} style={{ background: "#D3A73D" }} />Real-time inventory, analytics &amp; team management</li>
                            </ul>
                        </div>
                    ) : (
                        <div className={s.explainerHero}>
                            <p className={s.explainerHeroTitle}>For sellers &amp; brand owners</p>
                            <p className={s.explainerHeroDesc}>
                                No equipment, no warehouse, no production staff. Design products, set your retail
                                prices, and sell across every marketplace. When a customer buys, vetted fulfillment
                                partners print, pack, and ship the order directly to them. You keep the margin.
                            </p>
                            <ul className={s.explainerHeroBullets}>
                                <li><span className={s.explainerBulletDot} style={{ background: "#6366f1" }} />List on TikTok Shop, Shopify, Etsy, Amazon, Walmart &amp; more</li>
                                <li><span className={s.explainerBulletDot} style={{ background: "#6366f1" }} />Orders automatically route to the best fulfillment partner</li>
                                <li><span className={s.explainerBulletDot} style={{ background: "#6366f1" }} />Pre-funded wallet — charged only when orders are placed</li>
                                <li><span className={s.explainerBulletDot} style={{ background: "#6366f1" }} />Fee on your margin, not your revenue</li>
                            </ul>
                        </div>
                    )}
                </div>
            </section>

            {/* Pricing cards */}
            <section className={s.section}>
                <div className={s.wrap}>
                    {isFC ? (
                        <>
                            <div className={s.head}>
                                <p className={s.sectionTag}>Fulfillment Cloud</p>
                                <h2 className={s.h2}>For print shops &amp; production operations</h2>
                                <p className={s.sectionSub}>You own the equipment. Pythias runs the OS.</p>
                            </div>
                            <div className={s.pricingGrid}>
                                {FC_TIERS.map((t) => <FCCard key={t.name} tier={t} />)}
                            </div>
                            <p className={s.extraUsers} style={{ marginTop: 20 }}>
                                All plans include unlimited marketplace integrations up to tier limit · Extra users billed monthly · Cancel any time
                            </p>

                            {/* Overage table */}
                            <div className={s.sectionDark} style={{ borderRadius: 20, marginTop: 48, padding: "32px 36px" }}>
                                <p className={s.sectionTag} style={{ marginBottom: 6 }}>Overage Rates</p>
                                <p className={s.sectionSubLight} style={{ marginBottom: 24, textAlign: "left", maxWidth: "none" }}>
                                    Usage beyond your plan limits is billed at these rates. Scale and Enterprise have no overages.
                                </p>
                                <div className={s.tableWrap}>
                                    <table className={s.table}>
                                        <thead>
                                            <tr>
                                                <th>Resource</th>
                                                <th>Starter</th>
                                                <th>Professional</th>
                                                <th>Business</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {FC_OVERAGES.map((r) => (
                                                <tr key={r.resource}>
                                                    <td>{r.resource}</td>
                                                    <td>{r.starter}</td>
                                                    <td>{r.pro}</td>
                                                    <td>{r.biz}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={s.head}>
                                <p className={s.sectionTag} style={{ color: "#6366f1" }}>Commerce Cloud</p>
                                <h2 className={s.h2}>For sellers &amp; brand owners</h2>
                                <p className={s.sectionSub}>You own the brand. Partners handle production and shipping.</p>
                            </div>
                            <div className={s.pricingGrid}>
                                {CC_TIERS.map((t) => <CCCard key={t.name} tier={t} />)}
                            </div>

                            {/* Margin explainer */}
                            <div className={s.explainer}>
                                <div>
                                    <h3 className={s.explainerH3}>How the margin fee works</h3>
                                    <p className={s.explainerP}>
                                        The fee is charged on your <strong>margin</strong> — your retail selling price minus the wholesale cost charged by the fulfillment partner.
                                    </p>
                                    <p className={s.explainerP}>
                                        We never charge on a loss. If margin is zero or negative, the fee is zero.
                                    </p>
                                </div>
                                <div className={s.mathCard}>
                                    <p className={s.mathTitle}>Example — Growth plan (5%)</p>
                                    <div className={s.mathRow}><span className={s.mathLabel}>Retail price</span><span className={s.mathVal}>$35.00</span></div>
                                    <div className={s.mathRow}><span className={s.mathLabel}>Wholesale cost</span><span className={s.mathVal}>− $18.00</span></div>
                                    <div className={s.mathRow}><span className={s.mathLabel}>Your margin</span><span className={s.mathVal}>$17.00</span></div>
                                    <div className={s.mathRow}><span className={s.mathLabel}>Platform fee (5%)</span><span className={s.mathFee}>− $0.85</span></div>
                                    <div className={s.mathTotal}>
                                        <span className={s.mathTotalLabel}>You keep</span>
                                        <span className={s.mathTotalVal}>$16.15</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* FAQs */}
            <section className={s.section} style={{ background: "#fff", paddingTop: 0 }}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <h2 className={s.h2}>Frequently asked questions</h2>
                    </div>
                    <div className={s.faqList}>
                        {(isFC ? FC_FAQS : CC_FAQS).map((f) => (
                            <div key={f.q} className={s.faqItem}>
                                <p className={s.faqQ}>{f.q}</p>
                                <p className={s.faqA}>{f.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta} style={{ background: "linear-gradient(155deg, #0a0f1e, #0f172a, #0c1628)" }}>
                <div className={s.wrap}>
                    <h2 className={s.ctaTitle} style={{ color: "#fff" }}>Ready to get started?</h2>
                    <p className={s.ctaSub} style={{ color: "rgba(255,255,255,0.55)" }}>
                        Book a free 30-minute demo and we&apos;ll walk through your exact workflow — not a generic slide deck.
                    </p>
                    <div className={s.btns}>
                        <Link href="/#calendar-booking-section" className={s.ctaBtnGold}>Book a Free Demo</Link>
                        <Link href={isFC ? "/fulfillment-cloud" : "/commerce-cloud"} className={s.ctaBtnGray} style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
                            {isFC ? "Learn about Fulfillment Cloud →" : "Learn about Commerce Cloud →"}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
