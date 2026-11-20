"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, CalendarClock, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";
import { CopyButton } from "@/components/app/copy-button";
import { StatusPill } from "@/components/app/status";
import { StaffPicker, type StaffMember } from "@/components/staff/staff-picker";
import { formatTime } from "@/lib/utils";

type Booked = {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  status: string;
  staffIds: string[];
};
type Plage = { date: string; startTime: string; endTime: string; staffIds: string[]; unavailableIds: string[]; appointments: Booked[] };
type Planning = {
  eventType: { id: string; name: string; duration: number; color: string; status: string };
  plages: Plage[];
  outside: Booked[];
};

const plageKey = (p: { date: string; startTime: string; endTime: string }) => `${p.date}|${p.startTime}|${p.endTime}`;

const dayLabel = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

export default function InterviewPlanningPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const [planning, setPlanning] = useState<Planning | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([fetch(`/api/event-types/${id}/staff`), fetch("/api/staff")]);
      if (p.ok) setPlanning(await p.json());
      if (s.ok) setStaff(await s.json());
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (session?.user) load();
  }, [session, status, load]);

  const update = async (key: string, url: string, body: object, apply: (p: Planning) => Planning) => {
    if (!planning) return;
    const previous = planning;
    setPlanning(apply(planning));
    setSaving(key);
    setError(null);
    try {
      const response = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setPlanning(previous);
        setError(data.error || "Le changement n'a pas été enregistré.");
        return;
      }
      // Une plage modifiée met à jour ses entretiens côté serveur : on recharge pour l'afficher
      if (url.endsWith("/staff") && "date" in body) load();
    } catch {
      setPlanning(previous);
      setError("Connexion perdue : le changement n'a pas été enregistré.");
    } finally {
      setSaving(null);
    }
  };

  const setPlageStaff = (plage: Plage, staffIds: string[]) =>
    update(plageKey(plage), `/api/event-types/${id}/staff`, { date: plage.date, startTime: plage.startTime, endTime: plage.endTime, staffIds }, (p) => ({
      ...p,
      plages: p.plages.map((x) => (plageKey(x) === plageKey(plage) ? { ...x, staffIds } : x)),
    }));

  const setBookedStaff = (booked: Booked, staffIds: string[]) =>
    update(booked.id, `/api/appointments/${booked.id}/staff`, { staffIds }, (p) => ({
      ...p,
      plages: p.plages.map((x) => ({ ...x, appointments: x.appointments.map((a) => (a.id === booked.id ? { ...a, staffIds } : a)) })),
      outside: p.outside.map((a) => (a.id === booked.id ? { ...a, staffIds } : a)),
    }));

  if (isLoading && status !== "unauthenticated") {
    return (
      <MainLayout>
        <PageSkeleton rows={4} />
      </MainLayout>
    );
  }

  if (!planning) {
    return (
      <MainLayout>
        <EmptyState
          title="Type de rendez-vous introuvable"
          description="Il a peut-être été supprimé."
          action={
            <Button asChild variant="outline">
              <Link href="/event-types">Revenir aux types</Link>
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const { eventType, plages, outside } = planning;
  const bookingLink = `${window.location.origin}/book/${eventType.id}`;
  const days = [...new Set(plages.map((p) => p.date))];
  const bookedCount = plages.reduce((n, p) => n + p.appointments.length, 0) + outside.length;
  const uncovered = plages.filter((p) => p.staffIds.length === 0).length;

  const bookedRow = (a: Booked, unavailableIds: string[] = []) => (
    <li key={a.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:w-72 sm:shrink-0">
        <span className="w-12 shrink-0 text-sm font-medium tnum">{formatTime(a.startTime)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{a.clientName}</p>
          <p className="truncate text-xs text-muted-foreground">{a.clientEmail}</p>
        </div>
        {a.status === "pending" && <StatusPill status="pending" className="shrink-0" />}
      </div>
      <div className="min-w-0 pl-15 sm:pl-0">
        <StaffPicker
          staff={staff}
          value={a.staffIds}
          onChange={(ids) => setBookedStaff(a, ids)}
          disabled={saving === a.id}
          unavailableIds={unavailableIds}
          label={`Responsables de l'entretien de ${a.clientName}`}
        />
      </div>
    </li>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <Link href="/event-types" className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Types de rendez-vous
        </Link>

        <PageHeader
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: eventType.color }} aria-hidden="true" />
              {eventType.name}
            </span>
          }
          title="Planning des entretiens"
          description="Placez les responsables sur chaque plage. Chaque personne qui réserve dans la plage les retrouve dans son entretien, et ils reçoivent l'invitation."
          actions={
            <>
              <CopyButton value={bookingLink} label="Copier le lien à envoyer" />
              <Button asChild variant="outline">
                <Link href={`/event-types/${eventType.id}/availability`}>
                  <CalendarClock />
                  Modifier les plages
                </Link>
              </Button>
            </>
          }
        />

        {staff.length === 0 && (
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">Ajoutez d&apos;abord les responsables (nom, email, pôle) pour pouvoir les placer.</p>
            <Button asChild size="sm">
              <Link href="/staff">
                <Users />
                Ajouter des responsables
              </Link>
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {plages.length === 0 ? (
          <EmptyState
            title="Aucune plage à venir"
            description="Ouvrez des dates et des horaires : les candidats réservent un créneau dedans avec votre lien."
            action={
              <Button asChild variant="outline">
                <Link href={`/event-types/${eventType.id}/availability`}>
                  <CalendarClock />
                  Ouvrir des plages
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card text-center sm:max-w-md">
              <div className="px-3 py-3">
                <dt className="text-xs text-muted-foreground">Plages</dt>
                <dd className="text-lg font-medium tnum">{plages.length}</dd>
              </div>
              <div className="px-3 py-3">
                <dt className="text-xs text-muted-foreground">Réservés</dt>
                <dd className="text-lg font-medium tnum">{bookedCount}</dd>
              </div>
              <div className="px-3 py-3">
                <dt className="text-xs text-muted-foreground">Sans responsable</dt>
                <dd className={`text-lg font-medium tnum ${uncovered > 0 ? "text-warning" : ""}`}>{uncovered}</dd>
              </div>
            </dl>

            <div className="space-y-8">
              {days.map((day) => (
                <section key={day} className="space-y-2" aria-labelledby={`day-${day}`}>
                  <h2 id={`day-${day}`} className="text-base font-medium first-letter:uppercase">
                    {dayLabel(day)}
                  </h2>
                  <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                    {plages
                      .filter((p) => p.date === day)
                      .map((p) => (
                        <li key={plageKey(p)} className="px-4 py-4 sm:px-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="sm:w-72 sm:shrink-0">
                              <p className="font-medium tnum">
                                {p.startTime} – {p.endTime}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.appointments.length === 0
                                  ? "Aucun entretien réservé"
                                  : `${p.appointments.length} entretien${p.appointments.length > 1 ? "s" : ""} réservé${p.appointments.length > 1 ? "s" : ""}`}
                              </p>
                            </div>
                            <StaffPicker
                              staff={staff}
                              value={p.staffIds}
                              onChange={(ids) => setPlageStaff(p, ids)}
                              disabled={saving === plageKey(p) || staff.length === 0}
                              label={`Responsables de la plage ${p.startTime} – ${p.endTime}`}
                              emptyLabel="Aucun responsable sur cette plage"
                              unavailableIds={p.unavailableIds}
                            />
                          </div>
                          {p.unavailableIds.length > 0 && (
                            <p className="mt-2 text-xs text-muted-foreground sm:pl-76">
                              <span className="text-warning">Pas disponibles :</span>{" "}
                              {staff.filter((s) => p.unavailableIds.includes(s.id)).map((s) => s.name).join(", ")}
                            </p>
                          )}
                          {p.appointments.length > 0 && (
                            <ul className="mt-3 divide-y border-t border-dashed">{p.appointments.map((a) => bookedRow(a, p.unavailableIds))}</ul>
                          )}
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}

        {outside.length > 0 && (
          <section className="space-y-2" aria-labelledby="outside">
            <h2 id="outside" className="text-base font-medium">Hors des plages actuelles</h2>
            <p className="text-sm text-muted-foreground">Ces entretiens ont été pris sur une plage modifiée depuis.</p>
            <ul className="divide-y rounded-xl border bg-card px-4 sm:px-5">{outside.map((a) => bookedRow(a))}</ul>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
