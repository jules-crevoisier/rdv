import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClientInstance() {
  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  // Prisma Accelerate (prisma+postgres://), ex. Vercel Postgres
  const accelerateUrl = process.env.DATABASE_PRISMA_DATABASE_URL;
  if (accelerateUrl?.startsWith("prisma+")) {
    return new PrismaClient({ accelerateUrl, log });
  }

  // PostgreSQL classique (Dokploy, Docker, local) : Prisma 7 passe par un driver adapter
  const connectionString = process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Database URL is not defined. Set DATABASE_URL (or DATABASE_POSTGRES_URL / DATABASE_PRISMA_DATABASE_URL)."
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }), log });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClientInstance();
  }
  return globalForPrisma.prisma;
}

// Instanciation paresseuse : le client n'est créé qu'à la première requête,
// ce qui permet de builder (ex. dans Docker) sans variable DATABASE_URL.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
