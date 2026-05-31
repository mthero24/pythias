import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated } from "@/componants/ServicePage";

export const metadata = {
    title: "Design & Product Management",
    description: "Manage your entire product design library from one platform. Collaborative approval workflows, version control, SKU mapping, and one-click publish to Shopify, Etsy, Walmart, and more.",
    keywords: "print on demand design management, product design library, design approval workflow, SKU mapping, design version control, mockup builder, print shop design software, marketplace product publishing",
    openGraph: {
        title: "Design & Product Management | Pythias Technologies",
        description: "Centralized design library, approval workflows, and one-click marketplace publishing — built for print-on-demand teams.",
        type: "website",
        url: "https://pythiastechnologies.com/services/design",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/design" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Design & Product Management",
    applicationCategory: "BusinessApplication",
    description: "Design library management, approval workflows, and marketplace publishing for print-on-demand operations.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
};

const features = [
    { icon: "🗂️", title: "Centralized Design Library",      desc: "Store every design file, revision, and variant in one searchable library. Tag by product type, marketplace, season, or custom labels your team defines." },
    { icon: "🔁", title: "Version Control",                  desc: "Every design change is tracked automatically. Roll back to any previous version, compare revisions side by side, and know exactly who changed what and when." },
    { icon: "✅", title: "Approval Workflows",               desc: "Route designs through a configurable review process before they go live. Assign reviewers, leave comments, request revisions, and track approval status in real time." },
    { icon: "🗺️", title: "SKU & Variant Mapping",           desc: "Map each design to blanks, colors, and sizes automatically. The system builds every SKU combination and validates inventory availability before listing." },
    { icon: "🔗", title: "One-Click Marketplace Publishing", desc: "Push approved designs directly to Shopify, Etsy, Walmart, Amazon, and TikTok Shop with pre-filled titles, descriptions, and pricing rules." },
    { icon: "🖼️", title: "Mockup Builder",                  desc: "Preview your design on any blank before publishing. Adjust placement, scale, and color overlay — then generate listing images automatically for every variant." },
    { icon: "📐", title: "Print File Validation",            desc: "Automated checks confirm resolution, color mode, bleed margins, and file format requirements before a design enters the production queue." },
    { icon: "👥", title: "Team Collaboration",               desc: "Assign designs to team members, track task status, and keep creative and production teams aligned without email threads or external tools." },
    { icon: "📊", title: "Design Performance Insights",      desc: "See which designs drive the most sales across channels. Identify top performers, flag slow movers, and use real data to guide your next product drops." },
];

const steps = [
    { title: "Upload your artwork",       desc: "Drag and drop design files into the library. Pythias validates resolution, color mode, and format requirements on upload and flags any issues immediately." },
    { title: "Map blanks and variants",   desc: "Select the blank, color, and size combinations for each design. The system builds all SKU permutations and checks current inventory levels automatically." },
    { title: "Run through approval",      desc: "Designs move through your configured review workflow. Reviewers leave inline comments, approve revisions, and mark designs ready to publish." },
    { title: "Publish and fulfill",       desc: "One click pushes the approved product to every selected marketplace. When an order comes in, the correct print file is already mapped and ready for production." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                        item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",                    item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Design & Product Management", item: "https://pythiastechnologies.com/services/design" },
    ],
};

export default function DesignPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Design & Product Management"
                title="From concept to catalog,"
                accent="without the chaos."
                subtitle="Pythias gives your creative and production teams a single place to manage every design — with version history, approval gates, and direct publishing to every marketplace you sell on."
                icon="🎨"
                color="#ec4899"
            />
            <ServiceFeatures features={features} color="#ec4899" />
            <ServiceSteps steps={steps} color="#ec4899" />
            <ServiceCTA
                title="Ready to bring order to your design process?"
                sub="See how Pythias connects your design library to your production floor and storefronts in one workflow."
                color="#ec4899"
            />
            <ServiceRelated related={[
                { href: "/services/image-creation", label: "Automated Image Creation" },
                { href: "/services/marketplace",    label: "Multi-Marketplace Integration" },
                { href: "/services/production",     label: "Production Queue Management" },
            ]} />
        </>
    );
}
