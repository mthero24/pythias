import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Shopify Sellers — Fulfillment & Order Automation | Pythias",
    description: "Fulfillment and order management software for Shopify sellers. Pull Shopify orders into one production queue, route and ship automatically, and sell across 18+ other channels too. No per-order fees.",
    keywords: "software for shopify sellers, shopify fulfillment software, shopify order management, shopify production software, shopify multichannel software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-shopify-sellers" },
    openGraph: {
        title: "Software for Shopify Sellers | Pythias Technologies",
        description: "Automate Shopify order routing, production, and shipping — and run every other marketplace from the same dashboard. No per-order fees.",
        url: "https://pythiastechnologies.com/software-for-shopify-sellers",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Shopify Sellers | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Software for Shopify Sellers",
        h1: <>Your <span style={GRAD}>Shopify</span> Store.<br />Fulfillment on Autopilot.</>,
        sub: "Pythias is the production and fulfillment backend for your Shopify store — it pulls orders into one queue, routes them automatically, prints labels, and syncs tracking back to Shopify, while running every other channel you sell on.",
        stats: [
            { value: "Auto", label: "Shopify Order Sync" },
            { value: "18+", label: "Other Channels Too" },
            { value: "Real-time", label: "Inventory Sync" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Shopify is great at checkout. It was never built to run your production floor.",
        sub: "Once orders land in Shopify, you still have to produce, pick the right design, ship, and confirm tracking — usually across more channels than just Shopify.",
        items: [
            {
                icon: "🖨️",
                title: "Shopify doesn't manage production",
                body: "Your Shopify order doesn't know whether it's DTF or embroidery, which design file it needs, or who's making it. Bridging Shopify to your production floor by hand is slow and error-prone.",
            },
            {
                icon: "🔀",
                title: "Shopify is rarely your only channel",
                body: "You're also on Etsy, Amazon, TikTok Shop, and Walmart. Managing Shopify separately means another dashboard and another place for inventory to drift out of sync.",
            },
            {
                icon: "🚚",
                title: "Apps stack up fast",
                body: "A fulfillment app, an inventory app, a shipping app, a routing app — each a monthly fee and another integration to maintain. The Shopify app sprawl becomes its own problem.",
            },
        ],
    },
    features: {
        title: "Everything behind your Shopify checkout, in one platform.",
        sub: "Pythias takes Shopify orders from paid to shipped automatically — and unifies them with every other channel you sell on.",
        items: [
            {
                icon: "📥",
                title: "Automatic Shopify Order Import",
                body: "Paid Shopify orders flow into your production queue in real time with full customer and line-item detail — no manual export, no copy-paste.",
                bullets: ["Real-time Shopify order sync", "Full line-item + address detail", "Channel tagging across all stores"],
            },
            {
                icon: "🧭",
                title: "Automated Production Routing",
                body: "Each order routes by print method, priority, and ship speed with the correct design file attached — your team works one clean, prioritized list.",
                bullets: ["Route by print type + priority", "Rush/deadline sorting", "Print-ready file routing"],
            },
            {
                icon: "🚚",
                title: "Labels & Tracking Back to Shopify",
                body: "Scan a completed order and Pythias prints the carrier label, captures tracking, and marks the Shopify order fulfilled — your customer gets tracking automatically.",
                bullets: ["USPS, FedEx, UPS labels", "Auto-fulfill + tracking to Shopify", "Rate comparison at label time"],
            },
            {
                icon: "🌐",
                title: "Shopify + Every Marketplace",
                body: "Run Amazon, Etsy, TikTok Shop, Walmart, eBay and more alongside Shopify — all orders in one queue, all inventory in sync, all tracking confirmed automatically.",
                bullets: ["18+ marketplace integrations", "Unified production queue", "Cross-channel inventory sync"],
            },
            {
                icon: "📦",
                title: "Inventory & Stock Control",
                body: "Live blank inventory by color and size keeps your Shopify listings accurate and prevents the oversells that lead to refunds and cancellations.",
                bullets: ["Real-time stock tracking", "Low-stock + reorder alerts", "Multi-supplier support"],
            },
            {
                icon: "📊",
                title: "Revenue & Fulfillment Analytics",
                body: "Compare Shopify revenue to your marketplaces, track fulfillment rate and daily output, and see your whole operation in one dashboard.",
                bullets: ["Revenue by channel", "Fulfillment + on-time rate", "Daily output reporting"],
            },
        ],
    },
    howItWorks: {
        title: "From Shopify order to shipped in one automated flow",
        steps: [
            {
                title: "Connect your Shopify store",
                body: "Link Shopify and any other channels you sell on. Orders start importing into one unified production queue right away.",
            },
            {
                title: "Orders route themselves",
                body: "Every Shopify order is sorted by print method, priority, and ship-by date with the right file attached — no manual triage.",
            },
            {
                title: "Ship and auto-fulfill",
                body: "Scan to complete; Pythias prints the label and marks the Shopify order fulfilled with tracking, so your customer is notified automatically.",
            },
        ],
    },
    faqs: [
        { q: "Does Pythias replace my Shopify store?", a: "No — Pythias runs behind your Shopify store. You keep Shopify for your storefront and checkout; Pythias becomes the production and fulfillment backend that imports the orders, routes them to your team, prints labels, and confirms tracking back to Shopify automatically." },
        { q: "Can I run Shopify and marketplaces together in Pythias?", a: "Yes. Pythias connects to 18+ channels including Shopify, Amazon, Etsy, TikTok Shop, Walmart, and eBay, pulling every order into one production queue with shared inventory and per-channel tracking confirmation." },
        { q: "How many Shopify apps can Pythias replace?", a: "For production-based sellers, Pythias typically replaces a stack of separate fulfillment, inventory, routing, and shipping apps with one platform — which also covers your other marketplaces, not just Shopify." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month, so your costs stay predictable as your Shopify volume grows." },
        { q: "What print methods does Pythias support for Shopify orders?", a: "Pythias supports DTF, DTG, embroidery, and sublimation, each with its own production queue and routing rules — so Shopify orders are automatically directed to the correct workflow with the right design file." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Software for Shopify Sellers",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-shopify-sellers",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Shopify Sellers", "item": "https://pythiastechnologies.com/software-for-shopify-sellers" },
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
