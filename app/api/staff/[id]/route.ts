import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readStaffBody } from "@/lib/staff";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const parsed = readStaffBody(await request.json().catch(() => ({})));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const { count } = await prisma.staffMember.updateMany({ where: { id, userId: session.user.id }, data: parsed.data });
    if (count === 0) return NextResponse.json({ error: "Responsable introuvable" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Un responsable utilise déjà cette adresse." }, { status: 409 });
    }
    console.error("[PUT /api/staff/[id]]", error);
    return NextResponse.json({ error: "L'enregistrement n'a pas abouti." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const { count } = await prisma.staffMember.deleteMany({ where: { id, userId: session.user.id } });
  if (count === 0) return NextResponse.json({ error: "Responsable introuvable" }, { status: 404 });
  return NextResponse.json({ success: true });
}
