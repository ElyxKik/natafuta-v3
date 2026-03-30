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
    const personType = searchParams.get('personType') ?? '';
    const province = searchParams.get('province') ?? '';
    const reunificationStatus = searchParams.get('reunificationStatus') ?? '';
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = 12;

    const where: Record<string, unknown> = {
      personType: personType === 'displaced' ? 'displaced' : 'refugee',
    };
    if (status) where.status = status;
    if (province) where.originLocation = { contains: province };
    if (reunificationStatus) where.reunificationStatus = reunificationStatus;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { description: { contains: search } },
        { originLocation: { contains: search } },
        { dossierNumber: { contains: search } },
      ];
    }

    const db = prisma as any;
    const [total, persons] = await Promise.all([
      db.missingPerson.count({ where }),
      db.missingPerson.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { camp: true },
      }),
    ]);

    return NextResponse.json({ persons, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error: any) {
    console.error('GET /api/refugees error:', error);
    return NextResponse.json({ error: 'Erreur serveur', persons: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const data = await req.json();
  const { personType } = data;
  if (personType !== 'refugee' && personType !== 'displaced') {
    return NextResponse.json({ error: 'personType doit être "refugee" ou "displaced".' }, { status: 400 });
  }

  const person = await (prisma as any).missingPerson.create({
    data: {
      title: data.fullName,
      fullName: data.fullName,
      description: data.description ?? '',
      personType,
      age: data.age ? parseInt(data.age) : null,
      gender: data.gender ?? null,
      originLocation: data.originLocation ?? null,
      contactPerson: data.contactPerson ?? null,
      contactPhone: data.contactPhone ?? null,
      languages: data.languages ?? null,
      ethnicity: data.ethnicity ?? null,
      fatherName: data.fatherName ?? null,
      motherName: data.motherName ?? null,
      physicalDescription: data.physicalDescription ?? null,
      medicalConditions: data.medicalConditions ?? null,
      imageUrl: data.imageUrl ?? null,
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      dossierNumber: data.dossierNumber ?? null,
      reunificationStatus: data.reunificationStatus ?? 'pending',
      campId: data.campId ?? null,
      dateMissing: data.arrivalDate ? new Date(data.arrivalDate) : new Date(),
      status: 'active',
      urgencyLevel: 'medium',
      createdById: (session.user as any).id,
    },
  });
  return NextResponse.json(person, { status: 201 });
}
