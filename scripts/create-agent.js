const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAgent() {
  const email = 'agent.test3@natafuta.org';
  const password = 'Agent@123456'; // Mot de passe par défaut
  const name = 'Agent Test 3';

  try {
    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`✗ L'email ${email} est déjà utilisé.`);
      process.exit(1);
    }

    // Hasher le mot de passe
    const hashed = await bcrypt.hash(password, 10);

    // Créer l'utilisateur en tant qu'agent
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        userType: 'agent',
        isVerified: true,
      },
    });

    console.log('✓ Agent créé avec succès !');
    console.log(`  Email: ${user.email}`);
    console.log(`  Nom: ${user.name}`);
    console.log(`  Type: ${user.userType}`);
    console.log(`  Mot de passe par défaut: ${password}`);
    console.log(`  ID: ${user.id}`);
  } catch (error) {
    console.error('✗ Erreur lors de la création de l\'agent:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAgent();
