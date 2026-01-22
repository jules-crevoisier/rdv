import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimiser le middleware pour réduire la taille
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
