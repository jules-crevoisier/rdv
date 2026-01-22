import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClientInstance() {
  // Pour Prisma 7, on DOIT passer soit accelerateUrl soit un adapter au constructeur
  // Vercel Postgres fournit une URL Accelerate (prisma+postgres://) pour de meilleures performances
  const accelerateUrl = process.env.DATABASE_PRISMA_DATABASE_URL;
  const standardUrl = process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL;
  
  // Utiliser Accelerate si disponible, sinon l'URL standard
  const databaseUrl = accelerateUrl || standardUrl;
  
  if (!databaseUrl) {
    const error = new Error(
      "Database URL is not defined. Please set DATABASE_PRISMA_DATABASE_URL or DATABASE_POSTGRES_URL in your environment variables."
    );
    console.error("[Prisma] Error:", error.message);
    throw error;
  }
  
  try {
    // Si on a une URL Accelerate, l'utiliser
    if (accelerateUrl && accelerateUrl.startsWith("prisma+")) {
      console.log("[Prisma] Initializing with Prisma Accelerate");
      return new PrismaClient({
        accelerateUrl: accelerateUrl,
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    }
    
    // Sinon, utiliser l'URL standard (nécessite un adapter, mais pour l'instant on essaie avec accelerateUrl)
    console.log("[Prisma] Initializing with standard PostgreSQL connection");
    return new PrismaClient({
      accelerateUrl: databaseUrl,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (error) {
    console.error("[Prisma] Failed to initialize:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClientInstance();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
