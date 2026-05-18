import { ServiceHero, ServiceFeatures, ServiceSteps, ServiceCTA } from "@/componants/ServicePage";

export const metadata = {
    title: "Automated Product Image Creation | Pythias Technologies",
    description: "AI-powered mockup generation for every product, color, and size variant — automatically. Background removal, multi-angle renders, and direct export to Shopify, Etsy, and Walmart listings.",
    keywords: "automated product mockups, AI product image generation, print on demand mockup software, bulk mockup creation, background removal, listing image automation, Shopify product images, Etsy listing photos",
    openGraph: {
        title: "Automated Product Image Creation | Pythias Technologies",
        description: "AI-generated marketplace-ready product images for every variant — created automatically the moment a design is uploaded.",
        type: "website",
        url: "https://pythiastechnologies.com/services/image-creation",
    },
    alternates: { canonical: "https://pythiastechnologies.com/services/image-creation" },
};

export const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pythias Automated Product Image Creation",
    applicationCategory: "BusinessApplication",
    description: "AI-powered product mockup generation and image automation for print-on-demand businesses.",
    offers: { "@type": "Offer", seller: { "@type": "Organization", name: "Pythias Technologies" } },
};

const features = [
    { icon: "⚡", title: "Instant Mockup Generation",        desc: "Upload a design and Pythias generates clean, marketplace-ready mockups for every color and size variant automatically — no manual work required." },
    { icon: "🧹", title: "Background Removal",               desc: "AI-powered background removal produces clean, transparent or white-background product shots that meet every marketplace's image requirements." },
    { icon: "🔄", title: "Bulk Variant Rendering",            desc: "Generate images across all color, size, and style combinations in a single batch. A 12-color, 6-size product yields 72 images in seconds." },
    { icon: "📐", title: "Multi-Angle Renders",              desc: "Front, back, left, right, and lifestyle mockups are generated from a single design file. Configure which angles each product type uses." },
    { icon: "🎨", title: "Realistic Color Mapping",          desc: "Design colors are composited accurately onto the garment's texture and fabric folds, producing mockups that reflect the real printed product." },
    { icon: "🛒", title: "Direct Listing Export",            desc: "Generated images publish directly to Shopify, Etsy, Walmart, Amazon, and TikTok Shop listings — replacing placeholder images automatically." },
    { icon: "📏", title: "Marketplace-Compliant Sizing",     desc: "Output images are sized, padded, and formatted to each platform's exact specifications so they pass listing requirements without manual resizing." },
    { icon: "🖼️", title: "Lifestyle Scene Compositing",      desc: "Drop your designs into curated lifestyle scene templates — flat lays, on-model shots, and room settings — to increase conversion on every channel." },
    { icon: "📂", title: "Batch Download & Export",          desc: "Download all generated images as a ZIP organized by variant, or push them directly to your product listings with a single click." },
];

const steps = [
    { title: "Design is uploaded or approved", desc: "When a design is added to the library or cleared through the approval workflow, image creation kicks off automatically — no trigger needed." },
    { title: "Variants are resolved",           desc: "Pythias reads your SKU mappings to identify every blank, color, and size combination and queues a render for each one." },
    { title: "Images are generated",            desc: "AI compositing places the design on each product at the correct scale and position, removes backgrounds, and generates all configured angles." },
    { title: "Images go live on listings",      desc: "Finished images are pushed directly to your Shopify, Etsy, Walmart, or Amazon listings — replacing any placeholders already in place." },
];

export default function ImageCreationPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <ServiceHero
                label="Automated Image Creation"
                title="Professional listing images,"
                accent="generated automatically."
                subtitle="Pythias uses AI-powered compositing to produce marketplace-ready product mockups for every variant the moment a design is ready — so your listings are always up to date, at any scale."
                icon="🤖"
                color="#0ea5e9"
            />
            <ServiceFeatures features={features} color="#0ea5e9" />
            <ServiceSteps steps={steps} color="#0ea5e9" />
            <ServiceCTA
                title="Stop making mockups by hand."
                sub="See how Pythias generates and publishes product images across every variant and marketplace automatically."
                color="#0ea5e9"
            />
        </>
    );
}
