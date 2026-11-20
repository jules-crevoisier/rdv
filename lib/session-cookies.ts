// Noms des cookies de session. Partagé entre auth-client.ts et proxy.ts (Edge : pas d'import lourd ici).

/** Session des pros (NextAuth par défaut). */
export const PRO_SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/** Session des clients (instance NextAuth séparée, cf. auth-client.ts). */
export const CLIENT_SESSION_COOKIE = "rdv-client.session-token";
