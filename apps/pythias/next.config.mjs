/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pythias/integrations", "@pythias/shipping"],
  images: {
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;
