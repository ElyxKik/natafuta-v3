import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.userType !== 'agent' || !user.isAdmin) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, userType: true,
      isVerified: true, organization: true, badgeNumber: true, createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });

  const { userId, userType } = await req.json();
  if (!userId || !['visitor', 'agent'].includes(userType)) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { userType },
    select: { id: true, name: true, email: true, userType: true },
  });
  return NextResponse.json(updated);
}
