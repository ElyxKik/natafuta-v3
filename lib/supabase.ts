import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = 'natafuta-images';
export const MISSING_PERSON_FOLDER = 'missing-persons';
export const TEMP_FOLDER = 'temp';

export async function uploadImage(
  file: File,
  folder: string,
  fileName: string
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err) {
    console.error('Upload exception:', err);
    return null;
  }
}

export async function deleteImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete exception:', err);
    return false;
  }
}

export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}
