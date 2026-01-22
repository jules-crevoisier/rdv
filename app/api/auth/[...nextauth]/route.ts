import { handlers } from "@/auth";

// Utiliser Node.js runtime car NextAuth avec Prisma n'est pas compatible avec Edge Runtime
export const runtime = "nodejs";

export const { GET, POST } = handlers;
