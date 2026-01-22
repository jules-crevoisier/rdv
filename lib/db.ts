import { prisma } from "./prisma";
import type { EventType, Availability, Appointment, TimeSlot } from "./types";

// Event Types
export const getEventTypes = async (userId: string) => {
  return await prisma.eventType.findMany({
    where: { userId },
    include: { availability: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getEventType = async (id: string, userId: string) => {
  return await prisma.eventType.findFirst({
    where: { id, userId },
    include: { availability: true },
  });
};

export const createEventType = async (data: {
  userId: string;
  name: string;
  description: string;
  duration: number;
  color: string;
  bufferTime: number;
  status: string;
  requiresApproval: boolean;
  dateOverrides?: Array<{ date: string; available: boolean; timeSlots: TimeSlot[] }>;
}) => {
  const eventType = await prisma.eventType.create({
    data: {
      userId: data.userId,
      name: data.name,
      description: data.description,
      duration: data.duration,
      color: data.color,
      bufferTime: data.bufferTime,
      status: data.status,
      requiresApproval: data.requiresApproval,
      availability: {
        create: {
          timeSlots: JSON.stringify([]), // Plus utilisé, on utilise uniquement les dates spécifiques
          dateOverrides: JSON.stringify(data.dateOverrides || []),
        },
      },
    },
    include: { availability: true },
  });
  return eventType;
};

export const updateEventType = async (
  id: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    duration?: number;
    color?: string;
    bufferTime?: number;
    status?: string;
    requiresApproval?: boolean;
  }
) => {
  return await prisma.eventType.updateMany({
    where: { id, userId },
    data,
  });
};

export const deleteEventType = async (id: string, userId: string) => {
  return await prisma.eventType.deleteMany({
    where: { id, userId },
  });
};

// Availabilities
export const getAvailability = async (eventTypeId: string) => {
  return await prisma.availability.findUnique({
    where: { eventTypeId },
  });
};

export const updateAvailability = async (
  eventTypeId: string,
  timeSlots: TimeSlot[],
  dateOverrides: any[] = []
) => {
  return await prisma.availability.upsert({
    where: { eventTypeId },
    update: {
      timeSlots: JSON.stringify(timeSlots),
      dateOverrides: JSON.stringify(dateOverrides),
    },
    create: {
      eventTypeId,
      timeSlots: JSON.stringify(timeSlots),
      dateOverrides: JSON.stringify(dateOverrides),
    },
  });
};

// Appointments
export const getAppointments = async (userId: string) => {
  return await prisma.appointment.findMany({
    where: { userId },
    include: { eventType: true },
    orderBy: { startTime: "desc" },
  });
};

export const getAppointment = async (id: string, userId: string) => {
  return await prisma.appointment.findFirst({
    where: { id, userId },
    include: { eventType: true },
  });
};

export const createAppointment = async (data: {
  userId: string;
  eventTypeId: string;
  startTime: Date;
  endTime: Date;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  status?: string;
}) => {
  return await prisma.appointment.create({
    data,
    include: { eventType: true },
  });
};

export const updateAppointment = async (
  id: string,
  userId: string,
  data: {
    status?: string;
    startTime?: Date;
    endTime?: Date;
  }
) => {
  return await prisma.appointment.updateMany({
    where: { id, userId },
    data,
  });
};

export const deleteAppointment = async (id: string, userId: string) => {
  return await prisma.appointment.deleteMany({
    where: { id, userId },
  });
};

export const getAppointmentsByEventType = async (eventTypeId: string) => {
  return await prisma.appointment.findMany({
    where: { eventTypeId, status: { not: "cancelled" } },
  });
};

// Public - Get event type by ID (for booking page)
// Retourne le type même s'il est archived/closed pour afficher un message approprié
export const getPublicEventType = async (id: string) => {
  return await prisma.eventType.findUnique({
    where: { id },
    include: { availability: true },
  });
};
