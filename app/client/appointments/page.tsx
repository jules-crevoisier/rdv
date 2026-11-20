"use client";

import { useState, useEffect } from "react";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/app/brand";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status";
import { Ticket } from "@/components/app/ticket";
import { ThemeToggle } from "@/components/theme-toggle";

type AppointmentFromDB = {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  eventType: {
    id: string;
    name: string;
    description: string;
    duration: number;
    color: string;
  };
};

const ClientShell = ({ children, onSignOut, signedIn }: { children: React.ReactNode; onSignOut: () => void; signedIn: boolean }) => (
  <div className="min-h-dvh">
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand href="/client/appointments" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {signedIn && (
            <Button variant="ghost" onClick={onSignOut}>
              <LogOut />
              <span className="hidden sm:inline">Se déconnecter</span>
            </Button>
          )}
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
  </div>
);


function ClientAppointmentsContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session?.user) {
      router.push("/client/login");
      return;
    }

    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/client/appointments");
        if (!response.ok) {
          console.error("Error fetching appointments:", response.status);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [session, sessionStatus, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <ClientShell onSignOut={handleSignOut} signedIn={!!session?.user}>
        <PageSkeleton rows={3} />
      </ClientShell>
    );
  }

  const now = new Date();
  const upcoming = appointments
    .filter((a) => new Date(a.endTime) >= now && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const past = appointments
    .filter((a) => new Date(a.endTime) < now || a.status === "cancelled")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const renderList = (list: AppointmentFromDB[], muted = false) => (
    <ol className="space-y-3">
      {list.map((a) => (
        <Ticket key={a.id} as="li" start={a.startTime} end={a.endTime} showDate color={a.eventType.color} muted={muted}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{a.eventType.name}</p>
            <StatusPill status={a.status} />
          </div>
          {a.eventType.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.eventType.description}</p>}
          {a.notes && <p className="mt-2 border-l-2 pl-3 text-sm italic text-muted-foreground">{a.notes}</p>}
        </Ticket>
      ))}
    </ol>
  );

  return (
    <ClientShell onSignOut={handleSignOut} signedIn={!!session?.user}>
      <div className="space-y-10">
        <PageHeader
          eyebrow={session?.user?.name || session?.user?.email || "Compte client"}
          title="Mes rendez-vous"
          description={
            upcoming.length
              ? `${upcoming.length} rendez-vous à venir. Gardez ce billet : il contient l'heure et le lieu.`
              : "Aucun rendez-vous à venir."
          }
        />

        {appointments.length === 0 ? (
          <EmptyState
            title="Pas encore de rendez-vous"
            description="Réservez depuis le lien que vous a envoyé votre praticien ou votre prestataire : le rendez-vous s'affichera ici."
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <section aria-labelledby="up-title" className="">
                <h2 id="up-title" className="mb-4 text-xl">À venir</h2>
                {renderList(upcoming)}
              </section>
            )}
            {past.length > 0 && (
              <section aria-labelledby="past-title">
                <h2 id="past-title" className="mb-4 text-xl text-muted-foreground">Historique</h2>
                {renderList(past, true)}
              </section>
            )}
          </>
        )}
      </div>
    </ClientShell>
  );
}

export default function ClientAppointmentsPage() {
  return (
    <SessionProvider basePath="/api/auth/client">
      <ClientAppointmentsContent />
    </SessionProvider>
  );
}
