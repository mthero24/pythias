import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated } from "@/componants/ServicePage";

export const metadata = {
    title: "Multi-Marketplace Integration",
    description: "Sell on Shopify, Amazon, Etsy, Walmart, TikTok Shop, and Kohl's from one platform. Orders route to production automatically, tracking syncs back, and listings stay in sync across every channel.",
    keywords: "multi-marketplace ecommerce, Shopify fulfillment software, Amazon seller tools, Etsy order management, Walmart marketplace integration, TikTok Shop fulfillment, Kohl's marketplace, print on demand marketplace, multi-channel order management",
    openGraph: {
        title: "Multi-Marketplace Integration | Pythias Technologies",
        description: "One dashboard for Shopify, Amazon, Etsy, Walmart, TikTok Shop, and more. Orders route to production automatically.",
        type: "website",
        url: "https://pythiastechnologies.com/services/marketplace",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/marketplace" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Multi-Marketplace Integration",
    applicationCategory: "BusinessApplication",
    description: "Multi-channel order management and fulfillment for Shopify, Amazon, Etsy, Walmart, TikTok Shop, and more.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
};

const MARKETPLACES = [
    { icon: "🛍️", name: "Shopify",       desc: "Full bidirectional sync — orders, products, tracking, and inventory all stay in sync between Shopify and your production floor." },
    { icon: "📦", name: "Amazon",         desc: "Pull Amazon Seller Central and FBA orders automatically. Meet Amazon's strict SLA requirements with automated fulfillment timelines." },
    { icon: "🎨", name: "Etsy",           desc: "Sync Etsy orders in real time. Auto-mark orders as shipped with tracking numbers the moment labels are printed." },
    { icon: "🏪", name: "Walmart",        desc: "Fulfill Walmart Marketplace orders with automated routing, label generation, and tracking uploads that meet Walmart's performance standards." },
    { icon: "🎵", name: "TikTok Shop",    desc: "Connect your TikTok Shop catalog and auto-fulfill orders the moment they're placed. Tracking posts back automatically." },
    { icon: "👔", name: "Kohl's",         desc: "Meet Kohl's vendor requirements with compliant EDI-ready fulfillment, label formats, and shipment confirmation uploads." },
    { icon: "🛒", name: "Faire",          desc: "Wholesale orders from Faire route to production alongside DTC orders — prioritized correctly based on ship-by date." },
    { icon: "🏷️", name: "More Channels", desc: "New marketplace integrations are added continuously. Request a channel — if it has an API, we can connect it." },
];

const features = [
    { icon: "🔄", title: "Unified Order Inbox",            desc: "Every order from every channel appears in one production queue. No more logging into six different seller portals." },
    { icon: "🚦", title: "Smart Order Routing",            desc: "Rules-based routing sends orders to the correct production line based on product type, marketplace, or shipping deadline." },
    { icon: "📡", title: "Real-Time Order Sync",           desc: "Orders sync as they're placed — typically within 60 seconds of a customer completing checkout on any platform." },
    { icon: "✈️", title: "Auto Tracking Upload",           desc: "When a shipping label is generated, tracking is automatically uploaded to the originating marketplace, triggering customer notifications." },
    { icon: "📝", title: "Listing Management",             desc: "Sync product listings, pricing, and inventory availability from a single source of truth to all connected channels." },
    { icon: "📊", title: "Per-Channel Analytics",          desc: "See revenue, volume, and fulfillment performance broken down by marketplace. Identify your best-performing channels instantly." },
    { icon: "⏱️", title: "SLA & Deadline Tracking",       desc: "Each marketplace has different ship-by requirements. Pythias surfaces at-risk orders before SLAs are breached." },
    { icon: "🔗", title: "Order De-Duplication",           desc: "If an order appears in multiple systems during sync, Pythias detects and merges duplicates to prevent double-shipping." },
    { icon: "🛡️", title: "Error & Exception Handling",    desc: "Failed syncs, rejected tracking uploads, and API errors are surfaced with clear resolution steps — not buried in logs." },
];

const steps = [
    { title: "Connect your channels",        desc: "Authorize each marketplace in the Pythias settings panel. Most connections take under 5 minutes using OAuth or API key." },
    { title: "Orders flow in automatically", desc: "New orders from all channels appear in your production queue within seconds, tagged by source and sorted by ship-by date." },
    { title: "Produce and ship",             desc: "Your team works the queue as normal. Pythias handles carrier selection, label generation, and packing slip printing." },
    { title: "Tracking syncs everywhere",    desc: "The moment a label is printed, tracking posts back to the originating marketplace. Customers are notified automatically." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                           item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",                       item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Multi-Marketplace Integration",  item: "https://pythiastechnologies.com/services/marketplace" },
    ],
};

export default function MarketplacePage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Marketplace Integration"
                title="All your channels in"
                accent="one production queue."
                subtitle="Shopify, Amazon, Etsy, Walmart, TikTok Shop, Kohl's, and more — every order lands in the same place and follows the same production workflow, regardless of where it was placed."
                icon="🛒"
                color="#ef4444"
            />
            <ServiceFeatures features={features} color="#ef4444" />

            {/* Marketplace grid */}
            <div style={{ background: "#fff", padding: "64px 24px" }}>
                <div style={{ maxWidth: 1024, margin: "0 auto" }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ef4444", marginBottom: 12, textAlign: "center" }}>Supported Channels</p>
                    <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", marginBottom: 48, textAlign: "center" }}>Every channel you sell on</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
                        {MARKETPLACES.map((m) => (
                            <div key={m.name} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 24px" }}>
                                <div style={{ fontSize: "1.75rem", marginBottom: 10 }}>{m.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827", marginBottom: 6 }}>{m.name}</div>
                                <div style={{ fontSize: "0.855rem", color: "#6b7280", lineHeight: 1.6 }}>{m.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ServiceSteps steps={steps} color="#ef4444" />
            <ServiceCTA
                title="Sell everywhere, manage nowhere."
                sub="Pythias unifies all your channels so you can focus on production — not logging into six different portals."
                color="#ef4444"
            />
            <ServiceRelated related={[
                { href: "/services/shipping",    label: "Shipping & Fulfillment" },
                { href: "/services/production",  label: "Production Queue Management" },
                { href: "/integrations",         label: "All Integrations" },
            ]} />
        </>
    );
}
