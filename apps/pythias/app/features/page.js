import s from "./features.module.css";
import Link from "next/link";

export const metadata = {
    title: "Features",
    description: "Explore all the features of the Pythias print-on-demand fulfillment platform — production, shipping, inventory, marketplaces, analytics, and more.",
    alternates: { canonical: "https://pythiastechnologies.com/features" },
};

const CORE_FEATURES = [
    {
        icon: "🖨️",
        color: "#D3A73D",
        title: "Production Queue Management",
        desc: "DTF, embroidery, sublimation, and screen print queues organized by deadline, type, and priority. Your floor always knows exactly what to work on next.",
        bullets: ["Priority-based queue sorting", "Print type routing", "Deadline tracking", "Multi-station support"],
    },
    {
        icon: "🚚",
        color: "#6366f1",
        title: "Shipping & Carrier Integration",
        desc: "Auto-generate USPS, FedEx, and UPS labels the moment an order ships. Tracking numbers sync back to every marketplace automatically — no copy-paste.",
        bullets: ["USPS, FedEx & UPS", "Batch label printing", "Auto tracking sync", "Rate comparison"],
    },
    {
        icon: "📦",
        color: "#10b981",
        title: "Inventory & Stock Control",
        desc: "Real-time blank inventory tracking with automated reorder alerts. Always know what's in stock before orders hit your floor.",
        bullets: ["Real-time stock levels", "Reorder alerts", "Supplier management", "SKU tracking"],
    },
    {
        icon: "🛒",
        color: "#ef4444",
        title: "Multi-Marketplace Orders",
        desc: "Amazon, Etsy, Walmart, TikTok, Shopify, and Kohl's — all orders unified in a single production view. One dashboard, every channel.",
        bullets: ["6+ marketplace integrations", "Unified order view", "Auto order import", "Channel tagging"],
    },
    {
        icon: "📊",
        color: "#8b5cf6",
        title: "Analytics & Reporting",
        desc: "Daily output reports, line efficiency metrics, order status dashboards, and custom date-range exports to track what matters most.",
        bullets: ["Production output reports", "Efficiency metrics", "Custom date ranges", "CSV exports"],
    },
    {
        icon: "👥",
        color: "#14b8a6",
        title: "Team Collaboration",
        desc: "Built-in messaging, role-based access, activity logs, and shift management keep your entire floor aligned — from operators to managers.",
        bullets: ["Role-based access", "Activity logs", "Built-in messaging", "Shift management"],
    },
    {
        icon: "🏷️",
        color: "#f59e0b",
        title: "Label & Barcode Printing",
        desc: "Print production labels, packing slips, and barcodes for any order directly from your dashboard. No third-party tools needed.",
        bullets: ["Production labels", "Packing slips", "Barcode generation", "Bulk printing"],
    },
    {
        icon: "🎯",
        color: "#3b82f6",
        title: "Order Tracking & Visibility",
        desc: "Real-time tracking from production start to delivery. Every person on your team — and every marketplace — always knows where an order stands.",
        bullets: ["Real-time status updates", "Production milestones", "Customer-facing tracking", "Exception alerts"],
    },
];

const PLATFORM_FEATURES = [
    { icon: "🔌", color: "#6366f1", title: "50+ Integrations",        desc: "Printers, carriers, marketplaces, and tools — all connected out of the box." },
    { icon: "🎧", color: "#10b981", title: "24/7 Support",             desc: "Chat, email, phone, and dedicated Slack channels staffed by print production experts." },
    { icon: "🔒", color: "#D3A73D", title: "Role-Based Security",      desc: "Control exactly what each team member can see and do across your entire operation." },
    { icon: "💻", color: "#ef4444", title: "Works on Any Device",      desc: "Access your dashboard from the production floor, the office, or anywhere else." },
];

const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Technologies",
    applicationCategory: "BusinessApplication",
    description: "All-in-one print-on-demand fulfillment platform — production queues, shipping automation, inventory management, multi-marketplace integration, analytics, and team tools.",
    featureList: CORE_FEATURES.map(f => f.title).join(", "),
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5", bestRating: "5", worstRating: "1", ratingCount: "24" },
    url: "https://pythiastechnologies.com/features",
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",     item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Features", item: "https://pythiastechnologies.com/features" },
    ],
};

export default function FeaturesPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className={s.hero}>
                <div className={s.glow + " " + s.glow1} />
                <div className={s.glow + " " + s.glow2} />
                <div className={s.wrap}>
                    <p className={s.tag}>Platform Features</p>
                    <h1 className={s.h1}>
                        Everything you need to run{" "}
                        <span className={s.accent}>your print shop.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Powerful features designed to automate every aspect of your workflow — from first order to final delivery.
                    </p>
                    <div className={s.btns}>
                        <a href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</a>
                        <Link href="/contact" className={s.btnWhite}>Talk to Sales</Link>
                    </div>
                </div>
            </section>

            {/* Core Features */}
            <section className={s.section} itemScope itemType="https://schema.org/ItemList">
                <div className={s.wrap}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Core Features</p>
                        <h2 className={s.h2} itemProp="name">Built for every part of your operation.</h2>
                        <p className={s.sectionSub}>From the moment an order comes in to the moment it ships, Pythias handles it.</p>
                    </div>
                    <ul className={s.grid2} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {CORE_FEATURES.map((f, i) => (
                            <li
                                key={f.title}
                                className={s.feat}
                                itemProp="itemListElement"
                                itemScope
                                itemType="https://schema.org/ListItem"
                            >
                                <meta itemProp="position" content={i + 1} />
                                <div className={s.featHead}>
                                    <div className={s.featIcon} style={{ background: f.color + "18" }}>{f.icon}</div>
                                    <div>
                                        <h3 className={s.featTitle} itemProp="name">{f.title}</h3>
                                        <p className={s.featDesc} itemProp="description">{f.desc}</p>
                                    </div>
                                </div>
                                <hr className={s.hr} />
                                <ul className={s.bullets} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {f.bullets.map((b) => (
                                        <li key={b} className={s.bullet}>
                                            <span className={s.dot} style={{ background: f.color }} />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Platform-wide */}
            <section className={s.sectionDark}>
                <div className={s.sectionGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <div className={s.head}>
                        <p className={s.sectionTag}>Platform-Wide</p>
                        <h2 className={s.h2Light}>Built to support your whole team.</h2>
                    </div>
                    <ul className={s.grid4} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {PLATFORM_FEATURES.map((f) => (
                            <li key={f.title} className={s.pCard}>
                                <span className={s.pIcon}>{f.icon}</span>
                                <h3 className={s.pTitle}>{f.title}</h3>
                                <p className={s.pDesc}>{f.desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrapMd}>
                    <h2 className={s.ctaTitle}>See every feature live.</h2>
                    <p className={s.ctaSub}>
                        Book a free demo and we&apos;ll walk through exactly how Pythias fits your workflow — no commitment required.
                    </p>
                    <div className={s.btns}>
                        <a href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</a>
                        <Link href="/how-it-works" className={s.btnGray}>How It Works</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
