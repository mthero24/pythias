import Link from "next/link";
import s from "./pricing.module.css";

export const metadata = {
    title: "Pythias Fulfillment Cloud Pricing — Plans from $199/mo",
    description: "Simple, transparent pricing for Pythias Fulfillment Cloud — the production OS for print-on-demand operations. From Starter at $199/mo to Enterprise with a dedicated instance.",
    alternates: { canonical: "https://pythiastechnologies.com/pricing" },
};

const TIERS = [
    {
        name: "Starter",
        price: 199,
        desc: "Perfect for growing shops ready to automate their first workflows.",
        limits: [
            { label: "500 orders / mo" },
            { label: "250 products" },
            { label: "100 designs" },
            { label: "2 integrations" },
            { label: "5 users included" },
            { label: "$15 / extra user" },
        ],
        cta: "Get Started",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register",
    },
    {
        name: "Professional",
        price: 599,
        popular: true,
        desc: "For established shops scaling across multiple channels.",
        limits: [
            { label: "3,000 orders / mo" },
            { label: "1,500 products" },
            { label: "500 designs" },
            { label: "5 integrations" },
            { label: "10 users included" },
            { label: "$12 / extra user" },
        ],
        cta: "Get Started",
        ctaStyle: "gold",
        href: "https://platform.pythiastechnologies.com/register",
    },
    {
        name: "Business",
        price: 1499,
        desc: "High-volume operations with complex multi-channel workflows.",
        limits: [
            { label: "15,000 orders / mo" },
            { label: "10,000 products" },
            { label: "2,000 designs" },
            { label: "All integrations", gold: true },
            { label: "25 users included" },
            { label: "$10 / extra user" },
        ],
        cta: "Get Started",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register",
    },
    {
        name: "Scale",
        price: 3000,
        desc: "Unlimited everything for large, fast-growing fulfillment centers.",
        limits: [
            { label: "Unlimited orders", gold: true },
            { label: "Unlimited products", gold: true },
            { label: "Unlimited designs", gold: true },
            { label: "All integrations", gold: true },
            { label: "50 users included" },
            { label: "$8 / extra user" },
        ],
        cta: "Get Started",
        ctaStyle: "outline",
        href: "https://platform.pythiastechnologies.com/register",
    },
    {
        name: "Enterprise",
        price: null,
        priceLabel: "Custom",
        desc: "Dedicated database, your own branded app, and an on-site engineer.",
        limits: [
            { label: "Unlimited orders", gold: true },
            { label: "Unlimited everything", gold: true },
            { label: "All integrations", gold: true },
            { label: "Unlimited users", gold: true },
            { label: "Dedicated database", gold: true },
            { label: "Own branded app", gold: true },
        ],
        cta: "Contact Us",
        ctaStyle: "dark",
        href: "/contact",
    },
];

const OVERAGES = [
    { resource: "Extra Orders",   starter: "$0.25 / order",   pro: "$0.15 / order",   biz: "$0.08 / order" },
    { resource: "Extra Products", starter: "$1.50 / product",  pro: "$0.75 / product", biz: "$0.35 / product" },
    { resource: "Extra Designs",  starter: "$0.50 / design",   pro: "$0.25 / design",  biz: "$0.12 / design" },
    { resource: "Extra Integration", starter: "$75 / mo",     pro: "Upgrade required", biz: "Upgrade required" },
];

const FAQS = [
    {
        q: "Can I change plans as my business grows?",
        a: "Yes — you can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle.",
    },
    {
        q: "What happens if I exceed my monthly limits?",
        a: "For Starter, Professional, and Business tiers, usage beyond your limits is billed at the overage rates shown below. You'll receive automated alerts at 75%, 90%, and 100% of each limit so you're never surprised.",
    },
    {
        q: "What integrations are included?",
        a: "Starter and Professional include up to 2 and 5 Pythias Connect integrations respectively, chosen from our full library: Amazon, Etsy, Walmart, Shopify, TikTok, ChannelEngine, Faire, ShipStation, and more. Business, Scale, and Enterprise get all integrations.",
    },
    {
        q: "Is there a setup fee?",
        a: "No setup fee for Starter through Scale — you're up and running after onboarding. Enterprise plans include a setup fee starting at $15,000 for a dedicated engineer, data migration, and 30-day post-launch support.",
    },
    {
        q: "What's included in remote onboarding?",
        a: "Remote onboarding ($2,000) is one week of live remote sessions, 4 hours per day, covering data import, printer configuration, marketplace connections, and team training. Available for any tier.",
    },
    {
        q: "Do extra user seats require a plan upgrade?",
        a: "No — you can add seats à la carte on any plan. Rates are $15/user on Starter, $12 on Professional, $10 on Business, and $8 on Scale. Enterprise users are unlimited and included.",
    },
];

const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pythias Fulfillment Cloud Pricing",
    url: "https://pythiastechnologies.com/pricing",
    description: "Transparent pricing tiers for Pythias Fulfillment Cloud — the production OS for print-on-demand operations. From $199/mo Starter to Enterprise.",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",    item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Pythias Fulfillment Cloud Pricing", item: "https://pythiastechnologies.com/pricing" },
    ],
};

