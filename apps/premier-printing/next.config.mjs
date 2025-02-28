/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images1.pythiastechnologies.com",
              },{
                protocol: "https",
                hostname: "pythiastechnologies.com",
              },
              {
                protocol: "https",
                hostname: "www.pythiastechnologies.com",
              },
              {
                protocol: "http",
                hostname: "localhost:3006",
              },
        ]
    }
};

export default nextConfig;
