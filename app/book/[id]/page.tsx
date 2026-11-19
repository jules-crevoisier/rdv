"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "react-day-picker/locale";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { FullScreenLoader } from "@/components/app/loading";
import { BrandMark } from "@/components/app/brand";
import { Ticket } from "@/components/app/ticket";
import { cn, formatDate, formatTime, addMinutes } from "@/lib/utils";
import type { BookingFormData } from "@/lib/types";

type EventType = {
  id: string;
  name: string;
  description: string;
  duration: number;
  bufferTime: number;
  requiresApproval: boolean;
  status: string;
  color?: string;
  location?: string | null;
  meetingType?: string;
};

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const PoweredBy = () => (
  <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
    <BrandMark className="size-5 [&_svg]:size-3" />
    Réservation gérée avec Reservy
  </Link>
);

const Unavailable = ({ title, message, name }: { title: string; message: string; name?: string }) => (
  <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-muted/40 px-4 py-12">
    <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
      {name && <p className="mb-2 text-sm text-muted-foreground">{name}</p>}
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
    </div>
    <PoweredBy />
  </div>
);

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const eventTypeId = params.id as string;
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[] | null>(null);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [formData, setFormData] = useState<BookingFormData>({ name: "", email: "", phone: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const response = await fetch(`/api/event-types/public/${eventTypeId}`);
        setEventType(response.ok ? await response.json() : null);
      } catch {
        setEventType(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventType();
  }, [eventTypeId]);

  // Toutes les dates ayant au moins un créneau ; on pré-sélectionne la première
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!eventType) return;
      try {
        const response = await fetch(`/api/availability/${eventTypeId}/dates`);
        if (response.ok) {
          const data = await response.json();
          const dates: string[] = data.dates || [];
          setAvailableDates(dates);
          if (dates.length > 0) {
            const [y, m, d] = dates[0].split("-").map(Number);
            setSelectedDate(new Date(y, m - 1, d));
            setMonth(new Date(y, m - 1, 1));
          }
        } else {
          setAvailableDates([]);
        }
      } catch (error) {
        console.error("Error fetching available dates:", error);
        setAvailableDates([]);
      }
    };
    fetchAvailableDates();
  }, [eventType, eventTypeId]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!eventType || !selectedDate) return;
      setSlotsLoading(true);
      try {
        const response = await fetch(`/api/availability/${eventTypeId}?date=${toKey(selectedDate)}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots);
          setSelectedTimeSlot(null);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [eventType, selectedDate, eventTypeId]);

  const groupedSlots = useMemo(() => {
    const groups: { label: string; slots: string[] }[] = [
      { label: "Matin", slots: [] },
      { label: "Après-midi", slots: [] },
      { label: "Soir", slots: [] },
    ];
    availableSlots.forEach((slot) => {
      const h = new Date(slot).getHours();
      groups[h < 12 ? 0 : h < 18 ? 1 : 2].slots.push(slot);
    });
    return groups.filter((g) => g.slots.length > 0);
  }, [availableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedTimeSlot || !eventType) {
      setStep("pick");
      return;
    }

    setIsSubmitting(true);
    try {
      const startTime = new Date(selectedTimeSlot);
      const endTime = addMinutes(startTime, eventType.duration);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSubmitError(errorData.error || "La réservation n'a pas abouti. Choisissez un autre créneau ou réessayez.");
        setIsSubmitting(false);
        return;
      }

      const appointment = await response.json();
      if (!appointment?.id) {
        setSubmitError("La réservation n'a pas abouti. Réessayez dans un instant.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/book/${eventTypeId}/confirmation?appointmentId=${appointment.id}`);
    } catch (error) {
      console.error("Error creating appointment:", error);
      setSubmitError("Connexion perdue pendant l'envoi. Vérifiez votre réseau et réessayez.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <FullScreenLoader />;

  if (!eventType) {
    return (
      <Unavailable
        title="Ce lien ne mène nulle part"
        message="Le type de rendez-vous n'existe pas ou a été supprimé. Demandez un nouveau lien à la personne qui vous l'a envoyé."
      />
    );
  }

  if (eventType.status !== "online" && eventType.status !== "private") {
    return (
      <Unavailable
        name={eventType.name}
        title={eventType.status === "archived" ? "Ce rendez-vous n'est plus proposé" : "Les réservations sont fermées"}
        message={
          eventType.status === "archived"
            ? "Il a été archivé par l'organisateur. Contactez-le pour convenir d'un autre créneau."
            : "L'organisateur a suspendu les réservations pour le moment. Revenez plus tard ou contactez-le."
        }
      />
    );
  }

  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || !(availableDates ?? []).includes(format(date, "yyyy-MM-dd"));
  };

  const isVideo = eventType.meetingType === "video";

  return (
    <div className="flex min-h-dvh flex-col items-center bg-muted/40 px-3 py-4 sm:px-6 sm:py-10 lg:justify-center">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-sm lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Le rendez-vous */}
        <aside className="border-b p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: eventType.color || "var(--primary)" }} aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Prendre rendez-vous</p>
          </div>
          <h1 className="mt-2 text-2xl">{eventType.name}</h1>
          {eventType.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{eventType.description}</p>}

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Clock className="size-4 text-muted-foreground" />
              <span className="tnum">{eventType.duration} minutes</span>
            </li>
            <li className="flex items-center gap-3">
              {isVideo ? <Video className="size-4 text-muted-foreground" /> : <MapPin className="size-4 text-muted-foreground" />}
              <span>{isVideo ? "En visio, le lien arrive avec la confirmation" : eventType.location || "En présentiel"}</span>
            </li>
            {eventType.requiresApproval && (
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-muted-foreground" />
                <span>Validé par l&apos;organisateur après votre demande</span>
              </li>
            )}
          </ul>

          {selectedTimeSlot && step === "details" && (
            <div className="mt-8 space-y-2">
              <p className="text-sm font-medium">Votre créneau</p>
              <Ticket start={selectedTimeSlot} end={addMinutes(new Date(selectedTimeSlot), eventType.duration)}>
                <p className="text-sm font-medium first-letter:uppercase">{formatDate(selectedTimeSlot)}</p>
                <button type="button" onClick={() => setStep("pick")} className="mt-0.5 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Changer de créneau
                </button>
              </Ticket>
            </div>
          )}
        </aside>

        {/* Étape 1 : jour et heure */}
        {step === "pick" && (
          <section className="p-4 sm:p-8" aria-labelledby="pick-title">
            <h2 id="pick-title" className="text-lg">Choisissez un jour et une heure</h2>

            {availableDates !== null && availableDates.length === 0 ? (
              <p className="mt-6 rounded-lg bg-muted p-5 text-sm text-muted-foreground">
                Aucun créneau n&apos;est ouvert pour l&apos;instant. Revenez bientôt ou contactez l&apos;organisateur.
              </p>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedTimeSlot(null);
                  }}
                  month={month}
                  onMonthChange={setMonth}
                  disabled={disabledDates}
                  locale={fr}
                  weekStartsOn={1}
                  modifiers={{
                    hasSlots: (availableDates ?? []).map((s) => {
                      const [y, m, d] = s.split("-").map(Number);
                      return new Date(y, m - 1, d);
                    }),
                  }}
                  className="mx-auto md:mx-0"
                />

                <div className="min-w-0 md:max-h-[26rem] md:overflow-y-auto md:pr-1">
                  {selectedDate ? (
                    <>
                      <p className="mb-3 text-sm font-medium first-letter:uppercase">{formatDate(selectedDate)}</p>
                      {slotsLoading ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                          ))}
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Plus de créneau libre ce jour-là. Essayez un autre jour en gras.</p>
                      ) : (
                        <div className="space-y-5">
                          {groupedSlots.map((group) => (
                            <fieldset key={group.label}>
                              <legend className="mb-2 text-xs font-medium text-muted-foreground">{group.label}</legend>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-3">
                                {group.slots.map((slot) => {
                                  const isSelected = selectedTimeSlot === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => setSelectedTimeSlot(slot)}
                                      aria-pressed={isSelected}
                                      className={cn(
                                        "h-10 rounded-md border text-sm font-medium tnum outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[.98]",
                                        isSelected
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "bg-background shadow-xs hover:border-foreground/40"
                                      )}
                                    >
                                      {formatTime(slot)}
                                    </button>
                                  );
                                })}
                              </div>
                            </fieldset>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Choisissez un jour en gras dans le calendrier.</p>
                  )}
                </div>
              </div>
            )}

            {/* Barre d'action : collée en bas sur mobile */}
            <div className="sticky bottom-0 -mx-4 mt-6 flex items-center justify-between gap-3 border-t bg-card/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <p className="min-w-0 truncate text-sm text-muted-foreground">
                {selectedTimeSlot ? (
                  <>
                    <span className="font-medium text-foreground tnum">{formatTime(selectedTimeSlot)}</span>
                    <span className="hidden sm:inline">, {formatDate(selectedTimeSlot)}</span>
                  </>
                ) : (
                  "Aucun créneau choisi"
                )}
              </p>
              <Button disabled={!selectedTimeSlot} onClick={() => setStep("details")}>
                Continuer
                <ArrowRight />
              </Button>
            </div>
          </section>
        )}

        {/* Étape 2 : coordonnées */}
        {step === "details" && selectedTimeSlot && (
          <section className="p-4 sm:p-8" aria-labelledby="details-title">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Retour au calendrier
            </button>
            <h2 id="details-title" className="text-lg">Vos coordonnées</h2>
            <p className="mt-1 text-sm text-muted-foreground">La confirmation part à cette adresse e-mail.</p>

            <form onSubmit={handleSubmit} className="mt-6 grid max-w-xl gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nom et prénom</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">
                  Un mot pour l&apos;organisateur <span className="font-normal text-muted-foreground">(facultatif)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {submitError && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive sm:col-span-2">
                  {submitError}
                </p>
              )}

              <div className="sm:col-span-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Envoi en cours…"
                    : eventType.requiresApproval
                      ? "Envoyer ma demande"
                      : "Réserver ce créneau"}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:gap-4">
        <PoweredBy />
        <span className="hidden sm:inline" aria-hidden="true">·</span>
        <span>
          Déjà client ?{" "}
          <Link href="/client/login" className="text-foreground underline underline-offset-4">
            Retrouvez vos rendez-vous
          </Link>
        </span>
      </div>
    </div>
  );
}
