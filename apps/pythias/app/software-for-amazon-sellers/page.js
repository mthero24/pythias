import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Amazon Sellers — Order & Fulfillment Automation | Pythias",
    description: "Fulfillment and order management software for Amazon sellers. Auto-import Amazon orders, route to production, print labels, and confirm tracking — while selling across 18+ other channels too. No per-order fees.",
    keywords: "software for amazon sellers, amazon order management software, amazon fulfillment software, amazon seller tools, merchant fulfilled network software, amazon mfn software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-amazon-sellers" },
    openGraph: {
        title: "Software for Amazon Sellers | Pythias Technologies",
        description: "Automate Amazon order routing, production, and shipping — and run every other marketplace from the same dashboard. No per-order fees.",
        url: "https://pythiastechnologies.com/software-for-amazon-sellers",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Amazon Sellers | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Software for Amazon Sellers",
        h1: <>Sell on <span style={GRAD}>Amazon</span>.<br />Fulfill on Autopilot.</>,
        sub: "Pythias pulls your Amazon orders into one production queue, routes them automatically, prints labels, and confirms tracking back to Amazon — all while managing every other marketplace you sell on.",
        stats: [
            { value: "Auto", label: "Amazon Order Import" },
            { value: "18+", label: "Other Channels Too" },
            { value: "On-time", label: "Tracking Confirmation" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Amazon's metrics are unforgiving — and manual fulfillment is how sellers lose them.",
        sub: "Merchant-fulfilled Amazon sellers live and die by on-time shipment and valid tracking rate. Doing it by hand across multiple channels is a recipe for account-health trouble.",
        items: [
            {
                icon: "⏱️",
                title: "Late shipments tank your account health",
                body: "Amazon penalizes late dispatch and invalid tracking hard. When orders sit in a spreadsheet waiting to be triaged, your Late Shipment Rate climbs and your Buy Box and account standing suffer.",
            },
            {
                icon: "🔀",
                title: "Amazon is never your only channel",
                body: "You're also on Etsy, TikTok Shop, Walmart, and your own store. Managing Amazon in isolation means another dashboard, another export, another place for orders to get missed.",
            },
            {
                icon: "🖨️",
                title: "Production and fulfillment are disconnected",
                body: "Your Amazon order doesn't know which print method it needs or which design file goes with it. Bridging that gap by hand slows every order and invites mistakes.",
            },
        ],
    },
    features: {
        title: "Everything an Amazon seller needs to fulfill fast and stay compliant.",
        sub: "Pythias automates the path from Amazon order to confirmed shipment — and runs all your other channels from the same place.",
        items: [
            {
                icon: "📥",
                title: "Automatic Amazon Order Import",
                body: "Merchant-fulfilled Amazon orders flow into your production queue in real time with full buyer and line-item detail — no Seller Central exports, no copy-paste.",
                bullets: ["Real-time Amazon order sync", "Full line-item + address detail", "Channel tagging across all marketplaces"],
            },
            {
                icon: "🚚",
                title: "On-Time Tracking Confirmation",
                body: "Scan a completed order and Pythias prints the carrier label and confirms valid tracking back to Amazon inside the dispatch window — protecting your Late Shipment Rate.",
                bullets: ["USPS, FedEx, UPS labels", "Valid tracking pushed to Amazon", "Dispatch-window aware workflow"],
            },
            {
                icon: "🧭",
                title: "Automated Order Routing",
                body: "Route every Amazon order by print method, priority, and shipping speed with the correct design file attached — so production starts immediately and rush orders never wait.",
                bullets: ["Route by print type + priority", "Rush/deadline sorting", "Print-ready file routing"],
            },
            {
                icon: "🌐",
                title: "Every Other Channel, One Dashboard",
                body: "Run Etsy, TikTok Shop, Walmart, Shopify, eBay, and more alongside Amazon — all orders in one queue, all inventory in sync, all tracking confirmed automatically.",
                bullets: ["18+ marketplace integrations", "Unified production queue", "Real-time inventory sync across channels"],
            },
            {
                icon: "📦",
                title: "Inventory & Stock Control",
                body: "Live blank inventory by color and size keeps your Amazon listings accurate and prevents the oversells that trigger cancellations and metric hits.",
                bullets: ["Real-time stock tracking", "Low-stock + reorder alerts", "Multi-supplier support"],
            },
            {
                icon: "📊",
                title: "Revenue & Fulfillment Analytics",
                body: "See Amazon revenue against your other channels, fulfillment rate, on-time performance, and daily output — the numbers that keep your account healthy and your margins clear.",
                bullets: ["Revenue by channel", "On-time + fulfillment rate", "Daily output reporting"],
            },
        ],
    },
    howItWorks: {
        title: "From Amazon order to confirmed shipment, automatically",
        steps: [
            {
                title: "Connect Seller Central",
                body: "Link your Amazon account and any other channels you sell on. Orders begin importing into one unified production queue immediately.",
            },
            {
                title: "Orders route themselves",
                body: "Each Amazon order is sorted by print method, priority, and ship-by date with the right file attached — your team works one clean, prioritized list.",
            },
            {
                title: "Ship and confirm in the window",
                body: "Scan to complete; Pythias prints the label and pushes valid tracking to Amazon on time, protecting your seller metrics on every order.",
            },
        ],
    },
    faqs: [
        { q: "Does Pythias work for merchant-fulfilled (MFN) Amazon sellers?", a: "Yes. Pythias is built for merchant-fulfilled and seller-fulfilled-prime style operations — it imports your Amazon orders, routes them to production, generates carrier labels, and confirms valid tracking back to Amazon within the dispatch window to protect your Late Shipment Rate." },
        { q: "Can I manage Amazon and other marketplaces together?", a: "Absolutely — that's the point. Pythias connects to 18+ marketplaces including Amazon, Walmart, Etsy, TikTok Shop, Shopify, and eBay, pulling every order into one production queue with shared inventory and automatic tracking confirmation per channel." },
        { q: "How does Pythias protect my Amazon account health?", a: "By removing the manual delays that cause late shipments. Orders route automatically the moment they arrive, production works from a prioritized queue, and tracking is confirmed back to Amazon on completion — keeping your Late Shipment Rate and valid tracking rate where Amazon wants them." },
        { q: "Does Pythias charge Amazon-style per-order or referral fees?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month. Whatever Amazon charges in referral fees is separate — Pythias's cost stays predictable as your volume grows." },
        { q: "What print methods does Pythias support for Amazon orders?", a: "Pythias supports DTF, DTG, embroidery, and sublimation, each with its own production queue and routing rules — so Amazon orders are automatically directed to the correct workflow with the right design file." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Software for Amazon Sellers",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-amazon-sellers",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Amazon Sellers", "item": "https://pythiastechnologies.com/software-for-amazon-sellers" },
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
