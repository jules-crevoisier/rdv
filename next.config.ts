import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autonome (server.js + node_modules minimal) pour une image Docker légère
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  // Pas de next/image dans l'app : on désactive l'optimiseur et on retire sharp (~45 Mo) de l'image.
  // Si un jour on utilise next/image, supprimer ces deux options.
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**"],
  },
};

export default nextConfig;
