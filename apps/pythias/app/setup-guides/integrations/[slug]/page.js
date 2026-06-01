import { notFound } from "next/navigation";
import Link from "next/link";
import s from "../docs.module.css";
import { INTEGRATION_MAP, INTEGRATIONS } from "../data";

export async function generateStaticParams() {
    return INTEGRATIONS.map(i => ({ slug: i.slug }));
}

export async function generateMetadata({ params }) {
    const intg = INTEGRATION_MAP[params.slug];
    if (!intg) return {};
    return {
        title: `${intg.name} Integration Setup — Pythias Technologies`,
        description: `Step-by-step guide to connecting ${intg.name} to Pythias: prerequisites, API credentials, configuration, and troubleshooting.`,
        alternates: { canonical: `https://pythiastechnologies.com/setup-guides/integrations/${intg.slug}` },
        openGraph: {
            title: `${intg.name} Integration Setup | Pythias`,
            description: `How to connect ${intg.name} to Pythias Technologies for automatic order sync and fulfillment.`,
            type: "article",
            url: `https://pythiastechnologies.com/setup-guides/integrations/${intg.slug}`,
        },
    };
}

export default function IntegrationDocPage({ params }) {
    const intg = INTEGRATION_MAP[params.slug];
    if (!intg) notFound();

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to connect ${intg.name} to Pythias Technologies`,
        description: intg.overview,
        step: intg.steps.map((st, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: st.title,
            text: st.content.replace(/<[^>]+>/g, ""),
        })),
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://pythiastechnologies.com" },
            { "@type": "ListItem", position: 2, name: "Setup Guides", item: "https://pythiastechnologies.com/setup-guides/integrations" },
            { "@type": "ListItem", position: 3, name: "Integrations", item: "https://pythiastechnologies.com/setup-guides/integrations" },
            { "@type": "ListItem", position: 4, name: intg.name, item: `https://pythiastechnologies.com/setup-guides/integrations/${intg.slug}` },
        ],
    };

    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Breadcrumb */}
            <nav className={s.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/setup-guides/integrations">Setup Guides</Link>
                <span>/</span>
                <Link href="/setup-guides/integrations">Integrations</Link>
                <span>/</span>
                <span style={{ color: "#374151" }}>{intg.name}</span>
            </nav>

            {/* Hero */}
            <header className={s.detailHero}>
                <div className={s.detailHeroInner}>
                    {intg.logo ? (
                        <img
                            src={intg.logo}
                            alt={intg.name}
                            className={s.detailLogo}
                            style={intg.logoBg ? { background: intg.logoBg, padding: "8px 14px", borderRadius: "10px" } : {}}
                        />
                    ) : (
                        <div className={s.detailLogoBox} style={{ background: "#1e293b" }}>
                            <span style={{ fontWeight: 900, fontSize: "1.6rem", color: "#fff" }}>{intg.name.charAt(0)}</span>
                        </div>
                    )}
                    <div className={s.detailLogoText}>
                        <span className={s.detailChip}>{intg.category} · {intg.highlight}</span>
                        <h1 className={s.detailH1}>{intg.name} Integration Setup</h1>
                        <p className={s.detailOverview}>{intg.overview}</p>
                    </div>
                </div>
            </header>

            <main className={s.detailBody}>
                {/* Variables callout */}
                <div className={s.callout}>
                    <div className={s.calloutText}>
                        <div className={s.calloutTitle}>Using the Marketplace Modal?</div>
                        <div className={s.calloutDesc}>
                            When configuring column mappings in the Add/Edit Marketplace dialog, use dynamic variables like <code style={{ color: "#a5b4fc", fontFamily: "monospace" }}>productTitle</code> or <code style={{ color: "#a5b4fc", fontFamily: "monospace" }}>variantSku</code> to auto-populate fields from your product catalog.
                        </div>
                    </div>
                    <Link href="/setup-guides/integrations/marketplace-variables" className={s.calloutBtn}>
                        View Variables →
                    </Link>
                </div>

                {/* Prerequisites */}
                <section className={s.section}>
                    <h2 className={s.sectionTitle}>
                        <span className={s.sectionIcon}>📋</span>
                        Before You Start
                    </h2>
                    <ul className={s.prereqList} aria-label="Prerequisites">
                        {intg.prerequisites.map((p, i) => (
                            <li key={i} className={s.prereqItem}>
                                <span className={s.prereqDot} aria-hidden="true" />
                                {p}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Steps */}
                <section
                    className={s.section}
                    itemScope
                    itemType="https://schema.org/HowTo"
                >
                    <meta itemProp="name" content={`How to connect ${intg.name} to Pythias`} />
                    <h2 className={s.sectionTitle}>
                        <span className={s.sectionIcon}>🔧</span>
                        Setup Steps
                    </h2>
                    <ol className={s.stepList}>
                        {intg.steps.map((step, i) => (
                            <li
                                key={i}
                                className={s.step}
                                itemProp="step"
                                itemScope
                                itemType="https://schema.org/HowToStep"
                            >
                                <div className={s.stepLine} aria-hidden="true" />
                                <div className={s.stepNum} aria-label={`Step ${i + 1}`}>{i + 1}</div>
                                <div className={s.stepContent}>
                                    <div className={s.stepTitle} itemProp="name">{step.title}</div>
                                    <div
                                        className={s.stepText}
                                        itemProp="text"
                                        dangerouslySetInnerHTML={{ __html: step.content }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* What syncs */}
                <section className={s.section}>
                    <h2 className={s.sectionTitle}>
                        <span className={s.sectionIcon}>🔄</span>
                        What Gets Synced
                    </h2>
                    <ul className={s.syncList} aria-label="Data synced">
                        {intg.whatSyncs.map((item, i) => (
                            <li key={i} className={s.syncItem}>
                                <span className={s.syncCheck} aria-hidden="true">✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Tips */}
                <section className={s.section}>
                    <h2 className={s.sectionTitle}>
                        <span className={s.sectionIcon}>💡</span>
                        Tips &amp; Troubleshooting
                    </h2>
                    <ul className={s.tipsList} aria-label="Tips and troubleshooting">
                        {intg.tips.map((tip, i) => (
                            <li key={i} className={s.tip}>
                                <span className={s.tipIcon} aria-hidden="true">⚡</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Back link */}
                <p style={{ marginTop: 40 }}>
                    <Link href="/setup-guides/integrations" style={{ color: "#6366f1", fontWeight: 600, fontSize: "0.9rem" }}>
                        ← Back to all integrations
                    </Link>
                </p>
            </main>

            <section className={s.cta}>
                <div style={{ textAlign: "center" }}>
                    <h2 className={s.ctaTitle}>Need help with {intg.name}?</h2>
                    <p className={s.ctaSub}>Our onboarding team can walk you through the setup live.</p>
                    <a href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</a>
                </div>
            </section>
        </div>
    );
}
