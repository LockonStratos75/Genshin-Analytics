/** @type {import('next').NextConfig} */
const nextConfig = {
  // genshin-db ships tens of MB of JSON; bundling it into every page makes
  // static page-data collection time out. Keep data-heavy deps external.
  experimental: {
    serverComponentsExternalPackages: [
      "genshin-db",
      "enka-network-api",
      "unzipper",
      "@aws-sdk/client-s3",
    ],
  },
  staticPageGenerationTimeout: 240,
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
