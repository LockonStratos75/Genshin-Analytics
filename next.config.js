/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // lets Next bundle these server-side deps correctly
    serverComponentsExternalPackages: [
      "enka-network-api",
      "unzipper",
      "@aws-sdk/client-s3",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // keep them external in the server bundle
      config.externals = config.externals || [];
      config.externals.push("@aws-sdk/client-s3");
    }
    return config;
  },
};

module.exports = nextConfig;
