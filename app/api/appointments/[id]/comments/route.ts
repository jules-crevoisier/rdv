import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appointmentRole } from "@/lib/appointment-access";

// Commentaires internes d'un rendez-vous : organisateur et responsables placés dessus.

const MAX_LENGTH = 2000;

const list = async (appointmentId: string, userId: string, role: string) => {
  const comments = await prisma.appointmentComment.findMany({
    where: { appointmentId },
    orderBy: { createdAt: "asc" },
    select: { id: true, authorId: true, authorName: true, body: true, createdAt: true },
  });
  return comments.map(({ authorId, ...c }) => ({
    ...c,
    mine: authorId === userId,
    canDelete: authorId === userId || role === "owner",
  }));
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const role = await appointmentRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  return NextResponse.json(await list(id, session.user.id, role));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const role = await appointmentRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Écrivez un commentaire." }, { status: 400 });
  if (text.length > MAX_LENGTH) return NextResponse.json({ error: `${MAX_LENGTH} caractères au maximum.` }, { status: 400 });

  const author = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } });
  await prisma.appointmentComment.create({
    data: { appointmentId: id, authorId: session.user.id, authorName: author?.name || author?.email || "Équipe", body: text },
  });
  return NextResponse.json(await list(id, session.user.id, role), { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const role = await appointmentRole(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

  const commentId = new URL(request.url).searchParams.get("commentId") ?? "";
  const comment = await prisma.appointmentComment.findFirst({ where: { id: commentId, appointmentId: id }, select: { authorId: true } });
  if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
  if (comment.authorId !== session.user.id && role !== "owner") {
    return NextResponse.json({ error: "Seul son auteur ou l'organisateur peut le supprimer." }, { status: 403 });
  }
  await prisma.appointmentComment.delete({ where: { id: commentId } });
  return NextResponse.json(await list(id, session.user.id, role));
}
