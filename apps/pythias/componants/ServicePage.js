import s from "./ServicePage.module.css";
import Link from "next/link";

export const SERVICE_RATING = {
    "@type": "AggregateRating",
    ratingValue: "5",
    bestRating: "5",
    worstRating: "1",
    ratingCount: "24",
};

export function ServiceHero({ label, title, subtitle, accent, icon, color = "#D3A73D" }) {
    const css = { "--c": color, "--ca": color + "22", "--cb": color + "44", "--cs": color + "44" };
    return (
        <section className={s.hero} style={css} itemScope itemType="https://schema.org/Service">
            <meta itemProp="provider" content="Pythias Technologies" />
            <meta itemProp="serviceType" content={label} />
            <div itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating" style={{ display: "none" }}>
                <meta itemProp="ratingValue" content="5" />
                <meta itemProp="bestRating" content="5" />
                <meta itemProp="worstRating" content="1" />
                <meta itemProp="ratingCount" content="24" />
            </div>
            <div className={s.glow + " " + s.glow1} />
            <div className={s.glow + " " + s.glow2} />
            <div className={s.wrap}>
                <Link href="/services" className={s.heroBack}>← All Services</Link>
                <span className={s.heroIcon}>{icon}</span>
                <span className={s.chip}>{label}</span>
                <h1 className={s.h1} itemProp="name">
                    {title} <span className={s.accent}>{accent}</span>
                </h1>
                <p className={s.heroSub} itemProp="description">{subtitle}</p>
                <div className={s.btns}>
                    <a href="/#calendar-booking-section" className={s.btnPrimary}>📅 Book a Demo</a>
                    <Link href="/services" className={s.btnOutline}>View All Services</Link>
                </div>
            </div>
        </section>
    );
}

export function ServiceFeatures({ features, color = "#D3A73D" }) {
    const css = { "--c": color, "--ca": color + "18", "--cs": color + "44" };
    return (
        <section className={s.features} style={css} itemScope itemType="https://schema.org/ItemList">
            <div className={s.wrap}>
                <p className={s.label}>Key Features</p>
                <h2 className={s.h2} itemProp="name">Everything included</h2>
                <p className={s.sub}>
                    Built for real print shop workflows — every feature is designed around how your floor actually operates.
                </p>
                <ul className={s.grid3}>
                    {features.map((f, i) => (
                        <li key={f.title} className={s.feat} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <meta itemProp="position" content={i + 1} />
                            <div className={s.featIcon}>{f.icon}</div>
                            <div>
                                <h3 className={s.featTitle} itemProp="name">{f.title}</h3>
                                <p className={s.featDesc} itemProp="description">{f.desc}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export function ServiceSteps({ steps, color = "#D3A73D" }) {
    const css = { "--c": color, "--cs": color + "44", "--n": Math.min(steps.length, 4) };
    return (
        <section className={s.steps} style={css} itemScope itemType="https://schema.org/HowTo">
            <div className={s.wrap}>
                <p className={s.label}>How It Works</p>
                <h2 className={s.h2} itemProp="name">Simple from day one</h2>
                <ol className={s.stepsGrid}>
                    {steps.map((step) => (
                        <li key={step.title} itemProp="step" itemScope itemType="https://schema.org/HowToStep">
                            <h3 className={s.stepTitle} itemProp="name">{step.title}</h3>
                            <p className={s.stepDesc} itemProp="text">{step.desc}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

const PLATFORM_LINKS = [
    { href: "/services",        label: "All Services" },
    { href: "/features",        label: "Platform Features" },
    { href: "/integrations",    label: "Integrations" },
    { href: "/how-it-works",    label: "How It Works" },
    { href: "/about",           label: "About Pythias" },
    { href: "/contact",         label: "Contact Us" },
];

export function ServiceRelated({ related = [] }) {
    const links = [
        ...related,
        ...PLATFORM_LINKS.filter(l => !related.find(r => r.href === l.href)),
    ];
    return (
        <nav className={s.related} aria-label="Related pages">
            <div className={s.relatedInner}>
                <span className={s.relatedLabel}>Explore the platform</span>
                <ul className={s.relatedGrid}>
                    {links.map((l) => (
                        <li key={l.href}>
                            <Link href={l.href} className={s.relatedLink}>{l.label}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}

export function ServiceCTA({ title, sub, color = "#D3A73D" }) {
    const css = { "--c": color, "--cs": color + "44" };
    return (
        <section className={s.cta} style={css}>
            <div className={s.wrapSm}>
                <h2 className={s.ctaTitle}>{title}</h2>
                <p className={s.ctaSub}>{sub}</p>
                <div className={s.btns}>
                    <a href="/#calendar-booking-section" className={s.btnPrimary}>Book a Demo</a>
                    <a href="/#lead-capture-section" className={s.btnOutline}>Get Early Access</a>
                </div>
            </div>
        </section>
    );
}
