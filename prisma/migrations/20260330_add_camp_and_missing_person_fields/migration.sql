-- Création de la table Camp (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "Camp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "province" TEXT,
    "capacity" INTEGER,
    "currentOccupancy" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Camp_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Camp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Ajout des colonnes manquantes sur MissingPerson (IF NOT EXISTS pour idempotence)
ALTER TABLE "MissingPerson" ADD COLUMN IF NOT EXISTS "personType" TEXT NOT NULL DEFAULT 'missing';
ALTER TABLE "MissingPerson" ADD COLUMN IF NOT EXISTS "arrivalDate" TIMESTAMP;
ALTER TABLE "MissingPerson" ADD COLUMN IF NOT EXISTS "dossierNumber" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN IF NOT EXISTS "reunificationStatus" TEXT DEFAULT 'pending';
ALTER TABLE "MissingPerson" ADD COLUMN IF NOT EXISTS "campId" TEXT;

-- Ajout de la foreign key vers Camp (si pas encore présente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MissingPerson_campId_fkey'
  ) THEN
    ALTER TABLE "MissingPerson"
      ADD CONSTRAINT "MissingPerson_campId_fkey"
      FOREIGN KEY ("campId") REFERENCES "Camp" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Correction des types REAL → DOUBLE PRECISION sur FamilyMatch (si nécessaire)
ALTER TABLE "FamilyMatch" ALTER COLUMN "confidenceScore" TYPE DOUBLE PRECISION USING "confidenceScore"::double precision;
ALTER TABLE "FamilyMatch" ALTER COLUMN "nameSimilarity" TYPE DOUBLE PRECISION USING "nameSimilarity"::double precision;
ALTER TABLE "FamilyMatch" ALTER COLUMN "ageSimilarity" TYPE DOUBLE PRECISION USING "ageSimilarity"::double precision;
ALTER TABLE "FamilyMatch" ALTER COLUMN "locationSimilarity" TYPE DOUBLE PRECISION USING "locationSimilarity"::double precision;
ALTER TABLE "FamilyMatch" ADD COLUMN IF NOT EXISTS "aiConfidenceScore" DOUBLE PRECISION;

-- Index sur Camp
CREATE INDEX IF NOT EXISTS "Camp_status_idx" ON "Camp"("status");
