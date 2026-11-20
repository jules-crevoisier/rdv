import { registerAccount } from "@/lib/register-account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    return await registerAccount("client", request);
  } catch (error) {
    console.error("[register] client:", error);
    return Response.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
  }
}
