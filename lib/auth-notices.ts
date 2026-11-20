// Messages affichés sur les pages de connexion après une redirection (?verified=1, ?reset=1).
export const authNotice = (params: URLSearchParams): string | null => {
  if (params.get("verified") === "1") return "Adresse confirmée. Vous pouvez vous connecter.";
  if (params.get("reset") === "1") return "Mot de passe changé. Connectez-vous avec le nouveau.";
  return null;
};
