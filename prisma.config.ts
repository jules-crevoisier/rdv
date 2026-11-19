import "dotenv/config";
import { defineConfig } from "prisma/config";

// URL directe PostgreSQL (pas Accelerate) : utilisée par `prisma migrate`.
// `prisma generate` n'en a pas besoin, d'où le fallback vide (le build Docker tourne sans base).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL || "",
  },
});
