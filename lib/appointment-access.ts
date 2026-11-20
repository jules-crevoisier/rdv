import { prisma } from "./prisma";

export type AppointmentRole = "owner" | "staff";

/**
 * Qui peut voir l'équipe et les commentaires d'un rendez-vous : l'organisateur, et les responsables
 * placés dessus (reconnus par l'adresse vérifiée de leur compte). Jamais le client.
 */
export const appointmentRole = async (appointmentId: string, userId: string): Promise<AppointmentRole | null> => {
  const [appointment, user] = await Promise.all([
    prisma.appointment.findUnique({ where: { id: appointmentId }, select: { userId: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } }),
  ]);
  if (!appointment || !user) return null;
  if (appointment.userId === userId) return "owner";
  if (!user.emailVerified) return null;
  const assigned = await prisma.appointment.count({
    where: { id: appointmentId, staff: { some: { email: { equals: user.email, mode: "insensitive" } } } },
  });
  return assigned > 0 ? "staff" : null;
};
