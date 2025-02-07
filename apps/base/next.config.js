/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images3.teeshirtpalace.com",
      "images4.teeshirtpalace.com",
      "images1.teeshirtpalace.com",
      "teeshirtpalace.com",
      "www.teeshirtpalace.com",
      "images2.teeshirtpalace.com",
      "seal-easternmichigan.bbb.org",
      "www.shopperapproved.com",
      "images.dmca.com",
      "s3.wasabisys.com",
      "localhost",
      "teeshirtpalace-node-dev.s3.wasabisys.com",
      "www.teeshirtpalace.com",
      "letsenhance.io"
    ],
  },
  env:{
    localKey:"$2a$10$HN2gb5EVudQkf9op49kKJu3MoQQlPMgN00XUMIoy51EIiHNtbZqNm",
    NEXTAUTH_SECRET: "THe@huilekjasdf",
    NEXTAUTH_URL: "http://localhost:3004/"
  }
};

export default nextConfig;
