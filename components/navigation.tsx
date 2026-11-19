"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { CalendarDays, Inbox, LayoutGrid, LogOut, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/app/brand";

const navigation = [
  { name: "Aujourd'hui", short: "Aujourd'hui", href: "/", icon: CalendarDays },
  { name: "Réservations", short: "Réservations", href: "/appointments", icon: Inbox },
  { name: "Types de rendez-vous", short: "Types", href: "/event-types", icon: LayoutGrid },
  { name: "Clients", short: "Clients", href: "/clients", icon: Users },
];

const isActivePath = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const initials = (name?: string | null, email?: string | null) => {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return "U";
};

const UserMenu = ({ align = "start" }: { align?: "start" | "end" }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  if (!session?.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/40"
          aria-label="Menu du compte"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs text-ink-foreground">
            {initials(session.user.name, session.user.email)}
          </span>
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-medium">{session.user.name || "Mon compte"}</span>
            <span className="block truncate text-xs text-muted-foreground">{session.user.email}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={align === "start" ? "top" : "bottom"} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{session.user.name || "Mon compte"}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/* Barre latérale (≥ lg) */
export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-background px-4 py-5 lg:flex">
      <Brand className="px-2" />

      <Button asChild className="mt-8 w-full justify-start">
        <Link href="/event-types/new">
          <Plus />
          Nouveau type
        </Link>
      </Button>

      <nav className="mt-6 flex flex-col gap-0.5" aria-label="Navigation principale">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40",
                active ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {active && <span className="absolute inset-y-2.5 -left-4 w-[3px] rounded-r-full bg-primary" aria-hidden="true" />}
              <Icon className={cn("size-[1.125rem]", active && "text-primary")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-1 border-t pt-4">
        <div className="min-w-0 flex-1">
          <UserMenu />
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
};

/* Barre du haut + barre d'onglets en bas (< lg) : les actions restent sous le pouce. */
export const MobileNav = () => {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild size="icon" aria-label="Nouveau type de rendez-vous">
            <Link href="/event-types/new">
              <Plus />
            </Link>
          </Button>
          <div className="w-11">
            <UserMenu align="end" />
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Navigation principale"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium outline-none focus-visible:bg-secondary",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {active && <span className="absolute inset-x-6 top-0 h-[2px] rounded-b-full bg-primary" aria-hidden="true" />}
              <Icon className={cn("size-5", active && "text-primary")} />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export const Navigation = MobileNav;
