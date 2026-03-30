import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const person = await (prisma as any).missingPerson.findUnique({
      where: { id },
      include: { camp: true, createdBy: { select: { name: true, email: true } } },
    });
    if (!person) return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });
    if (person.personType !== 'refugee' && person.personType !== 'displaced') {
      return NextResponse.json({ error: 'Cette fiche n\'est pas un réfugié ou déplacé.' }, { status: 400 });
    }
    return NextResponse.json(person);
  } catch (error: any) {
    console.error('GET /api/refugees/[id] error:', error);
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
  const person = await (prisma as any).missingPerson.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined && { fullName: data.fullName, title: data.fullName }),
      ...(data.age !== undefined && { age: data.age ? parseInt(data.age) : null }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.originLocation !== undefined && { originLocation: data.originLocation }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.reunificationStatus !== undefined && { reunificationStatus: data.reunificationStatus }),
      ...(data.campId !== undefined && { campId: data.campId || null }),
      ...(data.dossierNumber !== undefined && { dossierNumber: data.dossierNumber }),
      ...(data.arrivalDate !== undefined && { arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null }),
      ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
  return NextResponse.json(person);
}
