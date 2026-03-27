import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function sequenceMatchRatio(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const len = Math.max(a.length, b.length);
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const [total, totalFamily, totalMatches, pendingMatches, verifiedMatches, confirmedMatches, rejectedMatches, recentMatches, highConfidence, mediumConfidence, lowConfidence] =
    await Promise.all([
      prisma.missingPerson.count(),
      prisma.familyMember.count(),
      prisma.familyMatch.count(),
      prisma.familyMatch.count({ where: { status: 'pending' } }),
      prisma.familyMatch.count({ where: { status: 'verified' } }),
      prisma.familyMatch.count({ where: { status: 'confirmed' } }),
      prisma.familyMatch.count({ where: { status: 'rejected' } }),
      prisma.familyMatch.findMany({
        orderBy: { createdAt: 'desc' }, take: 10,
        include: {
          missingPerson: { select: { id: true, fullName: true } },
          familyMember: { select: { id: true, fullName: true } },
        },
      }),
      prisma.familyMatch.count({ where: { confidenceScore: { gte: 80 } } }),
      prisma.familyMatch.count({ where: { confidenceScore: { gte: 60, lt: 80 } } }),
      prisma.familyMatch.count({ where: { confidenceScore: { lt: 60 } } }),
    ]);
  const successRate = totalMatches > 0 ? Math.round((confirmedMatches / totalMatches) * 100) : 0;
  return NextResponse.json({ totalMissingPersons: total, totalFamilyMembers: totalFamily, totalMatches, pendingMatches, verifiedMatches, confirmedMatches, rejectedMatches, recentMatches, highConfidence, mediumConfidence, lowConfidence, successRate });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const { missingPersonId, relationship, fullName, age, dateOfBirth, contactInfo, location, physicalDescription } = await req.json();
  if (!missingPersonId || !fullName || !relationship) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
  }
  const missingPerson = await prisma.missingPerson.findUnique({ where: { id: missingPersonId } });
  if (!missingPerson) return NextResponse.json({ error: 'Personne introuvable.' }, { status: 404 });
  const familyMember = await prisma.familyMember.create({
    data: {
      searcherId: (session.user as any).id,
      missingPersonId,
      relationship,
      fullName,
      age: age ? parseInt(age) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      contactInfo,
      location: location || null,
      physicalDescription: physicalDescription || null,
    },
  });
  const nameScore = calcNameSimilarity(fullName, missingPerson.fullName);
  const ageScore = calcAgeSimilarity(age ? parseInt(age) : null, missingPerson.age);
  // Compare searcher's declared location against the missing person's last known location
  const locScore = calcLocationSimilarity(location || null, missingPerson.lastKnownLocation);
  // Weighted: name 40%, age 30%, location 30%
  const confidence = Math.round((nameScore * 0.4 + ageScore * 0.3 + locScore * 0.3) * 100) / 100;
  const matchType = determineMatchType(nameScore, ageScore, locScore);
  await prisma.familyMatch.upsert({
    where: { missingPersonId_familyMemberId: { missingPersonId, familyMemberId: familyMember.id } },
    create: { missingPersonId, familyMemberId: familyMember.id, confidenceScore: confidence, matchType, nameSimilarity: nameScore, ageSimilarity: ageScore, locationSimilarity: locScore },
    update: { confidenceScore: confidence, matchType, nameSimilarity: nameScore, ageSimilarity: ageScore, locationSimilarity: locScore },
  });
  return NextResponse.json(familyMember, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const { id, status, notes } = await req.json();
  const match = await prisma.familyMatch.update({
    where: { id },
    data: { status, notes, verifiedById: (session.user as any).id, verifiedAt: new Date() },
  });
  return NextResponse.json(match);
}
