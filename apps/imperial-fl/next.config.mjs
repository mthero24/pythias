/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images1.pythiastechnologies.com",
              }, {
                protocol: "https",
                hostname: "images2.pythiastechnologies.com",
              },{
                protocol: "https",
                hostname: "images3.pythiastechnologies.com",
              },{
                protocol: "https",
                hostname: "pythiastechnologies.com",
              },
              {
                protocol: "https",
                hostname: "www.pythiastechnologies.com",
              },
              {
                protocol: "https",
                hostname: "imperial.pythiastechnologies.com",
              },
              {
                protocol: "http",
                hostname: "localhost",
              },
        ]
    }
};

export default nextConfig;
