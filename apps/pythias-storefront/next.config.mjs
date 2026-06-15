/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@pythias/mongo", "sharp"],
    transpilePackages: ["@pythias/storefront"],
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
