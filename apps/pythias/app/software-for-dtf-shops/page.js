import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for DTF Shops — Print Production Management | Pythias",
    description: "Purpose-built software for DTF (direct-to-film) print shops. Manage gang sheets, route orders from 18+ marketplaces, track blank inventory, and auto-generate shipping labels from one dashboard.",
    keywords: "DTF shop software, software for DTF shops, DTF production management, DTF order management software, direct to film shop management",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-dtf-shops" },
    openGraph: {
        title: "Software for DTF Shops | Pythias Technologies",
        description: "Purpose-built software for DTF print shops — gang sheet queuing, multi-marketplace orders, blank inventory, and automatic shipping labels.",
        url: "https://pythiastechnologies.com/software-for-dtf-shops",
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "DTF Shop Software",
        h1: <><span style={GRAD}>DTF Shop Software</span> Built for<br />How You Actually Print</>,
        sub: "Gang sheets, multi-channel orders, blank inventory, and shipping labels — all managed from one production dashboard designed for direct-to-film operations.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "< 2 wks", label: "Setup Time" },
            { value: "Zero", label: "Per-Order Fees" },
            { value: "Auto", label: "Shipping Label Gen" },
        ],
    },
    pain: {
        title: "Running a DTF shop is complex. Most software wasn't built for it.",
        sub: "Generic print shop tools were designed for screen printing or DTG — they don't understand DTF workflows, and that gap costs you time and orders every day.",
        items: [
            {
                icon: "📋",
                title: "Gang sheet chaos",
                body: "Orders from different channels pile up with no system for grouping them into efficient gang sheets. You're manually deciding what goes on each film run — and jobs constantly get missed or duplicated.",
            },
            {
                icon: "🛒",
                title: "Orders scattered across platforms",
                body: "Amazon, Etsy, TikTok Shop, your Shopify store — each has its own dashboard. Your team bounces between tabs copying order details into spreadsheets while orders back up.",
            },
            {
                icon: "📦",
                title: "Blank inventory is always a mystery",
                body: "You never know exactly what's in stock until someone walks to the shelf. Stockouts mid-run delay orders. Overbuying ties up cash. There's no real-time visibility.",
            },
        ],
    },
    features: {
        title: "Pythias is purpose-built for DTF operations",
        sub: "Every feature was designed around how print-on-demand shops — including DTF-first operations — actually work.",
        items: [
            {
                icon: "🖨️",
                title: "DTF Production Queue",
                body: "Orders route automatically into a DTF-specific queue, sorted by deadline and priority. Your team always knows exactly what to print next.",
                bullets: ["Print-type routing (DTF, embroidery, DTG)", "Deadline + priority sorting", "Scan-to-complete workflow"],
            },
            {
                icon: "🛒",
                title: "18+ Marketplace Integrations",
                body: "Pull orders from Amazon, Etsy, Walmart, TikTok Shop, Shopify, eBay, and more into a single production queue. One dashboard — every channel.",
                bullets: ["Auto order import from all channels", "Real-time order sync", "Channel tagging in queue"],
            },
            {
                icon: "📦",
                title: "Blank Inventory Tracking",
                body: "Real-time stock levels for every blank, color, and size. Set reorder thresholds and get alerts before you run out mid-run.",
                bullets: ["Real-time stock levels per SKU", "Automated reorder alerts", "Supplier management"],
            },
            {
                icon: "🚚",
                title: "Automatic Shipping Labels",
                body: "When an order is scanned complete, Pythias generates the USPS, FedEx, or UPS label and pushes tracking back to the marketplace automatically.",
                bullets: ["Auto-label on scan completion", "USPS, FedEx, UPS support", "Tracking sync to all channels"],
            },
            {
                icon: "📊",
                title: "Production Analytics",
                body: "Daily output reports, units per hour by print type, revenue by channel, and custom date-range exports. Know exactly how your DTF operation is performing.",
                bullets: ["Output reports by print type", "Revenue by channel", "Daily summary reports"],
            },
            {
                icon: "👥",
                title: "Team & Floor Management",
                body: "Badge scan login for production floor workers, role-based access for managers, and built-in messaging keeps everyone aligned.",
                bullets: ["Badge scan login", "Role-based permissions", "Shift + activity tracking"],
            },
        ],
    },
    howItWorks: {
        steps: [
            {
                title: "Connect your channels",
                body: "Link Amazon, Etsy, TikTok Shop, Shopify, and other selling channels in a single onboarding session. Orders start flowing within minutes.",
            },
            {
                title: "Orders route to your DTF queue",
                body: "Every incoming order routes automatically to the right print queue with the correct art file, size breakdown, and production priority.",
            },
            {
                title: "Print, scan, ship",
                body: "Your team prints and completes jobs. Pythias generates shipping labels on scan completion and pushes tracking back to every marketplace automatically.",
            },
        ],
    },
    faqs: [
        { q: "What makes Pythias different from generic print shop software for DTF?", a: "Most print shop management tools were built for screen printing or embroidery and bolted on DTF support later. Pythias was built from the ground up for multi-channel print-on-demand operations including DTF, so features like print-type routing, automatic label generation, and 18+ marketplace integrations are core — not add-ons." },
        { q: "Can Pythias help manage gang sheet production?", a: "Yes. Pythias queues DTF jobs by deadline and priority so your team can efficiently group orders into gang sheets. Each job is tracked at the item level, and scanning a completed job triggers the shipping label and marketplace confirmation automatically." },
        { q: "Which marketplaces does Pythias connect to for DTF shops?", a: "Pythias integrates with Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, Faire, SHEIN, Temu, Meta Shops, Mirakl (50+ channels), Acenda (150+ channels), and more — all pulling into one production queue." },
        { q: "How long does it take to get a DTF shop set up on Pythias?", a: "Most shops are fully operational within 2 weeks. Pythias includes a structured onboarding process that configures your marketplace connections, blank inventory, print queues, and shipping carriers before you go live." },
        { q: "Does Pythias charge per-order fees?", a: "No. Pythias is a flat monthly subscription with no per-order fees. At volume, this typically saves shops thousands of dollars per month compared to tools that charge $0.10–$0.25 per order." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — DTF Shop Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-dtf-shops",
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
            { "@type": "ListItem", "position": 2, "name": "Software for DTF Shops", "item": "https://pythiastechnologies.com/software-for-dtf-shops" },
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
