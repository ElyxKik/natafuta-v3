-- AlterTable
ALTER TABLE "FamilyMember" ADD COLUMN "location" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "physicalDescription" TEXT;

-- AlterTable
ALTER TABLE "MissingPerson" ADD COLUMN "circumstances" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN "ethnicity" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN "fatherName" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN "gender" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN "languages" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN "motherName" TEXT;
ALTER TABLE "MissingPerson" ADD COLUMN "originLocation" TEXT;
