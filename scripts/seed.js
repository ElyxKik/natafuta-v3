const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.familyMatch.deleteMany();
  await prisma.sighting.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.missingPerson.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const agentPassword = await bcrypt.hash('agent123', 10);
  const visitorPassword = await bcrypt.hash('visitor123', 10);

  const agent = await prisma.user.create({
    data: {
      name: 'Agent Test',
      email: 'agent@test.com',
      password: agentPassword,
      userType: 'agent',
      organization: 'Police Nationale',
      badgeNumber: 'PN-001',
      isVerified: true,
    },
  });

  const visitor = await prisma.user.create({
    data: {
      name: 'Visitor Test',
      email: 'visitor@test.com',
      password: visitorPassword,
      userType: 'visitor',
    },
  });

  console.log('✅ Users created:', { agent: agent.email, visitor: visitor.email });

  // Create missing persons
  const mp1 = await prisma.missingPerson.create({
    data: {
      title: 'Enfant disparu à Kinshasa',
      fullName: 'Jean Mukanda',
      age: 8,
      dateMissing: new Date('2026-03-15'),
      lastKnownLocation: 'Kinshasa, Quartier Gombe',
      description: 'Enfant disparu le 15 mars 2026 près de l\'école primaire. Porte un uniforme bleu.',
      physicalDescription: 'Petit pour son âge, peau foncée, cheveux courts noirs',
      medicalConditions: 'Asthme léger, traité avec inhalateur',
      contactPerson: 'Mère - Marie Mukanda',
      contactPhone: '+243 97 123 4567',
      urgencyLevel: 'critical',
      status: 'active',
      createdById: agent.id,
    },
  });

  const mp2 = await prisma.missingPerson.create({
    data: {
      title: 'Adolescent disparu à Kinshasa',
      fullName: 'Pierre Mukanda',
      age: 15,
      dateMissing: new Date('2026-03-10'),
      lastKnownLocation: 'Kinshasa, Quartier Gombe',
      description: 'Adolescent disparu le 10 mars 2026. Dernier vu près du marché central.',
      physicalDescription: 'Grand, peau foncée, cheveux rasés, cicatrice sur la joue gauche',
      medicalConditions: null,
      contactPerson: 'Père - Joseph Mukanda',
      contactPhone: '+243 97 234 5678',
      urgencyLevel: 'high',
      status: 'active',
      createdById: agent.id,
    },
  });

  const mp3 = await prisma.missingPerson.create({
    data: {
      title: 'Femme disparue à Lubumbashi',
      fullName: 'Fatima Kasongo',
      age: 32,
      dateMissing: new Date('2026-02-28'),
      lastKnownLocation: 'Lubumbashi, Quartier Katuba',
      description: 'Femme disparue le 28 février. Mère de trois enfants.',
      physicalDescription: 'Corpulence moyenne, peau foncée, cheveux longs noirs',
      medicalConditions: 'Diabète type 2',
      contactPerson: 'Frère - Karim Kasongo',
      contactPhone: '+243 98 345 6789',
      urgencyLevel: 'high',
      status: 'active',
      createdById: agent.id,
    },
  });

  const mp4 = await prisma.missingPerson.create({
    data: {
      title: 'Enfant disparu à Lubumbashi',
      fullName: 'Amara Kasongo',
      age: 7,
      dateMissing: new Date('2026-03-01'),
      lastKnownLocation: 'Lubumbashi, Quartier Katuba',
      description: 'Enfant disparu le 1er mars. Soeur d\'Amina Kasongo.',
      physicalDescription: 'Petite, peau foncée, cheveux courts noirs avec natte',
      medicalConditions: null,
      contactPerson: 'Mère - Zainab Kasongo',
      contactPhone: '+243 98 456 7890',
      urgencyLevel: 'critical',
      status: 'active',
      createdById: agent.id,
    },
  });

  console.log('✅ Missing persons created:', { mp1: mp1.fullName, mp2: mp2.fullName, mp3: mp3.fullName, mp4: mp4.fullName });

  // Create family members searching
  const fm1 = await prisma.familyMember.create({
    data: {
      searcherId: visitor.id,
      missingPersonId: mp1.id,
      relationship: 'sibling',
      fullName: 'Jean Mukanda',
      age: 8,
      contactInfo: '+243 97 111 2222',
    },
  });

  const fm2 = await prisma.familyMember.create({
    data: {
      searcherId: visitor.id,
      missingPersonId: mp2.id,
      relationship: 'sibling',
      fullName: 'Pierre Mukanda',
      age: 15,
      contactInfo: '+243 97 111 2222',
    },
  });

  const fm3 = await prisma.familyMember.create({
    data: {
      searcherId: visitor.id,
      missingPersonId: mp3.id,
      relationship: 'child',
      fullName: 'Fatima Kasongo',
      age: 32,
      contactInfo: '+243 98 111 3333',
    },
  });

  const fm4 = await prisma.familyMember.create({
    data: {
      searcherId: visitor.id,
      missingPersonId: mp4.id,
      relationship: 'child',
      fullName: 'Amara Kasongo',
      age: 7,
      contactInfo: '+243 98 111 3333',
    },
  });

  console.log('✅ Family members created:', { fm1: fm1.fullName, fm2: fm2.fullName, fm3: fm3.fullName, fm4: fm4.fullName });

  // Create family matches (algorithmic)
  const match1 = await prisma.familyMatch.create({
    data: {
      missingPersonId: mp1.id,
      familyMemberId: fm1.id,
      confidenceScore: 95,
      matchType: 'combined',
      nameSimilarity: 100,
      ageSimilarity: 100,
      locationSimilarity: 90,
      status: 'pending',
    },
  });

  const match2 = await prisma.familyMatch.create({
    data: {
      missingPersonId: mp2.id,
      familyMemberId: fm2.id,
      confidenceScore: 92,
      matchType: 'combined',
      nameSimilarity: 100,
      ageSimilarity: 95,
      locationSimilarity: 85,
      status: 'pending',
    },
  });

  const match3 = await prisma.familyMatch.create({
    data: {
      missingPersonId: mp3.id,
      familyMemberId: fm3.id,
      confidenceScore: 88,
      matchType: 'combined',
      nameSimilarity: 100,
      ageSimilarity: 100,
      locationSimilarity: 75,
      status: 'pending',
    },
  });

  const match4 = await prisma.familyMatch.create({
    data: {
      missingPersonId: mp4.id,
      familyMemberId: fm4.id,
      confidenceScore: 90,
      matchType: 'combined',
      nameSimilarity: 100,
      ageSimilarity: 100,
      locationSimilarity: 80,
      status: 'pending',
    },
  });

  // Cross-match: Jean and Pierre (siblings, same location, same family name)
  const match5 = await prisma.familyMatch.create({
    data: {
      missingPersonId: mp1.id,
      familyMemberId: fm2.id,
      confidenceScore: 65,
      matchType: 'name_similarity',
      nameSimilarity: 80,
      ageSimilarity: 30,
      locationSimilarity: 95,
      status: 'pending',
      notes: 'Même famille (Mukanda), même localisation (Gombe), âges différents',
    },
  });

  // Cross-match: Fatima and Amara (mother and child, same location, same family name)
  const match6 = await prisma.familyMatch.create({
    data: {
      missingPersonId: mp3.id,
      familyMemberId: fm4.id,
      confidenceScore: 72,
      matchType: 'name_similarity',
      nameSimilarity: 75,
      ageSimilarity: 20,
      locationSimilarity: 100,
      status: 'pending',
      notes: 'Même famille (Kasongo), même localisation (Katuba), disparitions rapprochées',
    },
  });

  console.log('✅ Family matches created:', { match1: match1.id, match2: match2.id, match3: match3.id, match4: match4.id, match5: match5.id, match6: match6.id });

  // Create sightings
  const sighting1 = await prisma.sighting.create({
    data: {
      missingPersonId: mp1.id,
      content: 'Enfant vu près de la gare routière de Kinshasa le 16 mars',
      location: 'Gare routière, Kinshasa',
      contactInfo: '+243 97 999 8888',
      status: 'pending',
      submittedById: visitor.id,
    },
  });

  const sighting2 = await prisma.sighting.create({
    data: {
      missingPersonId: mp2.id,
      content: 'Adolescent aperçu au marché Kasavubu le 18 mars',
      location: 'Marché Kasavubu, Kinshasa',
      contactInfo: '+243 97 888 7777',
      status: 'verified',
      submittedById: visitor.id,
      reviewedById: agent.id,
      reviewedAt: new Date(),
    },
  });

  console.log('✅ Sightings created:', { sighting1: sighting1.id, sighting2: sighting2.id });

  console.log('✨ Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('  Agent: agent@test.com / agent123');
  console.log('  Visitor: visitor@test.com / visitor123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
