/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["sharp", "fluent-ffmpeg", "ffmpeg-static", "@img/sharp-wasm32", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64", "@pythias/dtf", "@pythias/embroidery", "@pythias/sublimation", "@pythias/returns"],
    transpilePackages: ["@pythias/integrations", "@pythias/shipping"],
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
                hostname: "simplysage.pythiastechnologies.com",
              },
              {
                protocol: "http",
                hostname: "localhost",
              },
        ]
    }
};

export default nextConfig;
