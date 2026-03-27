import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const allMatches = await prisma.familyMatch.findMany({
    select: { matchType: true, status: true, confidenceScore: true, createdAt: true },
  });

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const m of allMatches) {
    byType[m.matchType] = (byType[m.matchType] ?? 0) + 1;
    byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
  }

  const now = new Date();
  const last12Months: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = allMatches.filter((m) => m.createdAt >= d && m.createdAt < end).length;
    last12Months.push({
      month: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      count,
    });
  }

  return NextResponse.json({ matchTypes: byType, byStatus, last12Months, total: allMatches.length });
}
