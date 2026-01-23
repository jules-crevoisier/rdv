"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { Calendar, User, Mail, Phone, FileText, Trash2, Check, X, ArrowRight, Clock, MapPin, Video, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  notes?: string | null;
  location?: string | null;
  meetingType?: string;
  videoLink?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function AppointmentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [appointments, setAppointments] = useState<AppointmentFromDB[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentFromDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (sessionStatus === "loading") {
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/appointments");
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
  }, [session, sessionStatus]);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la suppression" }));
        alert(errorData.error || "Erreur lors de la suppression");
        return;
      }

      // Recharger la liste
      const refreshResponse = await fetch("/api/appointments");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Une erreur est survenue lors de la suppression");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur lors de la mise à jour" }));
        alert(errorData.error || "Erreur lors de la mise à jour");
        return;
      }

      // Recharger la liste
      const refreshResponse = await fetch("/api/appointments");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Une erreur est survenue lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "default",
      cancelled: "destructive",
      completed: "secondary",
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Terminé",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  // Distinguer les rendez-vous où l'utilisateur est propriétaire vs client
  const isOwner = (apt: AppointmentFromDB) => apt.userId === session?.user?.id;
  const isClient = (apt: AppointmentFromDB) => 
    apt.clientId === session?.user?.id || 
    apt.clientEmail === session?.user?.email;

  // Séparer les rendez-vous en deux catégories
  const myAppointments = appointments.filter((apt) => isClient(apt) && !isOwner(apt)); // Rendez-vous pris par l'utilisateur
  const receivedAppointments = appointments.filter((apt) => isOwner(apt)); // Rendez-vous reçus (créés par l'utilisateur)

  const allAppointments = appointments.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const upcomingAppointments = appointments
    .filter((a) => new Date(a.startTime) > new Date() && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const pastAppointments = appointments
    .filter((a) => new Date(a.startTime) < new Date() || a.status === "cancelled")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const pendingAppointments = appointments
    .filter((a) => a.status === "pending")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const renderAppointmentCard = (appointment: AppointmentFromDB) => {
    const userIsClient = isClient(appointment);
    const userIsOwner = isOwner(appointment);
    
    return (
    <Card 
      key={appointment.id} 
      className={`relative overflow-hidden ${
        userIsClient && !userIsOwner 
          ? "border-l-4 border-l-primary bg-primary/5" 
          : "border-l-4 border-l-muted"
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {userIsClient && !userIsOwner && (
                <Badge variant="default" className="text-xs font-semibold">
                  <ArrowRight className="mr-1 h-3 w-3" />
                  Mon rendez-vous
                </Badge>
              )}
              {userIsOwner && (
                <Badge variant="outline" className="text-xs">
                  <User className="mr-1 h-3 w-3" />
                  Rendez-vous reçu
                </Badge>
              )}
            </div>
            <CardTitle className="flex items-center gap-2">
              {userIsClient && !userIsOwner ? (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <span>Vous</span>
                </>
              ) : (
                <>
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>{appointment.clientName}</span>
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{appointment.eventType.name}</CardDescription>
          </div>
          {getStatusBadge(appointment.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDateTime(appointment.startTime)}</span>
          </div>
          {!userIsClient && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.clientEmail}</span>
              </div>
              {appointment.clientPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.clientPhone}</span>
                </div>
              )}
            </>
          )}
          {appointment.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{appointment.location}</span>
            </div>
          )}
          {appointment.meetingType === "video" && appointment.videoLink && (
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-muted-foreground" />
              <a
                href={appointment.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Lien visio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {appointment.notes && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{appointment.notes}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 w-full sm:w-auto" onClick={() => setSelectedAppointment(appointment)}>
                  Détails
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Détails du rendez-vous</DialogTitle>
                  <DialogDescription>Informations complètes sur le rendez-vous</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {userIsClient && !userIsOwner && (
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-sm font-medium text-primary">Ceci est un rendez-vous que vous avez pris</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                    <p className="text-lg font-semibold">{userIsClient && !userIsOwner ? "Vous" : appointment.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{appointment.clientEmail}</p>
                  </div>
                  {appointment.clientPhone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                      <p>{appointment.clientPhone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type de rendez-vous</p>
                    <p>{appointment.eventType.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date et heure</p>
                    <p>{formatDateTime(appointment.startTime)}</p>
                    <p className="text-sm text-muted-foreground">
                      Durée: {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </p>
                  </div>
                  {appointment.location && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                      <p className="text-sm">{appointment.location}</p>
                    </div>
                  )}
                  {appointment.meetingType === "video" && appointment.videoLink && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lien de visioconférence</p>
                      <a
                        href={appointment.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {appointment.videoLink}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {appointment.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm">{appointment.notes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Statut</p>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {/* Les actions de confirmation/annulation ne sont disponibles que pour les rendez-vous reçus */}
            {userIsOwner && appointment.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                  onClick={() => handleStatusChange(appointment.id, "confirmed")}
                  title="Confirmer"
                >
                  <Check className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Confirmer</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                  title="Annuler"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Annuler</span>
                </Button>
              </div>
            )}
            {/* Les utilisateurs peuvent supprimer leurs propres rendez-vous ou ceux qu'ils ont reçus */}
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => handleDelete(appointment.id)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Supprimer</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  if (isLoading) {
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Réservations</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez tous vos rendez-vous</p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full min-w-[600px] grid-cols-6 md:min-w-0">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Tous ({allAppointments.length})</TabsTrigger>
              <TabsTrigger value="my" className="text-xs sm:text-sm">Mes RDV ({myAppointments.length})</TabsTrigger>
              <TabsTrigger value="received" className="text-xs sm:text-sm">Reçus ({receivedAppointments.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">En attente ({pendingAppointments.length})</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs sm:text-sm">À venir ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="past" className="text-xs sm:text-sm">Passés ({pastAppointments.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            {allAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Aucun rendez-vous</h3>
                  <p className="text-center text-muted-foreground">
                    Les rendez-vous réservés apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {myAppointments.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-base sm:text-lg font-semibold text-primary">Mes rendez-vous</h2>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {myAppointments.map(renderAppointmentCard)}
                    </div>
                  </div>
                )}
                {receivedAppointments.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-base sm:text-lg font-semibold">Rendez-vous reçus</h2>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {receivedAppointments.map(renderAppointmentCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            {myAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Aucun rendez-vous pris</h3>
                  <p className="text-center text-muted-foreground">
                    Les rendez-vous que vous prenez apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {myAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {receivedAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-base sm:text-lg font-semibold">Aucun rendez-vous reçu</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    Les rendez-vous que d'autres personnes prennent avec vous apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {receivedAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous en attente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {pendingAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {upcomingAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground">Aucun rendez-vous passé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {pastAppointments.map(renderAppointmentCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
