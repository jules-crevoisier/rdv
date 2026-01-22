import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClientInstance() {
  // Pour Prisma 7, on DOIT passer soit accelerateUrl soit un adapter au constructeur
  // Vercel Postgres fournit une URL Accelerate (prisma+postgres://) pour de meilleures performances
  const accelerateUrl = process.env.DATABASE_PRISMA_DATABASE_URL;
  
  if (!accelerateUrl) {
    console.error("DATABASE_PRISMA_DATABASE_URL is not defined");
    throw new Error(
      "DATABASE_PRISMA_DATABASE_URL is required. Please set it in your environment variables. " +
      "You can find it in Vercel Dashboard → Storage → Your database → .env.local"
    );
  }
  
  // Vérifier que c'est bien une URL Accelerate
  if (!accelerateUrl.startsWith("prisma+")) {
    console.warn("DATABASE_PRISMA_DATABASE_URL should start with 'prisma+' for Accelerate");
  }
  
  console.log("Initializing Prisma with PostgreSQL (Accelerate)");

  // Prisma 7 : Utiliser Prisma Accelerate pour de meilleures performances
  return new PrismaClient({
    accelerateUrl: accelerateUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClientInstance();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
