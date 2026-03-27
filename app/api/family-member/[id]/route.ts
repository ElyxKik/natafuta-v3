import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  const fm = await prisma.familyMember.findUnique({
    where: { id },
    include: {
      missingPerson: { select: { id: true, fullName: true, status: true, lastKnownLocation: true } },
      matches: {
        orderBy: { confidenceScore: 'desc' },
        include: { missingPerson: { select: { id: true, fullName: true } } },
      },
      searcher: { select: { id: true, name: true } },
    },
  });
  if (!fm) return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });
  if (fm.searcherId !== (session.user as any).id && (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  return NextResponse.json(fm);
}
