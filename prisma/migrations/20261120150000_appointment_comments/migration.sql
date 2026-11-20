-- Commentaires internes sur les rendez-vous (organisateur et responsables)
-- CreateTable
CREATE TABLE "AppointmentComment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentComment_appointmentId_createdAt_idx" ON "AppointmentComment"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AppointmentComment" ADD CONSTRAINT "AppointmentComment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentComment" ADD CONSTRAINT "AppointmentComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
