import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Print on Demand Businesses — Fulfillment Automation | Pythias",
    description: "The complete software platform for print-on-demand businesses. Automate order routing, production, inventory, and shipping across 18+ marketplaces from a single dashboard.",
    keywords: "print on demand software, software for print on demand, POD fulfillment software, print on demand management software, print on demand automation",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-print-on-demand" },
    openGraph: {
        title: "Software for Print on Demand | Pythias Technologies",
        description: "Complete print-on-demand software — automate order routing, production queues, inventory tracking, and shipping labels across 18+ marketplaces.",
        url: "https://pythiastechnologies.com/software-for-print-on-demand",
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Print on Demand Software",
        h1: <>The <span style={GRAD}>Print on Demand Software</span><br />Built to Scale With You</>,
        sub: "From 50 orders a day to 5,000 — Pythias automates every step of your POD operation. Order routing, production queues, inventory, and shipping all in one platform.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "4 types", label: "Print Methods Supported" },
            { value: "Zero", label: "Per-Order Fees" },
            { value: "< 2 wks", label: "Setup Time" },
        ],
    },
    pain: {
        title: "Most POD sellers outgrow their tools before they outgrow their market.",
        sub: "Manual processes that work at 20 orders a day break completely at 200. The software gap is where most print-on-demand businesses hit a ceiling.",
        items: [
            {
                icon: "📈",
                title: "Manual processes don't scale",
                body: "Copying order details from Etsy into a spreadsheet, then into ShipStation, then back to confirm fulfillment — works fine at low volume. Falls apart completely when you add a second channel or double your order count.",
            },
            {
                icon: "🔀",
                title: "Multi-channel means multi-dashboard",
                body: "Each marketplace has its own seller portal. Managing orders across Amazon, Etsy, TikTok, Shopify, and your own site means constantly switching contexts — and orders still get missed.",
            },
            {
                icon: "📦",
                title: "Inventory and production are disconnected",
                body: "Your order system doesn't know your blank inventory. Your production team doesn't know which orders are rush. Fulfillment delays build up and customers start complaining.",
            },
        ],
    },
    features: {
        title: "One platform that handles your entire print-on-demand operation.",
        sub: "Pythias connects every channel, automates every step, and gives your team a single production dashboard that scales with your volume.",
        items: [
            {
                icon: "🖨️",
                title: "Multi-Method Production Queue",
                body: "Separate queues for DTF, DTG, embroidery, and sublimation — each with their own deadline sorting, priority rules, and completion workflow.",
                bullets: ["DTF, DTG, embroidery, sublimation queues", "Deadline + priority routing", "Scan-to-complete workflow"],
            },
            {
                icon: "🛒",
                title: "18+ Marketplace Integrations",
                body: "Amazon, Walmart, Etsy, TikTok Shop, Shopify, eBay, Wix, WooCommerce — all orders pull into one unified production queue automatically. No copy-paste, no switching dashboards.",
                bullets: ["Real-time order import from all channels", "Unified production view", "Per-channel tagging and filtering"],
            },
            {
                icon: "📦",
                title: "Inventory & Stock Management",
                body: "Real-time blank inventory tracking with low-stock alerts. Know exactly what's on hand before an order hits the floor — and reorder before you run out.",
                bullets: ["Real-time stock by blank + color + size", "Automated reorder alerts", "Multi-supplier support"],
            },
            {
                icon: "🚚",
                title: "Automatic Shipping Labels",
                body: "Scan a completed order and Pythias generates the carrier label, captures tracking, and confirms fulfillment back to every marketplace in seconds.",
                bullets: ["USPS, FedEx, UPS support", "Auto-label on scan completion", "Tracking sync to all channels"],
            },
            {
                icon: "🏷️",
                title: "Product & Design Management",
                body: "Map designs to product SKUs, manage product listings across channels, and ensure the right art file goes to the right job every time.",
                bullets: ["Design library with SKU mapping", "Multi-channel listing management", "Print-ready file routing"],
            },
            {
                icon: "📊",
                title: "Analytics & Revenue Reporting",
                body: "Daily output reports, revenue by channel, fulfillment rate, production efficiency, and custom date-range exports. Know your numbers at a glance.",
                bullets: ["Revenue by marketplace", "Production output reports", "Fulfillment rate and SLA tracking"],
            },
        ],
    },
    howItWorks: {
        title: "From zero to fully automated in under 2 weeks",
        steps: [
            {
                title: "Connect your selling channels",
                body: "Link Amazon, Etsy, Shopify, TikTok Shop, and every other channel in a structured onboarding session. Orders start flowing into your production queue immediately.",
            },
            {
                title: "Production queue runs itself",
                body: "Orders route automatically by print type with the correct design file attached. Your team sees a clean, prioritized list of what to produce — nothing falls through the cracks.",
            },
            {
                title: "Ship and confirm automatically",
                body: "Scan a completed job, Pythias prints the label and confirms shipment on every connected marketplace. Your customers get tracking. You get your time back.",
            },
        ],
    },
    faqs: [
        { q: "What print methods does Pythias support for POD?", a: "Pythias supports DTF (direct-to-film), DTG (direct-to-garment), embroidery, and sublimation — each with its own dedicated production queue, routing rules, and completion workflow." },
        { q: "How many marketplaces does Pythias connect to?", a: "Pythias integrates directly with 18+ marketplaces including Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, Faire, SHEIN, Temu, Meta Shops, and more. Through Mirakl and Acenda connections, you can reach 200+ additional channels." },
        { q: "Does Pythias replace ShipStation for POD?", a: "For print-on-demand operations, yes — Pythias includes shipping label generation, carrier rate comparison, and tracking sync as part of the platform. Unlike ShipStation, it also manages your production queue, blank inventory, and marketplace order routing." },
        { q: "Is Pythias suitable for a one-person POD shop or only larger operations?", a: "Pythias is used by solo operators and larger teams alike. The minimum plan starts at $199/month with no per-order fees — at even 100 orders per month, the math typically favors Pythias over per-order tools." },
        { q: "Can I run multiple print types (DTF and embroidery) in the same Pythias account?", a: "Yes. Pythias routes orders to the correct print queue by print type, so DTF jobs and embroidery jobs never mix. Each queue has its own sorting, routing rules, and completion workflow." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Print on Demand Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-print-on-demand",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Print on Demand", "item": "https://pythiastechnologies.com/software-for-print-on-demand" },
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
