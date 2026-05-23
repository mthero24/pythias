const BASE = "https://pythiastechnologies.com";

const ROUTES = [
    { url: "/",                   priority: 1.0,  changeFrequency: "weekly" },
    { url: "/features",           priority: 0.9,  changeFrequency: "monthly" },
    { url: "/how-it-works",       priority: 0.9,  changeFrequency: "monthly" },
    { url: "/services",           priority: 0.85, changeFrequency: "monthly" },
    { url: "/services/production",    priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/shipping",      priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/inventory",     priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/marketplace",   priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/analytics",     priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/team",          priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/labels",        priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/design",        priority: 0.8, changeFrequency: "monthly" },
    { url: "/services/image-creation",priority: 0.8, changeFrequency: "monthly" },
    { url: "/about",              priority: 0.75, changeFrequency: "monthly" },
    { url: "/contact",            priority: 0.75, changeFrequency: "yearly" },
    { url: "/privacy",            priority: 0.3,  changeFrequency: "yearly" },
];

export default function sitemap() {
    return ROUTES.map(({ url, priority, changeFrequency }) => ({
        url:              `${BASE}${url}`,
        lastModified:     new Date(),
        changeFrequency,
        priority,
    }));
}
