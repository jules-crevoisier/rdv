import { getAvailability, getAppointmentsByEventType } from "./db";
import { addMinutes, isSameDay } from "./utils";
import type { TimeSlot } from "./types";

type EventTypeWithDuration = {
  id: string;
  duration: number;
  bufferTime: number;
};

// Fonction pour formater une date en YYYY-MM-DD en utilisant le fuseau horaire local
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAvailableTimeSlotsForEventType = async (
  eventType: EventTypeWithDuration,
  date: Date
): Promise<string[]> => {
  const availability = await getAvailability(eventType.id);
  if (!availability) {
    console.log("[getAvailableTimeSlotsForEventType] Aucune disponibilité trouvée pour", eventType.id);
    return [];
  }

  // Vérifier les disponibilités par date spécifique
  const dateOverrides: any[] = JSON.parse(availability.dateOverrides || "[]");
  // Utiliser le format local pour éviter les problèmes de fuseau horaire
  const dateStr = formatDateLocal(date);
  console.log("[getAvailableTimeSlotsForEventType] Recherche pour la date:", dateStr);
  console.log("[getAvailableTimeSlotsForEventType] Dates disponibles:", dateOverrides.map(d => d.date));
  
  const dateAvailability = dateOverrides.find((d) => d.date === dateStr);
  
  if (dateAvailability) {
    console.log("[getAvailableTimeSlotsForEventType] Disponibilité trouvée:", {
      available: dateAvailability.available,
      timeSlotsCount: dateAvailability.timeSlots?.length || 0
    });
    
    if (!dateAvailability.available) return [];
    if (dateAvailability.timeSlots && dateAvailability.timeSlots.length > 0) {
      const slots = await generateTimeSlotsForDate(
        dateAvailability.timeSlots,
        eventType,
        date
      );
      console.log("[getAvailableTimeSlotsForEventType] Créneaux générés:", slots.length);
      return slots;
    }
    return [];
  }

  console.log("[getAvailableTimeSlotsForEventType] Aucune disponibilité trouvée pour cette date");
  // Si aucune disponibilité spécifique pour cette date, retourner vide
  return [];
};

const generateTimeSlotsForDate = async (
  timeSlots: TimeSlot[],
  eventType: EventTypeWithDuration,
  date: Date
): Promise<string[]> => {
  const slots: string[] = [];
  const existingAppointments = await getAppointmentsByEventType(eventType.id);

  // Filtrer les rendez-vous du jour
  const dayAppointments = existingAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isSameDay(aptDate, date) && apt.status !== "cancelled";
  });

  timeSlots.forEach((timeSlot) => {
    const [startHour, startMinute] = timeSlot.startTime.split(":").map(Number);
    const [endHour, endMinute] = timeSlot.endTime.split(":").map(Number);

    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    let currentTime = new Date(startTime);

    while (currentTime.getTime() + eventType.duration * 60000 <= endTime.getTime()) {
      const slotEndTime = addMinutes(currentTime, eventType.duration);
      
      // Vérifier les conflits avec les rendez-vous existants
      const hasConflict = dayAppointments.some((apt) => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return (
          (currentTime >= aptStart && currentTime < aptEnd) ||
          (slotEndTime > aptStart && slotEndTime <= aptEnd) ||
          (currentTime <= aptStart && slotEndTime >= aptEnd)
        );
      });

      if (!hasConflict) {
        slots.push(currentTime.toISOString());
      }

      currentTime = addMinutes(currentTime, eventType.duration + eventType.bufferTime);
    }
  });

  return slots;
};
