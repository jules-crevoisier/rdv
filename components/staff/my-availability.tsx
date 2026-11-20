"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Plage = { date: string; startTime: string; endTime: string; unavailable: boolean; assigned: boolean };
type EventTypePlages = { id: string; name: string; color: string; plages: Plage[] };
type Space = { staffMemberId: string; organizer: string; eventTypes: EventTypePlages[] };

const key = (p: { date: string; startTime: string; endTime: string }) => `${p.date}|${p.startTime}|${p.endTime}`;

const dayLabel = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

/**
 * Plages à venir des organisateurs qui ont ce compte comme responsable : un clic indique
 * « pas disponible » (ou l'annule). Les organisateurs le voient sur leur planning.
 */
export const MyAvailability = () => {
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/availability")
      .then((r) => (r.ok ? r.json() : { spaces: [] }))
      .then((d: { spaces: Space[] }) => setSpaces(d.spaces))
      .catch(() => setSpaces([]));
  }, []);

  if (!spaces || spaces.length === 0) return null;

  const toggle = async (space: Space, et: EventTypePlages, p: Plage) => {
    const id = `${et.id}|${key(p)}`;
    const unavailable = !p.unavailable;
    const apply = (value: boolean) =>
      setSpaces((list) =>
        list!.map((s) =>
          s.staffMemberId !== space.staffMemberId
            ? s
            : {
                ...s,
                eventTypes: s.eventTypes.map((e) =>
                  e.id !== et.id ? e : { ...e, plages: e.plages.map((x) => (key(x) === key(p) ? { ...x, unavailable: value } : x)) }
                ),
              }
        )
      );
    apply(unavailable);
    setBusy(id);
    setError(null);
    try {
      const response = await fetch("/api/me/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffMemberId: space.staffMemberId, eventTypeId: et.id, date: p.date, startTime: p.startTime, endTime: p.endTime, unavailable }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        apply(!unavailable);
        setError(data.error || "Le changement n'a pas été enregistré.");
      }
    } catch {
      apply(!unavailable);
      setError("Connexion perdue : le changement n'a pas été enregistré.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="dispo-title" className="space-y-4">
      <div>
        <h2 id="dispo-title" className="text-xl">Mes disponibilités</h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Touchez une plage où vous ne pouvez pas venir. Les organisateurs le voient sur leur planning au moment de placer les responsables.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {spaces.flatMap((space) =>
        space.eventTypes.map((et) => {
          const days = [...new Set(et.plages.map((p) => p.date))];
          const off = et.plages.filter((p) => p.unavailable).length;
          return (
            <div key={`${space.staffMemberId}-${et.id}`} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
                <p className="flex min-w-0 items-center gap-2 font-medium">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: et.color }} aria-hidden="true" />
                  <span className="truncate">{et.name}</span>
                  <span className="truncate font-normal text-muted-foreground">· {space.organizer}</span>
                </p>
                <p className="text-xs text-muted-foreground tnum">
                  {off === 0 ? "Disponible sur toutes les plages" : `Pas disponible sur ${off} plage${off > 1 ? "s" : ""}`}
                </p>
              </div>
              <ul className="divide-y">
                {days.map((day) => (
                  <li key={day} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                    <p className="text-sm font-medium first-letter:uppercase sm:w-56 sm:shrink-0">{dayLabel(day)}</p>
                    <div className="flex flex-wrap gap-2">
                      {et.plages
                        .filter((p) => p.date === day)
                        .map((p) => {
                          const id = `${et.id}|${key(p)}`;
                          return (
                            <button
                              key={id}
                              type="button"
                              aria-pressed={p.unavailable}
                              aria-label={`${p.startTime} – ${p.endTime} : ${p.unavailable ? "pas disponible" : "disponible"}`}
                              disabled={busy === id}
                              onClick={() => toggle(space, et, p)}
                              className={cn(
                                "inline-flex h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium tnum outline-none transition-[background-color,border-color,transform] active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 sm:h-9",
                                p.unavailable
                                  ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/15"
                                  : "bg-background hover:bg-accent"
                              )}
                            >
                              {p.unavailable ? <X className="size-3.5" aria-hidden="true" /> : <Check className="size-3.5 text-muted-foreground" aria-hidden="true" />}
                              <span className={cn(p.unavailable && "line-through decoration-1")}>
                                {p.startTime} – {p.endTime}
                              </span>
                              {p.assigned && <span className="text-xs font-normal text-muted-foreground">· prévu</span>}
                            </button>
                          );
                        })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
};
