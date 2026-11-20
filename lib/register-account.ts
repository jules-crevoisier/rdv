import { after, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailSchema, findAccountByEmail, passwordSchema } from "@/lib/accounts";
import { isEmailVerificationRequired } from "@/lib/auth-credentials";
import { sendVerificationEmail } from "@/lib/email/account-emails";
import type { AccountType } from "@/lib/auth-tokens";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().max(120).optional().transform((v) => v || null),
  phone: z.string().trim().max(40).optional().transform((v) => v || null),
});

/** Inscription commune aux pros et aux clients, avec email de confirmation. */
export const registerAccount = async (type: AccountType, request: Request) => {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Données invalides", field: issue?.path[0] }, { status: 400 });
  }
  const { email, password, name, phone } = parsed.data;

  if (await findAccountByEmail(type, email)) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email", field: "email" }, { status: 409 });
  }

  const verificationRequired = isEmailVerificationRequired();
  const data = {
    email,
    name,
    password: await bcrypt.hash(password, 12),
    // Sans envoi d'email configuré, le compte est utilisable tout de suite.
    emailVerified: verificationRequired ? null : new Date(),
  };
  const account =
    type === "client"
      ? await prisma.client.create({ data: { ...data, phone }, select: { id: true, email: true, name: true, password: true, emailVerified: true } })
      : await prisma.user.create({ data, select: { id: true, email: true, name: true, password: true, emailVerified: true } });

  if (verificationRequired) {
    after(() => sendVerificationEmail(type, account, request).catch((e) => console.error("[register] email:", e)));
  }

  return NextResponse.json({ id: account.id, email: account.email, verificationRequired }, { status: 201 });
};
