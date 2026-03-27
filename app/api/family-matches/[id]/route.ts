import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const { id } = await params;
  const match = await prisma.familyMatch.findUnique({
    where: { id },
    include: {
      missingPerson: {
        select: {
          id: true, title: true, fullName: true, age: true,
          dateMissing: true, lastKnownLocation: true, description: true,
          physicalDescription: true, medicalConditions: true,
          contactPerson: true, contactPhone: true,
          urgencyLevel: true, status: true, imageUrl: true, createdAt: true,
        },
      },
      familyMember: {
        select: {
          id: true, fullName: true, relationship: true, age: true,
          dateOfBirth: true, contactInfo: true, createdAt: true,
          searcher: { select: { id: true, name: true, email: true } },
        },
      },
      verifiedBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!match) return NextResponse.json({ error: 'Correspondance introuvable.' }, { status: 404 });
  return NextResponse.json(match);
}
