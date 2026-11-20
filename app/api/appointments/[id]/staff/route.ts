import { after, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ownStaffIds, setAppointmentStaff } from "@/lib/staff";
import { notifyStaffChanged } from "@/lib/email/appointment-emails";

/** Remplace les responsables présents à un rendez-vous (entretien). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!appointment) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const staffIds = await ownStaffIds(session.user.id, body.staffIds);
  if (!staffIds) return NextResponse.json({ error: "Responsable inconnu" }, { status: 400 });

  const change = await setAppointmentStaff(id, staffIds);
  if (change.added.length || change.removed.length) after(() => notifyStaffChanged(id, change));

  return NextResponse.json({ success: true, staffIds });
}

/**
 * « Me placer sur cet entretien » : l'organisateur s'ajoute à son annuaire (s'il n'y est pas)
 * puis rejoint les responsables du rendez-vous. Renvoie la fiche pour mettre à jour la liste.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const userId = session.user.id;

  const appointment = await prisma.appointment.findFirst({
    where: { id, userId },
    select: { staff: { select: { id: true } } },
  });
  if (!appointment) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!me) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const email = me.email.toLowerCase();

  const self =
    (await prisma.staffMember.findFirst({ where: { userId, email: { equals: email, mode: "insensitive" } } })) ??
    (await prisma.staffMember.create({ data: { userId, email, name: me.name?.trim() || email.split("@")[0] } }));

  const staffIds = [...new Set([...appointment.staff.map((s) => s.id), self.id])];
  const change = await setAppointmentStaff(id, staffIds);
  if (change.added.length) after(() => notifyStaffChanged(id, change));

  return NextResponse.json({ staffIds, member: { id: self.id, name: self.name, email: self.email, role: self.role } });
}
