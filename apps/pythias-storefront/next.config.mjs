/** @type {import('next').NextConfig} */
const nextConfig = {
    // Mirror premier's externals: the checkout webhook imports @pythias/backend/server,
    // which transitively pulls @pythias/shipping → convertLabel → @napi-rs/canvas (a native
    // .node binary) plus the pdf/label stack. These must NOT be webpack-bundled — they're
    // require()'d at runtime from node_modules on the server.
    serverExternalPackages: [
        "@pythias/mongo",
        "sharp",
        "@img/sharp-wasm32", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64",
        "@pythias/dtf", "@pythias/embroidery", "@pythias/sublimation", "@pythias/returns",
        "@napi-rs/canvas", "pdfjs-dist", "bwip-js", "pdfkit",
        "fluent-ffmpeg", "ffmpeg-static",
    ],
    transpilePackages: ["@pythias/storefront", "@pythias/integrations", "@pythias/shipping"],
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push(({ request }, callback) => {
                if (request === "sharp" || (request && request.startsWith("@img/sharp"))) {
                    return callback(null, `commonjs ${request}`);
                }
                callback();
            });
        }
        return config;
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "images1.pythiastechnologies.com" },
            { protocol: "https", hostname: "images2.pythiastechnologies.com" },
            { protocol: "https", hostname: "images3.pythiastechnologies.com" },
            { protocol: "https", hostname: "pythiastechnologies.com" },
        ],
    },
};

export default nextConfig;
