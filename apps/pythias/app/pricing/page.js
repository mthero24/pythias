import PricingContent from "./PricingContent";
import FeeCalculatorSection from "./FeeCalculatorSection";

export const metadata = {
    title: "Pricing — Pythias Technologies | No Per-Order Fees",
    description: "Simple, transparent pricing for Pythias Fulfillment Cloud and Commerce Cloud. Flat monthly rates starting at $199/mo with no per-order fees. Compare plans and find the right fit for your print operation.",
    alternates: { canonical: "https://pythiastechnologies.com/pricing" },
    openGraph: {
        title: "Pythias Technologies Pricing — Flat Monthly Rate, No Per-Order Fees",
        description: "Fulfillment Cloud from $199/mo. Commerce Cloud free to start. No per-order fees, no hidden costs.",
        url: "https://pythiastechnologies.com/pricing",
        type: "website",
    },
};

const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pythias Technologies",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://pythiastechnologies.com",
    "offers": [
        { "@type": "Offer", "name": "Fulfillment Cloud — Starter",      "price": "199",  "priceCurrency": "USD", "description": "500 orders/mo, 2 integrations, 5 users" },
        { "@type": "Offer", "name": "Fulfillment Cloud — Professional", "price": "599",  "priceCurrency": "USD", "description": "3,000 orders/mo, 5 integrations, 10 users" },
        { "@type": "Offer", "name": "Fulfillment Cloud — Business",     "price": "1499", "priceCurrency": "USD", "description": "15,000 orders/mo, all integrations, 25 users" },
        { "@type": "Offer", "name": "Fulfillment Cloud — Scale",        "price": "3000", "priceCurrency": "USD", "description": "Unlimited orders, all integrations, 50 users" },
        { "@type": "Offer", "name": "Commerce Cloud — Free",            "price": "0",    "priceCurrency": "USD", "description": "1 marketplace, 50 products, 15% margin fee" },
        { "@type": "Offer", "name": "Commerce Cloud — Launch",          "price": "79",   "priceCurrency": "USD", "description": "3 marketplaces, 250 products, 8% margin fee" },
        { "@type": "Offer", "name": "Commerce Cloud — Growth",          "price": "299",  "priceCurrency": "USD", "description": "All integrations, 1,500 products, 5% margin fee" },
        { "@type": "Offer", "name": "Commerce Cloud — Scale",          "price": "799",  "priceCurrency": "USD", "description": "All integrations, unlimited products, 2% margin fee" },
    ],
};

export default function PricingPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <PricingContent />
            <FeeCalculatorSection />
        </>
    );
}
