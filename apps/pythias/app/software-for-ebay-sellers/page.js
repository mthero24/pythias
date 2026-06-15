import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for eBay Sellers — Order & Fulfillment Automation | Pythias",
    description: "Fulfillment and order management software for eBay sellers. Auto-import eBay orders, route to production, print labels, and upload tracking on time — while selling across 18+ other channels. No per-order fees.",
    keywords: "software for ebay sellers, ebay order management software, ebay fulfillment software, ebay seller tools, ebay multichannel software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-ebay-sellers" },
    openGraph: {
        title: "Software for eBay Sellers | Pythias Technologies",
        description: "Automate eBay order routing, production, and shipping — and run every other marketplace from the same dashboard. No per-order fees.",
        url: "https://pythiastechnologies.com/software-for-ebay-sellers",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for eBay Sellers | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Software for eBay Sellers",
        h1: <>Sell on <span style={GRAD}>eBay</span>.<br />Fulfill on Autopilot.</>,
        sub: "Pythias pulls your eBay orders into one production queue, routes them automatically, prints labels, and uploads tracking on time — protecting your seller standards while running every other channel you sell on.",
        stats: [
            { value: "Auto", label: "eBay Order Import" },
            { value: "18+", label: "Other Channels Too" },
            { value: "On-time", label: "Tracking Upload" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Top Rated Seller status is easy to lose and hard to win back.",
        sub: "eBay grades you on on-time shipment and valid tracking. Manual fulfillment across multiple channels is exactly how those metrics slip.",
        items: [
            {
                icon: "⭐",
                title: "Seller standards punish late tracking",
                body: "Miss the handling-time window or upload invalid tracking and your eBay seller level drops — costing you search visibility and the Top Rated discount. Manual processes make those misses inevitable at volume.",
            },
            {
                icon: "🔀",
                title: "eBay is one of many channels",
                body: "You also sell on Amazon, Etsy, TikTok Shop, and your own store. Managing eBay in its own portal means another dashboard and another place inventory drifts out of sync.",
            },
            {
                icon: "🖨️",
                title: "Orders don't reach production cleanly",
                body: "An eBay order doesn't know its print method or which design file it needs. Bridging that to your floor by hand slows everything and invites mistakes.",
            },
        ],
    },
    features: {
        title: "Everything an eBay seller needs to ship fast and stay Top Rated.",
        sub: "Pythias automates the path from eBay order to confirmed shipment — and runs all your other channels from one place.",
        items: [
            { icon: "📥", title: "Automatic eBay Order Import", body: "eBay orders flow into your production queue in real time with full buyer and line-item detail — no manual export, no copy-paste.", bullets: ["Real-time eBay order sync", "Full line-item + address detail", "Channel tagging across marketplaces"] },
            { icon: "🚚", title: "On-Time Tracking Upload", body: "Scan a completed order and Pythias prints the carrier label and uploads valid tracking to eBay inside the handling-time window — protecting your seller standards.", bullets: ["USPS, FedEx, UPS labels", "Valid tracking uploaded to eBay", "Handling-time aware workflow"] },
            { icon: "🧭", title: "Automated Order Routing", body: "Route every eBay order by print method, priority, and shipping speed with the correct design file attached — production starts immediately and rush orders never wait.", bullets: ["Route by print type + priority", "Rush/deadline sorting", "Print-ready file routing"] },
            { icon: "🌐", title: "Every Other Channel, One Dashboard", body: "Run Amazon, Etsy, TikTok Shop, Walmart, Shopify, and more alongside eBay — all orders in one queue, all inventory in sync, all tracking confirmed automatically.", bullets: ["18+ marketplace integrations", "Unified production queue", "Cross-channel inventory sync"] },
            { icon: "📦", title: "Inventory & Stock Control", body: "Live blank inventory by color and size keeps your eBay listings accurate and prevents oversells that trigger cancellations and defect rate hits.", bullets: ["Real-time stock tracking", "Low-stock + reorder alerts", "Multi-supplier support"] },
            { icon: "📊", title: "Revenue & Fulfillment Analytics", body: "See eBay revenue against your other channels, fulfillment rate, on-time performance, and daily output — the numbers that protect your seller level.", bullets: ["Revenue by channel", "On-time + fulfillment rate", "Daily output reporting"] },
        ],
    },
    howItWorks: {
        title: "From eBay order to confirmed shipment, automatically",
        steps: [
            { title: "Connect your eBay account", body: "Link eBay and any other channels you sell on. Orders begin importing into one unified production queue immediately." },
            { title: "Orders route themselves", body: "Each eBay order is sorted by print method, priority, and ship-by date with the right file attached — your team works one clean list." },
            { title: "Ship and upload tracking on time", body: "Scan to complete; Pythias prints the label and uploads valid tracking to eBay within the handling window, protecting your seller standards." },
        ],
    },
    faqs: [
        { q: "How does Pythias protect my eBay seller standards?", a: "By removing the manual delays that cause late shipments. eBay orders route automatically the moment they arrive, production works from a prioritized queue, and valid tracking is uploaded to eBay within the handling-time window — keeping your on-time shipment and tracking metrics where eBay requires for Top Rated Seller status." },
        { q: "Can I manage eBay and other marketplaces together?", a: "Yes. Pythias connects to 18+ marketplaces including eBay, Amazon, Walmart, Etsy, TikTok Shop, and Shopify, pulling every order into one production queue with shared inventory and automatic per-channel tracking confirmation." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month. eBay's own selling fees are separate — Pythias's cost stays predictable as your volume grows." },
        { q: "What print methods does Pythias support for eBay orders?", a: "Pythias supports DTF, DTG, embroidery, and sublimation, each with its own production queue and routing rules — so eBay orders are automatically directed to the correct workflow with the right design file." },
        { q: "Which sales channels can feed orders into Pythias?", a: "Pythias imports orders from 18+ direct integrations including eBay, Amazon, Walmart, Target Plus, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, and more — plus 200+ additional channels via Mirakl and Acenda." },
    ],
};

const schema = [
    { "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Pythias — Software for eBay Sellers", "description": metadata.description, "url": "https://pythiastechnologies.com/software-for-ebay-sellers", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": { "@type": "Offer", "price": "199", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "month" } }, "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" } },
    { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": data.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [ { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pythiastechnologies.com" }, { "@type": "ListItem", "position": 2, "name": "Software for eBay Sellers", "item": "https://pythiastechnologies.com/software-for-ebay-sellers" } ] },
];

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <IndustryLayout {...data} />
        </>
    );
}
