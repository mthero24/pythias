import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated, SERVICE_RATING } from "@/componants/ServicePage";

export const metadata = {
    title: "Shipping & Fulfillment Automation",
    description: "Auto-generate USPS, FedEx, and UPS labels the moment a print order completes. Tracking numbers sync back to Shopify, Etsy, Amazon, and every marketplace automatically — no manual steps.",
    keywords: "shipping label automation, USPS label generation, FedEx print shop, UPS shipping integration, UPS label generation, automatic tracking sync, ecommerce shipping software, print on demand shipping, fulfillment automation, Shopify shipping, Etsy shipping, Amazon fulfillment",
    openGraph: {
        title: "Shipping & Fulfillment Automation | Pythias Technologies",
        description: "Auto-generate USPS, FedEx, and UPS labels when orders complete. Tracking syncs to every marketplace automatically.",
        type: "website",
        url: "https://pythiastechnologies.com/services/shipping",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/shipping" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Shipping & Fulfillment Automation",
    applicationCategory: "BusinessApplication",
    description: "Automated shipping label generation and tracking sync for print-on-demand operations.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: SERVICE_RATING,
};

const features = [
    { icon: "🏷️", title: "Auto Label Generation",         desc: "Shipping labels are generated automatically when an order is marked complete in production — zero manual steps required." },
    { icon: "📮", title: "USPS Integration",               desc: "Access all USPS services including First Class, Priority Mail, Priority Mail Express, and Ground Advantage at commercial rates." },
    { icon: "🚀", title: "FedEx Integration",              desc: "Generate FedEx Ground, Home Delivery, Express, and 2Day labels directly from the Pythias dashboard." },
    { icon: "🟤", title: "UPS Integration",                desc: "Access UPS Ground, 2nd Day Air, Next Day Air, and Surepost rates. Ideal for heavier shipments and B2B deliveries." },
    { icon: "🔄", title: "Tracking Auto-Sync",             desc: "Tracking numbers post back to Shopify, Etsy, Amazon, Walmart, and every other connected marketplace the moment a label is printed." },
    { icon: "📦", title: "Batch Shipping",                  desc: "Print hundreds of labels at once for batch fulfillment. Sort by carrier, weight class, or order date to maximize packing efficiency." },
    { icon: "💰", title: "Rate Comparison",                desc: "Compare live carrier rates across USPS, FedEx, and UPS before printing. Always ship at the best rate for each package's size and weight." },
    { icon: "↩️", title: "Return Label Generation",        desc: "Create prepaid return labels for any order in one click. Customers receive them via email with no manual intervention needed." },
    { icon: "📄", title: "Packing Slip Printing",          desc: "Generate branded packing slips and pick lists alongside shipping labels — all in one print action." },
    { icon: "⚠️", title: "Unshipped Order Alerts",         desc: "Automatic alerts for orders approaching their ship-by deadline. Never miss a promised delivery date." },
];

const steps = [
    { title: "Order completes production",    desc: "When your team marks an order complete on the production floor, it automatically moves to the shipping queue." },
    { title: "Label generated instantly",     desc: "Pythias selects the correct carrier and service based on your rules (weight, destination, marketplace requirements) and generates the label." },
    { title: "Print and pack",                desc: "Labels print to your thermal or desktop printer alongside the packing slip. Scan and seal — done." },
    { title: "Tracking synced everywhere",    desc: "The tracking number is posted back to every marketplace the order came from, triggering confirmation emails to your customers automatically." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                      item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",                  item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Shipping & Fulfillment",    item: "https://pythiastechnologies.com/services/shipping" },
    ],
};

export default function ShippingPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Shipping & Fulfillment"
                title="Ship every order faster with"
                accent="zero manual steps."
                subtitle="From production complete to label in hand in seconds. Pythias auto-generates carrier labels and syncs tracking to every marketplace the moment your team finishes an order."
                icon="🚚"
                color="#6366f1"
            />
            <ServiceFeatures features={features} color="#6366f1" />
            <ServiceSteps steps={steps} color="#6366f1" />
            <ServiceCTA
                title="Stop printing labels one by one."
                sub="See how Pythias automates your entire shipping workflow from production floor to carrier pickup."
                color="#6366f1"
            />
            <ServiceRelated related={[
                { href: "/services/production",   label: "Production Queue Management" },
                { href: "/services/marketplace",  label: "Multi-Marketplace Integration" },
                { href: "/services/labels",       label: "Label & Barcode Printing" },
            ]} />
        </>
    );
}
