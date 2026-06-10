import { VsLayout } from "../ComparisonLayout";

export const metadata = {
    title: "Pythias vs ShipStation — Which Is Right for Print Shops?",
    description: "Pythias vs ShipStation: a detailed feature-by-feature comparison for print-on-demand businesses. ShipStation handles shipping. Pythias handles everything — production queues, marketplace sync, inventory, labels, and analytics.",
    alternates: { canonical: "https://pythiastechnologies.com/compare/pythias-vs-shipstation" },
    openGraph: {
        title: "Pythias vs ShipStation — Print Shop Software Comparison",
        description: "ShipStation is a shipping tool. Pythias is a complete print operations platform. See the full comparison.",
        url: "https://pythiastechnologies.com/compare/pythias-vs-shipstation",
    },
};

const data = {
    hero: {
        badge: "Software Comparison",
        h1: <>Pythias vs <span style={{ color: "rgba(255,255,255,0.6)" }}>ShipStation</span></>,
        sub: "ShipStation helps you ship orders. Pythias manages your entire print operation — from the moment an order lands to the moment it leaves your dock.",
        verdict: "Pythias for print shops that need production management. ShipStation for businesses that only need shipping.",
    },
    overview: {
        pythias: {
            tagline: "Complete print operations platform",
            desc: "Manages production queues, marketplace sync, inventory, shipping labels, team access, and analytics — purpose-built for print-on-demand and custom apparel operations.",
            price: "$199 / mo",
        },
        competitor: {
            name: "ShipStation",
            tagline: "Multi-carrier shipping software",
            desc: "Aggregates orders from selling channels and streamlines the shipping label process. Strong carrier rate shopping and tracking automation. Not built for production management.",
            price: "$9 / mo",
        },
    },
    table: [
        { feature: "Multi-marketplace order import",        pythias: true,               competitor: true,                  winner: "tie" },
        { feature: "Production queue management",           pythias: true,               competitor: false,                 winner: "pythias" },
        { feature: "DTF / DTG / embroidery workflows",      pythias: true,               competitor: false,                 winner: "pythias" },
        { feature: "Print job assignment & routing",        pythias: true,               competitor: false,                 winner: "pythias" },
        { feature: "Shipping label generation",             pythias: true,                       competitor: true,           winner: "tie" },
        { feature: "Multi-carrier rate shopping",           pythias: "USPS, FedEx, UPS, DHL, Stamps.com, Endicia", competitor: "40+ carriers", winner: "ShipStation" },
        { feature: "Tracking sync to marketplaces",         pythias: true,               competitor: true,                  winner: "tie" },
        { feature: "Blank inventory tracking",              pythias: true,               competitor: false,                 winner: "pythias" },
        { feature: "Barcode / scan-to-ship workflow",       pythias: true,               competitor: "Scan to verify only", winner: "pythias" },
        { feature: "Team & floor management",               pythias: true,               competitor: false,                 winner: "pythias" },
        { feature: "Production analytics & reporting",      pythias: true,               competitor: "Shipping only",       winner: "pythias" },
        { feature: "Built for print-on-demand",             pythias: true,               competitor: false,                 winner: "pythias" },
    ],
    differences: [
        {
            icon: "🖨️",
            title: "ShipStation starts where Pythias is already done",
            body: "ShipStation picks up after production is complete — when an order is ready to ship. Pythias manages the entire workflow before that: routing orders to the right machine, assigning print jobs, tracking job completion, and then generating the shipping label automatically when the scan happens.",
        },
        {
            icon: "📦",
            title: "Inventory management built in",
            body: "Print shops burn through blanks. Pythias tracks every SKU in real time — color, size, style — with automated reorder alerts before you run out mid-production run. ShipStation has no blank or raw materials inventory tracking.",
        },
        {
            icon: "🏭",
            title: "Production floor tools",
            body: "Pythias includes badge scan login for production staff, role-based access (operators see their queue, managers see everything), built-in messaging, and shift management. ShipStation is a back-office tool with no production floor capabilities.",
        },
        {
            icon: "💰",
            title: "The real cost comparison",
            body: "ShipStation starts at $9/mo but charges per label volume — at 500+ shipments/month you're paying $99–$229/mo. Pythias starts at $199/mo with no per-order or per-label fees, and includes production management that would otherwise require separate software (Printavo, OrderDesk, etc.).",
        },
    ],
    decide: {
        pythias: {
            title: "You run a print shop or POD operation",
            sub: "If you're managing production — DTF, DTG, embroidery, screen print, sublimation — Pythias was built for you.",
            points: [
                "You own printers, embroidery machines, or DTF equipment",
                "Orders come from multiple marketplaces (Etsy, Amazon, TikTok, etc.)",
                "You need to manage production queues, not just shipments",
                "You want inventory tracking and team management in one place",
            ],
        },
        competitor: {
            title: "You only need to manage shipping",
            sub: "ShipStation is the right tool if your production is already handled and you just need labels.",
            points: [
                "You use a third-party fulfillment service that handles production",
                "You need 40+ carrier options including international",
                "Your order volume is low and the per-label pricing makes sense",
            ],
        },
    },
    faqs: [
        { q: "Can Pythias replace ShipStation entirely?", a: "For most print shops, yes. Pythias includes USPS, FedEx, UPS, DHL, and Stamps.com label generation, carrier rate selection, and automatic tracking sync to every connected marketplace — the core reasons print shops use ShipStation. The only scenario where you'd still want ShipStation is if you rely on regional carriers not yet in Pythias." },
        { q: "Does Pythias integrate with ShipStation?", a: "Currently Pythias generates labels natively via USPS, FedEx, and UPS. A ShipStation integration is on the roadmap for shops that want to use both systems during transition." },
        { q: "How is Pythias pricing different from ShipStation?", a: "ShipStation charges per shipment volume ($9–$229/mo) for shipping only. Pythias charges a flat monthly rate ($199–$3,000/mo) that covers your entire operation — production management, marketplace sync, inventory, team tools, shipping labels, and analytics. No per-order fees, no per-label fees." },
        { q: "How long does switching from ShipStation to Pythias take?", a: "Most shops are fully live with Pythias within 2 weeks. We handle the technical setup — marketplace connections, printer integration, data import — with guided remote onboarding." },
    ],
};

const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Pythias vs ShipStation — Which Is Right for Print Shops?",
    "description": metadata.description,
    "url": "https://pythiastechnologies.com/compare/pythias-vs-shipstation",
    "articleSection": "Software Comparison",
    "author":    { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" },
    "dateModified": "2026-06-10",
};

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <VsLayout {...data} />
        </>
    );
}
