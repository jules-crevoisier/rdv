import type { EventType, Availability, Appointment } from "./types";

const STORAGE_KEYS = {
  EVENT_TYPES: "appointlet_event_types",
  AVAILABILITIES: "appointlet_availabilities",
  APPOINTMENTS: "appointlet_appointments",
} as const;

// Event Types
export const getEventTypes = (): EventType[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.EVENT_TYPES);
  return data ? JSON.parse(data) : [];
};

export const saveEventType = (eventType: EventType): void => {
  const eventTypes = getEventTypes();
  const index = eventTypes.findIndex((et) => et.id === eventType.id);
  if (index >= 0) {
    eventTypes[index] = eventType;
  } else {
    eventTypes.push(eventType);
  }
  localStorage.setItem(STORAGE_KEYS.EVENT_TYPES, JSON.stringify(eventTypes));
};

export const deleteEventType = (id: string): void => {
  const eventTypes = getEventTypes().filter((et) => et.id !== id);
  localStorage.setItem(STORAGE_KEYS.EVENT_TYPES, JSON.stringify(eventTypes));
  // Supprimer aussi les disponibilités associées
  const availabilities = getAvailabilities().filter((a) => a.eventTypeId !== id);
  localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(availabilities));
};

// Availabilities
export const getAvailabilities = (): Availability[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.AVAILABILITIES);
  return data ? JSON.parse(data) : [];
};

export const getAvailabilityByEventType = (eventTypeId: string): Availability | null => {
  const availabilities = getAvailabilities();
  return availabilities.find((a) => a.eventTypeId === eventTypeId) || null;
};

export const saveAvailability = (availability: Availability): void => {
  const availabilities = getAvailabilities();
  const index = availabilities.findIndex((a) => a.id === availability.id);
  if (index >= 0) {
    availabilities[index] = availability;
  } else {
    availabilities.push(availability);
  }
  localStorage.setItem(STORAGE_KEYS.AVAILABILITIES, JSON.stringify(availabilities));
};

// Appointments
export const getAppointments = (): Appointment[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  return data ? JSON.parse(data) : [];
};

export const getAppointmentsByEventType = (eventTypeId: string): Appointment[] => {
  return getAppointments().filter((a) => a.eventTypeId === eventTypeId);
};

export const saveAppointment = (appointment: Appointment): void => {
  const appointments = getAppointments();
  const index = appointments.findIndex((a) => a.id === appointment.id);
  if (index >= 0) {
    appointments[index] = appointment;
  } else {
    appointments.push(appointment);
  }
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
};

export const deleteAppointment = (id: string): void => {
  const appointments = getAppointments().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
};

export const getAppointmentsByDateRange = (startDate: Date, endDate: Date): Appointment[] => {
  return getAppointments().filter((appointment) => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate >= startDate && appointmentDate <= endDate;
  });
};