export default function PricingPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className={s.hero}>
                <div className={`${s.glow} ${s.glow1}`} />
                <div className={`${s.glow} ${s.glow2}`} />
                <div className={s.wrap}>
                    <img src="/fullfilment_cloud_transparant.png" alt="Pythias Fulfillment Cloud" className={s.heroLogo} />
                    <h1 className={s.h1}>
                        Simple pricing that{" "}
                        <span className={s.accent}>scales with you.</span>
                    </h1>
                    <p className={s.heroSub}>
                        No hidden fees. No per-transaction costs. One flat monthly rate for your entire Pythias Fulfillment Cloud instance — upgrade when your volume needs it.
                    </p>
                </div>
            </section>

            {/* Pricing cards */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <ul className={s.pricingGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {TIERS.map((tier) => (
                            <li
                                key={tier.name}
                                className={`${s.card} ${tier.popular ? s.cardPopular : ""}`}
                                itemScope
                                itemType="https://schema.org/Offer"
                            >
                                {tier.popular && <span className={s.popularBadge}>Most Popular</span>}
                                <meta itemProp="name" content={`Pythias Fulfillment Cloud — ${tier.name}`} />
                                {tier.price && <meta itemProp="price" content={tier.price} />}
                                <meta itemProp="priceCurrency" content="USD" />

                                <p className={s.tierName}>{tier.name}</p>
                                <div className={s.price}>
                                    {tier.priceLabel ? (
                                        <span>{tier.priceLabel}</span>
                                    ) : (
                                        <>
                                            <span className={s.priceSup}>$</span>
                                            {tier.price?.toLocaleString()}
                                        </>
                                    )}
                                </div>
                                <span className={s.pricePer}>{tier.price ? "/ month" : "contact us"}</span>
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
                                    <Link
                                        href={tier.href}
                                        className={
                                            tier.ctaStyle === "gold" ? s.btnGold :
                                            tier.ctaStyle === "dark" ? s.btnDark :
                                            s.btnOutline
                                        }
                                    >
                                        {tier.cta}
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <p className={s.extraUsers}>
                        All plans billed monthly. Annual billing available — <Link href="/contact" style={{ color: "#D3A73D", textDecoration: "none" }}>contact us</Link> for a quote.
                    </p>
                </div>
            </section>

            {/* Overage rates */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Overages</p>
                        <h2 className={s.h2Light}>Pay only for what you use beyond your plan.</h2>
                        <p className={s.sectionSubLight}>Scale and Enterprise tiers have no limits and no overage charges.</p>
                    </div>
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
                                {OVERAGES.map((row) => (
                                    <tr key={row.resource}>
                                        <td>{row.resource}</td>
                                        <td>{row.starter}</td>
                                        <td>{row.pro}</td>
                                        <td>{row.biz}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={s.note}>Automated alerts at 75%, 90%, and 100% of your monthly limits keep you in control.</p>
                </div>
            </section>

            {/* Onboarding */}
            <section className={s.section}>
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Onboarding</p>
                        <h2 className={s.h2}>We get you up and running fast.</h2>
                        <p className={s.sectionSub}>Every plan includes self-service onboarding. Prefer a hands-on experience? We have you covered.</p>
                    </div>
                    <ul className={s.onboardGrid} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li className={s.onboardCard}>
                            <span className={s.onboardIcon}>💻</span>
                            <h3 className={s.onboardTitle}>Remote Onboarding</h3>
                            <p className={s.onboardPrice}>$2,000</p>
                            <p className={s.onboardDesc}>
                                One week of live remote sessions — 4 hours per day — covering everything from data import to printer configuration and marketplace connections.
                            </p>
                            <ul className={s.onboardBullets}>
                                {["Live Zoom sessions, 4 hrs/day for 5 days", "Data import & migration assistance", "Printer & hardware configuration", "Marketplace connection setup", "Team training & walkthrough"].map(b => (
                                    <li key={b} className={s.onboardBullet}>
                                        <span className={s.checkGold}>✓</span> {b}
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li className={s.onboardCard}>
                            <span className={s.onboardIcon}>🏭</span>
                            <h3 className={s.onboardTitle}>On-Site Onboarding</h3>
                            <p className={s.onboardPrice}>From $15,000</p>
                            <p className={s.onboardDesc}>
                                A dedicated Pythias engineer comes to your facility. Includes flights, hotel, car rental, full data migration, and 30-day post-launch support. Enterprise tier.
                            </p>
                            <ul className={s.onboardBullets}>
                                {["Dedicated engineer at your warehouse", "Full travel & accommodation covered", "Complete data migration", "On-site hardware & printer setup", "30-day post-launch dedicated support"].map(b => (
                                    <li key={b} className={s.onboardBullet}>
                                        <span className={s.checkGold}>✓</span> {b}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    </ul>
                </div>
            </section>

            {/* FAQ */}
            <section className={s.section} style={{ paddingTop: 0 }}>
                <div className={s.wrapMd}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>FAQ</p>
                        <h2 className={s.h2}>Common pricing questions.</h2>
                    </div>
                    <ul className={s.faqList} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {FAQS.map((faq) => (
                            <li key={faq.q} className={s.faqItem} itemScope itemType="https://schema.org/Question">
                                <div className={s.faqQ} itemProp="name">
                                    {faq.q}
                                </div>
                                <div className={s.faqA} itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                                    <p itemProp="text" style={{ margin: 0 }}>{faq.a}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrapSm}>
                    <h2 className={s.ctaTitle}>Not sure which plan is right?</h2>
                    <p className={s.ctaSub}>
                        Book a free 30-minute demo and we&apos;ll walk through your volume, channels, and workflow to recommend the best fit — no commitment required.
                    </p>
                    <div className={s.btns}>
                        <Link href="/#calendar-booking-section" className={s.ctaBtnGold}>Book a Free Demo</Link>
                        <Link href="/contact" className={s.ctaBtnGray}>Talk to Sales</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
