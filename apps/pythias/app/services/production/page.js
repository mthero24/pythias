import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated, SERVICE_RATING } from "@/componants/ServicePage";

export const metadata = {
    title: "Production Queue Management",
    description: "Manage DTF, embroidery, sublimation, and screen print queues with automated job routing, deadline tracking, batch processing, and Brother GTX printer integration. Built for high-volume print shops.",
    keywords: "DTF queue management, embroidery job management, print shop software, production queue, Brother GTX integration, sublimation tracking, screen print scheduling, heat press management, print on demand production",
    openGraph: {
        title: "Production Queue Management | Pythias Technologies",
        description: "Automated production queues for DTF, embroidery, sublimation, and screen printing — built for high-volume print shops.",
        type: "website",
        url: "https://pythiastechnologies.com/services/production",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/production" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Production Queue Management",
    applicationCategory: "BusinessApplication",
    description: "Production queue management software for DTF, embroidery, sublimation, and screen print shops.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: SERVICE_RATING,
};

const features = [
    { icon: "🖨️", title: "DTF Queue Management",        desc: "Organize and prioritize Direct-to-Film jobs by deadline, order size, and design. Route jobs to the right station automatically." },
    { icon: "🧵", title: "Embroidery Scheduling",        desc: "Manage multi-head embroidery machine queues, thread color setups, and digitizing status in a single view." },
    { icon: "🌈", title: "Sublimation Tracking",          desc: "Track sublimation orders from transfer print through heat press to quality check with real-time status updates." },
    { icon: "🎨", title: "Screen Print Management",       desc: "Schedule screen printing runs by color count and press type. Manage film output, screen exposure, and squeegee assignments." },
    { icon: "🔥", title: "Heat Press Settings",           desc: "Store and display time, temperature, and pressure settings for every blank type. Print settings labels directly to your press station." },
    { icon: "⚡", title: "Brother GTX Integration",       desc: "Connect directly to Brother GTX printers for automatic job sending, status polling, and ink consumption tracking." },
    { icon: "📦", title: "Batch Processing",              desc: "Group similar orders into production batches to maximize throughput. Smart batching suggestions based on blank type and print area." },
    { icon: "📋", title: "Job Priority & Deadlines",      desc: "Flag rush orders, set ship-by dates, and let the system surface what needs to run first on every line." },
    { icon: "✅", title: "Quality Control Checkpoints",   desc: "Built-in QC steps at each production stage ensure defects are caught before packaging, not after shipping." },
];

const steps = [
    { title: "Orders land in your queue",    desc: "Orders from Shopify, Etsy, Amazon, and all other connected channels appear in the production queue automatically as they're placed." },
    { title: "Jobs are sorted by type",      desc: "The system separates DTF, embroidery, sublimation, and screen print jobs and assigns them to the correct production line." },
    { title: "Your team works the queue",    desc: "Floor staff see their assigned jobs with all print details, blank specs, and deadlines. Status updates in real time as jobs progress." },
    { title: "Orders complete and ship",     desc: "When a job is marked complete, the order is automatically flagged for packing and a shipping label is generated — no extra steps." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                         item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",                     item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Production Queue Management",  item: "https://pythiastechnologies.com/services/production" },
    ],
};

export default function ProductionPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Production Management"
                title="Run every print line from"
                accent="one dashboard."
                subtitle="Pythias manages DTF, embroidery, sublimation, and screen print queues simultaneously — routing jobs automatically, surfacing priorities, and keeping every line at full throughput."
                icon="🖨️"
                color="#D3A73D"
            />
            <ServiceFeatures features={features} color="#D3A73D" />
            <ServiceSteps steps={steps} color="#D3A73D" />
            <ServiceCTA
                title="Ready to clear the production bottleneck?"
                sub="See how Pythias keeps every line moving — from order received to order shipped."
                color="#D3A73D"
            />
            <ServiceRelated related={[
                { href: "/services/shipping",   label: "Shipping & Fulfillment" },
                { href: "/services/inventory",  label: "Inventory Management" },
                { href: "/services/labels",     label: "Label & Barcode Printing" },
            ]} />
        </>
    );
}
