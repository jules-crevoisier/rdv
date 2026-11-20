"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, MapPin, MessageSquare, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentPanel } from "@/components/appointments/appointment-panel";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status";
import { Ticket } from "@/components/app/ticket";
import { MyAvailability } from "@/components/staff/my-availability";

type Interview = {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  notes: string | null;
  location: string | null;
  meetingType: string;
  videoLink: string | null;
  status: string;
  organizer: string;
  eventType: { name: string; color: string; location: string | null };
  team: { id: string; name: string; role: string | null }[];
  commentCount: number;
};

const teamLabel = (a: Interview) => a.team.map((t) => (t.role ? `${t.name} (${t.role})` : t.name)).join(", ");

type Payload = { verified: boolean; interviews: Interview[]; loadedAt: number };

const InterviewTicket = ({ interview: a, muted, onOpen }: { interview: Interview; muted?: boolean; onOpen: () => void }) => {
  const place = a.location || a.eventType.location;
  return (
    <Ticket as="li" start={a.startTime} end={a.endTime} showDate color={a.eventType.color} muted={muted}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{a.clientName}</p>
        <StatusPill status={a.status} />
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {a.eventType.name} · organisé par {a.organizer}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        <a href={`mailto:${a.clientEmail}`} className="inline-flex min-h-6 items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <Mail className="size-3.5" aria-hidden="true" />
          {a.clientEmail}
        </a>
        {a.clientPhone && (
          <a href={`tel:${a.clientPhone}`} className="inline-flex min-h-6 items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Phone className="size-3.5" aria-hidden="true" />
            {a.clientPhone}
          </a>
        )}
        {a.meetingType === "video" && a.videoLink ? (
          <a href={a.videoLink} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline">
            <Video className="size-3.5" aria-hidden="true" />
            Rejoindre la visio
          </a>
        ) : place ? (
          <span className="inline-flex min-h-6 items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {place}
          </span>
        ) : null}
      </div>

      {a.team.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Avec {teamLabel(a)}</p>}
      {a.notes && <p className="mt-2 border-l-2 pl-3 text-sm italic text-muted-foreground">{a.notes}</p>}
      <Button variant="ghost" size="sm" className="-ml-2 mt-2 h-7 px-2 text-muted-foreground" onClick={onOpen}>
        <MessageSquare />
        {a.commentCount ? `${a.commentCount} commentaire${a.commentCount > 1 ? "s" : ""}` : "Commenter"}
      </Button>
    </Ticket>
  );
};

export default function MyInterviewsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/me/interviews")
      .then((r) => (r.ok ? r.json() : { verified: true, interviews: [] }))
      .then((d) => setData({ ...d, loadedAt: Date.now() }))
      .catch(() => setData({ verified: true, interviews: [], loadedAt: Date.now() }));
  }, [session?.user]);

  if (!data) {
    return (
      <MainLayout>
        <PageSkeleton rows={3} />
      </MainLayout>
    );
  }

  const now = data.loadedAt;
  const upcoming = data.interviews.filter((a) => new Date(a.endTime).getTime() >= now);
  const past = data.interviews.filter((a) => new Date(a.endTime).getTime() < now).reverse();

  return (
    <MainLayout>
      <div className="space-y-10">
        <PageHeader
          eyebrow={session?.user?.name || "Responsable d'entretien"}
          title="Mes entretiens"
          description={
            upcoming.length
              ? `${upcoming.length} entretien${upcoming.length > 1 ? "s" : ""} à venir où vous êtes responsable.`
              : "Les entretiens où un organisateur vous place comme responsable s'affichent ici."
          }
        />

        {!data.verified ? (
          <EmptyState
            title="Confirmez votre adresse email"
            description="Vos entretiens sont reliés à votre adresse. Ouvrez le lien de confirmation reçu par email, puis revenez ici."
          />
        ) : data.interviews.length === 0 ? (
          <>
            <EmptyState
              title="Aucun entretien pour l'instant"
              description={`Dès qu'un organisateur vous place sur un créneau avec l'adresse ${session?.user?.email ?? "de ce compte"}, l'entretien apparaît ici et vous recevez l'invitation par email.`}
            />
            <MyAvailability />
          </>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section aria-labelledby="up-title">
                <h2 id="up-title" className="mb-4 text-xl">À venir</h2>
                <ol className="space-y-3">
                  {upcoming.map((a) => (
                    <InterviewTicket key={a.id} interview={a} onOpen={() => setOpenId(a.id)} />
                  ))}
                </ol>
              </section>
            )}
            <MyAvailability />
            {past.length > 0 && (
              <section aria-labelledby="past-title">
                <h2 id="past-title" className="mb-4 text-xl text-muted-foreground">Passés</h2>
                <ol className="space-y-3">
                  {past.map((a) => (
                    <InterviewTicket key={a.id} interview={a} muted onOpen={() => setOpenId(a.id)} />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </div>

      {(() => {
        const a = data.interviews.find((i) => i.id === openId) ?? null;
        return (
          <AppointmentPanel
            open={!!a}
            onOpenChange={(o) => !o && setOpenId(null)}
            appointment={a && { ...a, eventTypeName: a.eventType.name }}
            team={a ? ["Vous", teamLabel(a)].filter(Boolean).join(", ") : undefined}
            onCommentCount={(n) =>
              a && setData((d) => d && { ...d, interviews: d.interviews.map((i) => (i.id === a.id ? { ...i, commentCount: n } : i)) })
            }
          />
        );
      })()}
    </MainLayout>
  );
}
