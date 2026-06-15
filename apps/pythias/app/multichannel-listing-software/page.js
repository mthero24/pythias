import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Multichannel Listing Software — List & Sync 18+ Marketplaces | Pythias",
    description: "Multichannel listing and inventory management software. Create listings once, sync stock in real time, and route every order across 18+ marketplaces from one dashboard — no per-order fees.",
    keywords: "multichannel listing software, multichannel inventory management software, multichannel ecommerce software, list products on multiple marketplaces, marketplace listing tool, cross-listing software",
    alternates: { canonical: "https://pythiastechnologies.com/multichannel-listing-software" },
    openGraph: {
        title: "Multichannel Listing Software | Pythias Technologies",
        description: "List once, sell everywhere. Sync inventory and orders across 18+ marketplaces from a single platform — with no per-order fees.",
        url: "https://pythiastechnologies.com/multichannel-listing-software",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Multichannel Listing Software | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Multichannel Listing Software",
        h1: <>List Once. <span style={GRAD}>Sell Everywhere.</span><br />Sync Everything.</>,
        sub: "Pythias creates and manages your product listings across 18+ marketplaces, keeps inventory in sync in real time, and pulls every order into one production queue — without per-order fees.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "200+", label: "Channels via Mirakl/Acenda" },
            { value: "Real-time", label: "Inventory Sync" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Listing the same product on five marketplaces shouldn't take five times the work.",
        sub: "Most sellers either copy-paste listings between seller portals or pay per-order fees that eat their margin as they scale. Both break down at volume.",
        items: [
            {
                icon: "📝",
                title: "Re-listing by hand doesn't scale",
                body: "Rebuilding every title, description, image set, and variant in each marketplace's portal is hours of duplicate work — and every channel has different attribute rules that get out of sync the moment you edit one.",
            },
            {
                icon: "📦",
                title: "Inventory drifts out of sync",
                body: "Sell the last unit on TikTok Shop and it's still listed as in-stock on Etsy and Walmart. Oversells mean cancellations, refunds, and account health penalties on every channel.",
            },
            {
                icon: "💸",
                title: "Per-order fees punish growth",
                body: "Listing tools that charge per order quietly scale your costs with your success. The more you sell, the more you pay — exactly backwards from how software pricing should work.",
            },
        ],
    },
    features: {
        title: "One catalog, every channel, always in sync.",
        sub: "Build a product once in Pythias, push it to every marketplace you sell on, and let inventory and orders flow back automatically.",
        items: [
            {
                icon: "🛒",
                title: "List to 18+ Marketplaces",
                body: "Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, Faire, SHEIN, Temu, Meta Shops and more — push a single product to all of them from one screen.",
                bullets: ["Per-channel title, description, and attributes", "Bulk listing and editing", "200+ more channels via Mirakl & Acenda"],
            },
            {
                icon: "🔄",
                title: "Real-Time Inventory Sync",
                body: "One source of truth for stock by blank, color, and size. When a unit sells on any channel, every other listing updates instantly — no overselling, no manual reconciliation.",
                bullets: ["Live stock sync across all channels", "Low-stock and reorder alerts", "Multi-supplier inventory support"],
            },
            {
                icon: "📥",
                title: "Unified Order Management",
                body: "Every order from every marketplace lands in one queue with channel tagging, so your team never logs into a seller portal to fulfill again.",
                bullets: ["Automatic order import from all channels", "Per-channel filtering and tagging", "Tracking + fulfillment sync back to each marketplace"],
            },
            {
                icon: "🧩",
                title: "Per-Channel Attribute Mapping",
                body: "Each marketplace demands its own category fields and attributes. Pythias maps your product data to each channel's requirements so listings pass validation the first time.",
                bullets: ["Marketplace-specific attribute rules", "Category mapping per channel", "Variant and barcode (UPC) support"],
            },
            {
                icon: "🏷️",
                title: "Design & SKU Management",
                body: "Map designs to SKUs, manage variants, and keep a single product catalog that powers every listing — so a change in one place updates everywhere.",
                bullets: ["Central product catalog", "Design-to-SKU mapping", "Bulk variant generation"],
            },
            {
                icon: "📊",
                title: "Cross-Channel Analytics",
                body: "See revenue by marketplace, best-selling products across channels, and fulfillment performance — all in one dashboard instead of eight separate report exports.",
                bullets: ["Revenue by channel", "Top products across marketplaces", "Fulfillment + SLA tracking"],
            },
        ],
    },
    howItWorks: {
        title: "From one product to every marketplace in minutes",
        steps: [
            {
                title: "Connect your channels",
                body: "Link every marketplace and storefront you sell on in a guided onboarding session. Your existing listings and orders start syncing immediately.",
            },
            {
                title: "Build your catalog once",
                body: "Create products with variants, designs, and per-channel attributes in one place. Push them live to every connected marketplace with a click.",
            },
            {
                title: "Sell and let it sync",
                body: "Orders flow into one queue, inventory updates across every channel in real time, and tracking confirms back automatically. You manage one system, not eight.",
            },
        ],
    },
    faqs: [
        { q: "What is multichannel listing software?", a: "Multichannel listing software lets you create a product once and publish it to many marketplaces and storefronts at the same time, then keeps inventory and orders synchronized across all of them. Pythias does this for 18+ channels — plus 200+ more through Mirakl and Acenda — from a single dashboard." },
        { q: "Which marketplaces does Pythias list to?", a: "Pythias integrates directly with 18+ marketplaces including Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, Faire, SHEIN, Temu, and Meta Shops. Through Mirakl and Acenda connections you can reach 200+ additional retail channels." },
        { q: "How does inventory sync work across channels?", a: "Pythias maintains a single source of truth for your stock by blank, color, and size. When a unit sells on any connected channel, every other listing is updated in real time, which prevents overselling and the cancellations that hurt your marketplace account health." },
        { q: "Does Pythias charge per-order fees like other listing tools?", a: "No. Pythias is a flat subscription with no per-order fees, so your costs don't scale with your order volume. Plans start at $199/month — at even modest volume the math typically favors Pythias over per-order pricing." },
        { q: "Can Pythias handle product variants and marketplace-specific attributes?", a: "Yes. Pythias supports full variant management (color, size, etc.), UPC/barcode assignment, and per-channel attribute mapping so each marketplace receives the category fields and attributes it requires to publish a valid listing." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Multichannel Listing Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/multichannel-listing-software",
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
            { "@type": "ListItem", "position": 2, "name": "Multichannel Listing Software", "item": "https://pythiastechnologies.com/multichannel-listing-software" },
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
