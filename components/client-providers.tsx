"use client";

import { SessionProvider } from "next-auth/react";

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider basePath="/api/auth/client" refetchInterval={0}>{children}</SessionProvider>;
};
