-- AlterTable
ALTER TABLE "FamilyMatch" ADD COLUMN "aiAnalyzedAt" TIMESTAMP;
ALTER TABLE "FamilyMatch" ADD COLUMN "aiConfidenceScore" REAL;
ALTER TABLE "FamilyMatch" ADD COLUMN "aiFactors" TEXT;
ALTER TABLE "FamilyMatch" ADD COLUMN "aiSummary" TEXT;

-- AlterTable
ALTER TABLE "MissingPerson" ADD COLUMN "aiCrossLinks" TEXT;
