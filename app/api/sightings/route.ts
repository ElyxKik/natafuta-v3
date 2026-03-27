import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { missingPersonId, content, location, contactInfo } = await req.json();
  if (!missingPersonId || !content) {
    return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
  }
  const sighting = await prisma.sighting.create({
    data: {
      missingPersonId,
      content,
      location,
      contactInfo,
      submittedById: (session?.user as any)?.id ?? null,
    },
  });
  return NextResponse.json(sighting, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }
  const { id, status } = await req.json();
  const sighting = await prisma.sighting.update({
    where: { id },
    data: { status, reviewedById: (session.user as any).id, reviewedAt: new Date() },
  });
  return NextResponse.json(sighting);
}
