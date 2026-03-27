import { NextResponse } from 'next/server';
import { supabase, TEMP_FOLDER } from '@/lib/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB).' }, { status: 400 });
    }

    // Upload vers Supabase Storage (dossier temp)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const filePath = `${TEMP_FOLDER}/${fileName}`;

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

    return NextResponse.json({
      id: fileName,
      fileName: filePath,
      fileSize: file.size,
      mimeType: file.type,
      publicUrl: publicUrlData.publicUrl,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
