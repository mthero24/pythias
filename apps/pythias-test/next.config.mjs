/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["sharp", "@img/sharp-wasm32", "@img/sharp-linux-x64", "@img/sharp-libvips-linux-x64", "@pythias/dtf", "@pythias/embroidery", "@pythias/sublimation", "@pythias/returns"],
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
              {
                protocol: "https",
                hostname: "cdnm.sanmar.com",
              }
        ]
    }
};

export default nextConfig;
