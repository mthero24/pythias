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
    // Rewrite barrel imports (named → direct module) so a page that pulls one component
    // from a big index doesn't drag the whole graph into its client bundle. @pythias/backend's
    // "." is a 75-export barrel (incl. MUI-based DesignMain); importing ContactForm (contact
    // page) or PageTracker (root layout → every page) otherwise pulls far more than needed.
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "@pythias/backend"],
  },
};

export default nextConfig;
