import { after, NextResponse } from "next/server";
import { z } from "zod";
import { findAccountById, passwordSchema, setPassword } from "@/lib/accounts";
import { consumeToken } from "@/lib/auth-tokens";
import { sendPasswordChangedEmail } from "@/lib/email/account-emails";

export const runtime = "nodejs";

const schema = z.object({ token: z.string().min(10).max(200), password: passwordSchema });

const reasons = {
  invalid: "Ce lien n'est pas valide.",
  expired: "Ce lien a expiré. Demandez-en un nouveau.",
  used: "Ce lien a déjà servi. Demandez-en un nouveau si besoin.",
};

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Données invalides", field: issue?.path[0] }, { status: 400 });
  }

  try {
    const result = await consumeToken(parsed.data.token, "reset-password");
    if (!result.ok) return NextResponse.json({ error: reasons[result.reason], reason: result.reason }, { status: 400 });

    const account = await findAccountById(result.accountType, result.accountId);
    if (!account) return NextResponse.json({ error: reasons.invalid, reason: "invalid" }, { status: 400 });

    await setPassword(result.accountType, account.id, parsed.data.password);
    after(() => sendPasswordChangedEmail(result.accountType, account, request).catch((e) => console.error("[reset]", e)));

    return NextResponse.json({ ok: true, type: result.accountType, email: account.email });
  } catch (error) {
    console.error("[reset]", error);
    return NextResponse.json({ error: "Une erreur est survenue, réessayez." }, { status: 500 });
  }
}
