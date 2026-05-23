export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/api/",
                    "/login",
                    "/register",
                    "/demo-confirmed",
                    "/test",
                    "/tiktok",
                ],
            },
        ],
        sitemap: "https://pythiastechnologies.com/sitemap.xml",
        host: "https://pythiastechnologies.com",
    };
}
