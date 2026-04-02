import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const type = searchParams.get('type') ?? '';
    const province = searchParams.get('province') ?? '';
    const status = searchParams.get('status') ?? '';
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = 12;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (province) where.province = { contains: province };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
        { province: { contains: search } },
      ];
    }

    const total = await prisma.camp.count({ where });
    const camps = await prisma.camp.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { persons: true } },
      },
    });

    return NextResponse.json({ camps, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error: any) {
    console.error('GET /api/camps error:', error);
    return NextResponse.json({ error: 'Erreur serveur', camps: [], total: 0, page: 1, pageSize: 12, totalPages: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const data = await req.json();
  if (!data.name || !data.type || !data.location) {
    return NextResponse.json({ error: 'Champs obligatoires manquants : name, type, location.' }, { status: 400 });
  }
  if (data.type !== 'refugee' && data.type !== 'displaced') {
    return NextResponse.json({ error: 'type doit être "refugee" ou "displaced".' }, { status: 400 });
  }

  const camp = await (prisma as any).camp.create({
    data: {
      name: data.name,
      type: data.type,
      location: data.location,
      province: data.province ?? null,
      capacity: data.capacity ? parseInt(data.capacity) : null,
      currentOccupancy: data.currentOccupancy ? parseInt(data.currentOccupancy) : 0,
      status: data.status ?? 'active',
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      contactPerson: data.contactPerson ?? null,
      contactPhone: data.contactPhone ?? null,
      description: data.description ?? null,
      createdById: (session.user as any).id,
    },
  });
  return NextResponse.json(camp, { status: 201 });
}
