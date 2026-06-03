/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@pythias/mongo", "@pythias/sublimation", "sharp", "canvas", "pdfkit", "@napi-rs/canvas", "@pythias/shipping", "@pythias/dtf", "fluent-ffmpeg", "ffmpeg-static"],
    transpilePackages: ["@pythias/backend", "@pythias/labels", "@pythias/roq-folder"],
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images1.pythiastechnologies.com" },
            { protocol: "https", hostname: "images2.pythiastechnologies.com" },
            { protocol: "https", hostname: "images3.pythiastechnologies.com" },
            { protocol: "https", hostname: "pythiastechnologies.com" },
        ],
    },
    webpack(config, { isServer }) {
        if (isServer) {
            // serverExternalPackages misses workspace-resolved paths; catch native
            // modules explicitly so webpack never tries to bundle their binaries.
            const nativePkgs = new Set(["sharp", "canvas", "@napi-rs/canvas"]);
            const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
            config.externals = [
                ...existing,
                ({ request }, callback) => {
                    if (nativePkgs.has(request) || request.startsWith("@napi-rs/")) {
                        return callback(null, `commonjs ${request}`);
                    }
                    callback();
                },
            ];
        }
        return config;
    },
};

export default nextConfig;
