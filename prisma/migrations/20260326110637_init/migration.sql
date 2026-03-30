-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP,
    "password" TEXT,
    "image" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'visitor',
    "phoneNumber" TEXT,
    "address" TEXT,
    "organization" TEXT,
    "badgeNumber" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "MissingPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP,
    "dateMissing" TIMESTAMP NOT NULL,
    "lastKnownLocation" TEXT,
    "description" TEXT NOT NULL,
    "physicalDescription" TEXT,
    "medicalConditions" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'medium',
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "MissingPerson_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sighting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missingPersonId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "location" TEXT,
    "contactInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP,
    CONSTRAINT "Sighting_missingPersonId_fkey" FOREIGN KEY ("missingPersonId") REFERENCES "MissingPerson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sighting_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sighting_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "searcherId" TEXT NOT NULL,
    "missingPersonId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP,
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyMember_searcherId_fkey" FOREIGN KEY ("searcherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyMember_missingPersonId_fkey" FOREIGN KEY ("missingPersonId") REFERENCES "MissingPerson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamilyMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missingPersonId" TEXT NOT NULL,
    "familyMemberId" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "matchType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "nameSimilarity" REAL NOT NULL DEFAULT 0,
    "ageSimilarity" REAL NOT NULL DEFAULT 0,
    "locationSimilarity" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "FamilyMatch_missingPersonId_fkey" FOREIGN KEY ("missingPersonId") REFERENCES "MissingPerson" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyMatch_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "FamilyMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamilyMatch_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMatch_missingPersonId_familyMemberId_key" ON "FamilyMatch"("missingPersonId", "familyMemberId");
