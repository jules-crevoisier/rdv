"use client";

import { Sidebar, MobileNav } from "@/components/navigation";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-foreground"
      >
        Aller au contenu
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-12">
          {children}
        </main>
      </div>
    </div>
  );
};
