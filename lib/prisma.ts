import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClientInstance() {
  // S'assurer que DATABASE_URL est défini
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL is not defined in environment variables");
    throw new Error(
      "DATABASE_URL is not defined. Please set it in your .env file or environment variables."
    );
  }
  
  // Détecter si on utilise SQLite local (file:) ou LibSQL (libsql://)
  const isLocalSQLite = databaseUrl.startsWith("file:");
  
  if (isLocalSQLite) {
    // Pour SQLite local, utiliser PrismaClient directement sans adaptateur
    console.log("Initializing Prisma with local SQLite:", databaseUrl);
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } else {
    // Pour LibSQL (Turso) en production, utiliser l'adaptateur
    console.log("Initializing Prisma with LibSQL:", databaseUrl);
    
    // Créer le client LibSQL
    const libsqlConfig: { url: string; authToken?: string } = {
      url: databaseUrl,
    };
    
    // Ajouter le token d'authentification si disponible (nécessaire pour Turso)
    if (process.env.TURSO_AUTH_TOKEN) {
      libsqlConfig.authToken = process.env.TURSO_AUTH_TOKEN;
    }
    
    const libsql = createClient(libsqlConfig);
    
    // Créer l'adaptateur Prisma avec le client LibSQL
    const adapter = new PrismaLibSql(libsql);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClientInstance();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
