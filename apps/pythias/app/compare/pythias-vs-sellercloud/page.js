import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Sellercloud — Multichannel Software Comparison 2026",
    description: "Pythias vs Sellercloud: compare multichannel order management, inventory, warehouse management, production, pricing, and setup. See which fits production-based sellers vs large catalog operations.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-sellercloud" },
    openGraph: {
        type: "article",
        title: "Pythias vs Sellercloud — Multichannel Software Comparison",
        description: "Sellercloud is a deep, configurable multichannel + WMS platform. Pythias is production-first with flat pricing and faster setup. See the comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-sellercloud",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Sellercloud Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Sellercloud</span></>,
        sub: "Both unify multichannel selling, orders, and inventory. Sellercloud is a deep, highly-configurable platform with warehouse management; Pythias is production-first with flat pricing and a faster path to live.",
        verdict: "Sellercloud for large catalog operations needing deep configurability and WMS. Pythias for print and fulfillment operations that want production + multichannel without the complexity.",
    },
    overview: {
        pythias: {
            tagline: "Production-first multichannel platform",
            desc: "Pythias lists across 18+ marketplaces, unifies orders, runs DTF/DTG/embroidery/sublimation production queues, tracks blank inventory, and handles labels and tracking — flat pricing, live in under 2 weeks, no per-order fees.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Sellercloud",
            tagline: "Configurable multichannel + WMS suite",
            desc: "A powerful, highly-configurable platform for multichannel listing, inventory, orders, and warehouse management, popular with large-catalog and high-SKU sellers. Deep feature set with a heavier setup and configuration effort.",
            price: "Custom / quote-based",
        },
    },
    table: [
        { feature: "Multichannel listing + orders",      pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Real-time inventory sync",            pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Production queue management",         pythias: "DTF/DTG/embroidery/sublimation", competitor: "Not production-focused", winner: "pythias" },
        { feature: "Print-method routing + file handling", pythias: true,              competitor: false,                 winner: "pythias" },
        { feature: "Warehouse management (WMS)",          pythias: "Inventory + fulfillment", competitor: "Full WMS",       winner: "competitor" },
        { feature: "High-SKU catalog depth",              pythias: "Strong",            competitor: "Very deep",           winner: "competitor" },
        { feature: "Shipping labels + tracking sync",     pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Setup time",                          pythias: "Under 2 weeks",     competitor: "Longer configuration", winner: "pythias" },
        { feature: "Pricing transparency",                pythias: "Flat $199/mo",      competitor: "Custom / quote-based", winner: "pythias" },
        { feature: "Per-order fees",                      pythias: "None",              competitor: "Plan-dependent",      winner: "pythias" },
    ],
    differences: [
        {
            icon: "🏭",
            title: "Production-first vs catalog/WMS-first",
            body: "Sellercloud is built for large-catalog sellers who need deep inventory, order, and warehouse configurability. Pythias is built around production — DTF/DTG/embroidery/sublimation queues, print-method routing, and design-file handling. If you make what you ship, that focus is the difference.",
        },
        {
            icon: "💸",
            title: "Flat pricing vs quote-based",
            body: "Sellercloud pricing is quote-based and configuration-dependent. Pythias is a flat $199/month with no per-order fees — predictable cost and no procurement cycle to get started.",
        },
        {
            icon: "⚡",
            title: "Faster to value",
            body: "Sellercloud is powerful but takes real configuration to stand up. Pythias is designed to be live in under two weeks with guided onboarding — automated operations without a long implementation.",
        },
        {
            icon: "🗂️",
            title: "Where Sellercloud wins: catalog depth + WMS",
            body: "If you manage tens of thousands of SKUs across complex warehousing and need granular configurability, Sellercloud's depth is built for that. Pythias targets production and fulfillment operations rather than very-high-SKU warehouse logistics.",
        },
    ],
    decide: {
        pythias: {
            title: "You produce your orders and want flat, fast, focused",
            sub: "Pythias fits print shops and fulfillment operations that need production + multichannel without enterprise configuration.",
            points: [
                "You run your own DTF, DTG, embroidery, or sublimation production",
                "You want flat, predictable pricing with no per-order fees",
                "You want to be live in weeks, not months",
                "You value production-floor workflow over deep WMS configurability",
            ],
        },
        competitor: {
            title: "You manage a large, complex catalog",
            sub: "Sellercloud is built for high-SKU sellers who need deep warehouse and configuration depth.",
            points: [
                "You manage tens of thousands of SKUs",
                "You need granular warehouse management",
                "You have the team for an involved configuration",
            ],
        },
    },
    faqs: [
        { q: "What's the main difference between Pythias and Sellercloud?", a: "Sellercloud is a deep, configurable multichannel and warehouse-management suite for large-catalog sellers. Pythias is production-first: it adds DTF/DTG/embroidery/sublimation production queues, print-method routing, and design-file handling on top of multichannel listing, orders, inventory, and shipping — with flat pricing and a sub-two-week setup." },
        { q: "Is Pythias cheaper than Sellercloud?", a: "Pythias is a flat $199/month with no per-order fees and transparent pricing. Sellercloud is quote-based and configuration-dependent. For most production and fulfillment operations, Pythias is more affordable and faster to implement." },
        { q: "Does Sellercloud handle production?", a: "Sellercloud focuses on catalog, inventory, orders, and warehouse management rather than decoration/production workflows. Pythias is built around production — routing orders into print-method queues with the right files attached — which is the gap Sellercloud leaves for print operations." },
        { q: "Which should a high-SKU seller choose?", a: "If your operation is defined by very high SKU counts and complex warehousing, Sellercloud's depth may suit you better. If your business produces decorated products and sells them across marketplaces, Pythias's production focus, flat pricing, and faster setup are usually the better fit." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Sellercloud — Multichannel Software Comparison 2026",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-sellercloud",
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
