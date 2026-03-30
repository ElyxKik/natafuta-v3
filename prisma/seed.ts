import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer des utilisateurs agents
  const agent1 = await (prisma as any).user.upsert({
    where: { email: 'agent1@natafuta.org' },
    update: {},
    create: {
      email: 'agent1@natafuta.org',
      name: 'Agent Natafuta 1',
      password: await bcrypt.hash('password123', 10),
      userType: 'agent',
      organization: 'Natafuta RDC',
      isVerified: true,
    },
  });

  const agent2 = await (prisma as any).user.upsert({
    where: { email: 'agent2@natafuta.org' },
    update: {},
    create: {
      email: 'agent2@natafuta.org',
      name: 'Agent Natafuta 2',
      password: await bcrypt.hash('password123', 10),
      userType: 'agent',
      organization: 'Natafuta RDC',
      isVerified: true,
    },
  });

  // Créer des camps
  const camp1 = await (prisma as any).camp.upsert({
    where: { id: 'camp-mugunga' },
    update: {},
    create: {
      id: 'camp-mugunga',
      name: 'Camp Mugunga',
      type: 'refugee',
      location: 'Goma',
      province: 'Nord-Kivu',
      capacity: 5000,
      currentOccupancy: 3200,
      status: 'active',
      latitude: -1.6797,
      longitude: 29.2228,
      contactPerson: 'Jean Mukendi',
      contactPhone: '+243 97 123 4567',
      description: 'Camp principal pour réfugiés à Goma',
      createdById: agent1.id,
    },
  });

  const camp2 = await (prisma as any).camp.upsert({
    where: { id: 'camp-nyiragongo' },
    update: {},
    create: {
      id: 'camp-nyiragongo',
      name: 'Camp Nyiragongo',
      type: 'displaced',
      location: 'Goma',
      province: 'Nord-Kivu',
      capacity: 3000,
      currentOccupancy: 2100,
      status: 'active',
      latitude: -1.5236,
      longitude: 29.2497,
      contactPerson: 'Marie Kasongo',
      contactPhone: '+243 97 234 5678',
      description: 'Camp pour déplacés internes',
      createdById: agent2.id,
    },
  });

  // Créer des personnes disparues
  const missing1 = await (prisma as any).missingPerson.create({
    data: {
      personType: 'missing',
      title: 'Recherche : Enfant disparu à Goma',
      fullName: 'Kabuya Mwangi',
      age: 12,
      gender: 'male',
      ethnicity: 'Luba',
      languages: 'Swahili, Français',
      fatherName: 'Mwangi Kabuya',
      motherName: 'Fatima Ndombele',
      originLocation: 'Goma, Nord-Kivu',
      physicalDescription: 'Petit de taille, cicatrice sur la joue gauche',
      description: 'Enfant disparu depuis le 15 mars 2026 après l\'école',
      dateMissing: new Date('2026-03-15'),
      lastKnownLocation: 'École primaire de Goma',
      circumstances: 'Disparu en rentrant de l\'école, aucune trace depuis',
      urgencyLevel: 'critical',
      status: 'active',
      contactPerson: 'Mère : Fatima Ndombele',
      contactPhone: '+243 97 111 2222',
      createdById: agent1.id,
    },
  });

  const missing2 = await (prisma as any).missingPerson.create({
    data: {
      personType: 'missing',
      title: 'Recherche : Femme disparue à Bukavu',
      fullName: 'Amara Habimana',
      age: 34,
      gender: 'female',
      ethnicity: 'Tutsi',
      languages: 'Kinyarwanda, Français, Swahili',
      fatherName: 'Habimana Sebarenzi',
      motherName: 'Yvonne Mukandayire',
      originLocation: 'Bukavu, Sud-Kivu',
      physicalDescription: 'Taille moyenne, cheveux longs noirs, tatouage sur le bras droit',
      description: 'Femme disparue depuis le 20 mars 2026',
      dateMissing: new Date('2026-03-20'),
      lastKnownLocation: 'Marché central de Bukavu',
      circumstances: 'Disparue au marché, sac à main retrouvé sur place',
      urgencyLevel: 'high',
      status: 'active',
      contactPerson: 'Frère : Joseph Habimana',
      contactPhone: '+243 97 333 4444',
      createdById: agent2.id,
    },
  });

  // Créer des réfugiés
  const refugee1 = await (prisma as any).missingPerson.create({
    data: {
      personType: 'refugee',
      title: 'Réfugié nigérian',
      fullName: 'Kwame Okonkwo',
      age: 28,
      gender: 'male',
      ethnicity: 'Igbo',
      languages: 'Anglais, Français, Igbo',
      fatherName: 'Okonkwo Senior',
      motherName: 'Ngozi Okonkwo',
      originLocation: 'Lagos, Nigeria',
      physicalDescription: 'Taille grande, musclé, cicatrice sur le front',
      description: 'Réfugié nigérian fuyant les violences communautaires',
      dateMissing: new Date('2025-12-10'),
      arrivalDate: new Date('2025-12-10'),
      dossierNumber: 'REF-NG-2025-001',
      reunificationStatus: 'pending',
      campId: camp1.id,
      status: 'active',
      contactPerson: 'Kwame Okonkwo',
      contactPhone: '+243 97 555 6666',
      createdById: agent1.id,
    },
  });

  const refugee2 = await (prisma as any).missingPerson.create({
    data: {
      personType: 'refugee',
      title: 'Réfugiée somalienne',
      fullName: 'Amina Hassan',
      age: 31,
      gender: 'female',
      ethnicity: 'Somali',
      languages: 'Somali, Arabe, Français',
      fatherName: 'Hassan Mohamed',
      motherName: 'Zahra Ahmed',
      originLocation: 'Mogadiscio, Somalie',
      physicalDescription: 'Taille petite, voile noir, bague en or',
      description: 'Réfugiée somalienne avec enfants, fuyant les conflits',
      dateMissing: new Date('2025-11-05'),
      arrivalDate: new Date('2025-11-05'),
      dossierNumber: 'REF-SO-2025-002',
      reunificationStatus: 'in_progress',
      campId: camp1.id,
      status: 'active',
      contactPerson: 'Amina Hassan',
      contactPhone: '+243 97 777 8888',
      createdById: agent1.id,
    },
  });

  // Créer des déplacés internes
  const displaced1 = await (prisma as any).missingPerson.create({
    data: {
      personType: 'displaced',
      title: 'Déplacé interne du Kasai',
      fullName: 'Kasongo Tshimanga',
      age: 45,
      gender: 'male',
      ethnicity: 'Lele',
      languages: 'Tshilele, Français, Swahili',
      fatherName: 'Tshimanga Kasongo',
      motherName: 'Mwila Kasongo',
      originLocation: 'Kasai Central, RDC',
      physicalDescription: 'Taille moyenne, cheveux gris, lunettes',
      description: 'Déplacé interne fuyant les violences communautaires au Kasai',
      dateMissing: new Date('2026-01-15'),
      arrivalDate: new Date('2026-01-15'),
      dossierNumber: 'DISP-KC-2026-001',
      reunificationStatus: 'pending',
      campId: camp2.id,
      status: 'active',
      contactPerson: 'Kasongo Tshimanga',
      contactPhone: '+243 97 999 0000',
      createdById: agent2.id,
    },
  });

  const displaced2 = await (prisma as any).missingPerson.create({
    data: {
      personType: 'displaced',
      title: 'Déplacée interne d\'Ituri',
      fullName: 'Mwangi Njeri',
      age: 38,
      gender: 'female',
      ethnicity: 'Kamba',
      languages: 'Kikamba, Swahili, Français',
      fatherName: 'Njeri Mwangi',
      motherName: 'Wanjiru Njeri',
      originLocation: 'Ituri, RDC',
      physicalDescription: 'Taille grande, cheveux courts, marque de naissance sur le cou',
      description: 'Déplacée interne avec 3 enfants, fuyant les conflits à Ituri',
      dateMissing: new Date('2026-02-20'),
      arrivalDate: new Date('2026-02-20'),
      dossierNumber: 'DISP-IT-2026-002',
      reunificationStatus: 'reunified',
      campId: camp2.id,
      status: 'active',
      contactPerson: 'Mwangi Njeri',
      contactPhone: '+243 97 111 2233',
      createdById: agent2.id,
    },
  });

  // Créer des membres de famille chercheurs
  const familyMember1 = await (prisma as any).familyMember.create({
    data: {
      searcherId: agent1.id,
      missingPersonId: refugee1.id,
      relationship: 'sibling',
      fullName: 'Chinedu Okonkwo',
      age: 25,
      contactInfo: '+243 97 555 7777',
      location: 'Goma',
      physicalDescription: 'Ressemble à Kwame, plus petit',
    },
  });

  const familyMember2 = await (prisma as any).familyMember.create({
    data: {
      searcherId: agent2.id,
      missingPersonId: refugee2.id,
      relationship: 'parent',
      fullName: 'Hassan Mohamed',
      age: 65,
      contactInfo: '+243 97 777 9999',
      location: 'Goma',
      physicalDescription: 'Père d\'Amina, cheveux blancs',
    },
  });

  // Créer des correspondances de matching
  const match1 = await (prisma as any).familyMatch.create({
    data: {
      missingPersonId: refugee1.id,
      familyMemberId: familyMember1.id,
      confidenceScore: 92.5,
      matchType: 'combined',
      nameSimilarity: 95,
      ageSimilarity: 88,
      locationSimilarity: 90,
      status: 'verified',
      notes: 'Correspondance très probable - frère et sœur',
    },
  });

  const match2 = await (prisma as any).familyMatch.create({
    data: {
      missingPersonId: refugee2.id,
      familyMemberId: familyMember2.id,
      confidenceScore: 87.3,
      matchType: 'name_similarity',
      nameSimilarity: 92,
      ageSimilarity: 75,
      locationSimilarity: 85,
      status: 'pending',
      notes: 'Père cherchant sa fille',
    },
  });

  // Créer des signalements pour les personnes disparues
  const sighting1 = await (prisma as any).sighting.create({
    data: {
      missingPersonId: missing1.id,
      content: 'Enfant vu près de la gare routière de Goma le 18 mars',
      location: 'Gare routière de Goma',
      contactInfo: '+243 97 123 5555',
      status: 'pending',
      submittedById: agent1.id,
    },
  });

  const sighting2 = await (prisma as any).sighting.create({
    data: {
      missingPersonId: missing2.id,
      content: 'Femme correspondant à la description vue au marché de Bukavu le 22 mars',
      location: 'Marché central de Bukavu',
      contactInfo: '+243 97 333 6666',
      status: 'reviewed',
      submittedById: agent2.id,
      reviewedById: agent1.id,
      reviewedAt: new Date(),
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log(`
📊 Données créées :
  - 2 agents
  - 2 camps (1 réfugié, 1 déplacé)
  - 2 personnes disparues
  - 2 réfugiés
  - 2 déplacés internes
  - 2 membres de famille chercheurs
  - 2 correspondances de matching
  - 2 signalements

🔐 Identifiants de test :
  Agent 1: agent1@natafuta.org / password123
  Agent 2: agent2@natafuta.org / password123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
