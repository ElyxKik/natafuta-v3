import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function sequenceMatchRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  let matches = 0;
  const used = new Set<number>();
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (!used.has(j) && a[i] === b[j]) { matches++; used.add(j); break; }
    }
  }
  return (2 * matches) / (a.length + b.length);
}

function calcNameSimilarity(a: string, b: string): number {
  return Math.round(sequenceMatchRatio(a.toLowerCase().trim(), b.toLowerCase().trim()) * 100 * 100) / 100;
}

function calcAgeSimilarity(age1?: number | null, age2?: number | null, tolerance = 5): number {
  if (age1 == null || age2 == null) return 0;
  const diff = Math.abs(age1 - age2);
  if (diff <= tolerance) return 100;
  if (diff <= tolerance * 2) return 50;
  return Math.max(0, 100 - diff * 5);
}

function calcLocationSimilarity(loc1?: string | null, loc2?: string | null): number {
  if (!loc1 || !loc2) return 0;
  const a = loc1.toLowerCase().trim();
  const b = loc2.toLowerCase().trim();
  if (a === b) return 100;
  return Math.round(sequenceMatchRatio(a, b) * 100 * 100) / 100;
}

function determineMatchType(nameSim: number, ageSim: number, locSim: number): string {
  if (nameSim >= 80 && ageSim >= 80) return 'combined';
  if (nameSim >= 80) return 'name_similarity';
  if (ageSim >= 80) return 'age_proximity';
  if (locSim >= 80) return 'location_match';
  return 'combined';
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const familyMembers = await prisma.familyMember.findMany({
    include: { missingPerson: true },
  });
  const activeMissing = await prisma.missingPerson.findMany({
    where: { status: 'active' },
  });

  let created = 0;
  let updated = 0;

  for (const fm of familyMembers) {
    for (const mp of activeMissing) {
      const nameScore = calcNameSimilarity(fm.fullName, mp.fullName);
      const ageScore = calcAgeSimilarity(fm.age, mp.age);
      const locScore = calcLocationSimilarity(fm.contactInfo, mp.lastKnownLocation);
      const confidence = Math.round((nameScore * 0.4 + ageScore * 0.3 + locScore * 0.3) * 100) / 100;

      if (confidence < 50) continue;

      const matchType = determineMatchType(nameScore, ageScore, locScore);
      const existing = await prisma.familyMatch.findUnique({
        where: { missingPersonId_familyMemberId: { missingPersonId: mp.id, familyMemberId: fm.id } },
      });

      if (existing) {
        await prisma.familyMatch.update({
          where: { id: existing.id },
          data: { confidenceScore: confidence, matchType, nameSimilarity: nameScore, ageSimilarity: ageScore, locationSimilarity: locScore },
        });
        updated++;
      } else {
        await prisma.familyMatch.create({
          data: { missingPersonId: mp.id, familyMemberId: fm.id, confidenceScore: confidence, matchType, nameSimilarity: nameScore, ageSimilarity: ageScore, locationSimilarity: locScore },
        });
        created++;
      }
    }
  }

  return NextResponse.json({ status: 'success', created, updated, total: created + updated, message: `${created} correspondance(s) créée(s), ${updated} mise(s) à jour.` });
}
