import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Order Management Software for Ecommerce — Multichannel OMS | Pythias",
    description: "Ecommerce order management software that pulls every marketplace order into one queue, routes it to production or fulfillment automatically, and syncs tracking back to each channel. No per-order fees.",
    keywords: "order management software, ecommerce order management software, order management system, multichannel order management, OMS for ecommerce, order fulfillment software",
    alternates: { canonical: "https://pythiastechnologies.com/order-management-software" },
    openGraph: {
        title: "Order Management Software | Pythias Technologies",
        description: "One queue for every marketplace order — routed, produced, shipped, and confirmed automatically. No per-order fees.",
        url: "https://pythiastechnologies.com/order-management-software",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Order Management Software | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Order Management Software",
        h1: <>Every Order. <span style={GRAD}>One Queue.</span><br />Fully Automated.</>,
        sub: "Pythias is the order management system for sellers and fulfillment teams — it imports orders from 18+ marketplaces, routes them by rules you control, and confirms tracking back to every channel automatically.",
        stats: [
            { value: "18+", label: "Order Sources" },
            { value: "1", label: "Unified Queue" },
            { value: "Auto", label: "Routing & Tracking" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Orders scattered across eight seller portals is how things slip through the cracks.",
        sub: "Manual order handling works until it doesn't. Add a channel or double your volume and missed orders, late shipments, and account penalties follow.",
        items: [
            {
                icon: "🔀",
                title: "Order data lives in too many places",
                body: "Amazon, Etsy, TikTok Shop, Shopify, Walmart — each with its own dashboard, export format, and fulfillment confirmation flow. Switching between them all day means orders get missed and SLAs get blown.",
            },
            {
                icon: "⏱️",
                title: "Manual routing is slow and error-prone",
                body: "Deciding which order is rush, which print method it needs, and who fulfills it — by hand, off a spreadsheet — doesn't hold up at volume. One mis-routed order becomes a refund and a bad review.",
            },
            {
                icon: "🔁",
                title: "Tracking confirmation is a second full-time job",
                body: "Every marketplace needs tracking pushed back in its own way and on its own deadline. Miss the window and you take a late-shipment hit on your seller metrics.",
            },
        ],
    },
    features: {
        title: "A complete order management system, not just a list of orders.",
        sub: "Pythias imports, routes, fulfills, and confirms — turning a pile of orders from every channel into one clean, automated workflow.",
        items: [
            {
                icon: "📥",
                title: "Unified Multichannel Order Import",
                body: "Orders from all 18+ connected marketplaces flow into a single queue in real time, tagged by channel, with full customer and line-item detail — no manual export or copy-paste.",
                bullets: ["Real-time import from every channel", "Channel tagging and filtering", "Full line-item + address detail"],
            },
            {
                icon: "🧭",
                title: "Rules-Based Order Routing",
                body: "Route orders automatically by print method, priority, shipping speed, or fulfillment partner. Each order lands where it should with the right files attached — no human triage.",
                bullets: ["Route by print type, priority, or partner", "Deadline + rush sorting", "Correct design file attached automatically"],
            },
            {
                icon: "🚚",
                title: "Shipping Labels & Tracking Sync",
                body: "Generate carrier labels on completion, capture tracking, and confirm fulfillment back to every marketplace in seconds — so your seller metrics stay healthy.",
                bullets: ["USPS, FedEx, UPS labels", "Auto-confirm tracking to each channel", "Rate comparison at label time"],
            },
            {
                icon: "📦",
                title: "Inventory-Aware Fulfillment",
                body: "Orders are checked against live inventory by blank, color, and size, so you know what can ship now and what's blocked before it hits the floor.",
                bullets: ["Live stock checks at order time", "Low-stock + reorder alerts", "Multi-supplier support"],
            },
            {
                icon: "👥",
                title: "Team Workflow & Roles",
                body: "Give production, shipping, and management their own views and permissions. Scan-to-complete keeps the floor moving and gives managers real-time status.",
                bullets: ["Role-based access", "Scan-to-complete production flow", "Live status for every order"],
            },
            {
                icon: "📊",
                title: "Order Analytics & SLA Tracking",
                body: "Track fulfillment rate, on-time performance, revenue by channel, and daily output. Catch bottlenecks before they become marketplace penalties.",
                bullets: ["Fulfillment + on-time rate", "Revenue by marketplace", "Daily output reporting"],
            },
        ],
    },
    howItWorks: {
        title: "Stand up automated order management in under 2 weeks",
        steps: [
            {
                title: "Connect every order source",
                body: "Link all your marketplaces and storefronts. Existing and new orders start flowing into one unified queue right away.",
            },
            {
                title: "Set your routing rules",
                body: "Define how orders should route — by print method, priority, shipping speed, or fulfillment partner. Pythias applies them automatically to every incoming order.",
            },
            {
                title: "Fulfill and confirm automatically",
                body: "Your team produces from one prioritized queue, scans to complete, and Pythias prints labels and confirms tracking back to every channel — no portal-hopping.",
            },
        ],
    },
    faqs: [
        { q: "What is order management software?", a: "Order management software (an OMS) centralizes orders from all your sales channels into one system, then automates routing, fulfillment, and tracking confirmation. Pythias is a multichannel OMS purpose-built for sellers and fulfillment operations — it imports from 18+ marketplaces, routes by rules you control, and confirms tracking back to each channel." },
        { q: "How is Pythias different from ShipStation?", a: "ShipStation focuses on shipping labels. Pythias covers the whole order lifecycle — multichannel order import, rules-based routing, production queue management, inventory checks, label generation, and tracking sync — in one platform. For sellers running production or fulfillment, Pythias replaces several tools at once." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month. Your costs stay predictable as your order volume grows instead of scaling up with every order." },
        { q: "Can I control how orders are routed?", a: "Yes. You set the rules — route by print method, priority level, shipping speed, or fulfillment partner. Every incoming order is triaged automatically with the correct files attached, so nothing waits on manual sorting." },
        { q: "Which sales channels can feed orders into Pythias?", a: "Pythias imports orders from 18+ direct integrations including Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, Faire, SHEIN, Temu, and Meta Shops, plus 200+ more channels via Mirakl and Acenda." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Order Management Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/order-management-software",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "199", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "month" } },
        "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    },
    {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": data.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
    },
    {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pythiastechnologies.com" },
            { "@type": "ListItem", "position": 2, "name": "Order Management Software", "item": "https://pythiastechnologies.com/order-management-software" },
        ],
    },
];

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <IndustryLayout {...data} />
        </>
    );
}
