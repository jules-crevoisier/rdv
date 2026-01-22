import { NextResponse } from "next/server";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      hasDatabasePrismaUrl: !!process.env.DATABASE_PRISMA_DATABASE_URL,
      hasDatabasePostgresUrl: !!process.env.DATABASE_POSTGRES_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  // Tester la connexion Prisma si possible
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$connect();
    health.status = "ok";
    (health as any).database = "connected";
  } catch (error: any) {
    health.status = "error";
    (health as any).database = "disconnected";
    (health as any).error = error.message;
  }

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 500,
  });
}
