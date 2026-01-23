-- AlterTable (only if column doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'calendarToken') THEN
        ALTER TABLE "User" ADD COLUMN "calendarToken" TEXT;
    END IF;
END $$;

-- CreateIndex (only if index doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_calendarToken_key') THEN
        CREATE UNIQUE INDEX "User_calendarToken_key" ON "User"("calendarToken");
    END IF;
END $$;
