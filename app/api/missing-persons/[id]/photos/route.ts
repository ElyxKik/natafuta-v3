import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'missing-persons');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La taille du fichier ne doit pas dépasser 5MB.' }, { status: 400 });
    }

    // Check if missing person exists
    const person = await prisma.missingPerson.findUnique({
      where: { id },
    });

    if (!person) {
      return NextResponse.json({ error: 'Personne disparue non trouvée.' }, { status: 404 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${id}-${timestamp}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Save to database
    const photo = await prisma.missingPersonPhoto.create({
      data: {
        missingPersonId: id,
        fileName,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload.' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photos = await prisma.missingPersonPhoto.findMany({
      where: { missingPersonId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(photos);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des photos.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  try {
    const { photoId } = await req.json();

    const photo = await prisma.missingPersonPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo non trouvée.' }, { status: 404 });
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, photo.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.missingPersonPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
