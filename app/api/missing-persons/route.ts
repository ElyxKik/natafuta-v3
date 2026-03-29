import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? '';
    const urgencyLevel = searchParams.get('urgency_level') ?? '';
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = 12;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (urgencyLevel) where.urgencyLevel = urgencyLevel;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { fullName: { contains: search } },
        { description: { contains: search } },
        { lastKnownLocation: { contains: search } },
      ];
    }

    const [total, persons] = await Promise.all([
      prisma.missingPerson.count({ where }),
      prisma.missingPerson.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({ persons, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error: any) {
    console.error('GET /api/missing-persons error:', error);
    return NextResponse.json({ error: 'Erreur serveur', persons: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const data = await req.json();
  const person = await prisma.missingPerson.create({
    data: {
      ...data,
      createdById: (session.user as any).id,
      dateMissing: new Date(data.dateMissing),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
  });
  return NextResponse.json(person, { status: 201 });
}
