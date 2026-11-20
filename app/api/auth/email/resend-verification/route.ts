import { after, NextResponse } from "next/server";
import { z } from "zod";
import { emailSchema, findAccountByEmail } from "@/lib/accounts";
import { canIssueToken, parseAccountType } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email/account-emails";

export const runtime = "nodejs";

const schema = z.object({ email: emailSchema, type: z.string().optional() });

// Réponse identique que le compte existe ou non : on ne révèle pas les adresses inscrites.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });

  try {
    const type = parseAccountType(parsed.data.type);
    const account = await findAccountByEmail(type, parsed.data.email);
    if (account && !account.emailVerified && (await canIssueToken(type, account.id, "verify-email"))) {
      after(() => sendVerificationEmail(type, account, request).catch((e) => console.error("[resend-verification]", e)));
    }
  } catch (error) {
    console.error("[resend-verification]", error);
  }
  return NextResponse.json({ ok: true });
}
