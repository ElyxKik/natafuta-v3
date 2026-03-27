import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await prisma.missingPerson.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      sightings: {
        include: { submittedBy: { select: { id: true, name: true } } },
        orderBy: { submittedAt: 'desc' },
      },
      familyMembersSearching: { include: { matches: true } },
    },
  });
  if (!person) return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });
  return NextResponse.json(person);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const { id } = await params;
  const data = await req.json();
  const person = await prisma.missingPerson.update({
    where: { id },
    data: {
      ...data,
      dateMissing: data.dateMissing ? new Date(data.dateMissing) : undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });
  return NextResponse.json(person);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const { id } = await params;
  await prisma.missingPerson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
