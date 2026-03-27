-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "password" TEXT,
    "image" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'visitor',
    "phoneNumber" TEXT,
    "address" TEXT,
    "organization" TEXT,
    "badgeNumber" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("address", "badgeNumber", "bio", "createdAt", "email", "emailVerified", "id", "image", "isVerified", "name", "organization", "password", "phoneNumber", "updatedAt", "userType") SELECT "address", "badgeNumber", "bio", "createdAt", "email", "emailVerified", "id", "image", "isVerified", "name", "organization", "password", "phoneNumber", "updatedAt", "userType" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
