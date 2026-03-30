import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const camp = await (prisma as any).camp.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        persons: {
          select: {
            id: true,
            fullName: true,
            age: true,
            gender: true,
            personType: true,
            reunificationStatus: true,
            originLocation: true,
            imageUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { persons: true } },
      },
    });
    if (!camp) {
      return NextResponse.json({ error: 'Camp introuvable.' }, { status: 404 });
    }
    return NextResponse.json(camp);
  } catch (error: any) {
    console.error('GET /api/camps/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const data = await req.json();
  const camp = await (prisma as any).camp.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.province !== undefined && { province: data.province }),
      ...(data.capacity !== undefined && { capacity: parseInt(data.capacity) }),
      ...(data.currentOccupancy !== undefined && { currentOccupancy: parseInt(data.currentOccupancy) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.latitude !== undefined && { latitude: parseFloat(data.latitude) }),
      ...(data.longitude !== undefined && { longitude: parseFloat(data.longitude) }),
      ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      ...(data.description !== undefined && { description: data.description }),
    },
  });
  return NextResponse.json(camp);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  await (prisma as any).camp.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
