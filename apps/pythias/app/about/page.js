import s from "./about.module.css";
import Link from "next/link";

export const metadata = {
    title: "About Us",
    description: "Learn about Pythias Technologies — the team building the future of print-on-demand fulfillment software.",
    alternates: { canonical: "https://pythiastechnologies.com/about" },
};

const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pythias Technologies",
    url: "https://pythiastechnologies.com",
    logo: { "@type": "ImageObject", url: "https://pythiastechnologies.com/logo.png" },
    description: "All-in-one print-on-demand automation platform — founded by people who understand print fulfillment from the inside out.",
    foundingLocation: { "@type": "Place", name: "Lapeer, Michigan, USA" },
    address: { "@type": "PostalAddress", streetAddress: "1421 Hidden View Drive", addressLocality: "Lapeer", addressRegion: "MI", postalCode: "48446", addressCountry: "US" },
    telephone: "+18445798442",
    numberOfEmployees: { "@type": "QuantitativeValue", description: "US-Based Team" },
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",     item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "About Us", item: "https://pythiastechnologies.com/about" },
    ],
};

const VALUES = [
    { icon: "🚀", color: "#D3A73D", title: "Built for Operators",      desc: "We build software for the people on the floor — not just the people in the boardroom. Every feature starts with a real workflow problem." },
    { icon: "👁️",  color: "#6366f1", title: "Full Visibility",          desc: "You should always know where every order stands. We obsess over real-time data so nothing falls through the cracks." },
    { icon: "🤝", color: "#10b981", title: "Partnership First",         desc: "We grow when our clients grow. That means honest pricing, responsive support, and building features that actually ship." },
    { icon: "💡", color: "#f59e0b", title: "Relentless Improvement",    desc: "The print industry moves fast. We ship updates constantly and listen closely to the teams using our platform every day." },
];

const STATS = [
    { value: "50+",     label: "Platform Integrations" },
    { value: "< 2 wks", label: "Average Onboarding" },
    { value: "24/7",    label: "Support Coverage" },
    { value: "100%",    label: "U.S.-Based Team" },
];

export default function AboutPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow + " " + s.glow1} />
                <div className={s.glow + " " + s.glow2} />
                <div className={s.wrap}>
                    <p className={s.tag}>About Pythias Technologies</p>
                    <h1 className={s.h1}>
                        We built the platform we{" "}
                        <span className={s.accent}>wished existed.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Pythias Technologies was founded by people who understand print fulfillment from the inside out.
                        We saw the chaos of disconnected tools, manual tracking, and missed orders — and built something better.
                    </p>
                </div>
            </section>

            {/* Stats bar */}
            <div className={s.statsBar}>
                <dl className={s.statsGrid}>
                    {STATS.map((stat) => (
                        <div key={stat.label} className={s.stat}>
                            <dt className={s.statVal}>{stat.value}</dt>
                            <dd className={s.statLabel}>{stat.label}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Mission */}
            <section className={s.mission}>
                <div className={s.wrap}>
                    <div className={s.missionGrid}>
                        <div>
                            <p className={s.missionLabel}>Our Mission</p>
                            <h2 className={s.h2}>Automate the work. Amplify the results.</h2>
                            <p className={s.p}>
                                Print shops are run by skilled people doing skilled work. But too much of their time gets eaten by
                                manual data entry, chasing order statuses, and stitching together spreadsheets.
                            </p>
                            <p className={s.p}>
                                Our mission is to give those hours back — by connecting your production floor, marketplaces, shipping
                                carriers, and team into one automated system that runs in the background while you focus on what you do best.
                            </p>
                        </div>
                        <address
                            className={`${s.locationCard} h-card`}
                            itemScope
                            itemType="https://schema.org/LocalBusiness"
                            style={{ fontStyle: "normal" }}
                        >
                            <meta itemProp="name" content="Pythias Technologies" />
                            <meta itemProp="url" content="https://pythiastechnologies.com" />
                            <div className={s.locationGlow} />
                            <p className={s.locationTag}>Southfield, MI</p>
                            <p className={s.locationTitle}>Headquartered in Michigan. Built for print shops everywhere.</p>
                            <hr className={s.locationHr} />
                            <p
                                className={s.locationAddress}
                                itemProp="address"
                                itemScope
                                itemType="https://schema.org/PostalAddress"
                            >
                                <span itemProp="streetAddress">1421 Hidden View Drive</span>,{" "}
                                <span itemProp="addressLocality">Lapeer</span>{" "}
                                <span itemProp="addressRegion">MI</span>{" "}
                                <span itemProp="postalCode">48446</span>
                            </p>
                            <p className={s.locationAddress} itemProp="telephone">(844) 579-8442</p>
                            <Link href="/contact" className={s.locationLink}>Contact Us</Link>
                        </address>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className={s.values}>
                <div className={s.wrap}>
                    <div className={s.valuesHead}>
                        <p className={s.valuesTag}>What We Stand For</p>
                        <h2 className={s.h2Values}>Our values</h2>
                    </div>
                    <ul className={s.grid2} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {VALUES.map((v) => (
                            <li key={v.title} className={s.valueCard}>
                                <div className={s.valueIcon} style={{ background: v.color + "18" }}>{v.icon}</div>
                                <h3 className={s.valueTitle}>{v.title}</h3>
                                <p className={s.valueDesc}>{v.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Featured media */}
            <section style={{ background: "#0f172a", padding: "80px 0" }}>
                <div className={s.wrap}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D3A73D", marginBottom: 10 }}>
                            Featured Podcast
                        </p>
                        <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginBottom: 12 }}>
                            Hear from our founder.
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto", lineHeight: 1.75, fontSize: "1rem" }}>
                            We sat down to talk about the chaos inside most print shops, why existing software falls short,
                            and how Pythias was built to fix it — from the production floor up.
                        </p>
                    </div>
                    <div style={{ maxWidth: 820, margin: "0 auto" }}>
                        <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <iframe
                                src="https://www.youtube.com/embed/gNssMTukPQk?rel=0&modestbranding=1"
                                title="Pythias Technologies Podcast Interview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrapMd}>
                    <h2 className={s.ctaTitle}>Ready to see it in action?</h2>
                    <p className={s.ctaSub}>
                        Book a free demo and we&apos;ll walk you through exactly how Pythias can fit your operation.
                    </p>
                    <div className={s.btns}>
                        <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</Link>
                        <Link href="/contact" className={s.btnGray}>Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
