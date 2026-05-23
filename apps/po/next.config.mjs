/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images3.teeshirtpalace.com",
      "images4.teeshirtpalace.com",
      "images1.teeshirtpalace.com",
      "images2.teeshirtpalace.com",
      "teeshirtpalace.com",
      "www.teeshirtpalace.com",
      "images2.tshirtpalace.com",
      "images3.tshirtpalace.com",
      "images4.tshirtpalace.com",
      "images1.tshirtpalace.com",
      "tshirtpalace.com",
      "www.tshirtpalace.com",
      "images2.tshirtpalace.com",
      "seal-easternmichigan.bbb.org",
      "www.shopperapproved.com",
      "images.dmca.com",
      "s3.wasabisys.com",
      "localhost",
      "teeshirtpalace-node-dev.s3.wasabisys.com",
      "pythiastechnologies.com",
      "www.pythiastechnologies.com",
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
  serverExternalPackages: ["sharp", "pdfkit", "@img/sharp-wasm32", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64"],
  transpilePackages: ["@pythias/integrations", "@pythias/shipping"],
};

export default nextConfig;
