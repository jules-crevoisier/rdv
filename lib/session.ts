import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const getSession = async () => {
  const session = await auth();
  return session;
};

export const requireAuth = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
};
