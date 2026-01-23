-- AlterTable EventType: Add location and meetingType
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'EventType' AND column_name = 'location') THEN
        ALTER TABLE "EventType" ADD COLUMN "location" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'EventType' AND column_name = 'meetingType') THEN
        ALTER TABLE "EventType" ADD COLUMN "meetingType" TEXT NOT NULL DEFAULT 'in-person';
    END IF;
END $$;

-- AlterTable Appointment: Add location, meetingType, and videoLink
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Appointment' AND column_name = 'location') THEN
        ALTER TABLE "Appointment" ADD COLUMN "location" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Appointment' AND column_name = 'meetingType') THEN
        ALTER TABLE "Appointment" ADD COLUMN "meetingType" TEXT NOT NULL DEFAULT 'in-person';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Appointment' AND column_name = 'videoLink') THEN
        ALTER TABLE "Appointment" ADD COLUMN "videoLink" TEXT;
    END IF;
END $$;
