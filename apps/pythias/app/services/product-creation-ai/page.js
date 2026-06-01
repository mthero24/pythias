import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA, ServiceRelated, SERVICE_RATING } from "@/componants/ServicePage";

export const metadata = {
    title: "Product Creation AI — AI-Generated Listings for Print-on-Demand",
    description: "Pythias Product Creation AI generates marketplace-ready titles, descriptions, keywords, and tags for every product in your catalog — in bulk, in seconds, optimized for Amazon, Etsy, Walmart, Shopify, and more.",
    keywords: "AI product listing generator, AI product description writer, print on demand product creation, bulk listing generation, Etsy SEO tool, Amazon listing optimizer, Shopify product AI, print shop automation",
    openGraph: {
        title: "Product Creation AI | Pythias Technologies",
        description: "AI-generated product titles, descriptions, and keywords — optimized per marketplace and ready to publish in bulk.",
        type: "website",
        url: "https://pythiastechnologies.com/services/product-creation-ai",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/product-creation-ai" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Product Creation AI",
    applicationCategory: "BusinessApplication",
    description: "AI-powered bulk product listing generator for print-on-demand businesses — creates titles, descriptions, keywords, and tags optimized for every marketplace.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
    aggregateRating: SERVICE_RATING,
};

const features = [
    { icon: "✍️", title: "AI Listing Copy Generation",      desc: "Generate compelling product titles and full descriptions for every item in your catalog. The AI writes naturally, avoids keyword stuffing, and produces copy that reads well on every marketplace." },
    { icon: "🔍", title: "Marketplace-Specific SEO",        desc: "Titles, bullet points, and keyword fields are optimized to each platform's ranking algorithm — what performs on Etsy is different from what ranks on Amazon or Walmart." },
    { icon: "🏷️", title: "Automated Tag & Keyword Sets",    desc: "Generate complete tag lists and search keyword sets for every product. Tags are drawn from your design theme, category, color, and target demographic — not generic guesses." },
    { icon: "📦", title: "Bulk Product Creation",           desc: "Create hundreds of complete product listings from your design library in a single batch. Select designs, choose marketplaces, click generate — done." },
    { icon: "🌈", title: "Variant-Aware Descriptions",      desc: "Descriptions include the full color and size range available. Listing copy adjusts dynamically per variant so each individual listing is accurate and complete." },
    { icon: "🛒", title: "One-Click Marketplace Publish",   desc: "Generated listings publish directly to Shopify, Etsy, Amazon, Walmart, and TikTok Shop — no manual copy-paste, no CSV exports." },
    { icon: "🔄", title: "Refresh & Rephrase",              desc: "Re-run the AI on existing listings to refresh stale copy, test new angles, or adapt descriptions when you enter a new marketplace." },
    { icon: "📋", title: "Custom Prompt Templates",          desc: "Configure AI prompt templates per product category or marketplace. Tell the AI your brand voice, what to emphasize, and what to avoid — and it follows your rules on every product." },
    { icon: "📊", title: "Listing Performance Feedback",    desc: "After listings go live, Pythias tracks which AI-generated titles drive the most clicks and sales per channel — so the model learns what works for your specific catalog." },
];

const steps = [
    { title: "Select designs or products",   desc: "Choose individual designs, an entire category, or your full catalog from the Pythias product library. You can also filter by marketplace, design tag, or date range." },
    { title: "Configure AI settings",        desc: "Pick your target marketplace(s) and optionally set a prompt template: brand voice, target audience, tone (professional, playful, minimal), and any keywords to always include or avoid." },
    { title: "AI generates listing content", desc: "Pythias generates titles, full descriptions, bullet points, keyword tags, and search terms for every selected product — simultaneously, across all chosen marketplaces." },
    { title: "Review and edit",              desc: "Generated content appears in a review grid. Accept all, edit individual fields, or regenerate specific products. All edits are saved to the product record." },
    { title: "Publish to marketplaces",      desc: "Push approved listings directly to Shopify, Etsy, Amazon, Walmart, or TikTok Shop with one click. Listings go live with correct images, variants, and AI-generated copy already in place." },
];

const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",                 item: "https://pythiastechnologies.com" },
        { "@type": "ListItem", position: 2, name: "Services",             item: "https://pythiastechnologies.com/services" },
        { "@type": "ListItem", position: 3, name: "Product Creation AI",  item: "https://pythiastechnologies.com/services/product-creation-ai" },
    ],
};

export default function ProductCreationAIPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <ServiceHero
                label="Product Creation AI"
                title="Write every listing."
                accent="In seconds, not hours."
                subtitle="Pythias AI generates marketplace-ready titles, descriptions, keywords, and tags for your entire product catalog — optimized per platform, published in bulk, and always on-brand."
                icon="✨"
                color="#7c3aed"
            />
            <ServiceFeatures features={features} color="#7c3aed" />
            <ServiceSteps steps={steps} color="#7c3aed" />
            <ServiceCTA
                title="Stop writing listings by hand."
                sub="Let Pythias AI generate and publish your entire product catalog — titles, descriptions, keywords, and images — across every channel at once."
                color="#7c3aed"
            />
            <ServiceRelated related={[
                { href: "/services/image-creation", label: "Automated Product Image Creation" },
                { href: "/services/design",         label: "Design & Product Management" },
                { href: "/services/marketplace",    label: "Multi-Marketplace Integration" },
            ]} />
        </>
    );
}
