/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pythias/integrations", "@pythias/shipping"],
  images: {
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
};

export default nextConfig;
