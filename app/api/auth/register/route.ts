import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, username, email, password } = await req.json();
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || username,
        email,
        password: hashed,
        userType: 'visitor', // always visitor — promotion to agent is done by admin only
      },
    });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
