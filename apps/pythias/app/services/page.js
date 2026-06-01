import s from "./services.module.css";
import Link from "next/link";

export const metadata = {
    title: "Services — Print-on-Demand Automation Platform",
    description: "Explore Pythias Technologies' full suite of print-on-demand automation services: production queue management, shipping integration, inventory control, multi-marketplace sync, analytics, team tools, label printing, and AI-powered product creation.",
    keywords: "print on demand software, DTF queue management, shipping label automation, inventory management, multi-marketplace integration, Shopify fulfillment, Etsy fulfillment, Amazon fulfillment, print shop software, AI product listing generator",
    openGraph: {
        title: "Services | Pythias Technologies",
        description: "The complete platform for print-on-demand operations — from production floor to shipping carrier.",
        type: "website",
        url: "https://pythiastechnologies.com/services",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services" },
};

const SERVICES = [
    {
        href: "/services/production",
        icon: "🖨️",
        color: "#D3A73D",
        tag: "Production",
        title: "Production Queue Management",
        desc: "Manage DTF, embroidery, sublimation, and screen print queues with automated job routing, deadline tracking, and Brother GTX printer integration.",
        highlights: ["DTF & Embroidery queues", "Heat press settings", "Batch processing", "Brother GTX integration"],
    },
    {
        href: "/services/shipping",
        icon: "🚚",
        color: "#6366f1",
        tag: "Shipping",
        title: "Shipping & Fulfillment",
        desc: "Auto-generate USPS, FedEx, and UPS labels the moment an order completes. Sync tracking back to every marketplace automatically — no manual steps.",
        highlights: ["USPS, FedEx & UPS labels", "Auto-tracking sync", "Batch shipping", "Rate comparison"],
    },
    {
        href: "/services/inventory",
        icon: "📦",
        color: "#10b981",
        tag: "Inventory",
        title: "Inventory Management",
        desc: "Real-time blank inventory tracking across all SKUs. Automated reorder alerts, supplier management, and low-stock notifications prevent costly stockouts.",
        highlights: ["Real-time stock levels", "Automated reorders", "Supplier management", "Multi-location support"],
    },
    {
        href: "/services/marketplace",
        icon: "🛒",
        color: "#ef4444",
        tag: "Marketplace",
        title: "Multi-Marketplace Integration",
        desc: "One dashboard for every channel — Shopify, Amazon, Etsy, Walmart, TikTok Shop, and Kohl's. Orders route to production automatically.",
        highlights: ["Shopify, Amazon, Etsy", "TikTok Shop & Walmart", "Auto order routing", "Listing sync"],
    },
    {
        href: "/services/analytics",
        icon: "📊",
        color: "#8b5cf6",
        tag: "Analytics",
        title: "Analytics & Reporting",
        desc: "Daily output reports, line efficiency metrics, marketplace revenue breakdowns, and custom date-range exports — all in real time.",
        highlights: ["Daily output reports", "Line efficiency KPIs", "Revenue by channel", "Custom exports"],
    },
    {
        href: "/services/team",
        icon: "👥",
        color: "#14b8a6",
        tag: "Team",
        title: "Team & Collaboration",
        desc: "Role-based access, built-in messaging, time tracking, badge scanning login, and activity logs to keep every shift running smoothly.",
        highlights: ["Role-based access", "Built-in messaging", "Time tracking", "Badge scan login"],
    },
    {
        href: "/services/labels",
        icon: "🏷️",
        color: "#f59e0b",
        tag: "Labels",
        title: "Label & Barcode Printing",
        desc: "Print production labels, packing slips, barcodes, and QR codes for any order directly from the dashboard — no third-party tools needed.",
        highlights: ["Production labels", "Packing slips", "Barcode & QR codes", "Bulk label printing"],
    },
    {
        href: "/services/design",
        icon: "🎨",
        color: "#ec4899",
        tag: "Design",
        title: "Design & Product Management",
        desc: "Create, organize, and publish your entire product design library from one place. Approval workflows, version control, and one-click push to every connected marketplace.",
        highlights: ["Design library & versioning", "Approval workflows", "SKU & variant mapping", "One-click marketplace publish"],
    },
    {
        href: "/services/image-creation",
        icon: "🤖",
        color: "#0ea5e9",
        tag: "Automation",
        title: "Automated Product Image Creation",
        desc: "AI-powered mockup generation across every product, color, and size variant — the moment a design is uploaded. No manual compositing, no third-party tools.",
        highlights: ["AI mockup generation", "Bulk variant rendering", "Background removal", "Direct listing export"],
    },
    {
        href: "/services/product-creation-ai",
        icon: "✨",
        color: "#7c3aed",
        tag: "AI",
        title: "Product Creation AI",
        desc: "AI-generated product titles, descriptions, keywords, and tags optimized for every marketplace — created in bulk from your design catalog, ready to publish.",
        highlights: ["AI listing copy", "SEO keyword generation", "Bulk product creation", "Marketplace-specific optimization"],
    },
];

const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pythias Technologies Services",
    description: "Complete suite of print-on-demand automation services.",
    url: "https://pythiastechnologies.com/services",
    numberOfItems: SERVICES.length,
    itemListElement: SERVICES.map((svc, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: svc.title,
        description: svc.desc,
        url: `https://pythiastechnologies.com${svc.href}`,
    })),
};

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",     item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services", item: "https://pythiastechnologies.com/services" },
    ],
};

