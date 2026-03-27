import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = path.join(process.cwd(), 'public', 'uploads', 'temp');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'missing-persons');

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { tempFileName } = await req.json();
    if (!tempFileName) return NextResponse.json({ error: 'tempFileName requis.' }, { status: 400 });

    const tempPath = path.join(TEMP_DIR, tempFileName);
    if (!fs.existsSync(tempPath)) {
      return NextResponse.json({ error: 'Fichier temporaire introuvable.' }, { status: 404 });
    }

    // Ensure upload dir exists
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // Move file from temp to missing-persons
    const ext = tempFileName.split('.').pop();
    const fileName = `${id}-${Date.now()}.${ext}`;
    const destPath = path.join(UPLOAD_DIR, fileName);
    fs.renameSync(tempPath, destPath);

    // Detect mime type from extension
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
    const mimeType = mimeMap[ext?.toLowerCase() ?? ''] ?? 'image/jpeg';
    const fileSize = fs.statSync(destPath).size;

    const photo = await prisma.missingPersonPhoto.create({
      data: { missingPersonId: id, fileName, fileSize, mimeType },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    console.error('from-temp error:', error);
    return NextResponse.json({ error: 'Erreur lors du déplacement du fichier.' }, { status: 500 });
  }
}
