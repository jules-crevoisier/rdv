"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, CalendarSync, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
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
import { cn, formatTime, isSameDay } from "@/lib/utils";

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
  status: string;
};

const HOUR = 64; // hauteur d'une heure sur la règle, en px

const longDate = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [eventTypes, setEventTypes] = useState<EventTypeFromDB[]>([]);
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [icalUrl, setIcalUrl] = useState<string>("");
  const [icalNote, setIcalNote] = useState<string>("");
  const [now, setNow] = useState<Date>(new Date());

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

  const isOwner = (apt: AppointmentFromDB) => apt.userId === session?.user?.id;
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

  // Plage horaire de la règle : 8 h à 19 h, élargie pour inclure chaque rendez-vous du jour
  const startHour = Math.min(8, ...dayAppointments.map((a) => new Date(a.startTime).getHours()));
  const endHour = Math.max(19, ...dayAppointments.map((a) => Math.ceil(new Date(a.endTime).getHours() + new Date(a.endTime).getMinutes() / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const minutesFromStart = (d: Date) => (d.getHours() - startHour) * 60 + d.getMinutes();
  const isToday = isSameDay(selectedDate, now);
  const nowOffset = (minutesFromStart(now) / 60) * HOUR;
  const showNow = isToday && now.getHours() >= startHour && now.getHours() < endHour;

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
      <div className="space-y-8">
        <PageHeader
          eyebrow={longDate(now)}
          title={firstName ? `Bonjour ${firstName}` : "Votre journée"}
          description={summary}
          actions={
            <>
              {session?.user?.id && (
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
                        Abonnez Google Agenda, Outlook ou Calendrier à ce lien : vos rendez-vous y apparaissent tout seuls.
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
                    <ol className="space-y-2 rounded-xl bg-secondary p-4 text-sm">
                      <li><span className="font-medium">Google Agenda</span> <span className="text-muted-foreground">: Autres agendas, +, À partir de l&apos;URL</span></li>
                      <li><span className="font-medium">Outlook</span> <span className="text-muted-foreground">: Ajouter un calendrier, S&apos;abonner à partir du web</span></li>
                      <li><span className="font-medium">Calendrier (Apple)</span> <span className="text-muted-foreground">: Fichier, Nouvel abonnement</span></li>
                    </ol>
                  </DialogContent>
                </Dialog>
              )}
            </>
          }
        />

        {/* Chiffres du jour */}
        <dl className="grid grid-cols-3 divide-x rounded-2xl border bg-card enter-2">
          {[
            { label: "Aujourd'hui", value: todayCount },
            { label: "À venir", value: upcoming.length },
            { label: "Types actifs", value: eventTypes.filter((e) => e.status === "online" || e.status === "private").length },
          ].map((s) => (
            <div key={s.label} className="px-4 py-4 sm:px-6">
              <dt className="eyebrow">{s.label}</dt>
              <dd className="mt-1 font-display text-3xl tnum tracking-[-0.03em] sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        {pending.length > 0 && (
          <div className="flex flex-col gap-4 rounded-2xl bg-ink p-5 text-ink-foreground sm:flex-row sm:items-center sm:justify-between enter-2">
            <div className="flex items-center gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-mono text-sm text-primary-foreground tnum">
                {pending.length}
              </span>
              <div>
                <p className="font-medium">
                  {pending.length > 1 ? `${pending.length} demandes attendent` : "Une demande attend"} votre réponse
                </p>
                <p className="text-sm opacity-70">Le client reçoit la confirmation dès que vous validez.</p>
              </div>
            </div>
            <Button asChild variant="secondary" className="bg-ink-foreground text-ink hover:bg-ink-foreground/90">
              <Link href="/appointments?tab=pending">
                Répondre aux demandes
                <ArrowRight />
              </Link>
            </Button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* La règle du jour */}
          <section aria-labelledby="day-title" className="min-w-0 enter-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="day-title" className="text-2xl first-letter:uppercase">
                {isToday ? "Aujourd'hui" : longDate(selectedDate)}
              </h2>
              <div className="flex items-center gap-1">
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
                    Revenir à aujourd&apos;hui
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={() => shiftDay(-1)} aria-label="Jour précédent">
                  <ChevronLeft />
                </Button>
                <Button variant="outline" size="icon" onClick={() => shiftDay(1)} aria-label="Jour suivant">
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-3 sm:p-4">
              <div className="relative grid grid-cols-[3rem_1fr]">
                <div aria-hidden="true">
                  {hours.map((h) => (
                    <div key={h} className="font-mono text-[0.6875rem] text-muted-foreground tnum" style={{ height: HOUR }}>
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
                <ol className="ruler relative" style={{ ["--hour" as string]: `${HOUR}px`, height: hours.length * HOUR }}>
                  {dayAppointments.map((apt) => {
                    const s = new Date(apt.startTime);
                    const e = new Date(apt.endTime);
                    const top = (minutesFromStart(s) / 60) * HOUR;
                    const height = Math.max(((e.getTime() - s.getTime()) / 3600000) * HOUR - 4, 44);
                    const mine = isClient(apt) && !isOwner(apt);
                    const past = e < now;
                    return (
                      <li key={apt.id} className="absolute inset-x-1 sm:inset-x-2" style={{ top: top + 2, height }}>
                        <Link
                          href="/appointments"
                          className={cn(
                            "lift flex h-full items-start justify-between gap-3 overflow-hidden rounded-lg border border-l-[3px] px-3 py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                            mine ? "border-l-foreground bg-secondary" : "border-l-primary bg-accent/70",
                            past && "opacity-55"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block font-mono text-[0.6875rem] text-muted-foreground tnum">
                              {formatTime(s)} – {formatTime(e)}
                            </span>
                            <span className="block truncate text-sm font-medium">{mine ? "Votre rendez-vous" : apt.clientName}</span>
                            <span className="block truncate text-xs text-muted-foreground">{apt.eventType.name}</span>
                          </span>
                          {apt.status === "pending" && <StatusPill status="pending" className="hidden sm:inline-flex" />}
                        </Link>
                      </li>
                    );
                  })}
                  {showNow && (
                    <li className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowOffset }} aria-label={`Maintenant, ${formatTime(now)}`}>
                      <span className="now-dot -ml-1 size-2 rounded-full bg-primary" />
                      <span className="h-px flex-1 bg-primary" />
                      <span className="ml-1 rounded bg-primary px-1.5 py-0.5 font-mono text-[0.625rem] text-primary-foreground tnum">{formatTime(now)}</span>
                    </li>
                  )}
                </ol>
                {dayAppointments.length === 0 && (
                  <p className="pointer-events-none absolute inset-x-0 top-1/2 ml-12 -translate-y-1/2 text-center text-sm text-muted-foreground">
                    Journée libre
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="order-first space-y-8 lg:order-none">
            <div className="hidden rounded-2xl border bg-card p-3 lg:block">
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

            <section aria-labelledby="next-title">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 id="next-title" className="text-xl">À venir</h2>
                <Link href="/appointments" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Tout voir
                </Link>
              </div>
              {upcoming.length > 0 ? (
                <ol className="space-y-2.5">
                  {upcoming.slice(0, 5).map((apt) => {
                    const mine = isClient(apt) && !isOwner(apt);
                    return (
                      <Ticket key={apt.id} as="li" start={apt.startTime} showDate>
                        <p className="truncate text-sm font-medium">{mine ? "Votre rendez-vous" : apt.clientName}</p>
                        <p className="truncate text-xs text-muted-foreground">{apt.eventType.name}</p>
                        {apt.status === "pending" && <StatusPill status="pending" className="mt-1.5" />}
                      </Ticket>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState
                  title="Rien de prévu"
                  description="Partagez le lien d'un type de rendez-vous pour recevoir vos premières réservations."
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
    </MainLayout>
  );
}
