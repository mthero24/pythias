import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Embroidery Businesses — Order & Production Management | Pythias",
    description: "Software built for embroidery businesses. Manage machine queues, route DST files, track thread and blank inventory, sync orders from 18+ marketplaces, and auto-generate shipping labels.",
    keywords: "embroidery business software, software for embroidery businesses, embroidery shop management software, embroidery order management, embroidery production software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-embroidery-businesses" },
    openGraph: {
        title: "Software for Embroidery Businesses | Pythias Technologies",
        description: "Built for embroidery shops — machine queue management, DST file routing, thread inventory, multi-marketplace orders, and shipping automation.",
        url: "https://pythiastechnologies.com/software-for-embroidery-businesses",
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Embroidery Business Software",
        h1: <><span style={GRAD}>Embroidery Business Software</span><br />From Order In to Machine Out</>,
        sub: "DST file routing, machine queue management, thread and blank inventory, and multi-marketplace order sync — built for embroidery businesses that sell everywhere.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "Auto", label: "DST File Routing" },
            { value: "Zero", label: "Per-Order Fees" },
            { value: "< 2 wks", label: "Setup Time" },
        ],
    },
    pain: {
        title: "Embroidery operations have unique complexity most shop software ignores.",
        sub: "Stitch count pricing, DST file management, and machine-level routing make embroidery different from other print methods — and most general shop software can't keep up.",
        items: [
            {
                icon: "🧵",
                title: "DST files don't manage themselves",
                body: "Each design needs a digitized DST file matched to the correct hoop size, stitch count, and thread color sequence. Without a system, the wrong file goes to the wrong machine — and you waste a garment finding out.",
            },
            {
                icon: "⚙️",
                title: "Machine queue management is manual",
                body: "With multiple embroidery heads running simultaneously, figuring out which job goes to which machine, in what order, requires constant human coordination — or jobs pile up on one machine while others sit idle.",
            },
            {
                icon: "🛒",
                title: "Orders from multiple channels with no unified view",
                body: "Custom orders from Etsy, corporate orders from direct customers, wholesale from Faire — each with different lead times, file requirements, and shipping expectations. Managing them in separate dashboards creates chaos.",
            },
        ],
    },
    features: {
        title: "Pythias routes embroidery jobs from order to machine without manual intervention.",
        sub: "Pythias manages DST files, machine queues, and multi-channel orders in one system built for how embroidery businesses actually operate.",
        items: [
            {
                icon: "🪡",
                title: "Embroidery Production Queue",
                body: "Orders route automatically into an embroidery-specific queue, separate from other print types. Sort by deadline, hoop size, or machine assignment.",
                bullets: ["Print-type separation per queue", "Hoop size and machine routing", "Deadline + priority sorting"],
            },
            {
                icon: "🗂️",
                title: "DST & Design File Management",
                body: "Associate DST files with product SKUs so the correct digitized design is attached to every job automatically — no folder hunting before each run.",
                bullets: ["SKU-to-DST file mapping", "Version history for design files", "Multi-format support (DST, PES, EXP)"],
            },
            {
                icon: "🛒",
                title: "18+ Marketplace Integrations",
                body: "Pull orders from Etsy, Faire, Amazon, Shopify, Wix, and more into one unified embroidery queue. Custom lead times and production rules per channel.",
                bullets: ["Auto order import from all channels", "Per-channel production rules", "Real-time order sync"],
            },
            {
                icon: "📦",
                title: "Blank & Thread Inventory",
                body: "Track blanks by style, color, and size. Monitor thread inventory by color. Get alerts when stock dips below your reorder threshold.",
                bullets: ["Blank inventory at color + size level", "Thread color inventory tracking", "Low-stock alerts and reorder management"],
            },
            {
                icon: "🚚",
                title: "Automatic Shipping Labels",
                body: "Scan a completed embroidery job and Pythias generates the carrier label, captures tracking, and confirms fulfillment back to every marketplace.",
                bullets: ["Auto-label on completion scan", "USPS, FedEx, UPS support", "Multi-marketplace tracking sync"],
            },
            {
                icon: "📊",
                title: "Output & Revenue Analytics",
                body: "Track pieces per hour per machine, revenue by channel, fulfillment rate by lead time, and more — with custom date ranges and CSV export.",
                bullets: ["Output per machine", "Revenue by marketplace channel", "Lead time fulfillment reporting"],
            },
        ],
    },
    howItWorks: {
        steps: [
            {
                title: "Configure your machines, blanks, and designs",
                body: "Set up your machine catalog, upload DST files tied to product SKUs, and connect your marketplaces. Onboarding is handled with you in under 2 weeks.",
            },
            {
                title: "Orders route to your embroidery queue",
                body: "Every order lands in the right queue with the DST file, blank specification, hoop size, and deadline attached. Your team sees exactly what to run next.",
            },
            {
                title: "Complete, scan, and ship automatically",
                body: "Scan the finished job and Pythias handles label generation, tracking capture, and marketplace fulfillment confirmation across all channels.",
            },
        ],
    },
    faqs: [
        { q: "Can Pythias manage DST files for embroidery orders?", a: "Yes. You associate DST (or PES, EXP) files with product SKUs in Pythias. When an order comes in for that SKU, the correct digitized file is automatically attached to the production job — no manual file lookup required." },
        { q: "Does Pythias support multiple embroidery machines?", a: "Yes. Pythias supports machine-level routing within the embroidery queue, so jobs can be assigned or routed to specific machines based on hoop size, job type, or machine availability." },
        { q: "Which marketplaces does Pythias connect to for embroidery businesses?", a: "Pythias connects to Etsy, Faire, Amazon, Walmart, Shopify, Wix, WooCommerce, TikTok Shop, and 15+ other channels. All orders flow into a single embroidery production queue with full channel tagging." },
        { q: "Does Pythias handle shops that do both embroidery and other print types?", a: "Yes. Pythias supports multiple print types in the same platform — embroidery, DTF, DTG, sublimation, and screen print. Each type routes to its own queue, so your team never confuses an embroidery job with a print job." },
        { q: "What does Pythias cost for an embroidery business?", a: "Pythias starts at $199/month with no per-order fees. The pricing includes all marketplace integrations, production management, inventory tracking, shipping labels, and analytics." },
    ],
};

const schema = [
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Pythias — Embroidery Business Software",
        "description": metadata.description,
        "url": "https://pythiastechnologies.com/software-for-embroidery-businesses",
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
            { "@type": "ListItem", "position": 2, "name": "Software for Embroidery Businesses", "item": "https://pythiastechnologies.com/software-for-embroidery-businesses" },
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
