import { Article } from "@pythias/mongo";

export const revalidate = 3600; // refresh hourly so new blog posts appear

const BASE = "https://pythiastechnologies.com";

const ROUTES = [
    { url: "/",                          priority: 1.0,  changeFrequency: "weekly" },
    { url: "/fulfillment-cloud",          priority: 0.95, changeFrequency: "monthly" },
    { url: "/commerce-cloud",            priority: 0.95, changeFrequency: "monthly" },
    { url: "/storefront-cloud",          priority: 0.95, changeFrequency: "monthly" },
    { url: "/founding",                  priority: 0.9,  changeFrequency: "monthly" },
    { url: "/features",                  priority: 0.9,  changeFrequency: "monthly" },
    { url: "/how-it-works",              priority: 0.9,  changeFrequency: "monthly" },
    { url: "/integrations",              priority: 0.85, changeFrequency: "monthly" },
    { url: "/integrations/etsy",         priority: 0.85, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations",         priority: 0.9,  changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/marketplace-variables", priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/shopify",       priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/amazon",        priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/walmart",       priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/target-plus",   priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/ebay",          priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/wayfair",       priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/etsy",          priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/faire",         priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/tiktok-shop",   priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/shein",         priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/temu",          priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/meta-shops",    priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/pinterest",     priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/wix",           priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/woocommerce",   priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/squarespace",   priority: 0.8, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/mirakl",        priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/acenda",        priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/rithum",        priority: 0.75, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/noon",          priority: 0.7, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/bol",           priority: 0.7, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/rakuten",       priority: 0.7, changeFrequency: "monthly" },
    { url: "/setup-guides/integrations/onbuy",         priority: 0.7, changeFrequency: "monthly" },
    { url: "/services",                  priority: 0.85, changeFrequency: "monthly" },
    { url: "/services/production",       priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/shipping",         priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/inventory",        priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/marketplace",      priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/analytics",        priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/team",             priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/labels",           priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/design",           priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/image-creation",       priority: 0.8,  changeFrequency: "monthly" },
    { url: "/services/product-creation-ai", priority: 0.8,  changeFrequency: "monthly" },
    { url: "/pricing",                                              priority: 0.95, changeFrequency: "monthly" },
    { url: "/multichannel-listing-software",                      priority: 0.92, changeFrequency: "monthly" },
    { url: "/order-management-software",                          priority: 0.92, changeFrequency: "monthly" },
    { url: "/print-automation-software",                          priority: 0.95, changeFrequency: "monthly" },
    { url: "/inventory-management-software",                      priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-amazon-sellers",                        priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-shopify-sellers",                       priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-ebay-sellers",                          priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-walmart-sellers",                       priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-woocommerce-stores",                    priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-screen-printing-shops",                 priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-sublimation-businesses",                priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-dtf-shops",                             priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-dtg-shops",                             priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-embroidery-businesses",                 priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-print-on-demand",                       priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-fulfillment-providers",                 priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-tiktok-shop-sellers",                   priority: 0.92, changeFrequency: "monthly" },
    { url: "/software-for-etsy-sellers",                          priority: 0.92, changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-shipstation",                     priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-shopify",                         priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/storefront-cloud-vs-shopify",                priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-printify",                        priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-sellbrite",                       priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-order-desk",                      priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-printful",                        priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-linnworks",                       priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-printavo",                        priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-sellercloud",                     priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/pythias-vs-zentail",                         priority: 0.9,  changeFrequency: "monthly" },
    { url: "/compare/best-dtf-fulfillment-software",              priority: 0.88, changeFrequency: "monthly" },
    { url: "/compare/best-print-on-demand-automation-software",   priority: 0.88, changeFrequency: "monthly" },
    { url: "/testimonials",                                       priority: 0.85, changeFrequency: "weekly" },
    { url: "/faq",                       priority: 0.85, changeFrequency: "monthly" },
    { url: "/blog",                      priority: 0.85, changeFrequency: "weekly" },
    { url: "/tutorials",                 priority: 0.7,  changeFrequency: "weekly" },
    { url: "/about",                     priority: 0.75, changeFrequency: "monthly" },
    { url: "/about-pythias-technologies", priority: 0.85, changeFrequency: "monthly" },
    { url: "/contact",                   priority: 0.75, changeFrequency: "yearly" },
    { url: "/privacy",                   priority: 0.3,  changeFrequency: "yearly" },
    { url: "/privacy/ebay",              priority: 0.2,  changeFrequency: "yearly" },
    { url: "/data-protection",           priority: 0.3,  changeFrequency: "yearly" },
    { url: "/policies/security-baseline",        priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/network-security",         priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/endpoint-security",        priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/access-control",           priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/data-classification",      priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/incident-response",        priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/vulnerability-management", priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/personal-data-protection", priority: 0.3, changeFrequency: "yearly" },
    { url: "/policies/data-deletion",            priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap() {
    const staticRoutes = ROUTES.map(({ url, priority, changeFrequency }) => ({
        url:              `${BASE}${url}`,
        lastModified:     new Date(),
        changeFrequency,
        priority,
    }));

    // Append published blog articles from the DB. Wrapped so a DB hiccup at build/request
    // time degrades to the static routes instead of breaking the whole sitemap.
    let blogRoutes = [];
    try {
        const articles = await Article.find({ published: true })
            .select("slug updatedAt publishedAt")
            .sort({ publishedAt: -1 })
            .limit(1000)
            .lean();
        blogRoutes = articles
            .filter((a) => a.slug)
            .map((a) => ({
                url:              `${BASE}/blog/${a.slug}`,
                lastModified:     a.updatedAt || a.publishedAt || new Date(),
                changeFrequency:  "monthly",
                priority:         0.7,
            }));
    } catch {
        // DB unavailable — fall back to static routes only.
    }

    return [...staticRoutes, ...blogRoutes];
}
