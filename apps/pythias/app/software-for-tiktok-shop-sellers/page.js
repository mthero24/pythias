import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for TikTok Shop Sellers — Print on Demand Fulfillment | Pythias",
    description: "Software built for TikTok Shop sellers who fulfill their own orders. Automate order routing, hit shipping SLAs, sync tracking back to TikTok Shop, and manage production from one dashboard.",
    keywords: "TikTok Shop seller software, software for TikTok Shop sellers, TikTok Shop fulfillment software, TikTok Shop print on demand, TikTok Shop order management",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-tiktok-shop-sellers" },
    openGraph: {
        title: "Software for TikTok Shop Sellers | Pythias Technologies",
        description: "Built for TikTok Shop sellers — automate order routing, hit shipping SLAs, sync tracking, and manage print production from one dashboard.",
        url: "https://pythiastechnologies.com/software-for-tiktok-shop-sellers",
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "TikTok Shop Seller Software",
        h1: <>Fulfill <span style={GRAD}>TikTok Shop</span> Orders<br />Without Missing a Single SLA</>,
        sub: "TikTok Shop has strict shipping windows. Pythias connects directly to your TikTok Shop seller account, routes orders to production instantly, and syncs tracking back automatically.",
        stats: [
            { value: "Direct", label: "TikTok Shop API" },
            { value: "Auto", label: "Tracking Sync" },
            { value: "Real-time", label: "Order Import" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "TikTok Shop moves fast. Manual fulfillment can't keep up.",
        sub: "TikTok Shop's algorithm rewards on-time fulfillment and penalizes late shipments. Manual order management is a business risk when volume spikes after a viral video.",
        items: [
            {
                icon: "⚡",
                title: "Viral spikes overwhelm manual processes",
                body: "One video can send hundreds of orders in hours. Manually downloading CSV files, printing labels, and confirming shipments one by one means SLA misses, suppressed listings, and lost momentum.",
            },
            {
                icon: "⏱️",
                title: "TikTok's shipping SLAs are strict",
                body: "TikTok Shop requires sellers to ship within 3 days or face listing suppression and lower placement. Manual tracking upload after every shipment is tedious — and one missed confirmation tanks your metrics.",
            },
            {
                icon: "🔀",
                title: "TikTok orders live in a separate world",
                body: "If you also sell on Etsy, Amazon, or Shopify, your TikTok orders are in a completely different dashboard. Your production team has no unified view of what to make and ship today.",
            },
        ],
    },
    features: {
        title: "Pythias connects directly to TikTok Shop and automates everything downstream.",
        sub: "From order import to production routing to tracking sync — Pythias handles TikTok Shop fulfillment without manual steps.",
        items: [
            {
                icon: "🎵",
                title: "TikTok Shop API Integration",
                body: "Connect your TikTok Shop seller account and every new order flows into your production queue automatically within minutes. No CSV downloads, no manual entry.",
                bullets: ["Direct TikTok Shop API connection", "Real-time order import", "Order status sync back to TikTok"],
            },
            {
                icon: "⏱️",
                title: "SLA Tracking & Alerts",
                body: "Pythias tracks the TikTok Shop ship-by deadline for every order and surfaces at-risk orders before the window closes — so you hit your metrics consistently.",
                bullets: ["Ship-by deadline tracking per order", "At-risk SLA alerts", "On-time fulfillment rate reporting"],
            },
            {
                icon: "🖨️",
                title: "Production Queue Routing",
                body: "TikTok orders route automatically into the correct print queue — DTF, DTG, embroidery — with the right design file and size attached. No manual routing decisions.",
                bullets: ["Print-type routing by SKU", "Design file auto-attachment", "Priority sort by SLA deadline"],
            },
            {
                icon: "🚚",
                title: "Automatic Shipping Labels + Tracking Sync",
                body: "Scan a completed TikTok Shop order and Pythias generates the shipping label, captures tracking, and confirms shipment on TikTok Shop automatically.",
                bullets: ["USPS, FedEx, UPS label generation", "Auto tracking confirmation to TikTok", "Batch label printing support"],
            },
            {
                icon: "🛒",
                title: "Sell on TikTok and Everywhere Else",
                body: "Pythias connects TikTok Shop alongside Amazon, Etsy, Shopify, Walmart, and 15+ other channels — all in one production queue so your team never misses an order regardless of source.",
                bullets: ["18+ marketplace integrations", "Unified production view", "Per-channel SLA rules"],
            },
            {
                icon: "📊",
                title: "TikTok Channel Analytics",
                body: "Revenue by channel, units shipped, on-time rate, and fulfillment metrics specifically for your TikTok Shop — alongside all other channels in one dashboard.",
                bullets: ["TikTok-specific revenue reporting", "Fulfillment rate by channel", "Daily production summary"],
            },
        ],
    },
    howItWorks: {
        title: "TikTok Shop orders in your queue within minutes",
        steps: [
            {
                title: "Connect your TikTok Shop account",
                body: "Authorize Pythias via the TikTok Shop API. Every new order starts flowing into your production queue in real time — usually within 5 minutes of setup.",
            },
            {
                title: "Orders route to production automatically",
                body: "Each TikTok order routes to the correct print queue with its SLA deadline displayed. Your team always knows which jobs are due first.",
            },
            {
                title: "Ship and confirm automatically",
                body: "Scan the completed order, Pythias generates the label, and tracking confirms back to TikTok Shop without any manual steps. Your metrics stay clean.",
            },
        ],
    },
    faqs: [
        { q: "How does Pythias connect to TikTok Shop?", a: "Pythias integrates directly with the TikTok Shop Seller API. You authorize the connection from your Pythias dashboard, and orders begin flowing automatically within minutes. Tracking confirmations sync back to TikTok Shop the same way." },
        { q: "Does Pythias help hit TikTok Shop's shipping SLAs?", a: "Yes. Pythias tracks the ship-by deadline for every TikTok Shop order and flags at-risk orders in the production queue before the window closes. Automated shipping label generation and tracking sync eliminate the manual steps that cause SLA misses." },
        { q: "Can I manage TikTok Shop and other channels like Etsy and Amazon in the same Pythias account?", a: "Yes. Pythias connects all your selling channels — TikTok Shop, Etsy, Amazon, Shopify, Walmart, and more — into one unified production queue. Each order is tagged by channel, and SLA rules can be set per platform." },
        { q: "What happens when I get a viral spike on TikTok Shop?", a: "Pythias handles volume spikes automatically. Orders import in real time, route to the production queue, and get labeled on scan completion. The system doesn't require any additional manual steps at high volume — it scales with your order count." },
        { q: "Does Pythias work for print-on-demand sellers specifically on TikTok Shop?", a: "Yes. Pythias was built for print-on-demand operations. It manages your production queue by print type (DTF, DTG, embroidery, sublimation), tracks blank inventory, and automates shipping — all specifically designed for POD fulfillment on TikTok Shop and other channels." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — TikTok Shop Seller Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-tiktok-shop-sellers",
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
            { "@type": "ListItem", "position": 2, "name": "Software for TikTok Shop Sellers", "item": "https://pythiastechnologies.com/software-for-tiktok-shop-sellers" },
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
