/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@pythias/mongo", "@pythias/sublimation", "sharp", "canvas", "pdfkit", "@napi-rs/canvas", "@pythias/shipping"],
    transpilePackages: ["@pythias/backend", "@pythias/labels", "@pythias/roq-folder"],
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images1.pythiastechnologies.com" },
            { protocol: "https", hostname: "images2.pythiastechnologies.com" },
            { protocol: "https", hostname: "images3.pythiastechnologies.com" },
            { protocol: "https", hostname: "pythiastechnologies.com" },
        ],
    },
};

export default nextConfig;
