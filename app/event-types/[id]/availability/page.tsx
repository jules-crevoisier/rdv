"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { AvailabilityForm } from "@/components/availability-form";
import type { TimeSlot } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/loading";

type DateAvailability = {
  date: string;
  available: boolean;
  timeSlots: TimeSlot[];
};

type EventTypeFromDB = {
  id: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  bufferTime: number;
  status: string;
  requiresApproval: boolean;
  availability?: {
    id: string;
    eventTypeId: string;
    timeSlots: string;
    dateOverrides: string;
  };
};

export default function AvailabilityPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const id = params.id as string;
  const [eventType, setEventType] = useState<EventTypeFromDB | null>(null);
  const [dateAvailabilities, setDateAvailabilities] = useState<DateAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/event-types/${id}`);
        
        if (!response.ok) {
          console.error("[AvailabilityPage] Erreur:", response.status);
          router.push("/event-types");
          return;
        }

        const data = await response.json();
        setEventType(data);

        // Charger les disponibilités par date
        let availabilities: DateAvailability[] = [];
        if (data.availability?.dateOverrides) {
          try {
            availabilities = JSON.parse(data.availability.dateOverrides);
          } catch (error) {
            console.error("[AvailabilityPage] Erreur lors du parsing des dateOverrides:", error);
          }
        }

        setDateAvailabilities(availabilities);
      } catch (error) {
        console.error("[AvailabilityPage] Erreur lors du chargement:", error);
        router.push("/event-types");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, session, router]);

  const handleAvailabilityChange = (availabilities: DateAvailability[]) => {
    setDateAvailabilities(availabilities);
  };

  const handleSave = async () => {
    if (!eventType) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/availability/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeSlots: [], // Plus utilisé, on utilise uniquement les dates spécifiques
          dateOverrides: dateAvailabilities,
        }),
      });


      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erreur lors de la sauvegarde" }));
        setSaveError(error.error || "Les horaires n'ont pas pu être enregistrés.");
        setIsSaving(false);
        return;
      }

      router.push("/event-types");
    } catch (error) {
      console.error("[AvailabilityPage] Erreur:", error);
      setSaveError("Les horaires n'ont pas pu être enregistrés. Vérifiez votre connexion.");
      setIsSaving(false);
    }
  };

  if (isLoading || !eventType) {
    return (
      <MainLayout>
        <PageSkeleton rows={3} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          <Link href="/event-types" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Types de rendez-vous
          </Link>
          <PageHeader
            eyebrow={eventType.name}
            title="Horaires de réservation"
            description="Choisissez les jours ouverts et leurs plages : seuls ces créneaux sont proposés aux clients."
          />
        </div>

        <AvailabilityForm
          dateOverrides={dateAvailabilities}
          onChange={handleAvailabilityChange}
        />

        {saveError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {saveError}
          </p>
        )}

        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 lg:bottom-0">
          <Button asChild type="button" variant="outline" className="flex-1 sm:flex-none">
            <Link href="/event-types">Annuler</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
            {isSaving ? "Enregistrement…" : "Enregistrer les horaires"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
