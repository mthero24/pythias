import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated, SERVICE_RATING } from "@/componants/ServicePage";

export const metadata = {
    title: "Inventory Management for Print Shops",
    description: "Real-time blank inventory tracking, automated reorder alerts, SKU management, and supplier integration built specifically for print-on-demand and custom apparel businesses.",
    keywords: "print shop inventory management, blank inventory tracking, DTF inventory, embroidery blank stock, SKU management, reorder alerts, apparel inventory software, print on demand inventory, stock management print shop",
    openGraph: {
        title: "Inventory Management for Print Shops | Pythias Technologies",
        description: "Real-time blank inventory tracking with automated reorder alerts and supplier management for print-on-demand businesses.",
        type: "website",
        url: "https://pythiastechnologies.com/services/inventory",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/inventory" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Inventory Management",
    applicationCategory: "BusinessApplication",
    description: "Blank inventory tracking and management software for print-on-demand and custom apparel businesses.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: SERVICE_RATING,
};

const features = [
    { icon: "📊", title: "Real-Time Stock Levels",         desc: "See exact quantities for every blank, color, and size across your entire warehouse — updated as orders are pulled and stock is received." },
    { icon: "🔔", title: "Automated Reorder Alerts",        desc: "Set minimum stock thresholds per SKU. Pythias sends alerts (and optionally creates purchase orders) before you run out." },
    { icon: "🏷️", title: "SKU & Variant Management",       desc: "Manage thousands of blank SKUs with size, color, style, and supplier attributes. Bulk import from CSV or supplier catalogs." },
    { icon: "🤝", title: "Supplier Management",             desc: "Store supplier contacts, pricing tiers, lead times, and preferred vendors per product. Compare supplier quotes side by side." },
    { icon: "📍", title: "Multi-Location Support",          desc: "Track inventory across multiple warehouse locations or production areas. Know exactly where each blank is stored." },
    { icon: "📦", title: "Receiving & PO Tracking",         desc: "Log incoming shipments against purchase orders. Stock levels update automatically when a delivery is received and verified." },
    { icon: "🔍", title: "Usage & Consumption Tracking",   desc: "See how quickly each blank sells. Identify fast-moving and slow-moving SKUs to optimize your buying decisions." },
    { icon: "⚠️", title: "Low-Stock Notifications",        desc: "Email and in-app alerts when stock drops below threshold. Optional Slack or SMS notifications for critical items." },
    { icon: "📋", title: "Audit & Adjustment Logs",        desc: "Full audit trail for every inventory adjustment — who changed what, when, and why. Essential for year-end accounting." },
];

const steps = [
    { title: "Import your blanks",           desc: "Upload your existing inventory via CSV or connect to your supplier catalog. Set starting quantities, thresholds, and reorder points for each SKU." },
    { title: "Inventory tracks in real time", desc: "As orders come in and production pulls blanks, quantities decrement automatically. Receiving updates them back up when new stock arrives." },
    { title: "Alerts fire before stockouts", desc: "When a SKU hits its reorder threshold, Pythias alerts the right people — or automatically generates a draft purchase order." },
    { title: "Buy smarter over time",        desc: "Usage reports show your actual consumption rate. Make purchasing decisions based on real data, not guesswork." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                   item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",               item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Inventory Management",   item: "https://pythiastechnologies.com/services/inventory" },
    ],
};

export default function InventoryPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Inventory Management"
                title="Never run out of blanks"
                accent="mid-production."
                subtitle="Real-time blank inventory tracking built specifically for print shops. Know your exact stock levels across every SKU, color, and size — and get alerted before you run short."
                icon="📦"
                color="#10b981"
            />
            <ServiceFeatures features={features} color="#10b981" />
            <ServiceSteps steps={steps} color="#10b981" />
            <ServiceCTA
                title="Stop losing sales to stockouts."
                sub="Pythias tracks every blank in real time so your team always knows what's available before production starts."
                color="#10b981"
            />
            <ServiceRelated related={[
                { href: "/services/production",  label: "Production Queue Management" },
                { href: "/services/analytics",   label: "Analytics & Reporting" },
                { href: "/services/design",      label: "Design & Product Management" },
            ]} />
        </>
    );
}
