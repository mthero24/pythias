/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pythias/integrations", "@pythias/shipping"],
  // Don't gate the production build on lint (run `next lint` separately).
  // A stray unescaped quote in content shouldn't break a deploy.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
};

export default nextConfig;
