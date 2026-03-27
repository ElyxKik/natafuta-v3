-- CreateTable
CREATE TABLE "MissingPersonPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missingPersonId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissingPersonPhoto_missingPersonId_fkey" FOREIGN KEY ("missingPersonId") REFERENCES "MissingPerson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
