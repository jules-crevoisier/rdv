import { getAppUrl } from "@/lib/app-config";
import { findAccountByEmail } from "@/lib/accounts";
import { sendEmail } from "./client";
import { staffWelcomeTemplate } from "./templates";

export const STAFF_HOME = "/mes-entretiens";

/** Email envoyé quand un organisateur ajoute un responsable à son annuaire. */
export const sendStaffWelcome = async (
  staff: { name: string; email: string },
  host: { name: string | null; email: string },
  request?: Request
) => {
  const hasAccount = Boolean(await findAccountByEmail("user", staff.email));
  const params = new URLSearchParams({ email: staff.email, callbackUrl: STAFF_HOME });
  if (!hasAccount) params.set("tab", "register");
  const t = staffWelcomeTemplate({
    staffName: staff.name,
    hostName: host.name || host.email,
    url: `${getAppUrl(request)}/login?${params}`,
    hasAccount,
  });
  return sendEmail({ to: staff.email, replyTo: host.email, ...t, tags: [{ name: "category", value: "staff_welcome" }] });
};
