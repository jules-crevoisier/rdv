export type EventType = {
  id: string;
  name: string;
  description: string;
  duration: number; // en minutes
  color: string;
  bufferTime: number; // en minutes
  status: "online" | "private" | "archived" | "closed";
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TimeSlot = {
  day: number; // 0 = dimanche, 1 = lundi, etc.
  startTime: string; // format HH:mm
  endTime: string; // format HH:mm
};

export type Availability = {
  id: string;
  eventTypeId: string;
  timeSlots: TimeSlot[];
  dateOverrides: {
    date: string; // format YYYY-MM-DD
    available: boolean;
    timeSlots?: TimeSlot[];
  }[];
};

export type Appointment = {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
};

export type BookingFormData = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
};
