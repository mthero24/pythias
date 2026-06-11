import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Fulfillment Providers — Multi-Client Print Fulfillment | Pythias",
    description: "Software built for print fulfillment providers and 3PLs. Manage multiple client accounts, track SLAs, generate client-level reporting, and automate order routing from 18+ selling channels.",
    keywords: "fulfillment provider software, software for fulfillment providers, print fulfillment software, 3PL print management software, fulfillment house management system",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-fulfillment-providers" },
    openGraph: {
        title: "Software for Fulfillment Providers | Pythias Technologies",
        description: "Built for print fulfillment providers — multi-client management, SLA tracking, client-level reporting, and automated order routing from 18+ channels.",
        url: "https://pythiastechnologies.com/software-for-fulfillment-providers",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Fulfillment Providers | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Fulfillment Provider Software",
        h1: <><span style={GRAD}>Fulfillment Provider Software</span><br />Manage Every Client From One Dashboard</>,
        sub: "Multi-client order management, SLA tracking, client-level analytics, and automated production routing — built for print fulfillment operations that serve multiple brands.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "Multi", label: "Client Account Support" },
            { value: "Zero", label: "Per-Order Fees" },
            { value: "Real-time", label: "SLA Monitoring" },
        ],
    },
    pain: {
        title: "Fulfillment providers need software that thinks in clients, not just orders.",
        sub: "Generic shop management tools treat every order the same. Fulfillment providers need client-level isolation, SLA tracking, and reporting — and most tools weren't built for that.",
        items: [
            {
                icon: "👥",
                title: "Client orders mix together",
                body: "When Client A's rush orders and Client B's standard orders land in the same queue with no separation, priorities get confused, SLAs get missed, and clients get upset.",
            },
            {
                icon: "⏱️",
                title: "SLA tracking is manual",
                body: "You're monitoring ship dates in spreadsheets, chasing your team to hit client-specific SLAs, and building reports from scratch every billing cycle. It's hours of overhead that software should handle.",
            },
            {
                icon: "📊",
                title: "Client reporting takes too long",
                body: "Every client wants to know their order volume, fulfillment rate, and on-time percentage. Pulling that data manually from separate systems before each check-in call is unsustainable at scale.",
            },
        ],
    },
    features: {
        title: "Pythias was built to run multi-client fulfillment operations.",
        sub: "Separate production queues, client-level inventory, SLA monitoring, and automated reporting — all from one platform your entire team can use.",
        items: [
            {
                icon: "👥",
                title: "Multi-Client Account Management",
                body: "Separate order queues, inventory pools, and production rules for each client. Your team sees the right work without cross-client confusion.",
                bullets: ["Per-client production queues", "Client-specific routing rules", "Inventory segregation by client"],
            },
            {
                icon: "🛒",
                title: "18+ Marketplace Integrations",
                body: "Connect each client's selling channels — Amazon, Etsy, Shopify, TikTok Shop, Walmart, and more — so orders route automatically into the correct client queue.",
                bullets: ["Per-client channel connections", "Real-time order import", "Channel tagging and filtering"],
            },
            {
                icon: "⏱️",
                title: "SLA Monitoring & Alerts",
                body: "Set ship-by windows for each client. Pythias flags orders at risk of missing SLA so your team can prioritize before it becomes a problem.",
                bullets: ["Per-client SLA configuration", "At-risk order alerts", "SLA fulfillment rate tracking"],
            },
            {
                icon: "📊",
                title: "Client-Level Analytics",
                body: "Order volume, fulfillment rate, on-time percentage, and revenue per client — all in one place. Pull custom reports for client calls in seconds, not hours.",
                bullets: ["Per-client order and revenue reports", "On-time fulfillment rate", "Custom date-range exports"],
            },
            {
                icon: "📦",
                title: "Production & Inventory Management",
                body: "Real-time blank inventory per client, production queue by print type, and automatic low-stock alerts so you never run out mid-batch.",
                bullets: ["DTF, DTG, embroidery, sublimation queues", "Per-client inventory tracking", "Automated reorder alerts"],
            },
            {
                icon: "🚚",
                title: "Automatic Shipping Labels",
                body: "Scan a completed order and Pythias generates the carrier label, captures tracking, and confirms fulfillment on every connected marketplace automatically.",
                bullets: ["Auto-label on scan completion", "USPS, FedEx, UPS support", "Per-client return address support"],
            },
        ],
    },
    howItWorks: {
        title: "Onboard a new client in days, not weeks",
        steps: [
            {
                title: "Create the client account and connect their channels",
                body: "Set up a client profile, connect their marketplaces, and configure their production rules and SLAs. New clients are live in days with a structured onboarding process.",
            },
            {
                title: "Orders route automatically by client",
                body: "Every order from every channel routes into the correct client's production queue with the right SLA window attached. No manual sorting required.",
            },
            {
                title: "Ship automatically and report effortlessly",
                body: "Labels generate on scan completion. Client reports pull with one click. SLA breaches surface before they happen. Your team focuses on fulfillment — not paperwork.",
            },
        ],
    },
    faqs: [
        { q: "Does Pythias support managing multiple fulfillment clients in one account?", a: "Yes. Pythias is built for multi-client fulfillment operations. You can create separate client accounts with isolated production queues, inventory pools, SLA configurations, and reporting — all managed from a single platform." },
        { q: "Can each client have their own marketplace integrations?", a: "Yes. Each client account can have its own marketplace connections — Amazon, Etsy, TikTok Shop, Shopify, Walmart, and more. Orders from each client's channels route automatically into their dedicated queue." },
        { q: "How does SLA monitoring work in Pythias?", a: "You configure ship-by windows for each client in their account settings. Pythias tracks the age of every open order against the SLA and surfaces at-risk orders in the production queue before the deadline is missed." },
        { q: "Can Pythias generate per-client reports for billing and review calls?", a: "Yes. Pythias includes client-level reporting on order volume, fulfillment rate, on-time percentage, and revenue — with custom date ranges and CSV export. Pull a client report in seconds rather than manually compiling data." },
        { q: "What print types does Pythias support for fulfillment providers?", a: "Pythias supports DTF, DTG, embroidery, sublimation, and screen printing — each with its own production queue and routing rules. Most fulfillment providers run multiple print methods, and Pythias handles all of them in the same platform." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Fulfillment Provider Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-fulfillment-providers",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Fulfillment Providers", "item": "https://pythiastechnologies.com/software-for-fulfillment-providers" },
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
