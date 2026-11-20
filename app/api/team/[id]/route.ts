import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkspace, WORKSPACE_COOKIE } from "@/lib/workspace";

/** Retire un co-organisateur de l'espace en cours (y compris soi-même : « Quitter l'équipe »). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.teamMember.findFirst({ where: { id, ownerId: ws.ownerId }, select: { email: true } });
  if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  await prisma.teamMember.delete({ where: { id } });

  const leftSelf = !ws.isOwner && member.email.toLowerCase() === ws.actorEmail.toLowerCase();
  const response = NextResponse.json({ success: true, left: leftSelf });
  // Qui quitte l'équipe revient dans son propre espace.
  if (leftSelf) response.cookies.delete(WORKSPACE_COOKIE);
  return response;
}
