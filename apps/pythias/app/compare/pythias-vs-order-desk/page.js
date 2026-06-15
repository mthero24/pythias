import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Order Desk — Order Management Comparison 2026",
    description: "Pythias vs Order Desk: compare order routing, production management, marketplace listing, fulfillment, and pricing. See which fits print and fulfillment operations that run their own production.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-order-desk" },
    openGraph: {
        type: "article",
        title: "Pythias vs Order Desk — Order Management Comparison",
        description: "Order Desk is a flexible order-routing hub. Pythias adds production, listing, and inventory to give you the full operation. See the comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-order-desk",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Order Desk Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Order Desk</span></>,
        sub: "Both centralize orders and automate routing with rules. Order Desk is a flexible middleware hub; Pythias is a full operations platform that also lists products and runs your production floor.",
        verdict: "Order Desk for lightweight rule-based routing between carts and providers. Pythias for operations that produce, list, and fulfill in-house.",
    },
    overview: {
        pythias: {
            tagline: "End-to-end operations: list, route, produce, ship",
            desc: "Pythias imports orders from 18+ marketplaces, routes them with rules you control, runs DTF/DTG/embroidery/sublimation production queues, manages blank inventory, prints labels, and confirms tracking — one platform, no per-order fees.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Order Desk",
            tagline: "Rule-based order management hub",
            desc: "A highly flexible order-routing tool with a powerful rules engine and a large library of shopping-cart, POD, and shipping integrations. Great as connective middleware; it isn't a production or marketplace-listing system on its own.",
            price: "Volume-tiered (per orders/integrations)",
        },
    },
    table: [
        { feature: "Centralized order import",            pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Rule-based order routing",            pythias: true,                competitor: "Very flexible",       winner: "tie" },
        { feature: "POD / fulfillment integrations",      pythias: true,                competitor: "Large library",       winner: "tie" },
        { feature: "Marketplace listing management",      pythias: true,                competitor: false,                 winner: "pythias" },
        { feature: "Production queue management",         pythias: "DTF/DTG/embroidery/sublimation", competitor: false,    winner: "pythias" },
        { feature: "Print-method routing + file handling", pythias: true,              competitor: "Limited",             winner: "pythias" },
        { feature: "Blank / raw inventory tracking",      pythias: true,                competitor: "Limited",             winner: "pythias" },
        { feature: "Shipping labels + tracking sync",     pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Built-in production analytics",       pythias: true,                competitor: "Basic",               winner: "pythias" },
        { feature: "Per-order fees",                      pythias: "None",              competitor: "Scales with volume",  winner: "pythias" },
    ],
    differences: [
        {
            icon: "🏭",
            title: "Pythias runs production; Order Desk routes around it",
            body: "Order Desk excels at moving an order from a shopping cart to a fulfillment provider based on rules. But it isn't a shop-floor system — there's no DTF/DTG/embroidery queue, no scan-to-complete workflow, no print-ready file routing to your team. Pythias is built for operations that actually make the product.",
        },
        {
            icon: "🛒",
            title: "Listing + orders, not just orders",
            body: "Order Desk works on the order side. Pythias also manages your product listings across 18+ marketplaces and keeps inventory synced both ways — so listing, selling, and fulfilling all live in one system instead of bolted together.",
        },
        {
            icon: "💸",
            title: "Flat pricing vs volume-tiered",
            body: "Order Desk's pricing scales with your order volume and number of integrations. Pythias is a flat subscription with no per-order fees, so growth doesn't continuously raise your software bill.",
        },
        {
            icon: "🧩",
            title: "One platform vs assembled stack",
            body: "Order Desk is often the glue between several tools (cart, POD provider, shipping app). Pythias consolidates listing, order management, production, inventory, labels, and analytics into a single platform — fewer moving parts, fewer points of failure.",
        },
    ],
    decide: {
        pythias: {
            title: "You produce and fulfill in-house",
            sub: "Pythias fits print shops and fulfillment operations that need the whole pipeline, not just order routing.",
            points: [
                "You run your own DTF, DTG, embroidery, or sublimation production",
                "You want listing, orders, inventory, and shipping in one platform",
                "You're scaling and want predictable, flat pricing",
                "You need print-method queues and design-file routing",
            ],
        },
        competitor: {
            title: "You need flexible middleware between tools",
            sub: "Order Desk is a strong choice when production lives elsewhere and you mainly need rule-based routing.",
            points: [
                "You route orders from carts to external POD/3PL providers",
                "You want a deep, customizable rules engine",
                "You don't manage your own production floor",
            ],
        },
    },
    faqs: [
        { q: "What's the difference between Pythias and Order Desk?", a: "Order Desk is a flexible, rule-based order-routing hub that connects shopping carts to fulfillment and POD providers. Pythias is a full operations platform: it also manages marketplace listings, runs in-house production queues (DTF/DTG/embroidery/sublimation), tracks blank inventory, and handles labels and tracking. Order Desk routes orders; Pythias runs the whole operation." },
        { q: "Does Order Desk manage production or marketplace listings?", a: "Order Desk is focused on order management and routing rather than shop-floor production or marketplace listing. Pythias includes production queue management and multichannel listing natively, so production-based sellers don't need to stitch together separate tools." },
        { q: "Which is better for a print shop?", a: "For a shop that produces its own orders, Pythias is generally the better fit because it manages the production floor — print-method queues, design-file routing, scan-to-complete, and blank inventory — in addition to order routing. Order Desk is better when production happens at an external provider and you just need flexible routing." },
        { q: "How does pricing compare?", a: "Order Desk pricing is tiered by order volume and integrations, so it scales with usage. Pythias is a flat subscription starting at $199/month with no per-order fees, which tends to be more predictable and cost-effective as volume grows." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Order Desk — Order Management Comparison 2026",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-order-desk",
    "articleSection": "Software Comparison",
    "author":    { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    "dateModified": "2026-06-14",
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
};

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <VsLayout {...data} />
        </>
    );
}
