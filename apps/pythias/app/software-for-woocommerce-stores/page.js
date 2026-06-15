import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for WooCommerce Stores — Fulfillment & Order Automation | Pythias",
    description: "Fulfillment and order management software for WooCommerce stores. Pull WooCommerce orders into one production queue, route and ship automatically, and sell across 18+ other channels. No per-order fees.",
    keywords: "software for woocommerce, woocommerce fulfillment software, woocommerce order management, woocommerce production software, woocommerce multichannel",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-woocommerce-stores" },
    openGraph: {
        title: "Software for WooCommerce Stores | Pythias Technologies",
        description: "Automate WooCommerce order routing, production, and shipping — and run every other marketplace from the same dashboard. No per-order fees.",
        url: "https://pythiastechnologies.com/software-for-woocommerce-stores",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for WooCommerce Stores | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Software for WooCommerce",
        h1: <>Your <span style={GRAD}>WooCommerce</span> Store.<br />Fulfillment on Autopilot.</>,
        sub: "Pythias is the production and fulfillment backend for your WooCommerce store — it pulls orders into one queue, routes them automatically, prints labels, and syncs tracking back to WooCommerce, while running every other channel you sell on.",
        stats: [
            { value: "Auto", label: "WooCommerce Sync" },
            { value: "18+", label: "Other Channels Too" },
            { value: "Real-time", label: "Inventory Sync" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "WooCommerce is flexible — but it doesn't run your production floor.",
        sub: "Once orders land in WooCommerce you still have to produce, pick the right design, ship, and confirm tracking — usually across more channels than just your store.",
        items: [
            { icon: "🧩", title: "Plugin sprawl gets out of hand", body: "A fulfillment plugin, an inventory plugin, a shipping plugin, a sync plugin — each one a dependency that can break with the next WordPress or WooCommerce update. The stack becomes its own maintenance burden." },
            { icon: "🔀", title: "WooCommerce is rarely your only channel", body: "You also sell on Etsy, Amazon, TikTok Shop, and Walmart. Managing WooCommerce separately means another dashboard and another place inventory drifts out of sync." },
            { icon: "🖨️", title: "Orders don't reach production cleanly", body: "A WooCommerce order doesn't know its print method or which design file it needs. Bridging that to your floor by hand slows everything down." },
        ],
    },
    features: {
        title: "Everything behind your WooCommerce checkout, in one platform.",
        sub: "Pythias takes WooCommerce orders from paid to shipped automatically — and unifies them with every other channel you sell on.",
        items: [
            { icon: "📥", title: "Automatic WooCommerce Order Import", body: "Paid WooCommerce orders flow into your production queue in real time with full customer and line-item detail — no manual export, no copy-paste.", bullets: ["Real-time WooCommerce order sync", "Full line-item + address detail", "Channel tagging across stores"] },
            { icon: "🧭", title: "Automated Production Routing", body: "Each order routes by print method, priority, and ship speed with the correct design file attached — your team works one clean, prioritized list.", bullets: ["Route by print type + priority", "Rush/deadline sorting", "Print-ready file routing"] },
            { icon: "🚚", title: "Labels & Tracking Back to WooCommerce", body: "Scan a completed order and Pythias prints the carrier label, captures tracking, and marks the WooCommerce order complete — your customer gets tracking automatically.", bullets: ["USPS, FedEx, UPS labels", "Auto-complete + tracking to WooCommerce", "Rate comparison at label time"] },
            { icon: "🌐", title: "WooCommerce + Every Marketplace", body: "Run Amazon, Etsy, TikTok Shop, Walmart, eBay, and Shopify alongside WooCommerce — all orders in one queue, all inventory in sync, all tracking confirmed automatically.", bullets: ["18+ marketplace integrations", "Unified production queue", "Cross-channel inventory sync"] },
            { icon: "📦", title: "Inventory & Stock Control", body: "Live blank inventory by color and size keeps your WooCommerce listings accurate and prevents oversells that lead to refunds.", bullets: ["Real-time stock tracking", "Low-stock + reorder alerts", "Multi-supplier support"] },
            { icon: "📊", title: "Revenue & Fulfillment Analytics", body: "Compare WooCommerce revenue to your marketplaces, track fulfillment rate and daily output, and see your whole operation in one dashboard.", bullets: ["Revenue by channel", "Fulfillment + on-time rate", "Daily output reporting"] },
        ],
    },
    howItWorks: {
        title: "From WooCommerce order to shipped in one automated flow",
        steps: [
            { title: "Connect your WooCommerce store", body: "Link WooCommerce and any other channels you sell on. Orders start importing into one unified production queue right away." },
            { title: "Orders route themselves", body: "Every WooCommerce order is sorted by print method, priority, and ship-by date with the right file attached — no manual triage." },
            { title: "Ship and auto-complete", body: "Scan to complete; Pythias prints the label and marks the WooCommerce order complete with tracking, so your customer is notified automatically." },
        ],
    },
    faqs: [
        { q: "Does Pythias replace my WooCommerce store?", a: "No — Pythias runs behind your WooCommerce store. You keep WooCommerce for your storefront and checkout; Pythias becomes the production and fulfillment backend that imports the orders, routes them to your team, prints labels, and confirms tracking back to WooCommerce automatically." },
        { q: "How many WooCommerce plugins can Pythias replace?", a: "For production-based sellers, Pythias typically replaces a stack of separate fulfillment, inventory, routing, and shipping plugins with one platform — which also covers your other marketplaces, not just WooCommerce, removing a lot of update-fragile dependencies." },
        { q: "Can I run WooCommerce and marketplaces together?", a: "Yes. Pythias connects to 18+ channels including WooCommerce, Amazon, Etsy, TikTok Shop, Walmart, and eBay, pulling every order into one production queue with shared inventory and per-channel tracking confirmation." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month, so your costs stay predictable as your WooCommerce volume grows." },
        { q: "What print methods does Pythias support for WooCommerce orders?", a: "Pythias supports DTF, DTG, embroidery, and sublimation, each with its own production queue and routing rules — so WooCommerce orders are automatically directed to the correct workflow with the right design file." },
    ],
};

const schema = [
    { "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Pythias — Software for WooCommerce Stores", "description": metadata.description, "url": "https://pythiastechnologies.com/software-for-woocommerce-stores", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": { "@type": "Offer", "price": "199", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "month" } }, "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" } },
    { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": data.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [ { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pythiastechnologies.com" }, { "@type": "ListItem", "position": 2, "name": "Software for WooCommerce Stores", "item": "https://pythiastechnologies.com/software-for-woocommerce-stores" } ] },
];

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <IndustryLayout {...data} />
        </>
    );
}
