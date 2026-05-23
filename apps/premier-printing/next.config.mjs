/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["sharp", "fluent-ffmpeg", "ffmpeg-static", "@img/sharp-wasm32", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64"],
    transpilePackages: ["@pythias/integrations", "@pythias/shipping"],
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
