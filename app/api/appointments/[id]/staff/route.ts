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
