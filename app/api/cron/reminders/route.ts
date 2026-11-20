import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/email/appointment-emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Envoie les rappels J-1. À appeler toutes les heures avec l'en-tête
// `Authorization: Bearer $CRON_SECRET` (planification Dokploy, voir DEPLOY.md).
const authorized = (request: Request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

const handle = async (request: Request) => {
  if (!authorized(request)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    return NextResponse.json(await sendDueReminders(request));
  } catch (error) {
    console.error("[cron/reminders]", error);
    return NextResponse.json({ error: "Échec" }, { status: 500 });
  }
};

export const GET = handle;
export const POST = handle;
