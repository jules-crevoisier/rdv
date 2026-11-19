"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, ExternalLink, MapPin, Video } from "lucide-react";
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
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 text-center">
          <h1 className="text-3xl">{error || "Ce rendez-vous est introuvable."}</h1>
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

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="text-center enter">
        <p className="eyebrow">{pending ? "Demande envoyée" : "C'est réservé"}</p>
        <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.5rem]">
          {pending ? "Votre demande est entre de bonnes mains" : "À bientôt, " + appointment.clientName.split(" ")[0]}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          {pending
            ? `L'organisateur valide votre créneau, puis vous recevez la confirmation à ${appointment.clientEmail}.`
            : `Un récapitulatif part à ${appointment.clientEmail}.`}
        </p>
      </div>

      {/* Le billet */}
      <article className="ticket-shadow w-full max-w-md enter-2" aria-label="Récapitulatif du rendez-vous">
        <div className="ticket-lg" style={{ ["--cut" as string]: "9.5rem" }}>
          <div className="relative flex h-[9.5rem] items-end justify-between gap-4 px-7 pb-6">
            <div>
              <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground first-letter:uppercase">
                {start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="mt-1 font-mono text-[3.5rem] leading-none tracking-[-0.04em] tnum">{formatTime(start)}</p>
            </div>
            <span
              className={`stamp mb-1 inline-block rounded-md border-2 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-widest ${
                pending ? "border-warning text-warning" : "border-success text-success"
              }`}
              style={{ transform: "rotate(-8deg)" }}
            >
              {pending ? "En attente" : "Confirmé"}
            </span>
            <span className="absolute right-7 top-6 font-mono text-[0.6875rem] text-muted-foreground">
              N° {appointment.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 px-7 pb-7 pt-7 text-sm">
            <div className="col-span-2">
              <dt className="eyebrow">Rendez-vous</dt>
              <dd className="mt-1 font-display text-xl tracking-[-0.02em]">{appointment.eventType.name}</dd>
            </div>
            <div>
              <dt className="eyebrow">Durée</dt>
              <dd className="mt-1 tnum">
                {Math.round((new Date(appointment.endTime).getTime() - start.getTime()) / 60000)} min, fin à {formatTime(appointment.endTime)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Au nom de</dt>
              <dd className="mt-1 truncate">{appointment.clientName}</dd>
            </div>
            {(appointment.location || isVideo) && (
              <div className="col-span-2">
                <dt className="eyebrow">{isVideo ? "Visio" : "Lieu"}</dt>
                <dd className="mt-1 flex items-start gap-2">
                  {isVideo ? <Video className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                  {isVideo && appointment.videoLink ? (
                    <a href={appointment.videoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-primary underline-offset-4 hover:underline">
                      Rejoindre la visio
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span>{appointment.location || "Le lien arrive avec la confirmation"}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </article>

      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row enter-3">
        <Button asChild size="lg" className="flex-1">
          <a href={icsHref(appointment)} download={`rendez-vous-${appointment.id.slice(-6)}.ics`}>
            <CalendarPlus />
            Ajouter à mon agenda
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1">
          <Link href={bookAgain}>Prendre un autre créneau</Link>
        </Button>
      </div>

      <Link href="/login" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <BrandMark className="h-3.5 w-5 text-muted-foreground" />
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
