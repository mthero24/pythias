import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Zentail — Multichannel Software Comparison 2026",
    description: "Pythias vs Zentail: compare multichannel listing, catalog management, repricing, production, fulfillment, and pricing. See which fits sellers who produce and ship their own orders.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-zentail" },
    openGraph: {
        type: "article",
        title: "Pythias vs Zentail — Multichannel Software Comparison",
        description: "Zentail centralizes catalog, listing, and repricing. Pythias adds production and fulfillment to run the whole operation. See the comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-zentail",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Zentail Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Zentail</span></>,
        sub: "Both centralize multichannel selling. Zentail is strong on catalog management, listing, and repricing; Pythias adds the production floor and fulfillment so a shop can run the whole operation in one platform.",
        verdict: "Zentail for catalog-centric listing and repricing. Pythias for sellers who also produce, route, and fulfill their own orders.",
    },
    overview: {
        pythias: {
            tagline: "Multichannel listing + production & fulfillment",
            desc: "Pythias lists across 18+ marketplaces, unifies orders, runs DTF/DTG/embroidery/sublimation production queues, tracks blank inventory, prints labels, and confirms tracking — one platform from listing to shipment, flat pricing, no per-order fees.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Zentail",
            tagline: "Catalog, listing & repricing platform",
            desc: "A polished multichannel platform centered on centralized catalog management (SMP), listing automation, repricing, and order/inventory sync for growing marketplace sellers. Strong on the listing/catalog layer; production lives elsewhere.",
            price: "Custom / quote-based",
        },
    },
    table: [
        { feature: "Multichannel listing",               pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Centralized catalog management",      pythias: true,                competitor: "Very strong",         winner: "competitor" },
        { feature: "Automated repricing",                 pythias: false,               competitor: true,                  winner: "competitor" },
        { feature: "Real-time inventory sync",            pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Unified order import",                pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Production queue management",         pythias: "DTF/DTG/embroidery/sublimation", competitor: false,    winner: "pythias" },
        { feature: "Print-method routing + file handling", pythias: true,              competitor: false,                 winner: "pythias" },
        { feature: "Blank / raw inventory tracking",      pythias: true,                competitor: "Finished goods",      winner: "pythias" },
        { feature: "Shipping labels + tracking sync",     pythias: true,                competitor: "Via integrations",    winner: "pythias" },
        { feature: "Per-order fees",                      pythias: "None",              competitor: "Plan-dependent",      winner: "pythias" },
    ],
    differences: [
        {
            icon: "🏭",
            title: "Pythias runs production; Zentail stops at listing/catalog",
            body: "Zentail is excellent at centralizing your catalog, automating listings, and repricing across marketplaces. But when an order arrives, you still need a production queue, print-method routing, and design-file handling. Pythias is built for exactly that — it manages production and fulfillment end to end.",
        },
        {
            icon: "🏷️",
            title: "Where Zentail wins: catalog + repricing",
            body: "Zentail's centralized catalog (single source of product data) and automated repricing are genuinely strong for catalog-heavy resellers competing on price. Pythias focuses on production and fulfillment rather than dynamic repricing.",
        },
        {
            icon: "💸",
            title: "Flat pricing vs quote-based",
            body: "Zentail pricing is quote-based. Pythias is a flat $199/month with no per-order fees, so growth doesn't continuously raise your software bill and there's no procurement cycle to begin.",
        },
        {
            icon: "📦",
            title: "Inventory down to the blank",
            body: "Zentail manages finished-goods catalog and inventory. Pythias also tracks raw blanks by color and size with reorder alerts, so production-based sellers know what they can actually make before an order hits the floor.",
        },
    ],
    decide: {
        pythias: {
            title: "You produce and fulfill your own orders",
            sub: "Pythias is built for sellers and print operations that need listing, order routing, production, and shipping in one system.",
            points: [
                "You run DTF, DTG, embroidery, or sublimation production",
                "You want one platform from listing through shipment",
                "You want flat pricing with no per-order fees",
                "You need blank inventory and production routing, not just catalog + repricing",
            ],
        },
        competitor: {
            title: "You're a catalog-heavy reseller competing on price",
            sub: "Zentail is a strong choice when centralized catalog management and repricing are your priorities.",
            points: [
                "You manage a large product catalog across marketplaces",
                "You need automated repricing to win the Buy Box",
                "Your production/fulfillment happens elsewhere",
            ],
        },
    },
    faqs: [
        { q: "What's the difference between Pythias and Zentail?", a: "Zentail centers on centralized catalog management, listing automation, and repricing for multichannel sellers. Pythias does multichannel listing too, then adds the production and fulfillment layer — DTF/DTG/embroidery/sublimation queues, print-method routing, blank inventory, labels, and tracking. If you produce your own orders, Pythias covers the steps Zentail leaves to other tools." },
        { q: "Does Pythias do automated repricing?", a: "No — repricing isn't a Pythias focus. If dynamic, competitive repricing is central to your strategy, Zentail is stronger there. Pythias focuses on production, fulfillment, and getting orders shipped accurately and on time across every channel." },
        { q: "Does Zentail manage production?", a: "Zentail focuses on the catalog, listing, repricing, and order/inventory layer rather than shop-floor production. Pythias includes production queue management and design-file routing natively, which is the gap Zentail leaves for print operations." },
        { q: "How does pricing compare?", a: "Zentail is quote-based. Pythias is a flat subscription starting at $199/month with no per-order fees, which tends to be more predictable and cost-effective for production-based sellers as volume grows." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Zentail — Multichannel Software Comparison 2026",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-zentail",
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
