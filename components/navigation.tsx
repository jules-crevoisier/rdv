"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Check, ChevronsUpDown, CalendarDays, ClipboardList, Inbox, LayoutGrid, LogOut, Plus, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
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
import { spaceName, switchWorkspace, useWorkspace, type WorkspaceInfo } from "@/components/workspace/use-workspace";

const navigation = [
  { name: "Aujourd'hui", short: "Aujourd'hui", href: "/", icon: CalendarDays },
  { name: "Réservations", short: "Réservations", tiny: "Résas", href: "/appointments", icon: Inbox },
  { name: "Types de rendez-vous", short: "Types", href: "/event-types", icon: LayoutGrid },
  { name: "Responsables", short: "Responsables", tiny: "Resp.", href: "/staff", icon: UserRoundCheck },
  { name: "Clients", short: "Clients", href: "/clients", icon: Users },
  // Barre latérale seulement : sur mobile, la page s'ouvre depuis le menu du compte.
  { name: "Organisateurs", short: "Organisateurs", href: "/organisateurs", icon: ShieldCheck, desktopOnly: true },
];

const interviewsItem = { name: "Mes entretiens", short: "Entretiens", href: "/mes-entretiens", icon: ClipboardList };

// Nombre d'entretiens à venir confiés à ce compte, lu une fois par onglet.
let interviewCount: Promise<number> | null = null;
const loadInterviewCount = () =>
  (interviewCount ??= fetch("/api/me/interviews?count=1")
    .then((r) => (r.ok ? r.json() : { count: 0 }))
    .then((d: { count?: number }) => d.count ?? 0)
    .catch(() => 0));

/** Navigation du compte : « Mes entretiens » s'ajoute quand on est responsable d'au moins un entretien à venir. */
const useNavigation = () => {
  const pathname = usePathname();
  const { status } = useSession();
  const [hasInterviews, setHasInterviews] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    loadInterviewCount().then((n) => active && setHasInterviews(n > 0));
    return () => {
      active = false;
    };
  }, [status]);

  return hasInterviews || pathname.startsWith(interviewsItem.href) ? [...navigation, interviewsItem] : navigation;
};

const isActivePath = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const initials = (name?: string | null, email?: string | null) => {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return "U";
};

/* Liste des espaces (le sien et ceux des équipes d'organisation), cochée sur l'espace ouvert. */
const SpaceItems = ({ workspace }: { workspace: WorkspaceInfo }) => (
  <>
    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Espaces</DropdownMenuLabel>
    {workspace.spaces.map((space) => {
      const current = space.id === workspace.ownerId;
      return (
        <DropdownMenuItem key={space.id} onClick={() => !current && switchWorkspace(space.id)} aria-current={current ? "true" : undefined}>
          <span className="grid size-5 shrink-0 place-items-center rounded bg-muted text-[0.625rem] font-medium" aria-hidden="true">
            {initials(space.name, space.email)}
          </span>
          <span className="min-w-0 flex-1 truncate">{space.mine ? "Mon espace" : spaceName(space)}</span>
          {current && <Check className="text-foreground" />}
        </DropdownMenuItem>
      );
    })}
  </>
);

/* Barre latérale : espace ouvert, et changement d'espace quand on fait partie d'une équipe. */
const SpaceSwitcher = () => {
  const { workspace } = useWorkspace();
  if (!workspace || workspace.spaces.length < 2) return null;
  const { current } = workspace;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="mt-4 flex min-h-11 w-full items-center gap-2.5 rounded-lg border bg-background px-2.5 text-left shadow-xs outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Changer d'espace"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-[0.6875rem] font-medium" aria-hidden="true">
            {initials(current.name, current.email)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.6875rem] leading-tight text-muted-foreground">{current.mine ? "Espace" : "Équipe de"}</span>
            <span className="block truncate text-sm font-medium leading-tight">{current.mine ? "Mon espace" : spaceName(current)}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <SpaceItems workspace={workspace} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserMenu = ({ align = "start" }: { align?: "start" | "end" }) => {
  const { data: session } = useSession();
  const { workspace } = useWorkspace();
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
          className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Menu du compte"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
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
        <DropdownMenuItem asChild>
          <Link href={interviewsItem.href}>
            <interviewsItem.icon />
            {interviewsItem.name}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/organisateurs">
            <ShieldCheck />
            Organisateurs
          </Link>
        </DropdownMenuItem>
        {workspace && workspace.spaces.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <SpaceItems workspace={workspace} />
          </>
        )}
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
  const items = useNavigation();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar px-3 py-4 lg:flex">
      <Brand className="px-2" />
      <SpaceSwitcher />

      <Button asChild className="mt-4 w-full">
        <Link href="/event-types/new">
          <Plus />
          Nouveau type
        </Link>
      </Button>

      <nav className="mt-4 flex flex-col gap-0.5" aria-label="Navigation principale">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-1 border-t pt-3">
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
  const items = useNavigation().filter((item) => !("desktopOnly" in item && item.desktopOnly));

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
          <div className="w-10">
            <UserMenu align="end" />
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Navigation principale"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 font-medium outline-none focus-visible:bg-accent",
                items.length > 5 ? "text-[0.625rem]" : "text-[0.6875rem]",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
                            <Icon className="size-5" />
              <span className="max-w-full truncate">{(items.length > 5 && (item as { tiny?: string }).tiny) || item.short}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export const Navigation = MobileNav;
