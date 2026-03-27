import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, email: true, image: true, userType: true, phoneNumber: true, address: true, organization: true, badgeNumber: true, bio: true, isVerified: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const { phoneNumber, organization, badgeNumber, address, bio } = await req.json();
  const user = await prisma.user.update({
    where: { id: (session.user as any).id },
    data: { phoneNumber, organization, badgeNumber, address, bio },
    select: { id: true, name: true, email: true, image: true, userType: true, phoneNumber: true, address: true, organization: true, badgeNumber: true, bio: true, isVerified: true },
  });
  return NextResponse.json(user);
}
