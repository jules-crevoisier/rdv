"use client";

import { useState, useEffect } from "react";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { Clock, Calendar as CalendarIcon, User, Mail, Phone, FileText, LogOut } from "lucide-react";
import Link from "next/link";

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <p>Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mes rendez-vous</h1>
            <p className="text-muted-foreground">
              Gérez vos rendez-vous réservés
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{session?.user?.name || session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">Compte client</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>

        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aucun rendez-vous</h2>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de rendez-vous réservé.
              </p>
              <Link href="/">
                <Button>Voir les types de rendez-vous disponibles</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const startDate = new Date(appointment.startTime);
              const endDate = new Date(appointment.endTime);
              const isPast = endDate < new Date();

              return (
                <Card key={appointment.id} className={isPast ? "opacity-75" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: appointment.eventType.color }}
                          />
                          <CardTitle className="text-lg">{appointment.eventType.name}</CardTitle>
                        </div>
                        <CardDescription>{appointment.eventType.description}</CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Date et heure</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(startDate)} à {formatTime(startDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Durée: {appointment.eventType.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Fin prévue</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(endDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Nom</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.clientName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.clientEmail}
                            </p>
                          </div>
                        </div>
                        {appointment.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Téléphone</p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.clientPhone}
                              </p>
                            </div>
                          </div>
                        )}
                        {appointment.notes && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Notes</p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {isPast && (
                      <div className="mt-4 rounded-md bg-muted p-2 text-center text-xs text-muted-foreground">
                        Ce rendez-vous est passé
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function ClientAppointmentsPage() {
  return (
    <SessionProvider basePath="/api/auth/client">
      <ClientAppointmentsContent />
    </SessionProvider>
  );
}
