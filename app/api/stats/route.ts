import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).userType !== 'agent') {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
    }

    const db = prisma as any;

    const [missing, refugee, displaced, camps, reunified, reunificationInProgress] = await Promise.all([
      db.missingPerson.count({ where: { personType: 'missing' } }),
      db.missingPerson.count({ where: { personType: 'refugee' } }),
      db.missingPerson.count({ where: { personType: 'displaced' } }),
      db.camp.count({ where: { status: 'active' } }),
      db.missingPerson.count({ where: { personType: { in: ['refugee', 'displaced'] }, reunificationStatus: 'reunified' } }),
      db.missingPerson.count({ where: { personType: { in: ['refugee', 'displaced'] }, reunificationStatus: 'in_progress' } }),
    ]);

    return NextResponse.json({ missing, refugee, displaced, camps, reunified, reunificationInProgress });
  } catch (error: any) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
}
