import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Screen Printing Shops — Order & Fulfillment Automation | Pythias",
    description: "Order management and fulfillment software for screen printing shops selling online. Pull marketplace and store orders into one production queue, route them, ship, and sync tracking. No per-order fees.",
    keywords: "software for screen printing shops, screen printing order management software, screen print shop software, screen printing fulfillment software, screen printing business software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-screen-printing-shops" },
    openGraph: {
        title: "Software for Screen Printing Shops | Pythias Technologies",
        description: "Automate the order, production, and fulfillment side of your screen printing shop across 18+ sales channels — no per-order fees.",
        url: "https://pythiastechnologies.com/software-for-screen-printing-shops",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Screen Printing Shops | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Software for Screen Printing Shops",
        h1: <>Run Your <span style={GRAD}>Screen Printing</span><br />Orders on Autopilot</>,
        sub: "Pythias is the order management and fulfillment layer for screen printing shops selling online — it pulls every marketplace and store order into one production queue, routes it, ships it, and confirms tracking automatically.",
        stats: [
            { value: "18+", label: "Sales Channels" },
            { value: "1", label: "Unified Production Queue" },
            { value: "Auto", label: "Labels & Tracking" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Screen printing software handles quoting. Your online orders need something else.",
        sub: "Quote-and-invoice tools are built for custom and wholesale jobs. When you sell finished designs across marketplaces, you need order automation, inventory, and fulfillment — not another quote form.",
        items: [
            {
                icon: "🔀",
                title: "Online orders scatter across channels",
                body: "Etsy, Amazon, TikTok Shop, Walmart, and your own store each have their own portal. Pulling those orders to the press by hand is where deadlines slip and orders get missed.",
            },
            {
                icon: "📦",
                title: "Blank inventory is a guessing game",
                body: "Knowing whether you have the right blanks in the right colors and sizes before a run — across every channel's demand — is nearly impossible on a spreadsheet.",
            },
            {
                icon: "🚚",
                title: "Shipping and tracking eat the day",
                body: "Generating labels and pushing tracking back to each marketplace, one order at a time, is hours your shop should spend printing — and missed windows hurt your seller metrics.",
            },
        ],
    },
    features: {
        title: "The operations backbone for a screen printing shop that sells online.",
        sub: "Pythias automates everything around the press — orders in, production routed, blanks tracked, labels out, tracking confirmed.",
        items: [
            {
                icon: "📥",
                title: "Unified Multichannel Orders",
                body: "Every order from 18+ marketplaces and your own store flows into one production queue in real time, tagged by channel — no portal-hopping, no copy-paste.",
                bullets: ["Real-time import from all channels", "Channel tagging + filtering", "Full line-item detail with the design"],
            },
            {
                icon: "🧭",
                title: "Production Queue & Routing",
                body: "Sort and route orders by priority, ship-by date, and workflow with the correct artwork attached, so your team always knows what's printing next.",
                bullets: ["Priority + deadline sorting", "Configurable production workflows", "Print-ready artwork routing"],
            },
            {
                icon: "📦",
                title: "Blank Inventory Management",
                body: "Track blank stock by style, color, and size with reorder alerts, so you know what you can run before an order hits the floor — and reorder before you run short.",
                bullets: ["Stock by style + color + size", "Automated reorder alerts", "Multi-supplier support"],
            },
            {
                icon: "🚚",
                title: "Shipping Labels & Tracking Sync",
                body: "Scan a completed order and Pythias prints the carrier label, captures tracking, and confirms fulfillment back to every marketplace automatically.",
                bullets: ["USPS, FedEx, UPS labels", "Auto-confirm tracking per channel", "Rate comparison at label time"],
            },
            {
                icon: "🏷️",
                title: "Design & SKU Management",
                body: "Map artwork to SKUs and variants so the right file reaches the right job every time, across every channel you list on.",
                bullets: ["Design library with SKU mapping", "Variant management", "Multi-channel listing"],
            },
            {
                icon: "📊",
                title: "Output & Revenue Analytics",
                body: "Daily output, revenue by channel, fulfillment rate, and SLA tracking — the numbers that tell you how the shop is really running.",
                bullets: ["Daily output reports", "Revenue by marketplace", "Fulfillment + on-time rate"],
            },
        ],
    },
    howItWorks: {
        title: "Stand up automated online-order operations in under 2 weeks",
        steps: [
            {
                title: "Connect your sales channels",
                body: "Link every marketplace and store you sell finished designs on. Orders start flowing into one production queue immediately.",
            },
            {
                title: "Route to the press",
                body: "Orders sort by priority and ship-by date with artwork attached, so your team prints from one clean, prioritized list.",
            },
            {
                title: "Ship and confirm automatically",
                body: "Scan to complete; Pythias prints the label and confirms tracking back to every channel — protecting your seller metrics.",
            },
        ],
    },
    faqs: [
        { q: "Is Pythias a screen printing quote and invoicing tool?", a: "No — and that's the point. Tools like Printavo focus on quoting, invoicing, and CRM for custom and wholesale jobs. Pythias handles the other side: automating the orders, production routing, blank inventory, shipping, and tracking for screen printing shops that sell finished designs across online marketplaces and storefronts. Many shops run both." },
        { q: "Does Pythias work for shops selling on marketplaces?", a: "Yes — it's built for it. Pythias connects to 18+ channels including Amazon, Etsy, TikTok Shop, Walmart, eBay, and Shopify, pulling every order into one production queue with shared blank inventory and automatic tracking confirmation per channel." },
        { q: "Can Pythias track my blank inventory?", a: "Yes. Pythias tracks blanks by style, color, and size with low-stock and reorder alerts, so you know what you can run before scheduling a job and can reorder before you run short across all your channels' demand." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month, so your costs stay predictable as your order volume grows." },
        { q: "Can I run screen printing alongside other decoration methods?", a: "Yes. Pythias routes orders into configurable production queues and also supports DTF, DTG, embroidery, and sublimation workflows — so a shop running multiple decoration methods can keep each one's orders organized and prioritized in one system." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Software for Screen Printing Shops",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-screen-printing-shops",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Screen Printing Shops", "item": "https://pythiastechnologies.com/software-for-screen-printing-shops" },
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
