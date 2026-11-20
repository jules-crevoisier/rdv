import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmail } from "@/lib/staff";
import { getWorkspace } from "@/lib/workspace";
import { sendTeamInvite } from "@/lib/email/team-emails";

// Équipe d'organisation de l'espace en cours : l'organisateur et ses co-organisateurs.
// Tout membre peut ajouter ou retirer quelqu'un ; l'organisateur, lui, reste toujours.

const list = async (ownerId: string, actorId: string, actorEmail: string) => {
  const [owner, members] = await Promise.all([
    prisma.user.findUnique({ where: { id: ownerId }, select: { id: true, name: true, email: true } }),
    prisma.teamMember.findMany({ where: { ownerId }, orderBy: { createdAt: "asc" }, select: { id: true, email: true, name: true, createdAt: true } }),
  ]);
  const accounts = members.length
    ? await prisma.user.findMany({
        where: { OR: members.map((m) => ({ email: { equals: m.email, mode: "insensitive" as const } })) },
        select: { email: true, name: true, emailVerified: true },
      })
    : [];
  const me = actorEmail.toLowerCase();
  return {
    owner: owner && { ...owner, isMe: owner.id === actorId },
    members: members.map((m) => {
      const account = accounts.find((a) => a.email.toLowerCase() === m.email.toLowerCase());
      return {
        ...m,
        name: m.name || account?.name || null,
        // Actif : un compte vérifié avec cette adresse existe, la personne a donc accès à l'espace.
        active: Boolean(account?.emailVerified),
        isMe: m.email.toLowerCase() === me,
      };
    }),
  };
};

export async function GET() {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await list(ws.ownerId, ws.actorId, ws.actorEmail));
}

export async function POST(request: Request) {
  const ws = await getWorkspace();
  if (!ws) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : null;
  if (!isEmail(email)) return NextResponse.json({ error: "Cette adresse email n'est pas valide." }, { status: 400 });

  const owner = await prisma.user.findUnique({ where: { id: ws.ownerId }, select: { name: true, email: true } });
  if (!owner) return NextResponse.json({ error: "Espace introuvable" }, { status: 404 });
  if (owner.email.toLowerCase() === email) {
    return NextResponse.json({ error: "C'est l'adresse de l'organisateur : il fait déjà partie de l'équipe." }, { status: 400 });
  }

  try {
    const member = await prisma.teamMember.create({ data: { ownerId: ws.ownerId, email, name } });
    const actor = await prisma.user.findUnique({ where: { id: ws.actorId }, select: { name: true, email: true } });
    after(() =>
      sendTeamInvite(member, {
        spaceName: owner.name || owner.email,
        inviterName: actor?.name || actor?.email || owner.name || owner.email,
        inviterEmail: actor?.email || owner.email,
      }, request).catch((e) => console.error("[team-invite]", e))
    );
    return NextResponse.json(await list(ws.ownerId, ws.actorId, ws.actorEmail), { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Cette personne fait déjà partie de l'équipe." }, { status: 409 });
    }
    console.error("[POST /api/team]", error);
    return NextResponse.json({ error: "L'ajout n'a pas abouti." }, { status: 500 });
  }
}