export default function ServicesPage() {
    return (
        <div className={s.bg}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className={s.hero}>
                <div className={s.heroGlow} />
                <div className={s.wrap} style={{ position: "relative" }}>
                    <span className={s.heroChip}>Our Services</span>
                    <h1 className={s.h1}>
                        Everything your print shop needs,{" "}
                        <span className={s.accent}>built in.</span>
                    </h1>
                    <p className={s.heroSub}>
                        Pythias Technologies covers every part of your operation — from the moment an order lands to the moment it ships.
                    </p>
                </div>
            </section>

            {/* Services grid */}
            <div className={s.grid}>
                <div className={s.wrap}>
                    <ul
                        className={s.grid3}
                        style={{ listStyle: "none", padding: 0, margin: 0 }}
                        itemScope
                        itemType="https://schema.org/ItemList"
                    >
                        {SERVICES.map((svc, i) => (
                            <li
                                key={svc.href}
                                itemProp="itemListElement"
                                itemScope
                                itemType="https://schema.org/ListItem"
                            >
                                <meta itemProp="position" content={i + 1} />
                                <Link
                                    href={svc.href}
                                    className={s.card}
                                    style={{ "--c": svc.color, "--ca": svc.color + "18" }}
                                    itemProp="url"
                                >
                                    <div className={s.cardBody}>
                                        <div className={s.cardTop}>
                                            <span className={s.cardEmoji}>{svc.icon}</span>
                                            <span className={s.cardTag}>{svc.tag}</span>
                                        </div>
                                        <h2 className={s.cardTitle} itemProp="name">{svc.title}</h2>
                                        <p className={s.cardDesc} itemProp="description">{svc.desc}</p>
                                        <ul className={s.highlights} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                            {svc.highlights.map((h) => (
                                                <li key={h} className={s.highlight}>{h}</li>
                                            ))}
                                        </ul>
                                        <span className={s.cardArrow}>Learn more →</span>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* CTA */}
            <section className={s.cta}>
                <div className={s.wrapMd}>
                    <h2 className={s.ctaTitle}>Ready to see it in action?</h2>
                    <p className={s.ctaSub}>
                        Book a demo and we&apos;ll walk you through the platform with your actual workflow in mind.
                    </p>
                    <Link href="/#calendar-booking-section" className={s.btnGold}>Book a Demo</Link>
                </div>
            </section>
        </div>
    );
}
