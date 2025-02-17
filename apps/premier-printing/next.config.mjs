/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images1.pythiastechnologies.com",
              },
        ]
    }
};

export default nextConfig;
