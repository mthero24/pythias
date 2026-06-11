import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Shopify — Print-on-Demand Operations Compared",
    description: "Pythias vs Shopify for print-on-demand businesses. Shopify is your storefront. Pythias is the production and fulfillment engine behind it. See why top print shops use both — or why Pythias alone covers more channels.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-shopify" },
    openGraph: {
        type: "article",
        title: "Pythias vs Shopify — Print Operations Comparison",
        description: "Shopify runs your store. Pythias runs your production floor, syncs 18+ marketplaces, and ships orders. See the full comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-shopify",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Shopify Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Shopify</span></>,
        sub: "Shopify is a world-class storefront. Pythias is the production and fulfillment engine that runs behind it — and connects to 17 other marketplaces at the same time.",
        verdict: "Not really competitors. Pythias connects to Shopify and handles everything Shopify can't — production queues, inventory, multi-marketplace sync, and shipping.",
    },
    overview: {
        pythias: {
            tagline: "Print operations & fulfillment platform",
            desc: "Manages production queues, syncs orders from 18+ marketplaces (including Shopify), tracks blank inventory, generates shipping labels, and gives you real-time analytics — all in one platform built for print shops.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Shopify",
            tagline: "E-commerce storefront platform",
            desc: "The leading platform for building and running an online store. Handles product listings, checkout, payments, and basic order management. Requires third-party apps for production workflows and multi-marketplace selling.",
            price: "$39 / mo",
        },
    },
    table: [
        { feature: "Online storefront & checkout",          pythias: false,               competitor: true,                   winner: "Shopify" },
        { feature: "Multi-marketplace order sync",          pythias: "18+ channels",      competitor: "Shopify only",         winner: "pythias" },
        { feature: "Amazon, Etsy, TikTok, Walmart sync",    pythias: true,                competitor: "Via paid apps",        winner: "pythias" },
        { feature: "Production queue management",           pythias: true,                competitor: false,                  winner: "pythias" },
        { feature: "DTF / DTG / embroidery workflows",      pythias: true,                competitor: false,                  winner: "pythias" },
        { feature: "Blank inventory tracking",              pythias: true,                competitor: "Product only",         winner: "pythias" },
        { feature: "Shipping label generation",             pythias: true,                competitor: "Shopify Shipping add-on", winner: "tie" },
        { feature: "Tracking sync to all channels",         pythias: true,                competitor: "Shopify store only",   winner: "pythias" },
        { feature: "Team & production floor tools",         pythias: true,                competitor: false,                  winner: "pythias" },
        { feature: "Built for print-on-demand ops",         pythias: true,                competitor: false,                  winner: "pythias" },
        { feature: "No per-order fees",                     pythias: true,                competitor: "2% transaction fee",   winner: "pythias" },
    ],
    differences: [
        {
            icon: "🔗",
            title: "They solve different problems",
            body: "Shopify is where your customers buy. Pythias is where your team fulfills. Shopify doesn't know your printers exist — it just sends you orders. Pythias takes those orders, routes them to the right machine, tracks production, and ships the finished product. They're complementary, not competing.",
        },
        {
            icon: "🌐",
            title: "Pythias connects to 18 channels, not just one",
            body: "If you sell on Etsy, Amazon, Walmart, and TikTok in addition to Shopify, you can't manage production from Shopify — it only sees its own orders. Pythias pulls from all 18+ channels into one production queue. Your team sees one list of what to make, regardless of where the customer ordered.",
        },
        {
            icon: "🏭",
            title: "Shopify has no production management",
            body: "Shopify tells you what was ordered. It does not tell your team what to print, on which machine, in what priority, or when it's due. There's no DTF queue, no embroidery job tracker, no scan-to-ship workflow. You'd need Printavo, OrderDesk, or a custom solution on top. Pythias handles all of this natively.",
        },
        {
            icon: "📊",
            title: "Real inventory vs. product catalog",
            body: "Shopify tracks how many finished products you have listed. Pythias tracks your blank inventory — how many Gildan 64000 blank tees in size M/Color Black you have on the shelf — with automated reorder alerts. These are fundamentally different inventory systems for fundamentally different purposes.",
        },
    ],
    decide: {
        pythias: {
            title: "You run production for multiple channels",
            sub: "If you're printing, embroidering, or fulfilling orders from more than just Shopify, Pythias is the backbone you need.",
            points: [
                "You sell on Etsy, Amazon, TikTok, Walmart, or other channels beyond Shopify",
                "You have a production floor — printers, embroidery machines, DTF equipment",
                "You need to track blank inventory, not just finished product inventory",
                "You want all orders in one production queue regardless of source",
            ],
        },
        competitor: {
            title: "You only sell on one Shopify store",
            sub: "Shopify is right if you're building a direct-to-consumer brand without multi-channel complexity.",
            points: [
                "You sell exclusively through your Shopify storefront",
                "You use a third-party POD service (Printful, Printify) so production is outsourced",
                "You need a customer-facing storefront with checkout and payments",
            ],
        },
    },
    faqs: [
        { q: "Do I need Shopify if I use Pythias?", a: "Not necessarily. Pythias connects to 18+ marketplaces natively — Etsy, Amazon, TikTok, Walmart, eBay, and more. If you already sell on those channels, you may not need a Shopify store at all. However, if you want your own branded storefront with direct checkout, Shopify is still the best option — and Pythias integrates with it seamlessly." },
        { q: "Can Pythias sync with my existing Shopify store?", a: "Yes. Pythias connects to Shopify via API and pulls orders automatically. Your Shopify store stays exactly as it is — you keep your storefront, your product listings, and your customer experience. Pythias handles the back-end production and fulfillment." },
        { q: "What about Shopify's built-in shipping tools?", a: "Shopify Shipping works for Shopify orders. The problem: it doesn't know about your orders from Amazon, Etsy, or TikTok. Pythias generates shipping labels for all orders from all channels in one place, automatically triggered when a production job is completed." },
        { q: "What does Pythias cost compared to running Shopify + apps?", a: "A typical Shopify print shop setup includes Shopify ($39–$399/mo) + a production management app like Printavo ($49–$149/mo) + multi-channel listing software ($50–$200/mo) + shipping software. Pythias consolidates all of this into one platform starting at $199/mo." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Shopify — Print-on-Demand Operations Compared",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-shopify",
    "articleSection": "Software Comparison",
    "author":    { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    "dateModified": "2026-06-10",
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
