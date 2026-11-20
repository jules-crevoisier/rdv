-- Vérification d'email
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "Client" ADD COLUMN "emailVerified" TIMESTAMP(3);

-- Les comptes existants sont considérés comme vérifiés pour ne bloquer personne
UPDATE "User" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL;
UPDATE "Client" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL;

-- Rappels de rendez-vous
ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- Jetons envoyés par email
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX "AuthToken_accountType_accountId_purpose_idx" ON "AuthToken"("accountType", "accountId", "purpose");
