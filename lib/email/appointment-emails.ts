import { getAppUrl } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "./client";
import { STAFF_HOME } from "./staff-emails";
import { appointmentIcs } from "./ics";
import {
  bookingCancelledTemplate,
  bookingConfirmedTemplate,
  bookingReceivedTemplate,
  bookingReminderTemplate,
  bookingRescheduledTemplate,
  newBookingForProTemplate,
  staffCancelledTemplate,
  staffInvitedTemplate,
  staffRescheduledTemplate,
  type AppointmentForEmail,
} from "./templates";

// Notifications de rendez-vous. Toutes ces fonctions avalent leurs erreurs :
// elles tournent après la réponse HTTP (via `after`) et ne doivent rien casser.

const load = (id: string) =>
  prisma.appointment.findUnique({
    where: { id },
    include: {
      eventType: { select: { id: true, name: true, duration: true } },
      user: { select: { name: true, email: true } },
      staff: { select: { id: true, name: true, email: true }, orderBy: { name: "asc" } },
    },
  });

type Loaded = NonNullable<Awaited<ReturnType<typeof load>>>;

const urls = (a: Loaded, request?: Request) => {
  const base = getAppUrl(request);
  return {
    manage: `${base}/book/${a.eventType.id}/confirmation?appointmentId=${a.id}`,
    rebook: `${base}/book/${a.eventType.id}`,
    dashboard: `${base}/appointments`,
    staff: `${base}${STAFF_HOME}`,
  };
};

const safe = async (label: string, fn: () => Promise<unknown>) => {
  try {
    await fn();
  } catch (error) {
    console.error(`[email] ${label} :`, error);
  }
};

/** Nouvelle réservation : un email au client, un au pro. */
export const notifyAppointmentCreated = (appointmentId: string, request?: Request) =>
  safe("réservation", async () => {
    const a = await load(appointmentId);
    if (!a) return;
    const u = urls(a, request);
    const client = bookingReceivedTemplate(a, { manageUrl: u.manage });
    const pro = newBookingForProTemplate(a, { dashboardUrl: u.dashboard });
    await Promise.all([
      sendEmail({
        to: a.clientEmail,
        ...client,
        replyTo: a.user.email,
        attachments: a.status === "confirmed" ? [appointmentIcs(a)] : undefined,
        idempotencyKey: `booking-client/${a.id}`,
        tags: [{ name: "category", value: "booking_received" }],
      }),
      sendEmail({
        to: a.user.email,
        ...pro,
        replyTo: a.clientEmail,
        attachments: [appointmentIcs(a)],
        idempotencyKey: `booking-pro/${a.id}`,
        tags: [{ name: "category", value: "booking_new" }],
      }),
      // Les responsables ne sont invités qu'une fois le créneau confirmé
      ...(a.status === "confirmed" ? a.staff.map((s) => sendStaffInvite(a, s, request)) : []),
    ]);
  });

const staffSummary = (a: AppointmentForEmail) => `${a.eventType.name} : ${a.clientName}`;

const staffUrl = (request?: Request) => `${getAppUrl(request)}${STAFF_HOME}`;

const sendStaffInvite = (a: Loaded, s: { id: string; name: string; email: string }, request?: Request) =>
  sendEmail({
    to: s.email,
    replyTo: a.user.email,
    ...staffInvitedTemplate(a, { staffName: s.name, url: staffUrl(request) }),
    attachments: [appointmentIcs(a, { summary: staffSummary(a) })],
    idempotencyKey: `staff-invite/${a.id}/${s.id}/${a.startTime.getTime()}`,
    tags: [{ name: "category", value: "staff_invited" }],
  });

const sendStaffCancel = (
  a: AppointmentForEmail,
  s: { name: string; email: string },
  reason: "cancelled" | "removed",
  request?: Request
) =>
  sendEmail({
    to: s.email,
    replyTo: a.user.email,
    ...staffCancelledTemplate(a, { staffName: s.name, reason, url: staffUrl(request) }),
    attachments: [appointmentIcs(a, { cancelled: true, summary: staffSummary(a) })],
    tags: [{ name: "category", value: "staff_cancelled" }],
  });

/** L'organisateur change les responsables d'un rendez-vous : invitation aux nouveaux, annulation aux retirés. */
export const notifyStaffChanged = (
  appointmentId: string,
  change: { added: string[]; removed: { name: string; email: string }[] }
) =>
  safe("responsables", async () => {
    const a = await load(appointmentId);
    if (!a || a.status !== "confirmed" || a.startTime < new Date()) return;
    await Promise.all([
      ...a.staff.filter((s) => change.added.includes(s.id)).map((s) => sendStaffInvite(a, s)),
      ...change.removed.map((s) => sendStaffCancel(a, s, "removed")),
    ]);
  });

