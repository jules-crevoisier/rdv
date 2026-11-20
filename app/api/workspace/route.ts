import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManage, getWorkspace, teamsOf, WORKSPACE_COOKIE } from "@/lib/workspace";

// Espace en cours (le sien ou celui d'une équipe) et liste des espaces accessibles, pour le menu du compte.

export async function GET() {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [self, teams] = await Promise.all([
    prisma.user.findUnique({ where: { id: ws.actorId }, select: { id: true, name: true, email: true } }),
    teamsOf(ws.actorId),
  ]);
  const spaces = [...(self ? [{ ...self, mine: true }] : []), ...teams.map((t) => ({ ...t, mine: false }))];
  const current = spaces.find((s) => s.id === ws.ownerId) ?? spaces[0];

  return NextResponse.json({ ownerId: ws.ownerId, isOwner: ws.isOwner, current, spaces });
}

/** Change d'espace : { ownerId } doit être le sien ou celui d'une équipe dont on fait partie. */
export async function POST(request: Request) {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ownerId = typeof body.ownerId === "string" ? body.ownerId : "";
  if (!ownerId || !(await canManage(ownerId, ws.actorId))) {
    return NextResponse.json({ error: "Vous ne faites pas partie de cette équipe." }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, ownerId });
  response.cookies.set(WORKSPACE_COOKIE, ownerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
