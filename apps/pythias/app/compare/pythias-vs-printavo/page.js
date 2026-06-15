import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs Printavo — Print Shop Software Comparison 2026",
    description: "Pythias vs Printavo: compare what each does for a print shop. Printavo handles quoting, invoicing, and job scheduling; Pythias automates marketplace orders, production, inventory, and fulfillment.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-printavo" },
    openGraph: {
        type: "article",
        title: "Pythias vs Printavo — Print Shop Software Comparison",
        description: "Printavo is quote-to-invoice shop management for custom jobs. Pythias automates marketplace orders, production, and fulfillment. They solve different problems — see how.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-printavo",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pythias vs Printavo Comparison" }],
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>Printavo</span></>,
        sub: "These solve different problems. Printavo manages quotes, invoices, and job scheduling for custom and wholesale orders. Pythias automates marketplace orders, production routing, inventory, and fulfillment for shops selling online.",
        verdict: "Printavo for quote-to-invoice management of custom jobs. Pythias for automating high-volume online marketplace orders end to end. Many shops use both.",
    },
    overview: {
        pythias: {
            tagline: "Marketplace order + production + fulfillment automation",
            desc: "Pythias pulls orders from 18+ marketplaces into one production queue, routes them by print method with the right files, tracks blank inventory, prints labels, and confirms tracking — built for high-volume online selling. Flat pricing, no per-order fees.",
            price: "$199 / mo",
        },
        competitor: {
            name: "Printavo",
            tagline: "Print shop management (quote-to-invoice)",
            desc: "Cloud shop-management software for screen print and decoration shops — quoting, invoicing, approvals, job scheduling, payments, and customer communication for custom and wholesale orders.",
            price: "Subscription (tiered)",
        },
    },
    table: [
        { feature: "Quoting & estimates",                pythias: false,               competitor: true,                  winner: "competitor" },
        { feature: "Invoicing & payments",               pythias: false,               competitor: true,                  winner: "competitor" },
        { feature: "Customer approvals / proofs",        pythias: false,               competitor: true,                  winner: "competitor" },
        { feature: "Job scheduling / calendar",          pythias: "Production queue",   competitor: "Full scheduling",     winner: "competitor" },
        { feature: "Marketplace order import",           pythias: "18+ channels",       competitor: false,                 winner: "pythias" },
        { feature: "Multichannel listing",               pythias: true,                 competitor: false,                 winner: "pythias" },
        { feature: "Production routing by print method", pythias: true,                 competitor: "Manual",              winner: "pythias" },
        { feature: "Blank inventory tracking",           pythias: true,                 competitor: "Limited",             winner: "pythias" },
        { feature: "Shipping labels + tracking sync",    pythias: true,                 competitor: false,                 winner: "pythias" },
        { feature: "Per-order fees",                     pythias: "None",               competitor: "None",                winner: "tie" },
    ],
    differences: [
        {
            icon: "🎯",
            title: "Different jobs entirely",
            body: "Printavo is a quote-to-invoice system for custom and wholesale work — a customer asks for 200 shirts, you quote, get approval, schedule, and invoice. Pythias is for selling finished designs online — orders arrive from marketplaces already paid, and the job is producing and shipping them fast at volume. Most shops do both kinds of business.",
        },
        {
            icon: "🛒",
            title: "Pythias brings the orders in; Printavo doesn't",
            body: "Printavo doesn't pull orders from Amazon, Etsy, TikTok Shop, or Shopify — it's built around manually-entered custom jobs. Pythias imports orders from 18+ marketplaces automatically, routes them to production, and confirms tracking back to each channel.",
        },
        {
            icon: "📦",
            title: "Fulfillment and inventory built in",
            body: "Pythias tracks blank inventory by color and size, generates carrier labels, and syncs tracking to every marketplace. Printavo focuses on the front office (quotes, invoices, approvals) rather than the fulfillment and shipping back office for online orders.",
        },
        {
            icon: "🤝",
            title: "They can work together",
            body: "A shop can run Printavo for its custom/wholesale quote-to-invoice business and Pythias for its high-volume online marketplace orders. They cover opposite ends of the workflow rather than competing head to head.",
        },
    ],
    decide: {
        pythias: {
            title: "Your growth is in online marketplace orders",
            sub: "Pythias is built to automate high-volume, already-paid orders from marketplaces and stores end to end.",
            points: [
                "You sell finished designs on Amazon, Etsy, TikTok Shop, Shopify, etc.",
                "You need orders to route to production automatically",
                "You want blank inventory, labels, and tracking handled in one place",
                "Your volume is too high for manual order entry",
            ],
        },
        competitor: {
            title: "Your business is custom & wholesale jobs",
            sub: "Printavo is the better fit when quoting, approvals, and invoicing are the core of your workflow.",
            points: [
                "You quote custom jobs and need estimates + invoices",
                "You manage customer approvals and proofs",
                "You schedule jobs and collect payments in one tool",
            ],
        },
    },
    faqs: [
        { q: "Is Pythias a replacement for Printavo?", a: "Not exactly — they solve different problems. Printavo manages quoting, invoicing, approvals, and scheduling for custom and wholesale orders. Pythias automates marketplace and store orders end to end: import, production routing, inventory, labels, and tracking. Many shops use Printavo for custom work and Pythias for online marketplace volume." },
        { q: "Does Printavo pull orders from marketplaces?", a: "Printavo is built around manually-created custom jobs rather than automatic marketplace order import. Pythias connects to 18+ marketplaces — Amazon, Etsy, TikTok Shop, Walmart, Shopify, eBay, and more — and pulls those orders into one production queue automatically." },
        { q: "Can I use both Printavo and Pythias?", a: "Yes, and many shops do. Run Printavo for your custom/wholesale quote-to-invoice business and Pythias for your high-volume online marketplace orders. They cover opposite ends of the workflow, so they complement rather than conflict." },
        { q: "Does Pythias do quoting and invoicing?", a: "No — Pythias is focused on automating already-paid online orders through production and fulfillment, not front-office quoting and invoicing. If quote-to-invoice management is your main need, Printavo is the right tool for that part of the business." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs Printavo — Print Shop Software Comparison 2026",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-printavo",
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
