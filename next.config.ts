import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  },
  // Exclure Prisma du bundling Edge Runtime
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@libsql/client", "@prisma/adapter-libsql"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclure Prisma du bundling pour éviter les problèmes avec Edge Runtime
      config.externals = config.externals || [];
      config.externals.push({
        "@prisma/client": "commonjs @prisma/client",
        "@libsql/client": "commonjs @libsql/client",
        "@prisma/adapter-libsql": "commonjs @prisma/adapter-libsql",
      });
    }
    return config;
  },
};

export default nextConfig;
