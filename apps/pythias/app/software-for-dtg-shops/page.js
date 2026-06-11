import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for DTG Shops — Direct to Garment Production Management | Pythias",
    description: "Software built for direct-to-garment (DTG) print shops. Route orders by color profile, manage art files per blank, sync orders from 18+ marketplaces, and auto-generate shipping labels.",
    keywords: "DTG shop software, software for DTG shops, direct to garment shop management, DTG production management, DTG order management",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-dtg-shops" },
    openGraph: {
        title: "Software for DTG Shops | Pythias Technologies",
        description: "Built for direct-to-garment shops — color profile routing, art file management, multi-marketplace orders, and automatic shipping labels.",
        url: "https://pythiastechnologies.com/software-for-dtg-shops",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for DTG Shops | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "DTG Shop Software",
        h1: <><span style={GRAD}>DTG Shop Software</span> That Understands<br />Color Profiles and Custom Orders</>,
        sub: "Direct-to-garment printing requires routing by blank, color profile, and art file — not just order number. Pythias handles it automatically.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "Auto", label: "Art File Routing" },
            { value: "Zero", label: "Per-Order Fees" },
            { value: "Real-time", label: "Inventory Tracking" },
        ],
    },
    pain: {
        title: "DTG shops face unique challenges most software ignores.",
        sub: "Color profiles, pretreatment requirements, and blank-specific art adjustments make DTG more complex than other print methods — yet most shop software treats every print job the same.",
        items: [
            {
                icon: "🎨",
                title: "Color profiles vary by blank and color",
                body: "A black shirt requires a white underbase. A light-colored Bella+Canvas needs different ICC settings than a Gildan. Manually routing art files and pretreatment by blank costs hours every day.",
            },
            {
                icon: "🗂️",
                title: "Art file management is a mess",
                body: "Customer-supplied files, resized variants, pretreated versions — all stored in folders, named inconsistently, and regularly applied to the wrong blank. One wrong file wastes a garment and a customer.",
            },
            {
                icon: "🔀",
                title: "Orders from everywhere with no unified queue",
                body: "Etsy, Shopify, Amazon, and direct orders all need different handling, but there's no single view. Your team switches between dashboards and still misses jobs.",
            },
        ],
    },
    features: {
        title: "Pythias routes every DTG job to the right machine with the right file.",
        sub: "Production routing in Pythias respects print type, blank, and color — so DTG jobs are never confused with other print methods.",
        items: [
            {
                icon: "🖨️",
                title: "DTG Production Queue",
                body: "Orders route automatically into a DTG-specific queue, separated from embroidery, DTF, and sublimation. Your team sees a clean, prioritized list of exactly what to print.",
                bullets: ["Print-type separation per queue", "Deadline + priority sorting", "Machine-level routing support"],
            },
            {
                icon: "🎨",
                title: "Design File Management",
                body: "Associate art files with SKUs so the right design, at the right resolution, goes to the right garment automatically — every time.",
                bullets: ["SKU-to-design file mapping", "Design library with version history", "Print-ready file routing"],
            },
            {
                icon: "🛒",
                title: "18+ Marketplace Integrations",
                body: "Pull orders from Amazon, Etsy, Shopify, TikTok Shop, Walmart, eBay, and more into one unified queue. No more tab-switching between dashboards.",
                bullets: ["Auto order import from all channels", "Real-time order sync", "Channel tagging and filtering"],
            },
            {
                icon: "📦",
                title: "Blank & Color Inventory",
                body: "Track inventory at the blank, color, and size level. Get reorder alerts before a specific size runs out and holds up a batch of jobs.",
                bullets: ["Color + size level tracking", "Low-stock alerts", "Multi-supplier support"],
            },
            {
                icon: "🚚",
                title: "Automatic Shipping Labels",
                body: "Scan a completed DTG job and Pythias prints the label, captures the tracking number, and confirms fulfillment on every marketplace automatically.",
                bullets: ["Auto-label on scan completion", "USPS, FedEx, UPS support", "Multi-channel tracking sync"],
            },
            {
                icon: "📊",
                title: "Analytics & Reporting",
                body: "Output per machine, revenue by channel, defect rate tracking, and daily production summaries — all in one dashboard with CSV export.",
                bullets: ["Output by machine and print type", "Revenue by marketplace", "Defect and reprint tracking"],
            },
        ],
    },
    howItWorks: {
        steps: [
            {
                title: "Connect your channels and configure your blanks",
                body: "Link your marketplaces, set up your blank catalog with SKU mappings, and associate design files. Onboarding is handled with you in under 2 weeks.",
            },
            {
                title: "Orders route automatically to your DTG queue",
                body: "Every incoming order lands in the right print queue with the correct art file and blank specification attached. No manual routing.",
            },
            {
                title: "Print, scan, and ship automatically",
                body: "Complete a job, scan it, and Pythias handles the rest — label generation, tracking capture, and marketplace fulfillment confirmation.",
            },
        ],
    },
    faqs: [
        { q: "Can Pythias handle routing by blank type and color for DTG?", a: "Yes. Pythias routes orders by print type, blank, and SKU — so your DTG jobs are separated from other print methods and associated with the correct art file and production spec." },
        { q: "How does Pythias manage design files for DTG?", a: "You associate design files with product SKUs in the Pythias design library. When an order for that SKU comes in, the correct file is automatically attached to the job — no manual file hunting." },
        { q: "What marketplaces does Pythias connect to?", a: "Pythias connects to Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, Faire, SHEIN, Temu, Meta Shops, Mirakl (50+ channels), Acenda (150+ channels), and more." },
        { q: "Does Pythias work for shops that do both DTG and DTF?", a: "Yes. Pythias supports multiple print types in the same platform — DTG, DTF, embroidery, sublimation, and screen printing. Each print type routes to its own queue, and your production team sees a clear separation of job types." },
        { q: "What does Pythias cost for a DTG shop?", a: "Pythias starts at $199/month with no per-order fees. For a DTG shop processing 500+ orders per month, this typically costs far less than per-order tools like ShipStation or OrderDesk." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — DTG Shop Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-dtg-shops",
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
            { "@type": "ListItem", "position": 2, "name": "Software for DTG Shops", "item": "https://pythiastechnologies.com/software-for-dtg-shops" },
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
