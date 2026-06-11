import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Etsy Sellers — Print on Demand Fulfillment Automation | Pythias",
    description: "Software built for Etsy sellers who fulfill their own print-on-demand orders. Automate order routing, maintain Star Seller shipping metrics, sync tracking back to Etsy, and manage production from one dashboard.",
    keywords: "Etsy seller software, software for Etsy sellers, Etsy print on demand software, Etsy fulfillment automation, Etsy order management software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-etsy-sellers" },
    openGraph: {
        title: "Software for Etsy Sellers | Pythias Technologies",
        description: "Built for Etsy sellers — automate order routing, protect your Star Seller status, sync tracking, and manage print production from one dashboard.",
        url: "https://pythiastechnologies.com/software-for-etsy-sellers",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Etsy Sellers | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Etsy Seller Software",
        h1: <>Fulfill <span style={GRAD}>Etsy Orders</span> Automatically<br />and Protect Your Star Seller Status</>,
        sub: "Pythias connects to Etsy via OAuth, routes every order to production instantly, and syncs tracking back automatically — so your on-time shipping rate stays green without manual effort.",
        stats: [
            { value: "OAuth", label: "Etsy API Connection" },
            { value: "Auto", label: "Tracking Sync to Etsy" },
            { value: "Real-time", label: "Order Import" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Etsy's Star Seller badge depends on your shipping rate. Manual fulfillment puts it at risk.",
        sub: "Etsy's Star Seller program requires 95%+ on-time shipping. Manual order management — copying orders, printing labels one at a time, manually uploading tracking — is a high-risk way to run your shop.",
        items: [
            {
                icon: "⭐",
                title: "Star Seller status is fragile",
                body: "Missing a few shipments or forgetting to mark orders as shipped can drop your on-time rate below 95% and cost you the Star Seller badge — and the traffic boost that comes with it.",
            },
            {
                icon: "🗂️",
                title: "Custom orders are hard to route",
                body: "Etsy buyers often order custom colors, sizes, or personalization. Routing each custom order to the right production step with the right file manually takes time that compounds across dozens of daily orders.",
            },
            {
                icon: "🔀",
                title: "Etsy is just one of your channels",
                body: "Most Etsy sellers also sell on Amazon, their own Shopify store, or other platforms. Managing Etsy orders separately from everything else means constant tab-switching and a higher chance of missing something.",
            },
        ],
    },
    features: {
        title: "Pythias automates Etsy fulfillment from order to tracking confirmation.",
        sub: "Connect once and Pythias handles the rest — order import, production routing, label generation, and tracking sync back to Etsy.",
        items: [
            {
                icon: "🛍️",
                title: "Etsy OAuth API Integration",
                body: "Connect your Etsy shop via OAuth and every new receipt flows into your production queue automatically. No CSV downloads, no manual order entry.",
                bullets: ["Direct Etsy API connection via OAuth", "Real-time receipt import", "Order status sync back to Etsy"],
            },
            {
                icon: "⭐",
                title: "On-Time Shipping Protection",
                body: "Pythias tracks Etsy's expected ship date for every order and flags at-risk orders so your team can prioritize before the deadline passes — protecting your Star Seller metrics.",
                bullets: ["Ship-by deadline tracking per order", "At-risk order alerts", "On-time rate reporting"],
            },
            {
                icon: "🖨️",
                title: "Production Queue Routing",
                body: "Etsy orders route automatically into the correct print queue — DTF, DTG, embroidery — with the right design file and size attached. Custom orders route correctly by SKU.",
                bullets: ["Print-type routing by product SKU", "Design file auto-attachment", "Custom personalization routing support"],
            },
            {
                icon: "🚚",
                title: "Auto Shipping Labels + Etsy Tracking Sync",
                body: "Scan a completed Etsy order, Pythias generates the label, captures tracking, and marks the order as shipped on Etsy automatically — in seconds.",
                bullets: ["USPS, FedEx, UPS label generation", "Auto tracking confirmation to Etsy", "Batch label printing support"],
            },
            {
                icon: "🛒",
                title: "Sell on Etsy and Every Other Channel",
                body: "Pythias connects Etsy alongside Amazon, Shopify, TikTok Shop, Faire, and 15+ other channels — all in one unified production queue so nothing gets missed.",
                bullets: ["18+ marketplace integrations", "Unified production view", "Per-channel rule configuration"],
            },
            {
                icon: "📊",
                title: "Etsy Channel Analytics",
                body: "Revenue from Etsy, units shipped, on-time rate, and your top-selling products — all in a single dashboard alongside your other channels.",
                bullets: ["Etsy revenue and order volume", "On-time fulfillment rate", "Top-selling SKU reporting"],
            },
        ],
    },
    howItWorks: {
        title: "Etsy orders in your production queue in minutes",
        steps: [
            {
                title: "Connect your Etsy shop",
                body: "Authorize Pythias via Etsy OAuth. Every new receipt starts flowing into your production queue in real time — usually within minutes of setup.",
            },
            {
                title: "Orders route to production automatically",
                body: "Each order routes to the correct print queue with its ship-by deadline displayed. Custom orders route correctly by SKU. Your team always knows what to make first.",
            },
            {
                title: "Ship and confirm automatically",
                body: "Scan the completed order. Pythias generates the label, captures tracking, and marks the Etsy order as shipped. Your on-time rate stays protected without manual steps.",
            },
        ],
    },
    faqs: [
        { q: "How does Pythias connect to my Etsy shop?", a: "Pythias connects to Etsy using the official Etsy API via OAuth. You authorize the connection from your Pythias dashboard, and open receipts begin importing automatically within minutes. Tracking and fulfillment confirmation sync back to Etsy the same way." },
        { q: "Will Pythias help protect my Etsy Star Seller status?", a: "Yes. Pythias tracks Etsy's expected ship date for every order and flags at-risk orders in the production queue before the window closes. Automated label generation and tracking sync eliminate the manual steps that cause on-time misses." },
        { q: "Can I manage Etsy and other channels like Amazon and Shopify in the same Pythias account?", a: "Yes. Pythias connects all your selling channels — Etsy, Amazon, Shopify, TikTok Shop, Faire, and more — into one unified production queue. Each order is tagged by channel and routes with channel-specific rules." },
        { q: "Does Pythias support custom and personalized Etsy orders?", a: "Yes. Pythias routes orders by SKU, so custom product variants and personalized items route to the correct print queue with the right production spec attached. You can configure routing rules for custom SKU patterns." },
        { q: "What print methods does Pythias support for Etsy sellers?", a: "Pythias supports DTF, DTG, embroidery, and sublimation — each with its own production queue. Most print-on-demand Etsy sellers use one or more of these methods, and Pythias manages them all in the same platform." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Etsy Seller Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-etsy-sellers",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Etsy Sellers", "item": "https://pythiastechnologies.com/software-for-etsy-sellers" },
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
