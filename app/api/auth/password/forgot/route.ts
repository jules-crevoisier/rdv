import { after, NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema, findAccountByEmail } from "@/lib/accounts";
import { canIssueToken, parseAccountType } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email/account-emails";

export const runtime = "nodejs";

const schema = z.object({ email: emailSchema, type: z.string().optional() });

// Réponse identique que le compte existe ou non : on ne révèle pas les adresses inscrites.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Adresse email invalide", field: "email" }, { status: 400 });

  try {
    const type = parseAccountType(parsed.data.type);
    const account = await findAccountByEmail(type, parsed.data.email);
    if (account && (await canIssueToken(type, account.id, "reset-password"))) {
      after(() => sendPasswordResetEmail(type, account, request).catch((e) => console.error("[forgot]", e)));
    }
  } catch (error) {
    console.error("[forgot]", error);
  }
  return NextResponse.json({ ok: true });
}
