"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullScreenLoader } from "@/components/app/loading";
import { BrandMark } from "@/components/app/brand";
import { formatTime } from "@/lib/utils";

type AppointmentData = {
  id: string;
  eventTypeId: string;
  eventType: {
    name: string;
    description?: string;
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

/* Fichier .ics généré dans le navigateur : « Ajouter à mon agenda » fonctionne partout. */
const icsHref = (a: AppointmentData) => {
  const stamp = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reservy//FR",
    "BEGIN:VEVENT",
    `UID:${a.id}@reservy`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(a.startTime)}`,
    `DTEND:${stamp(a.endTime)}`,
    `SUMMARY:${esc(a.eventType.name)}`,
    a.location ? `LOCATION:${esc(a.location)}` : "",
    a.videoLink ? `URL:${a.videoLink}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
};

const ConfirmationContent = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const appointmentId = searchParams.get("appointmentId");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setError("Ce lien de confirmation est incomplet.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/appointments/public/${appointmentId}`);
        if (!response.ok) {
          setError(response.status === 404 ? "Ce rendez-vous est introuvable." : "Le rendez-vous n'a pas pu être chargé.");
          return;
        }
        setAppointment(await response.json());
      } catch (error) {
        console.error("Error fetching appointment:", error);
        setError("Le rendez-vous n'a pas pu être chargé.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointment();
  }, [appointmentId]);

  if (isLoading) return <FullScreenLoader />;

  const bookAgain = `/book/${params.id as string}`;

  if (error || !appointment) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl">{error || "Ce rendez-vous est introuvable."}</h1>
          <Button asChild variant="outline" className="mt-6">
            <Link href={bookAgain}>Revenir au calendrier</Link>
          </Button>
        </div>
      </div>
    );
  }

  const start = new Date(appointment.startTime);
  const pending = appointment.status === "pending";
  const isVideo = appointment.meetingType === "video";
  const minutes = Math.round((new Date(appointment.endTime).getTime() - start.getTime()) / 60000);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm enter sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span
            className={`grid size-12 place-items-center rounded-full ${pending ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}
            aria-hidden="true"
          >
            {pending ? <Clock className="size-6" /> : <CheckCircle2 className="size-6" />}
          </span>
          <h1 className="mt-4 text-2xl">{pending ? "Demande envoyée" : "Rendez-vous confirmé"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending
              ? `L'organisateur valide votre créneau, puis la confirmation part à ${appointment.clientEmail}.`
              : `Un récapitulatif part à ${appointment.clientEmail}.`}
          </p>
        </div>

        <dl className="mt-6 divide-y rounded-lg border text-sm">
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">Rendez-vous</dt>
            <dd className="text-right font-medium">{appointment.eventType.name}</dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-right first-letter:uppercase">
              {start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">Heure</dt>
            <dd className="text-right tnum">
              {formatTime(start)} – {formatTime(appointment.endTime)} ({minutes} min)
            </dd>
          </div>
          {(appointment.location || isVideo) && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">{isVideo ? "Visio" : "Lieu"}</dt>
              <dd className="text-right">
                {isVideo && appointment.videoLink ? (
                  <a href={appointment.videoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                    Rejoindre
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  appointment.location || "Lien envoyé avec la confirmation"
                )}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-muted-foreground">Au nom de</dt>
            <dd className="text-right">{appointment.clientName}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <a href={icsHref(appointment)} download={`rendez-vous-${appointment.id.slice(-6)}.ics`}>
              <CalendarPlus />
              Ajouter à mon agenda
            </a>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={bookAgain}>Autre créneau</Link>
          </Button>
        </div>
      </div>

      <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <BrandMark className="size-5 [&_svg]:size-3" />
        Réservation gérée avec Reservy
      </Link>
    </div>
  );
};

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ConfirmationContent />
    </Suspense>
  );
}
