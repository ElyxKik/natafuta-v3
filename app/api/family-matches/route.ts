import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  const matches = await prisma.familyMatch.findMany({
    where: { status },
    orderBy: { confidenceScore: 'desc' },
    include: {
      missingPerson: { select: { id: true, fullName: true, lastKnownLocation: true, urgencyLevel: true, aiCrossLinks: true } },
      familyMember: { select: { id: true, fullName: true, relationship: true } },
    },
  });
  return NextResponse.json({ matches });
}
