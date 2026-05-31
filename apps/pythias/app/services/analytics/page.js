import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated } from "@/componants/ServicePage";

export const metadata = {
    title: "Analytics & Reporting for Print Shops",
    description: "Real-time production analytics, line efficiency metrics, revenue reporting by marketplace, employee output tracking, and custom date-range exports built for print-on-demand businesses.",
    keywords: "print shop analytics, production reporting, line efficiency metrics, order analytics, revenue by marketplace, employee productivity tracking, DTF reporting, print on demand analytics, ecommerce reporting software",
    openGraph: {
        title: "Analytics & Reporting for Print Shops | Pythias Technologies",
        description: "Real-time dashboards, line efficiency KPIs, and marketplace revenue breakdowns for print-on-demand operations.",
        type: "website",
        url: "https://pythiastechnologies.com/services/analytics",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/analytics" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Analytics & Reporting",
    applicationCategory: "BusinessApplication",
    description: "Production analytics and reporting for print-on-demand and custom apparel businesses.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
};

const features = [
    { icon: "📈", title: "Daily Output Reports",            desc: "See exactly how many units each line produced each day. Compare against targets and identify underperforming shifts automatically." },
    { icon: "⚡", title: "Line Efficiency KPIs",            desc: "Track throughput per hour, average production time per unit, and downtime by line. Pinpoint bottlenecks before they hurt capacity." },
    { icon: "💰", title: "Revenue by Marketplace",          desc: "Break revenue, order count, and average order value down by Shopify, Etsy, Amazon, Walmart, and every other connected channel." },
    { icon: "👤", title: "Employee Output Tracking",        desc: "See units produced per employee per shift. Identify your top performers and flag when output drops below baseline." },
    { icon: "📅", title: "Custom Date-Range Exports",       desc: "Pull any report for any date range and export to CSV or PDF for accounting, payroll, or investor reporting." },
    { icon: "🔴", title: "Real-Time Dashboards",            desc: "Live views of current queue depth, orders in production, orders ready to ship, and carrier pickups remaining today." },
    { icon: "📦", title: "Order Fulfillment Rate",          desc: "Track on-time fulfillment rate by marketplace and carrier. Catch trends before they lead to account suspensions." },
    { icon: "🧮", title: "Cost & Margin Analysis",          desc: "Factor in blank cost, shipping cost, and marketplace fees to see your actual margin per order and per channel." },
    { icon: "🔔", title: "Automated Report Delivery",       desc: "Schedule daily, weekly, or monthly reports to email automatically to owners, managers, or investors." },
];

const steps = [
    { title: "Data captured automatically", desc: "Every order, production event, label scan, and shipping action is logged in real time — no manual data entry required from your team." },
    { title: "Dashboards update live",      desc: "Your analytics dashboards reflect the current state of your floor. Management can monitor from anywhere without calling the warehouse." },
    { title: "Reports run on demand",       desc: "Pull any report for any time range in seconds. Filter by marketplace, product type, employee, or production line." },
    { title: "Act on what you find",        desc: "Use built-in annotations to flag issues, assign follow-ups, and track whether efficiency changes are making a measurable difference." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                    item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",                item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Analytics & Reporting",   item: "https://pythiastechnologies.com/services/analytics" },
    ],
};

export default function AnalyticsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Analytics & Reporting"
                title="Know exactly how your"
                accent="operation performs."
                subtitle="Real-time production dashboards, line efficiency metrics, revenue breakdowns by marketplace, and automated reports — so every decision you make is backed by data, not gut feel."
                icon="📊"
                color="#8b5cf6"
            />
            <ServiceFeatures features={features} color="#8b5cf6" />
            <ServiceSteps steps={steps} color="#8b5cf6" />
            <ServiceCTA
                title="Stop guessing what's happening on your floor."
                sub="Pythias captures every production event automatically so you can see what's really going on — and fix it."
                color="#8b5cf6"
            />
            <ServiceRelated related={[
                { href: "/services/production",  label: "Production Queue Management" },
                { href: "/services/team",        label: "Team & Collaboration" },
                { href: "/services/marketplace", label: "Multi-Marketplace Integration" },
            ]} />
        </>
    );
}
