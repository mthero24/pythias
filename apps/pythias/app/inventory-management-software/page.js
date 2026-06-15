import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Inventory Management Software for Multichannel Sellers | Pythias",
    description: "Real-time inventory management software for print and ecommerce operations. Track stock by blank, color, and size, sync across 18+ marketplaces, and get reorder alerts before you run out. No per-order fees.",
    keywords: "inventory management software, multichannel inventory software, ecommerce inventory management, stock management software, inventory sync software, blank inventory tracking",
    alternates: { canonical: "https://pythiastechnologies.com/inventory-management-software" },
    openGraph: {
        title: "Inventory Management Software | Pythias Technologies",
        description: "One source of truth for stock across every channel — real-time sync, reorder alerts, and no overselling. No per-order fees.",
        url: "https://pythiastechnologies.com/inventory-management-software",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Inventory Management Software | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Inventory Management Software",
        h1: <>One Source of Truth<br />for <span style={GRAD}>Every Channel</span></>,
        sub: "Pythias tracks your stock by blank, color, and size, syncs it across 18+ marketplaces in real time, and alerts you before you run out — so you never oversell or scramble for blanks again.",
        stats: [
            { value: "Real-time", label: "Cross-Channel Sync" },
            { value: "18+", label: "Marketplaces Synced" },
            { value: "Auto", label: "Reorder Alerts" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Selling everywhere is great — until your inventory can't keep up.",
        sub: "When the same stock feeds a dozen channels and a production floor, a spreadsheet stops being inventory management and starts being a liability.",
        items: [
            {
                icon: "📉",
                title: "Overselling kills your account health",
                body: "Sell the last unit on one channel and it's still live on five others. The cancellations and refunds that follow damage your seller metrics on every marketplace at once.",
            },
            {
                icon: "🧮",
                title: "Spreadsheets can't track what you actually make",
                body: "Production sellers don't just hold finished goods — they hold blanks by style, color, and size. A spreadsheet can't tell you what you can actually produce right now.",
            },
            {
                icon: "🛒",
                title: "You find out you're out of stock too late",
                body: "Without reorder alerts tied to real demand across channels, you discover a shortage when an order is already on the floor — and the customer is already waiting.",
            },
        ],
    },
    features: {
        title: "Inventory built for sellers who produce and sell everywhere.",
        sub: "Track raw and finished stock, sync it across every channel, and stay ahead of demand with automatic alerts.",
        items: [
            {
                icon: "📦",
                title: "Stock by Blank, Color & Size",
                body: "Track inventory at the granularity production actually needs — every style, every color, every size — not just a single finished-goods count.",
                bullets: ["Variant-level stock tracking", "Raw blank + finished goods", "Accurate counts for production planning"],
            },
            {
                icon: "🔄",
                title: "Real-Time Multichannel Sync",
                body: "One source of truth pushes stock levels to every connected marketplace instantly. Sell on any channel and all the others update — no overselling, no manual reconciliation.",
                bullets: ["Live sync across 18+ channels", "No overselling across marketplaces", "Two-way order + stock updates"],
            },
            {
                icon: "🔔",
                title: "Automated Reorder Alerts",
                body: "Set thresholds and let Pythias warn you before you run out, based on real demand across every channel — so you reorder blanks on time, every time.",
                bullets: ["Low-stock thresholds", "Demand-aware alerts", "Reorder before it hits the floor"],
            },
            {
                icon: "🏭",
                title: "Production-Aware Inventory",
                body: "Inventory is checked against incoming orders so you know what can ship now versus what's blocked — bridging the gap between your stock and your production queue.",
                bullets: ["Stock checks at order time", "Ship-now vs blocked visibility", "Tied directly to production queue"],
            },
            {
                icon: "🏢",
                title: "Multi-Supplier Support",
                body: "Track which supplier stocks which blanks and manage replenishment across multiple vendors from one place.",
                bullets: ["Multiple suppliers per blank", "Per-supplier reorder tracking", "Centralized replenishment"],
            },
            {
                icon: "📊",
                title: "Inventory Analytics",
                body: "See what's moving, what's sitting, and what's about to run out across every channel — so purchasing decisions are driven by data, not guesswork.",
                bullets: ["Sell-through by SKU", "Stock-on-hand reporting", "Demand trends by channel"],
            },
        ],
    },
    howItWorks: {
        title: "Accurate inventory across every channel in under 2 weeks",
        steps: [
            {
                title: "Import your stock",
                body: "Load your blanks and finished products by style, color, and size, and connect every channel you sell on.",
            },
            {
                title: "Sync turns on automatically",
                body: "Pythias becomes your single source of truth — every sale on any channel updates stock everywhere in real time.",
            },
            {
                title: "Stay ahead of demand",
                body: "Reorder alerts fire before you run short, and order-time stock checks keep production moving without surprises.",
            },
        ],
    },
    faqs: [
        { q: "What makes Pythias inventory management different?", a: "Pythias tracks inventory at the level production actually needs — by blank, color, and size — and syncs it across 18+ marketplaces in real time. It's built for sellers who both produce and sell everywhere, so inventory is tied directly to your production queue and your channel listings, not just a standalone count." },
        { q: "Does Pythias prevent overselling across marketplaces?", a: "Yes. Pythias maintains one source of truth for stock and updates every connected channel in real time when a unit sells anywhere, which prevents the oversells that cause cancellations and damage your marketplace account health." },
        { q: "Can it track blanks across multiple suppliers?", a: "Yes. Pythias supports multiple suppliers per blank, tracks stock by style/color/size, and provides reorder alerts so you can replenish from the right vendor before you run out." },
        { q: "How many sales channels can it sync inventory across?", a: "Pythias syncs inventory across 18+ direct marketplace integrations — including Amazon, Walmart, Etsy, TikTok Shop, Shopify, and eBay — plus 200+ more channels through Mirakl and Acenda." },
        { q: "Does Pythias charge per order or per SKU?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month, so your costs stay predictable as your catalog and order volume grow." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Inventory Management Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/inventory-management-software",
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
            { "@type": "ListItem", "position": 2, "name": "Inventory Management Software", "item": "https://pythiastechnologies.com/inventory-management-software" },
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
