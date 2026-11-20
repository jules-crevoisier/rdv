import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AccountType } from "@/lib/auth-tokens";

// Accès unifié aux deux types de comptes : les pros (User) et leurs clients (Client).

export type Account = {
  id: string;
  email: string;
  name: string | null;
  /** null pour un compte créé via Google ou Discord. */
  password: string | null;
  emailVerified: Date | null;
};

const select = { id: true, email: true, name: true, password: true, emailVerified: true } as const;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailSchema = z.string().trim().toLowerCase().email("Adresse email invalide").max(254);
export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(200, "Mot de passe trop long");

export const findAccountByEmail = async (type: AccountType, email: string): Promise<Account | null> => {
  const normalized = normalizeEmail(email);
  // Les anciens comptes ont pu être créés avec des majuscules : on tente l'exact puis le normalisé.
  const where = { email: { equals: normalized, mode: "insensitive" as const } };
  return type === "client"
    ? prisma.client.findFirst({ where, select })
    : prisma.user.findFirst({ where, select });
};

export const findAccountById = async (type: AccountType, id: string): Promise<Account | null> =>
  type === "client"
    ? prisma.client.findUnique({ where: { id }, select })
    : prisma.user.findUnique({ where: { id }, select });

export const markEmailVerified = async (type: AccountType, id: string) => {
  const data = { emailVerified: new Date() };
  if (type === "client") await prisma.client.update({ where: { id }, data });
  else await prisma.user.update({ where: { id }, data });
};

export const setPassword = async (type: AccountType, id: string, password: string) => {
  // Réinitialiser par email prouve aussi la possession de l'adresse.
  const data = { password: await bcrypt.hash(password, 12), emailVerified: new Date() };
  if (type === "client") await prisma.client.update({ where: { id }, data });
  else await prisma.user.update({ where: { id }, data });
};

/** Chemins des pages de connexion selon le type de compte. */
export const loginPath = (type: AccountType) => (type === "client" ? "/client/login" : "/login");
