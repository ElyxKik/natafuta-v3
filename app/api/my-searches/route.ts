import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const members = await prisma.familyMember.findMany({
    where: { searcherId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    include: {
      missingPerson: { select: { id: true, fullName: true, status: true } },
      matches: { select: { id: true, confidenceScore: true, status: true }, orderBy: { confidenceScore: 'desc' } },
    },
  });
  return NextResponse.json({ members });
}
