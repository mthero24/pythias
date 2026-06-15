import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Sellbrite — Multichannel Software Comparison 2026",
    description: "Pythias vs Sellbrite: compare multichannel listing, inventory sync, order management, production, and pricing. See which fits sellers who also produce and fulfill their own orders.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-sellbrite" },
    openGraph: {
        type: "article",
        title: "Pythias vs Sellbrite — Multichannel Software Comparison",
        description: "Sellbrite lists and syncs across marketplaces. Pythias does that and runs your production and fulfillment too. See the full comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-sellbrite",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Sellbrite Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Sellbrite</span></>,
        sub: "Both list products across marketplaces and keep inventory in sync. The difference is what happens after the order comes in — Sellbrite hands it off, Pythias produces and ships it.",
        verdict: "Sellbrite for pure listing and inventory sync. Pythias for sellers who also produce, route, and fulfill their own orders.",
    },
    overview: {
        pythias: {
            tagline: "Multichannel listing + full production & fulfillment",
            desc: "Pythias lists across 18+ marketplaces, syncs inventory in real time, and then routes every order into a production queue, prints labels, and confirms tracking — one platform from listing to shipment, with no per-order fees.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Sellbrite",
            tagline: "Multichannel listing & inventory tool",
            desc: "A solid, simple tool (owned by GoDaddy) for listing to major marketplaces and keeping inventory synced. Strong at the listing layer; it relies on other tools for production and shop-floor fulfillment.",
            price: "~$29 / mo (volume-tiered)",
        },
    },
    table: [
        { feature: "Multichannel listing",                pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Real-time inventory sync",            pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Marketplace integrations",            pythias: "18+ (200+ via Mirakl/Acenda)", competitor: "Major channels", winner: "pythias" },
        { feature: "Unified order import",                pythias: true,                competitor: true,                  winner: "tie" },
        { feature: "Production queue management",         pythias: "DTF/DTG/embroidery/sublimation", competitor: false,    winner: "pythias" },
        { feature: "Print-method order routing",          pythias: true,                competitor: false,                 winner: "pythias" },
        { feature: "Shipping labels + tracking sync",     pythias: true,                competitor: "Limited",             winner: "pythias" },
        { feature: "Fulfillment partner routing",         pythias: true,                competitor: false,                 winner: "pythias" },
        { feature: "Blank/raw inventory tracking",        pythias: true,                competitor: "Finished goods only", winner: "pythias" },
        { feature: "Per-order fees",                      pythias: "None",              competitor: "Scales with volume",  winner: "pythias" },
        { feature: "Analytics dashboard",                 pythias: true,                competitor: "Basic",               winner: "pythias" },
    ],
    differences: [
        {
            icon: "🏭",
            title: "Pythias runs your production floor; Sellbrite stops at the listing",
            body: "Sellbrite is excellent at getting products live across channels and keeping stock in sync. But when an order arrives, you still need somewhere to route it, a queue for your DTF/DTG/embroidery team, and a way to attach the right design file. Pythias is built for exactly that — it manages production end to end, not just the listing.",
        },
        {
            icon: "💸",
            title: "Flat pricing vs volume-tiered",
            body: "Sellbrite's plans step up as your order volume grows, so your cost rises with your success. Pythias is a flat subscription with no per-order fees — at higher volumes the economics increasingly favor Pythias.",
        },
        {
            icon: "🌐",
            title: "More reach out of the box",
            body: "Sellbrite covers the major marketplaces. Pythias connects to 18+ directly — including Walmart, Target Plus, TikTok Shop, Faire, SHEIN, and Temu — plus 200+ more channels through Mirakl and Acenda.",
        },
        {
            icon: "📦",
            title: "Inventory down to the blank",
            body: "Sellbrite tracks finished-goods inventory. Pythias tracks raw blanks by color and size with reorder alerts, so production-based sellers know what they can actually make before an order hits the floor — not just what's listed.",
        },
    ],
    decide: {
        pythias: {
            title: "You produce and fulfill your own orders",
            sub: "Pythias is built for sellers and print operations that need listing, order routing, production, and shipping in one system.",
            points: [
                "You run DTF, DTG, embroidery, or sublimation production",
                "You want one platform from listing through shipment",
                "You're scaling and don't want costs that climb with order volume",
                "You need blank inventory and fulfillment-partner routing, not just listing sync",
            ],
        },
        competitor: {
            title: "You only need listing and inventory sync",
            sub: "Sellbrite is a clean, affordable choice if production and fulfillment live elsewhere.",
            points: [
                "You list to a handful of major marketplaces",
                "You outsource or don't manage your own production",
                "You want the simplest possible listing + sync tool",
            ],
        },
    },
    faqs: [
        { q: "What's the main difference between Pythias and Sellbrite?", a: "Sellbrite focuses on multichannel listing and inventory sync. Pythias does that and adds the entire production and fulfillment layer — order routing, DTF/DTG/embroidery/sublimation queues, shipping labels, and tracking confirmation. If you produce your own orders, Pythias covers the steps Sellbrite leaves to other tools." },
        { q: "Does Sellbrite handle production or shipping labels?", a: "Sellbrite is primarily a listing and inventory tool; production management and full label/tracking workflows generally rely on additional software. Pythias includes production queues, carrier label generation, and per-channel tracking confirmation natively." },
        { q: "Which is more cost-effective at scale?", a: "Sellbrite's plans are tiered by order volume, so cost rises as you grow. Pythias is a flat subscription starting at $199/month with no per-order fees, so the higher your volume, the more the economics tend to favor Pythias." },
        { q: "Can Pythias list to the same marketplaces as Sellbrite?", a: "Yes, and more. Pythias integrates directly with 18+ marketplaces — including Amazon, eBay, Etsy, Walmart, Shopify, TikTok Shop, Target Plus, and Faire — plus 200+ additional channels via Mirakl and Acenda." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Sellbrite — Multichannel Software Comparison 2026",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-sellbrite",
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
