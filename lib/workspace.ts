import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "./prisma";

// Espace de travail : les créneaux, réservations et responsables appartiennent à un organisateur
// (ownerId). Ses co-organisateurs (TeamMember, reconnus par l'adresse vérifiée de leur compte)
// gèrent le même espace que lui. Le cookie ci-dessous retient l'espace choisi dans le menu.

export const WORKSPACE_COOKIE = "rdv-espace";

export type Workspace = {
  /** Organisateur propriétaire des données gérées. */
  ownerId: string;
  /** Compte connecté. */
  actorId: string;
  actorEmail: string;
  /** Le compte connecté gère son propre espace. */
  isOwner: boolean;
};

export type TeamSpace = { id: string; name: string | null; email: string };

const me = (userId: string) =>
  prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });

/** Organisateurs dont ce compte est co-organisateur. */
export const teamsOf = async (userId: string): Promise<TeamSpace[]> => {
  const user = await me(userId);
  if (!user?.emailVerified) return [];
  const rows = await prisma.teamMember.findMany({
    where: { email: { equals: user.email, mode: "insensitive" }, ownerId: { not: userId } },
    select: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => r.owner);
};

/** Le compte peut-il gérer l'espace de cet organisateur ? */
export const canManage = async (ownerId: string, userId: string) => {
  if (ownerId === userId) return true;
  const user = await me(userId);
  if (!user?.emailVerified) return false;
  const count = await prisma.teamMember.count({ where: { ownerId, email: { equals: user.email, mode: "insensitive" } } });
  return count > 0;
};

/**
 * Espace géré par le compte connecté pour cette requête. Sans choix enregistré, un co-organisateur
 * qui n'a rien créé lui-même arrive directement dans l'espace de son équipe.
 */
export const getWorkspace = cache(async (): Promise<Workspace | null> => {
  const session = await auth();
  const actorId = session?.user?.id;
  if (!actorId) return null;
  const actorEmail = session.user?.email ?? "";
  const own = { ownerId: actorId, actorId, actorEmail, isOwner: true };

  const chosen = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (chosen === actorId) return own;
  if (chosen) return (await canManage(chosen, actorId)) ? { ...own, ownerId: chosen, isOwner: false } : own;

  const teams = await teamsOf(actorId);
  if (teams.length === 0) return own;
  const hasOwnEventTypes = (await prisma.eventType.count({ where: { userId: actorId } })) > 0;
  return hasOwnEventTypes ? own : { ...own, ownerId: teams[0].id, isOwner: false };
});
