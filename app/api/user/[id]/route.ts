import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true, userType: true,
      phoneNumber: true, address: true, organization: true, badgeNumber: true,
      bio: true, isVerified: true,
      createdNotices: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, fullName: true, status: true, createdAt: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  return NextResponse.json(user);
}
