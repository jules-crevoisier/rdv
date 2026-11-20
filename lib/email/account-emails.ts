import { getAppUrl } from "@/lib/app-config";
import { issueToken, type AccountType } from "@/lib/auth-tokens";
import { loginPath, type Account } from "@/lib/accounts";
import { sendEmail } from "./client";
import { passwordChangedTemplate, resetPasswordTemplate, verifyEmailTemplate } from "./templates";

const typeParam = (type: AccountType) => (type === "client" ? "&type=client" : "");

export const sendVerificationEmail = async (type: AccountType, account: Account, request?: Request) => {
  const token = await issueToken(type, account.id, "verify-email");
  const url = `${getAppUrl(request)}/verify-email?token=${token}${typeParam(type)}`;
  const t = verifyEmailTemplate({ name: account.name, url });
  return sendEmail({ to: account.email, ...t, tags: [{ name: "category", value: "verify_email" }] });
};

export const sendPasswordResetEmail = async (type: AccountType, account: Account, request?: Request) => {
  const token = await issueToken(type, account.id, "reset-password");
  const url = `${getAppUrl(request)}/reset-password?token=${token}${typeParam(type)}`;
  const t = resetPasswordTemplate({ name: account.name, url });
  return sendEmail({ to: account.email, ...t, tags: [{ name: "category", value: "reset_password" }] });
};

export const sendPasswordChangedEmail = async (type: AccountType, account: Account, request?: Request) => {
  const base = getAppUrl(request);
  const t = passwordChangedTemplate({
    name: account.name,
    loginUrl: `${base}${loginPath(type)}`,
    forgotUrl: `${base}/forgot-password${type === "client" ? "?type=client" : ""}`,
  });
  return sendEmail({ to: account.email, ...t, tags: [{ name: "category", value: "password_changed" }] });
};
