import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClientInstance() {
  // S'assurer que DATABASE_URL est défini
  // Dans Next.js, les variables d'environnement du .env sont chargées automatiquement
  // mais on s'assure qu'elles sont bien disponibles
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables");
    throw new Error(
      "DATABASE_URL is not defined. Please set it in your .env file or environment variables."
    );
  }
  
  console.log("Initializing Prisma with DATABASE_URL:", databaseUrl);
  
  // Créer l'adaptateur Prisma avec la configuration directement
  const adapter = new PrismaLibSql({
    url: databaseUrl,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClientInstance();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
