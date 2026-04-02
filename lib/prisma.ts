import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  dbUrl: string | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// In dev, if DATABASE_URL changed (e.g. .env edit), recreate the client
if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.dbUrl &&
  globalForPrisma.dbUrl !== process.env.DATABASE_URL
) {
  globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.dbUrl = process.env.DATABASE_URL;
}
