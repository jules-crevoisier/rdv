"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { CheckCircle, Calendar, User, Mail, Phone, MapPin, Video, ExternalLink } from "lucide-react";
import Link from "next/link";

type AppointmentData = {
  id: string;
  eventTypeId: string;
  eventType: {
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

const ConfirmationContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setError("ID de rendez-vous manquant");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/appointments/public/${appointmentId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Rendez-vous non trouvé");
          } else {
            setError("Erreur lors de la récupération du rendez-vous");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setAppointment(data);
      } catch (error) {
        console.error("Error fetching appointment:", error);
        setError("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>{error || "Rendez-vous non trouvé"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Réservation confirmée !</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {appointment.status === "pending"
                  ? "Votre demande de rendez-vous a été envoyée et est en attente d'approbation."
                  : "Votre rendez-vous a été confirmé avec succès."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start sm:items-center gap-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Date et heure</p>
                    <p className="text-base sm:text-lg font-semibold break-words">{formatDateTime(appointment.startTime)}</p>
                  </div>
                </div>

                <div className="flex items-start sm:items-center gap-3">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Type de rendez-vous</p>
                    <p className="text-base sm:text-lg font-semibold break-words">{appointment.eventType.name}</p>
                  </div>
                </div>

                <div className="flex items-start sm:items-center gap-3">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Nom</p>
                    <p className="text-base sm:text-lg font-semibold break-words">{appointment.clientName}</p>
                  </div>
                </div>

                <div className="flex items-start sm:items-center gap-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base sm:text-lg font-semibold break-words">{appointment.clientEmail}</p>
                  </div>
                </div>

                {appointment.clientPhone && (
                  <div className="flex items-start sm:items-center gap-3">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Téléphone</p>
                      <p className="text-base sm:text-lg font-semibold break-words">{appointment.clientPhone}</p>
                    </div>
                  </div>
                )}

                {appointment.location && (
                  <div className="flex items-start sm:items-center gap-3">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Lieu</p>
                      <p className="text-base sm:text-lg font-semibold break-words">{appointment.location}</p>
                    </div>
                  </div>
                )}

                {appointment.meetingType === "video" && appointment.videoLink && (
                  <div className="flex items-start sm:items-center gap-3">
                    <Video className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Lien de visioconférence</p>
                      <a
                        href={appointment.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base sm:text-lg font-semibold text-primary hover:underline break-words flex items-center gap-1"
                      >
                        {appointment.videoLink}
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Statut</p>
                  <Badge
                    variant={appointment.status === "pending" ? "outline" : "default"}
                    className="mt-1 text-xs sm:text-sm"
                  >
                    {appointment.status === "pending" ? "En attente d'approbation" : "Confirmé"}
                  </Badge>
                </div>
              </div>

              {appointment.status === "pending" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-900">
                    Votre demande de rendez-vous est en attente d'approbation. Vous recevrez une
                    confirmation par email une fois qu'elle sera approuvée.
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4 pt-4">
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">Retour à l'accueil</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
