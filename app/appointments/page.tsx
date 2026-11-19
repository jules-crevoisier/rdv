"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ExternalLink, Mail, MapPin, MoreHorizontal, Phone, Trash2, Video, X } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status";
import { Ticket } from "@/components/app/ticket";
import { cn, formatDateTime } from "@/lib/utils";

type AppointmentFromDB = {
  id: string;
  userId: string;
  clientId?: string | null;
  eventTypeId: string;
  eventType: {
    id: string;
    name: string;
    color?: string;
  };
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  notes?: string | null;
  location?: string | null;
  meetingType?: string;
  videoLink?: string | null;
  status: string;
};

type Filter = "upcoming" | "pending" | "past" | "all";
const FILTERS: Filter[] = ["upcoming", "pending", "past", "all"];

const dayLabel = (d: Date) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === tomorrow.toDateString()) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
};

function AppointmentsContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab") as Filter | null;
  const [filter, setFilter] = useState<Filter>(initial && FILTERS.includes(initial) ? initial : "upcoming");
  const [scope, setScope] = useState<"received" | "mine">("received");
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toDelete, setToDelete] = useState<AppointmentFromDB | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = async () => {
    const response = await fetch("/api/appointments");
    if (response.ok) setAppointments(await response.json());
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (sessionStatus === "loading") return;
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      try {
        await reload();
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [session, sessionStatus]);

  const changeFilter = (value: string) => {
    setFilter(value as Filter);
    router.replace(`/appointments?tab=${value}`, { scroll: false });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    setActionError(null);
    try {
      const response = await fetch(`/api/appointments/${toDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setActionError(data.error || "La suppression n'a pas abouti.");
        return;
      }
      setToDelete(null);
      await reload();
    } catch {
      setActionError("La suppression n'a pas abouti.");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setActionError(data.error || "La mise à jour n'a pas abouti.");
        return;
      }
      await reload();
    } catch {
      setActionError("La mise à jour n'a pas abouti.");
    } finally {
      setBusyId(null);
    }
  };

  const isOwner = (apt: AppointmentFromDB) => apt.userId === session?.user?.id;
  const isClient = (apt: AppointmentFromDB) =>
    apt.clientId === session?.user?.id || apt.clientEmail === session?.user?.email;

  const mine = appointments.filter((a) => isClient(a) && !isOwner(a));
  const received = appointments.filter((a) => isOwner(a));
  const base = scope === "mine" ? mine : received;
  const now = new Date();

  const lists: Record<Filter, AppointmentFromDB[]> = useMemo(() => {
    const byStartAsc = (a: AppointmentFromDB, b: AppointmentFromDB) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    return {
      upcoming: base.filter((a) => new Date(a.startTime) > now && a.status !== "cancelled").sort(byStartAsc),
      pending: base.filter((a) => a.status === "pending").sort(byStartAsc),
      past: base.filter((a) => new Date(a.startTime) < now || a.status === "cancelled").sort((a, b) => -byStartAsc(a, b)),
      all: [...base].sort((a, b) => -byStartAsc(a, b)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, scope, session]);

  const groups = useMemo(() => {
    const map = new Map<string, AppointmentFromDB[]>();
    lists[filter].forEach((a) => {
      const key = new Date(a.startTime).toDateString();
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return Array.from(map.entries());
  }, [lists, filter]);

  if (isLoading) {
    return (
      <MainLayout>
        <PageSkeleton rows={4} />
      </MainLayout>
    );
  }

  const labels: Record<Filter, string> = { upcoming: "À venir", pending: "En attente", past: "Passés", all: "Tous" };
  const empty: Record<Filter, { title: string; description: string }> = {
    upcoming: { title: "Rien à venir", description: "Les nouveaux rendez-vous s'affichent ici dès qu'un client réserve." },
    pending: { title: "Aucune demande en attente", description: "Les rendez-vous à valider arrivent ici." },
    past: { title: "Pas encore d'historique", description: "Les rendez-vous terminés ou annulés sont rangés ici." },
    all: { title: "Aucun rendez-vous", description: "Partagez le lien d'un type de rendez-vous pour recevoir vos premières réservations." },
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow={`${received.length} reçus${mine.length ? ` · ${mine.length} pris` : ""}`}
          title="Réservations"
          description="Validez les demandes, retrouvez les coordonnées, gardez l'historique."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={changeFilter}>
            <TabsList className="w-full sm:w-fit">
              {FILTERS.map((f) => (
                <TabsTrigger key={f} value={f} className="gap-1.5">
                  {labels[f]}
                  <span className="text-xs opacity-60 tnum">{lists[f].length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {mine.length > 0 && (
            <div className="flex rounded-xl border bg-card p-1 text-sm" role="group" aria-label="Afficher">
              {(["received", "mine"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={scope === s}
                  onClick={() => setScope(s)}
                  className={cn(
                    "h-9 flex-1 rounded-lg px-3 font-medium transition-colors sm:flex-none",
                    scope === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s === "received" ? "Reçus" : "Pris par moi"}
                </button>
              ))}
            </div>
          )}
        </div>

        {actionError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {actionError}
          </p>
        )}

        {groups.length === 0 ? (
          <EmptyState {...empty[filter]} />
        ) : (
          <div className="space-y-8">
            {groups.map(([key, items]) => (
              <section key={key} aria-label={dayLabel(new Date(key))}>
                <h2 className="mb-3 flex items-baseline gap-3 text-lg first-letter:uppercase">
                  {dayLabel(new Date(key))}
                  <span className="text-xs text-muted-foreground tnum">{items.length}</span>
                </h2>
                <ol className="space-y-3">
                  {items.map((apt) => {
                    const own = isOwner(apt);
                    const myBooking = isClient(apt) && !own;
                    const dimmed = apt.status === "cancelled" || new Date(apt.endTime) < now;
                    return (
                      <Ticket key={apt.id} as="li" start={apt.startTime} end={apt.endTime} color={apt.eventType.color} muted={dimmed}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{myBooking ? "Votre rendez-vous" : apt.clientName}</p>
                              <StatusPill status={apt.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">{apt.eventType.name}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              {!myBooking && (
                                <a href={`mailto:${apt.clientEmail}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground">
                                  <Mail className="size-3.5 shrink-0" />
                                  <span className="truncate">{apt.clientEmail}</span>
                                </a>
                              )}
                              {!myBooking && apt.clientPhone && (
                                <a href={`tel:${apt.clientPhone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                                  <Phone className="size-3.5" />
                                  {apt.clientPhone}
                                </a>
                              )}
                              {apt.location && (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="size-3.5" />
                                  {apt.location}
                                </span>
                              )}
                              {apt.meetingType === "video" && apt.videoLink && (
                                <a href={apt.videoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline underline-offset-4">
                                  <Video className="size-3.5" />
                                  Rejoindre la visio
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                            {apt.notes && (
                              <p className="max-w-prose border-l-2 pl-3 text-sm italic text-muted-foreground">{apt.notes}</p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {own && apt.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => handleStatusChange(apt.id, "confirmed")} disabled={busyId === apt.id} className="flex-1 md:flex-none">
                                  <Check />
                                  Confirmer
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, "cancelled")} disabled={busyId === apt.id} className="flex-1 md:flex-none">
                                  <X />
                                  Refuser
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" aria-label={`Plus d'actions pour ${apt.clientName}`}>
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                {own && apt.status === "confirmed" && new Date(apt.endTime) < now && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "completed")}>
                                    <Check />
                                    Marquer comme terminé
                                  </DropdownMenuItem>
                                )}
                                {own && apt.status !== "cancelled" && apt.status !== "pending" && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "cancelled")}>
                                    <X />
                                    Annuler le rendez-vous
                                  </DropdownMenuItem>
                                )}
                                {own && apt.status !== "pending" && <DropdownMenuSeparator />}
                                <DropdownMenuItem variant="destructive" onClick={() => setToDelete(apt)}>
                                  <Trash2 />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Ticket>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce rendez-vous ?</DialogTitle>
            <DialogDescription>
              {toDelete && `${toDelete.clientName}, ${formatDateTime(toDelete.startTime)}. `}
              Il disparaît de votre agenda et de l&apos;historique. Pour prévenir le client, annulez-le plutôt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Garder
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busyId === toDelete?.id}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <PageSkeleton rows={4} />
        </MainLayout>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
