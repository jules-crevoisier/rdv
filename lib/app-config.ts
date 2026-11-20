// Réglages globaux lus depuis l'environnement (voir .env.example).

export const APP_NAME = process.env.APP_NAME || "Reservy";

/** Fuseau utilisé pour écrire les dates dans les emails (le serveur tourne en UTC). */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Paris";

/** URL publique de l'app, sans slash final. Sert aux liens des emails. */
export const getAppUrl = (request?: Request): string => {
  const fromEnv = process.env.APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (request) {
    const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
};
