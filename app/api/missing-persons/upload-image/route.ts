import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase, MISSING_PERSON_FOLDER } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const missingPersonId = formData.get('missingPersonId') as string;

    if (!file || !missingPersonId) {
      return NextResponse.json({ error: 'Fichier ou ID manquant.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB).' }, { status: 400 });
    }

    // Vérifier que la personne disparue existe
    const missingPerson = await prisma.missingPerson.findUnique({
      where: { id: missingPersonId },
    });

    if (!missingPerson) {
      return NextResponse.json({ error: 'Personne disparue introuvable.' }, { status: 404 });
    }

    // Upload vers Supabase Storage
    const fileName = `${missingPersonId}-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${MISSING_PERSON_FOLDER}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('natafuta-images')
      .upload(filePath, file, { upsert: false });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'upload.' }, { status: 500 });
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('natafuta-images')
      .getPublicUrl(filePath);

    // Créer l'entrée en base de données
    const photo = await prisma.missingPersonPhoto.create({
      data: {
        missingPersonId,
        fileName: filePath,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json({
      id: photo.id,
      fileName: filePath,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      publicUrl: publicUrlData.publicUrl,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
