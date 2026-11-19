import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/health        -> liveness (utilisé par le HEALTHCHECK Docker, ne touche pas la base)
// GET /api/health?db=1   -> readiness (vérifie aussi la connexion PostgreSQL)
export async function GET(request: Request) {
  const checkDb = new URL(request.url).searchParams.has("db");
  if (!checkDb) {
    return NextResponse.json({ status: "ok" });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch {
    return NextResponse.json({ status: "error", database: "disconnected" }, { status: 503 });
  }
}
