"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { spaceName, useWorkspace } from "@/components/workspace/use-workspace";
import Link from "next/link";
import { ArrowRight, CalendarSync, ChevronLeft, ChevronRight, MessageSquare, Plus, RefreshCw, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { StatusPill } from "@/components/app/status";
import { Ticket } from "@/components/app/ticket";
import { CopyButton } from "@/components/app/copy-button";
import { EmptyState } from "@/components/app/empty-state";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
import { useAppointmentStaff } from "@/components/appointments/use-appointment-staff";
import { formatTime, isSameDay } from "@/lib/utils";

type EventTypeFromDB = {
  id: string;
  name: string;
  status: string;
};

type AppointmentFromDB = {
  id: string;
  userId: string;
  clientId?: string | null;
  eventTypeId: string;
  eventType: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  status: string;
  staff?: { id: string; name: string }[];
  _count?: { comments: number };
};

const longDate = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { workspace } = useWorkspace();
  const [eventTypes, setEventTypes] = useState<EventTypeFromDB[]>([]);
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [icalUrl, setIcalUrl] = useState<string>("");
  const [icalNote, setIcalNote] = useState<string>("");
  const [now, setNow] = useState<Date>(new Date());
  const [openId, setOpenId] = useState<string | null>(null);

  const patch = useCallback((id: string, change: Partial<AppointmentFromDB>) => {
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, ...change } : a)));
  }, []);
  const team = useAppointmentStaff(
    sessionStatus === "authenticated",
    useCallback((id, staff) => patch(id, { staff }), [patch])
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchCalendarToken = async () => {
      if (!session?.user?.id) return;
      try {
        const response = await fetch("/api/calendar/generate-token");
        if (response.ok) {
          const data = await response.json();
          setIcalUrl(`${window.location.origin}/api/calendar/public/${data.token}/ical`);
        }
      } catch (error) {
        console.error("Error fetching calendar token:", error);
      }
    };
    fetchCalendarToken();
  }, [session]);

  useEffect(() => {
    const fetchData = async () => {
      if (sessionStatus === "loading") return;
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      try {
        const [eventTypesResponse, appointmentsResponse] = await Promise.all([
          fetch("/api/event-types"),
          fetch("/api/appointments"),
        ]);
        if (eventTypesResponse.ok) setEventTypes(await eventTypesResponse.json());
        if (appointmentsResponse.ok) setAppointments(await appointmentsResponse.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session, sessionStatus]);

  const regenerateToken = async () => {
    try {
      const response = await fetch("/api/calendar/generate-token", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setIcalUrl(`${window.location.origin}/api/calendar/public/${data.token}/ical`);
        setIcalNote("Nouveau lien créé. L'ancien ne fonctionne plus.");
      } else {
        setIcalNote("Le lien n'a pas pu être régénéré.");
      }
    } catch {
      setIcalNote("Le lien n'a pas pu être régénéré.");
    }
  };

  // Rendez-vous reçus dans l'espace géré : le sien ou celui de l'équipe d'organisation ouverte.
  const isOwner = (apt: AppointmentFromDB) => apt.userId === (workspace?.ownerId ?? session?.user?.id);
  const isClient = (apt: AppointmentFromDB) =>
    apt.clientId === session?.user?.id || apt.clientEmail === session?.user?.email;

  const active = appointments.filter((a) => a.status !== "cancelled");
  const pending = appointments.filter((a) => a.status === "pending" && isOwner(a));
  const todayCount = active.filter((a) => isSameDay(new Date(a.startTime), new Date())).length;
  const upcoming = active
    .filter((a) => new Date(a.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const next = upcoming[0];

  const dayAppointments = useMemo(
    () =>
      active
        .filter((a) => isSameDay(new Date(a.startTime), selectedDate))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments, selectedDate]
  );

  const isToday = isSameDay(selectedDate, now);

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <PageSkeleton rows={4} />
      </MainLayout>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0];
  const summary =
    todayCount === 0
      ? "Aucun rendez-vous aujourd'hui."
      : `${todayCount} rendez-vous aujourd'hui${next && isSameDay(new Date(next.startTime), now) ? `, le prochain à ${formatTime(next.startTime)}` : ""}.`;

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow={workspace && !workspace.isOwner ? `${longDate(now)} · espace ${spaceName(workspace.current)}` : longDate(now)}
          title={firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
          description={summary}
          actions={
            session?.user?.id && (
              <Dialog onOpenChange={() => setIcalNote("")}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CalendarSync />
                    Synchroniser mon agenda
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Synchroniser avec votre agenda</DialogTitle>
                    <DialogDescription>
                      Abonnez Google Agenda, Outlook ou Calendrier à ce lien : vos rendez-vous y apparaissent automatiquement.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="ical-url-input">Lien d&apos;abonnement</Label>
                    <div className="flex gap-2">
                      <Input id="ical-url-input" readOnly value={icalUrl} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                      <CopyButton value={icalUrl} size="icon" label="Copier le lien" />
                      <Button variant="outline" size="icon" onClick={regenerateToken} aria-label="Régénérer le lien" title="Régénérer le lien">
                        <RefreshCw />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {icalNote || "Toute personne qui a ce lien voit vos rendez-vous. Régénérez-le en cas de doute."}
                    </p>
                  </div>
                  <ul className="space-y-1.5 rounded-lg bg-muted p-4 text-sm">
                    <li><span className="font-medium">Google Agenda</span> <span className="text-muted-foreground">: Autres agendas, +, À partir de l&apos;URL</span></li>
                    <li><span className="font-medium">Outlook</span> <span className="text-muted-foreground">: Ajouter un calendrier, S&apos;abonner à partir du web</span></li>
                    <li><span className="font-medium">Calendrier (Apple)</span> <span className="text-muted-foreground">: Fichier, Nouvel abonnement</span></li>
                  </ul>
                </DialogContent>
              </Dialog>
            )
          }
        />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Aujourd'hui", value: todayCount },
            { label: "À venir", value: upcoming.length },
            { label: "Types actifs", value: eventTypes.filter((e) => e.status === "online" || e.status === "private").length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tnum">{s.value}</p>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              <div>
                <p className="font-medium">
                  {pending.length > 1 ? `${pending.length} demandes attendent` : "Une demande attend"} votre réponse
                </p>
                <p className="text-sm text-muted-foreground">Le client reçoit la confirmation dès que vous validez.</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/appointments?tab=pending">
                Voir les demandes
                <ArrowRight />
              </Link>
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section aria-labelledby="day-title" className="min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="day-title" className="text-lg first-letter:uppercase">
                {isToday ? "Aujourd'hui" : longDate(selectedDate)}
              </h2>
              <div className="flex items-center gap-1">
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                    Aujourd&apos;hui
                  </Button>
                )}
                <Button variant="outline" size="icon-sm" onClick={() => shiftDay(-1)} aria-label="Jour précédent">
                  <ChevronLeft />
                </Button>
                <Button variant="outline" size="icon-sm" onClick={() => shiftDay(1)} aria-label="Jour suivant">
                  <ChevronRight />
                </Button>
              </div>
            </div>

            {dayAppointments.length === 0 ? (
              <EmptyState title="Aucun rendez-vous ce jour-là" />
            ) : (
              <ol className="space-y-2">
                {dayAppointments.map((apt) => {
                  const mine = isClient(apt) && !isOwner(apt);
                  return (
                    <Ticket
                      key={apt.id}
                      as="li"
                      start={apt.startTime}
                      end={apt.endTime}
                      muted={new Date(apt.endTime) < now}
                      className={isOwner(apt) ? "relative transition-colors hover:border-foreground/20" : undefined}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {isOwner(apt) ? (
                            <button
                              type="button"
                              onClick={() => setOpenId(apt.id)}
                              className="block max-w-full truncate text-left font-medium outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                            >
                              {apt.clientName}
                            </button>
                          ) : (
                            <p className="truncate font-medium">{mine ? "Votre rendez-vous" : apt.clientName}</p>
                          )}
                          <p className="truncate text-sm text-muted-foreground">{apt.eventType.name}</p>
                          {isOwner(apt) && (
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <Users className="size-3.5 shrink-0" aria-hidden="true" />
                                <span className="truncate">
                                  {apt.staff?.length ? apt.staff.map((s) => s.name).join(", ") : "Personne pour l'entretien"}
                                </span>
                              </span>
                              {apt._count?.comments ? (
                                <span className="inline-flex items-center gap-1">
                                  <MessageSquare className="size-3.5" aria-hidden="true" />
                                  {apt._count.comments}
                                </span>
                              ) : null}
                            </p>
                          )}
                        </div>
                        <StatusPill status={apt.status} />
                      </div>
                    </Ticket>
                  );
                })}
              </ol>
            )}
          </section>

          <aside className="space-y-6">
            <div className="hidden rounded-xl border p-2 lg:block">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="mx-auto"
                modifiers={{
                  hasAppointments: active.map((apt) => {
                    const date = new Date(apt.startTime);
                    date.setHours(0, 0, 0, 0);
                    return date;
                  }),
                }}
              />
            </div>

            <section aria-labelledby="next-title" className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 id="next-title" className="text-lg">À venir</h2>
                <Link href="/appointments" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                  Tout voir
                </Link>
              </div>
              {upcoming.length > 0 ? (
                <ul className="divide-y rounded-xl border">
                  {upcoming.slice(0, 5).map((apt) => {
                    const mine = isClient(apt) && !isOwner(apt);
                    const d = new Date(apt.startTime);
                    return (
                      <li key={apt.id} className="relative flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent/50">
                        <div className="min-w-0">
                          {mine ? (
                            <p className="truncate font-medium">Votre rendez-vous</p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setOpenId(apt.id)}
                              className="block max-w-full truncate text-left font-medium outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                            >
                              {apt.clientName}
                            </button>
                          )}
                          <p className="truncate text-muted-foreground">{apt.eventType.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="tnum">{formatTime(d)}</p>
                          <p className="text-xs text-muted-foreground">{d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="Rien de prévu"
                  description="Partagez le lien d'un type de rendez-vous pour recevoir des réservations."
                  action={
                    <Button asChild variant="outline" size="sm">
                      <Link href={eventTypes.length ? "/event-types" : "/event-types/new"}>
                        {eventTypes.length ? "Partager un lien" : <><Plus />Créer un type</>}
                      </Link>
                    </Button>
                  }
                />
              )}
            </section>
          </aside>
        </div>
      </div>
      {(() => {
        const apt = appointments.find((a) => a.id === openId) ?? null;
        const myEmail = session?.user?.email?.toLowerCase();
        const self = team.directory.find((m) => m.email.toLowerCase() === myEmail);
        const canAddSelf = apt && (!self || !(apt.staff ?? []).some((m) => m.id === self.id));
        return (
          <AppointmentPanel
            open={!!apt}
            onOpenChange={(o) => !o && setOpenId(null)}
            appointment={apt && { ...apt, eventTypeName: apt.eventType.name }}
            directory={team.directory}
            onAssign={apt ? (ids) => team.assign(apt.id, ids, apt.staff ?? []) : undefined}
            onAddSelf={apt && canAddSelf ? () => team.addSelf(apt.id) : undefined}
            busy={team.busyId === apt?.id}
            error={team.error}
            onCommentCount={(n) => apt && patch(apt.id, { _count: { comments: n } })}
          />
        );
      })()}
    </MainLayout>
  );
}
