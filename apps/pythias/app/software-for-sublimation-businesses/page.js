import IndustryLayout from "../solutions/IndustryLayout";

export const metadata = {
    title: "Software for Sublimation Businesses — Fulfillment Automation | Pythias",
    description: "The complete software platform for sublimation businesses. Automate order routing, a dedicated sublimation production queue, inventory, and shipping across 18+ marketplaces. No per-order fees.",
    keywords: "sublimation software, software for sublimation business, sublimation order management software, sublimation production software, sublimation fulfillment software",
    alternates: { canonical: "https://pythiastechnologies.com/software-for-sublimation-businesses" },
    openGraph: {
        title: "Software for Sublimation Businesses | Pythias Technologies",
        description: "Complete sublimation software — automate order routing, a dedicated sublimation production queue, inventory, and shipping across 18+ marketplaces.",
        url: "https://pythiastechnologies.com/software-for-sublimation-businesses",
        images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Software for Sublimation Businesses | Pythias Technologies" }],
    },
};

const GRAD = { background: "linear-gradient(90deg, #D3A73D, #f0c66a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

const data = {
    hero: {
        badge: "Sublimation Software",
        h1: <>The <span style={GRAD}>Sublimation Software</span><br />Built to Scale With You</>,
        sub: "From mugs and tumblers to all-over apparel, Pythias automates every step of your sublimation operation — order routing, a dedicated sublimation production queue, inventory, and shipping in one platform.",
        stats: [
            { value: "18+", label: "Marketplace Integrations" },
            { value: "Dedicated", label: "Sublimation Queue" },
            { value: "Real-time", label: "Inventory Sync" },
            { value: "Zero", label: "Per-Order Fees" },
        ],
    },
    pain: {
        title: "Sublimation orders are detail-heavy — and that's where manual processes break.",
        sub: "Mixed substrates, wraps, and apparel each have their own files and steps. Tracking that across multiple channels by hand doesn't scale.",
        items: [
            { icon: "🎨", title: "Every substrate needs the right file", body: "A mug wrap, a tumbler template, and an all-over shirt are completely different print files. Matching the correct artwork to each order by hand is slow and error-prone at volume." },
            { icon: "🔀", title: "Multi-channel means multi-dashboard", body: "Selling sublimation products on Etsy, Amazon, TikTok Shop, and your own store means juggling separate portals — and orders still slip through." },
            { icon: "📦", title: "Blank substrates are hard to track", body: "Knowing how many of each mug, tumbler, and blank you have on hand — before scheduling a batch — is nearly impossible on a spreadsheet." },
        ],
    },
    features: {
        title: "One platform for your entire sublimation operation.",
        sub: "Pythias connects every channel, routes every order to the sublimation queue with the right file, and keeps substrate inventory accurate.",
        items: [
            { icon: "🔥", title: "Dedicated Sublimation Production Queue", body: "A sublimation queue with its own deadline sorting, priority rules, and scan-to-complete workflow — separate from your other decoration methods, so jobs never mix.", bullets: ["Sublimation-specific queue", "Deadline + priority routing", "Scan-to-complete workflow"] },
            { icon: "🛒", title: "18+ Marketplace Integrations", body: "Amazon, Walmart, Etsy, TikTok Shop, Shopify, eBay, and more — all sublimation orders pull into one unified production queue automatically.", bullets: ["Real-time order import from all channels", "Unified production view", "Per-channel tagging and filtering"] },
            { icon: "🏷️", title: "Substrate & File Management", body: "Map designs to the right substrate templates and SKUs so the correct wrap or print file reaches each mug, tumbler, or garment every time.", bullets: ["Design-to-substrate mapping", "Template + file routing", "Variant management"] },
            { icon: "📦", title: "Blank & Substrate Inventory", body: "Real-time inventory of mugs, tumblers, and blanks by type, color, and size, with low-stock alerts so you reorder before a batch is blocked.", bullets: ["Stock by substrate type", "Automated reorder alerts", "Multi-supplier support"] },
            { icon: "🚚", title: "Automatic Shipping Labels", body: "Scan a completed sublimation order and Pythias generates the carrier label, captures tracking, and confirms fulfillment back to every marketplace.", bullets: ["USPS, FedEx, UPS support", "Auto-label on scan completion", "Tracking sync to all channels"] },
            { icon: "📊", title: "Analytics & Revenue Reporting", body: "Daily output, revenue by channel, fulfillment rate, and production efficiency — know your sublimation numbers at a glance.", bullets: ["Revenue by marketplace", "Production output reports", "Fulfillment + SLA tracking"] },
        ],
    },
    howItWorks: {
        title: "From zero to automated sublimation fulfillment in under 2 weeks",
        steps: [
            { title: "Connect your selling channels", body: "Link every marketplace and store you sell sublimation products on. Orders start flowing into your production queue immediately." },
            { title: "Sublimation queue runs itself", body: "Orders route automatically to the sublimation queue with the correct substrate template and file attached — your team sees a clean, prioritized list." },
            { title: "Ship and confirm automatically", body: "Scan a completed job, Pythias prints the label and confirms shipment on every connected marketplace. Customers get tracking; you get your time back." },
        ],
    },
    faqs: [
        { q: "Does Pythias have a dedicated sublimation production queue?", a: "Yes. Sublimation is a first-class print method in Pythias with its own production queue, routing rules, and scan-to-complete workflow — separate from DTF, DTG, and embroidery, so different decoration jobs never mix on the floor." },
        { q: "Can Pythias handle mugs, tumblers, and apparel together?", a: "Yes. Pythias maps designs to the correct substrate templates and SKUs, so the right wrap or print file reaches each mug, tumbler, or garment automatically — and tracks blank substrate inventory by type, color, and size." },
        { q: "How many marketplaces does Pythias connect to for sublimation products?", a: "Pythias integrates with 18+ marketplaces including Amazon, Walmart, Etsy, TikTok Shop, Shopify, and eBay — plus 200+ more channels via Mirakl and Acenda — pulling every order into one sublimation-aware production queue." },
        { q: "Can I run sublimation alongside DTF, DTG, and embroidery?", a: "Yes. Pythias routes each order to the correct print queue by method, so sublimation, DTF, DTG, and embroidery jobs each have their own sorting, routing rules, and completion workflow in one account." },
        { q: "Does Pythias charge per order?", a: "No. Pythias is a flat monthly subscription with no per-order fees, starting at $199/month, so your costs stay predictable as your sublimation volume grows." },
    ],
};

const schema = [
    { "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Pythias — Sublimation Software", "description": metadata.description, "url": "https://pythiastechnologies.com/software-for-sublimation-businesses", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "offers": { "@type": "Offer", "price": "199", "priceCurrency": "USD", "priceSpecification": { "@type": "UnitPriceSpecification", "unitText": "month" } }, "publisher": { "@type": "Organization", "name": "Pythias Technologies", "url": "https://pythiastechnologies.com" } },
    { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": data.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [ { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pythiastechnologies.com" }, { "@type": "ListItem", "position": 2, "name": "Software for Sublimation Businesses", "item": "https://pythiastechnologies.com/software-for-sublimation-businesses" } ] },
];

export default function Page() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <IndustryLayout {...data} />
        </>
    );
}