/** Changement fait par le pro : confirmation, annulation ou nouvel horaire. */
export const notifyAppointmentUpdated = (
  appointmentId: string,
  previous: { status: string; startTime: Date },
  request?: Request
) =>
  safe("mise à jour", async () => {
    const a = await load(appointmentId);
    if (!a) return;
    const u = urls(a, request);
    const base = { to: a.clientEmail, replyTo: a.user.email };

    if (a.status === "cancelled" && previous.status !== "cancelled") {
      if (a.startTime < new Date()) return; // inutile de prévenir pour un créneau passé
      const t = bookingCancelledTemplate(a, { audience: "client", rebookUrl: u.rebook });
      await Promise.all([
        sendEmail({ ...base, ...t, attachments: [appointmentIcs(a, { cancelled: true })], tags: [{ name: "category", value: "booking_cancelled" }] }),
        ...a.staff.map((s) => sendStaffCancel(a, s, "cancelled", request)),
      ]);
      return;
    }
    if (a.status === "cancelled" || a.status === "completed") return;

    if (a.startTime.getTime() !== previous.startTime.getTime()) {
      const t = bookingRescheduledTemplate(a, { previousStart: previous.startTime, manageUrl: u.manage });
      await prisma.appointment.update({ where: { id: a.id }, data: { reminderSentAt: null } });
      await Promise.all([
        sendEmail({ ...base, ...t, attachments: [appointmentIcs(a)], tags: [{ name: "category", value: "booking_rescheduled" }] }),
        ...a.staff.map((s) =>
          sendEmail({
            to: s.email,
            replyTo: a.user.email,
            ...staffRescheduledTemplate(a, { staffName: s.name, previousStart: previous.startTime, url: u.staff }),
            attachments: [appointmentIcs(a, { summary: staffSummary(a) })],
            tags: [{ name: "category", value: "staff_rescheduled" }],
          })
        ),
      ]);
      return;
    }

    if (a.status === "confirmed" && previous.status === "pending") {
      const t = bookingConfirmedTemplate(a, { manageUrl: u.manage });
      await Promise.all([
        sendEmail({ ...base, ...t, attachments: [appointmentIcs(a)], tags: [{ name: "category", value: "booking_confirmed" }] }),
        ...a.staff.map((s) => sendStaffInvite(a, s, request)),
      ]);
    }
  });

/** Suppression d'un rendez-vous à venir : on prévient l'autre partie. */
export const notifyAppointmentDeleted = (
  snapshot: AppointmentForEmail & { eventType: { id: string; name: string; duration: number }; staff?: { name: string; email: string }[] },
  deletedBy: "pro" | "client",
  request?: Request
) =>
  safe("suppression", async () => {
    if (snapshot.status === "cancelled" || snapshot.startTime < new Date()) return;
    const base = getAppUrl(request);
    const audience = deletedBy === "pro" ? "client" : "pro";
    const t = bookingCancelledTemplate(snapshot, {
      audience,
      rebookUrl: audience === "client" ? `${base}/book/${snapshot.eventType.id}` : `${base}/appointments`,
    });
    await Promise.all([
      sendEmail({
        to: audience === "client" ? snapshot.clientEmail : snapshot.user.email,
        replyTo: audience === "client" ? snapshot.user.email : snapshot.clientEmail,
        ...t,
        attachments: [appointmentIcs(snapshot, { cancelled: true })],
        tags: [{ name: "category", value: "booking_cancelled" }],
      }),
      ...(snapshot.staff ?? []).map((s) => sendStaffCancel(snapshot, s, "cancelled", request)),
    ]);
  });

/**
 * Rappels J-1 : rendez-vous confirmés qui commencent dans les 24 prochaines heures
 * et n'ont pas encore reçu de rappel. À appeler régulièrement (voir /api/cron/reminders).
 */
export const sendDueReminders = async (request?: Request) => {
  const now = new Date();
  const due = await prisma.appointment.findMany({
    where: {
      status: "confirmed",
      reminderSentAt: null,
      startTime: { gt: new Date(now.getTime() + 60 * 60 * 1000), lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      // Pas de rappel pour un rendez-vous pris moins de 12 h avant
      createdAt: { lt: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
    },
    include: {
      eventType: { select: { id: true, name: true, duration: true } },
      user: { select: { name: true, email: true } },
      staff: { select: { id: true, name: true, email: true }, orderBy: { name: "asc" } },
    },
    take: 200,
  });

  let sent = 0;
  for (const a of due) {
    // On réserve le rappel avant l'envoi : deux crons simultanés n'enverront pas deux fois.
    const { count } = await prisma.appointment.updateMany({
      where: { id: a.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (count === 0) continue;
    const t = bookingReminderTemplate(a, { manageUrl: urls(a, request).manage });
    const result = await sendEmail({
      to: a.clientEmail,
      replyTo: a.user.email,
      ...t,
      idempotencyKey: `reminder/${a.id}/${a.startTime.getTime()}`,
      tags: [{ name: "category", value: "booking_reminder" }],
    });
    if (result.ok) sent++;
  }
  return { checked: due.length, sent };
};
