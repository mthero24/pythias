import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Walmart Marketplace Sellers — Fulfillment Automation | Pythias",
    description: "Order management and fulfillment software for Walmart Marketplace sellers. Auto-import Walmart orders, route to production, ship, and confirm tracking on time — while selling across 18+ channels. No per-order fees.",
    keywords: "software for walmart sellers, walmart marketplace software, walmart order management software, walmart fulfillment software, walmart seller tools",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-walmart-sellers" },
    openGraph: {
        title: "Software for Walmart Marketplace Sellers | Pythias Technologies",
        description: "Automate Walmart Marketplace order routing, production, and shipping — and run every other channel from the same dashboard. No per-order fees.",
        url: "https://pythiastechnologies.com/software-for-walmart-sellers",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Walmart Marketplace Sellers | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Software for Walmart Sellers",
        h1: <>Sell on <span style={GRAD}>Walmart</span>.<br />Hit Every Metric.</>,
        sub: "Pythias pulls your Walmart Marketplace orders into one production queue, routes them automatically, prints labels, and confirms tracking on time — protecting your on-time delivery rate while running every other channel you sell on.",
        stats: [
            { value: "Auto", label: "Walmart Order Import" },
            { value: "18+", label: "Other Channels Too" },
            { value: "On-time", label: "Delivery Tracking" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Walmart's seller metrics are strict — and unforgiving of manual delays.",
        sub: "Walmart grades on-time delivery and valid tracking hard, with suspension risk for repeat misses. Manual fulfillment across channels is how sellers fall below standard.",
        items: [
            { icon: "📉", title: "On-time delivery rate drives everything", body: "Walmart monitors on-time shipment and delivery closely, and falling below standard threatens your listings and account. Orders sitting in a spreadsheet waiting to be triaged are exactly how that rate slips." },
            { icon: "🔀", title: "Walmart is never your only channel", body: "You also sell on Amazon, Etsy, TikTok Shop, and your own store. Managing Walmart in its own Seller Center means another dashboard and another place inventory drifts out of sync." },
            { icon: "🖨️", title: "Production and orders are disconnected", body: "A Walmart order doesn't know its print method or design file. Bridging that gap by hand slows every order and risks the mistakes Walmart penalizes." },
        ],
    },
    features: {
        title: "Everything a Walmart Marketplace seller needs to stay above standard.",
        sub: "Pythias automates the path from Walmart order to confirmed delivery — and runs all your other channels from one place.",
        items: [
            { icon: "📥", title: "Automatic Walmart Order Import", body: "Walmart Marketplace orders flow into your production queue in real time with full buyer and line-item detail — no Seller Center exports, no copy-paste.", bullets: ["Real-time Walmart order sync", "Full line-item + address detail", "Channel tagging across marketplaces"] },
            { icon: "🚚", title: "On-Time Tracking & Delivery", body: "Scan a completed order and Pythias prints the carrier label and confirms valid tracking to Walmart promptly — protecting your on-time delivery rate.", bullets: ["USPS, FedEx, UPS labels", "Valid tracking pushed to Walmart", "Ship-by window aware workflow"] },
            { icon: "🧭", title: "Automated Order Routing", body: "Route every Walmart order by print method, priority, and shipping speed with the correct design file attached — production starts immediately and rush orders never wait.", bullets: ["Route by print type + priority", "Rush/deadline sorting", "Print-ready file routing"] },
            { icon: "🌐", title: "Every Other Channel, One Dashboard", body: "Run Amazon, Etsy, TikTok Shop, eBay, Shopify, and Target Plus alongside Walmart — all orders in one queue, all inventory in sync, all tracking confirmed automatically.", bullets: ["18+ marketplace integrations", "Unified production queue", "Cross-channel inventory sync"] },
            { icon: "📦", title: "Inventory & Stock Control", body: "Live blank inventory by color and size keeps your Walmart listings accurate and prevents oversells that trigger cancellations and metric hits.", bullets: ["Real-time stock tracking", "Low-stock + reorder alerts", "Multi-supplier support"] },
            { icon: "📊", title: "Revenue & Fulfillment Analytics", body: "See Walmart revenue against your other channels, on-time rate, fulfillment rate, and daily output — the numbers that keep your account above standard.", bullets: ["Revenue by channel", "On-time + fulfillment rate", "Daily output reporting"] },
        ],
    },
    howItWorks: {
        title: "From Walmart order to confirmed delivery, automatically",
        steps: [
            { title: "Connect Walmart Seller Center", body: "Link your Walmart account and any other channels you sell on. Orders begin importing into one unified production queue immediately." },
            { title: "Orders route themselves", body: "Each Walmart order is sorted by print method, priority, and ship-by date with the right file attached — your team works one clean list." },
            { title: "Ship and confirm on time", body: "Scan to complete; Pythias prints the label and confirms valid tracking to Walmart in the ship-by window, protecting your on-time delivery rate." },
        ],
    },
    faqs: [
        { q: "How does Pythias protect my Walmart seller metrics?", a: "By removing the manual delays that cause late shipments. Walmart orders route automatically the moment they arrive, production works from a prioritized queue, and valid tracking is confirmed back to Walmart within the ship-by window — keeping your on-time delivery and valid tracking rates above Walmart's standard." },
        { q: "Can I manage Walmart and other marketplaces together?", a: "Yes. Pythias connects to 18+ marketplaces including Walmart, Amazon, Target Plus, Etsy, TikTok Shop, eBay, and Shopify, pulling every order into one production queue with shared inventory and automatic per-channel tracking confirmation." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month. Walmart's referral fees are separate — Pythias's cost stays predictable as your volume grows." },
        { q: "What print methods does Pythias support for Walmart orders?", a: "Pythias supports DTF, DTG, embroidery, and sublimation, each with its own production queue and routing rules — so Walmart orders are automatically directed to the correct workflow with the right design file." },
        { q: "Does Pythias also support Target Plus and other big-box marketplaces?", a: "Yes. Alongside Walmart Marketplace, Pythias integrates with Target Plus and many other marketplaces directly, plus 200+ more channels through Mirakl and Acenda — all from one dashboard." },
    ],
};

const schema = [
    { "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Pythias — Software for Walmart Marketplace Sellers", "description": metadata.description, "url": "https://pythiastechnologies.com/software-for-walmart-sellers", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": { "@type": "Offer", "price": "199", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "month" } }, "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" } },
    { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": data.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [ { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pythiastechnologies.com" }, { "@type": "ListItem", "position": 2, "name": "Software for Walmart Sellers", "item": "https://pythiastechnologies.com/software-for-walmart-sellers" } ] },
];

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <IndustryLayout {...data} />
        </>
    );
}
