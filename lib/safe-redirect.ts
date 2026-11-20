/** Chemin interne sûr pour un retour après connexion (jamais un autre site). */
export const safeCallback = (value: string | null | undefined, fallback = "/") =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
