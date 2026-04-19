const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function keepAlive() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ping`;
    console.log(`✓ Keep-alive ping successful at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error(`✗ Keep-alive ping failed at ${new Date().toISOString()}:`, error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

keepAlive().then(success => {
  process.exit(success ? 0 : 1);
});
