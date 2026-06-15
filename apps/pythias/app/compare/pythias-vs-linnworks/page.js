import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Linnworks — Multichannel Software Comparison 2026",
    description: "Pythias vs Linnworks: compare multichannel order management, inventory, production, pricing, and complexity. See which fits sellers who produce and fulfill without enterprise overhead.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-linnworks" },
    openGraph: {
        type: "article",
        title: "Pythias vs Linnworks — Multichannel Software Comparison",
        description: "Linnworks is enterprise multichannel + warehouse management. Pythias delivers listing, orders, production, and fulfillment with flat pricing and faster setup. See the comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-linnworks",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Linnworks Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Linnworks</span></>,
        sub: "Both unify multichannel selling and orders. Linnworks is a broad enterprise platform with warehouse management; Pythias is a focused, production-first platform with flat pricing and faster setup.",
        verdict: "Linnworks for large enterprises needing deep WMS. Pythias for print and fulfillment operations that want production + multichannel without enterprise cost and complexity.",
    },
    overview: {
        pythias: {
            tagline: "Production-first multichannel platform",
            desc: "Pythias lists across 18+ marketplaces, unifies orders, runs DTF/DTG/embroidery/sublimation production queues, tracks blank inventory, and handles labels and tracking — flat pricing, live in under 2 weeks, no per-order fees.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Linnworks",
            tagline: "Enterprise multichannel + warehouse management",
            desc: "A powerful, broad platform connecting 70+ channels with deep inventory, order, and warehouse management for large operations. Capable but complex, with enterprise pricing and a heavier implementation.",
            price: "Custom / quote-based",
        },
    },
    table: [
        { feature: "Multichannel listing + orders",      pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Real-time inventory sync",            pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Channel reach",                       pythias: "18+ (200+ via Mirakl/Acenda)", competitor: "70+ channels", winner: "competitor" },
        { feature: "Production queue management",         pythias: "DTF/DTG/embroidery/sublimation", competitor: "Not production-focused", winner: "pythias" },
        { feature: "Print-method routing + file handling", pythias: true,              competitor: false,                 winner: "pythias" },
        { feature: "Warehouse management (WMS)",          pythias: "Inventory + fulfillment", competitor: "Full WMS",       winner: "competitor" },
        { feature: "Shipping labels + tracking sync",     pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Setup time",                          pythias: "Under 2 weeks",     competitor: "Longer implementation", winner: "pythias" },
        { feature: "Pricing transparency",                pythias: "Flat $199/mo",      competitor: "Custom / quote-based", winner: "pythias" },
        { feature: "Per-order fees",                      pythias: "None",              competitor: "Plan-dependent",      winner: "pythias" },
    ],
    differences: [
        {
            icon: "🏭",
            title: "Production-first vs warehouse-first",
            body: "Linnworks is built around inventory and warehouse management for large retail operations. Pythias is built around production — DTF/DTG/embroidery/sublimation queues, print-method routing, and design-file handling — for sellers who make what they ship. If you produce your own orders, that focus matters.",
        },
        {
            icon: "💸",
            title: "Flat pricing vs enterprise quotes",
            body: "Linnworks pricing is quote-based and scales into enterprise territory. Pythias is a flat $199/month with no per-order fees — predictable cost and no procurement cycle to get started.",
        },
        {
            icon: "⚡",
            title: "Faster to value",
            body: "Linnworks is powerful but heavy to implement. Pythias is designed to be live in under two weeks with guided onboarding — you get to automated operations without a months-long rollout.",
        },
        {
            icon: "🏢",
            title: "Where Linnworks wins: scale + WMS",
            body: "If you're a large multichannel retailer with complex warehousing, multiple fulfillment locations, and a need for full WMS depth across 70+ channels, Linnworks is built for that scale. Pythias targets production and fulfillment operations rather than enterprise warehouse logistics.",
        },
    ],
    decide: {
        pythias: {
            title: "You produce your orders and want flat, fast, focused",
            sub: "Pythias fits print shops and fulfillment operations that need production + multichannel without enterprise overhead.",
            points: [
                "You run your own DTF, DTG, embroidery, or sublimation production",
                "You want flat, predictable pricing with no per-order fees",
                "You want to be live in weeks, not months",
                "You value production-floor workflow over full WMS depth",
            ],
        },
        competitor: {
            title: "You're an enterprise needing deep WMS",
            sub: "Linnworks is built for large retailers with complex warehousing and very broad channel needs.",
            points: [
                "You manage complex multi-location warehousing",
                "You need full warehouse management depth",
                "You have the budget and team for an enterprise rollout",
            ],
        },
    },
    faqs: [
        { q: "What's the main difference between Pythias and Linnworks?", a: "Linnworks is a broad enterprise multichannel and warehouse-management platform. Pythias is a production-first platform: it adds DTF/DTG/embroidery/sublimation production queues, print-method routing, and design-file handling on top of multichannel listing, orders, inventory, and shipping — with flat pricing and a sub-two-week setup. Pythias suits production operations; Linnworks suits large warehouse-heavy retailers." },
        { q: "Is Pythias cheaper than Linnworks?", a: "Pythias is a flat $199/month with no per-order fees and transparent pricing. Linnworks is quote-based and scales into enterprise pricing. For most production and fulfillment operations, Pythias is both more affordable and faster to implement." },
        { q: "Does Linnworks handle production?", a: "Linnworks centers on inventory, orders, and warehouse management rather than decoration/production workflows. Pythias is built around production — routing orders into print-method queues with the right files attached — which is the gap Linnworks leaves for print operations." },
        { q: "Which connects to more channels?", a: "Linnworks advertises 70+ channels. Pythias integrates with 18+ directly plus 200+ more through Mirakl and Acenda. For most sellers the practical channel coverage overlaps heavily; the bigger difference is Pythias's production focus and pricing model." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Linnworks — Multichannel Software Comparison 2026",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-linnworks",
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
