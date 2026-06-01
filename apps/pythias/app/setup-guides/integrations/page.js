import Link from "next/link";
import s from "./docs.module.css";
import { INTEGRATIONS, CATEGORIES_ORDER } from "./data";

export const metadata = {
    title: "Integration Setup Guides — Pythias Technologies",
    description: "Step-by-step setup guides for every marketplace and platform integration in Pythias: Amazon, Walmart, Shopify, Etsy, TikTok Shop, eBay, WooCommerce, and more.",
    alternates: { canonical: "https://pythiastechnologies.com/setup-guides/integrations" },
    openGraph: {
        title: "Integration Setup Guides | Pythias Technologies",
        description: "Detailed setup instructions for every Pythias marketplace integration.",
        type: "website",
        url: "https://pythiastechnologies.com/setup-guides/integrations",
    },
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Setup Guides", item: "https://pythiastechnologies.com/setup-guides/integrations" },
        { "@type": "ListItem", position: 3, name: "Integrations", item: "https://pythiastechnologies.com/setup-guides/integrations" },
    ],
};

const grouped = CATEGORIES_ORDER.reduce((acc, cat) => {
    const items = INTEGRATIONS.filter(i => i.category === cat);
    if (items.length) acc.push({ label: cat, items });
    return acc;
}, []);

const CAT_DESCS = {
    "Major Marketplaces": "The highest-volume US and global shopping destinations.",
    "Your Own Store": "Connect your D2C storefront directly to your production queue.",
    "Boutique & Handmade": "Curated marketplaces for independent and handmade sellers.",
    "Social Commerce": "Sell on social platforms where your customers are already browsing.",
    "Multi-Marketplace Platforms": "One connection that unlocks dozens of channels simultaneously.",
    "International Marketplaces": "Expand into the Middle East, Europe, and Asia-Pacific.",
};

export default function SetupGuidesPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            <div className={s.hero}>
                <div className={s.heroGlow} />
                <span className={s.heroChip}>Documentation</span>
                <h1 className={s.h1}>Integration Setup Guides</h1>
                <p className={s.heroSub}>
                    Detailed, step-by-step instructions for connecting every supported marketplace and platform to your Pythias account.
                </p>
            </div>

            <div className={s.breadcrumb}>
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/setup-guides/integrations">Setup Guides</Link>
                <span>/</span>
                <span style={{ color: "#374151" }}>Integrations</span>
            </div>

            <section className={s.indexSection}>
                <div className={s.wrap}>
                    {/* Marketplace variables callout */}
                    <div className={s.callout}>
                        <div className={s.calloutText}>
                            <div className={s.calloutTitle}>Marketplace Column Variables</div>
                            <div className={s.calloutDesc}>
                                Learn how to use dynamic variables like <code style={{ color: "#a5b4fc", fontFamily: "monospace" }}>productTitle</code>, <code style={{ color: "#a5b4fc", fontFamily: "monospace" }}>variantSku</code>, and <code style={{ color: "#a5b4fc", fontFamily: "monospace" }}>productImage,0</code> in the Add/Edit Marketplace modal to auto-populate listing fields from your product catalog.
                            </div>
                        </div>
                        <Link href="/setup-guides/integrations/marketplace-variables" className={s.calloutBtn}>
                            View Variables →
                        </Link>
                    </div>

                    {grouped.map(cat => (
                        <div key={cat.label} className={s.categoryBlock}>
                            <p className={s.categoryLabel}>{cat.label}</p>
                            <h2 className={s.categoryTitle}>{cat.label}</h2>
                            <p className={s.categoryDesc}>{CAT_DESCS[cat.label] || ""}</p>
                            <ul className={s.grid3} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {cat.items.map(intg => (
                                    <li key={intg.slug}>
                                        <Link href={`/setup-guides/integrations/${intg.slug}`} className={s.card}>
                                            {intg.logo ? (
                                                <img
                                                    src={intg.logo}
                                                    alt={intg.name}
                                                    className={s.cardLogo}
                                                    style={intg.logoBg ? { background: intg.logoBg, padding: "4px 8px" } : {}}
                                                />
                                            ) : (
                                                <div className={s.cardLogoBox} style={{ background: "#f1f5f9" }}>
                                                    <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#374151" }}>{intg.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className={s.cardBody}>
                                                <div className={s.cardName}>{intg.name}</div>
                                                <div className={s.cardDesc}>{intg.overview.slice(0, 90)}…</div>
                                                <span className={s.cardArrow}>Setup guide →</span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            <section className={s.cta}>
                <div className={s.wrapMd} style={{ textAlign: "center" }}>
                    <h2 className={s.ctaTitle}>Need help with your setup?</h2>
                    <p className={s.ctaSub}>Our team can walk you through any integration during your onboarding call.</p>
                    <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</Link>
                </div>
            </section>
        </div>
    );
}
