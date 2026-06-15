// Grounding context for the Pythias marketing blog AI content tools.
// Only verifiable facts go here — the generator is forbidden from asserting anything
// not in `facts`. Shared by the article generate + ideas routes. Storefront Cloud will
// build the equivalent object per seller from their own store data.
export const PYTHIAS_BRAND = {
    name: "Pythias Technologies",
    description:
        "An all-in-one print-on-demand and multichannel fulfillment platform. Pythias connects sellers' sales channels to one production and fulfillment pipeline — order routing, production queues, inventory, shipping, and analytics.",
    url: "https://pythiastechnologies.com",
    audience: "print-on-demand sellers, print shop owners, and multichannel ecommerce sellers",
    voice: "knowledgeable, practical, and direct — written for print-shop owners and ecommerce sellers, never hypey",
    byline: "Pythias Technologies",
    facts: [
        "Pythias connects directly to 18+ marketplaces including Amazon, Walmart, Target Plus, eBay, Etsy, TikTok Shop, Shopify, Wix, WooCommerce, Squarespace, and Faire, plus 200+ more channels through Mirakl and Acenda.",
        "Pythias has no per-order fees — it is a flat monthly subscription.",
        "Fulfillment Cloud (run your own production) starts at $199/month: Starter $199, Professional $599, Business $1,499, Scale $3,000, Enterprise custom.",
        "Commerce Cloud (sell across channels with orders auto-routed to vetted fulfillment partners) has Free ($0 + 15% margin fee), Launch ($79 + 8%), Growth ($299 + 5%), Scale ($799 + 2%), and Enterprise (custom) tiers; the margin fee is never charged on a loss.",
        "Pythias has dedicated production queues for DTF, DTG, embroidery, and sublimation, each with its own routing rules and print-ready file handling.",
        "Orders from every connected channel flow into one unified production queue, and tracking is confirmed back to each marketplace automatically.",
        "Pythias generates carrier shipping labels (USPS, FedEx, UPS) and tracks real-time inventory by blank, color, and size with low-stock and reorder alerts.",
        "Commerce Cloud routes each order to a fulfillment partner scored by geography (closest to the customer), price (lowest wholesale), and reliability (historical on-time rate).",
        "Most shops are fully live on Pythias within about two weeks.",
    ],
    internalLinks: [
        { label: "Pythias for print on demand", href: "/software-for-print-on-demand" },
        { label: "Pricing", href: "/pricing" },
        { label: "Fulfillment Cloud", href: "/fulfillment-cloud" },
        { label: "Commerce Cloud", href: "/commerce-cloud" },
        { label: "Integrations", href: "/integrations" },
        { label: "Multichannel listing software", href: "/multichannel-listing-software" },
        { label: "Order management software", href: "/order-management-software" },
        { label: "Inventory management software", href: "/inventory-management-software" },
        { label: "Software for screen printing shops", href: "/software-for-screen-printing-shops" },
        { label: "Book a demo", href: "/#calendar-booking-section" },
    ],
};
