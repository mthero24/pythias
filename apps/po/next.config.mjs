/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images3.teeshirtpalace.com",
      "images4.teeshirtpalace.com",
      "images1.teeshirtpalace.com",
      "teeshirtpalace.com",
      "www.teeshirtpalace.com",
      "images2.teeshirtpalace.com",
      "seal-easternmichigan.bbb.org",
      "www.shopperapproved.com",
      "images.dmca.com",
      "s3.wasabisys.com",
      "localhost",
      "teeshirtpalace-node-dev.s3.wasabisys.com",
    ],
  },
  env: {
    localKey: "$2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy",
  },
  webpack: (config) => {
    config.node = {
      __dirname: true,
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
