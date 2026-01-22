import { getAvailability, getAppointmentsByEventType } from "./db";
import { addMinutes, isSameDay } from "./utils";
import type { TimeSlot } from "./types";

type EventTypeWithDuration = {
  id: string;
  duration: number;
  bufferTime: number;
};

export const getAvailableTimeSlotsForEventType = async (
  eventType: EventTypeWithDuration,
  date: Date
): Promise<string[]> => {
  const availability = await getAvailability(eventType.id);
  if (!availability) return [];

  const timeSlots: TimeSlot[] = JSON.parse(availability.timeSlots);
  const dayOfWeek = date.getDay();
  const dayTimeSlots = timeSlots.filter((slot) => slot.day === dayOfWeek);

  if (dayTimeSlots.length === 0) return [];

  // Vérifier les overrides de date
  const dateOverrides: any[] = JSON.parse(availability.dateOverrides || "[]");
  const dateStr = date.toISOString().split("T")[0];
  const dateOverride = dateOverrides.find((d) => d.date === dateStr);
  
  if (dateOverride) {
    if (!dateOverride.available) return [];
    if (dateOverride.timeSlots && dateOverride.timeSlots.length > 0) {
      return generateTimeSlotsForDate(
        dateOverride.timeSlots,
        eventType,
        date
      );
    }
  }

  // Générer les créneaux disponibles
  return generateTimeSlotsForDate(dayTimeSlots, eventType, date);
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
