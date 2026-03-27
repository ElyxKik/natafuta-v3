'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Upload, X, Loader2 } from 'lucide-react';

const EMPTY = { title: '', fullName: '', age: '', dateOfBirth: '', dateMissing: '', lastKnownLocation: '', description: '', physicalDescription: '', medicalConditions: '', contactPerson: '', contactPhone: '', status: 'active', urgencyLevel: 'medium', imageUrl: '' };

export default function EditMissingPersonPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<Array<{ id: string; fileName: string }>>([]);
  const [newPhotos, setNewPhotos] = useState<Array<{ id: string; fileName: string }>>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/missing-persons/${id}`).then((r) => r.json()).then((d) => {
      setForm({ title: d.title ?? '', fullName: d.fullName ?? '', age: d.age ? String(d.age) : '', dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : '', dateMissing: d.dateMissing ? d.dateMissing.slice(0, 10) : '', lastKnownLocation: d.lastKnownLocation ?? '', description: d.description ?? '', physicalDescription: d.physicalDescription ?? '', medicalConditions: d.medicalConditions ?? '', contactPerson: d.contactPerson ?? '', contactPhone: d.contactPhone ?? '', status: d.status ?? 'active', urgencyLevel: d.urgencyLevel ?? 'medium', imageUrl: d.imageUrl ?? '' });
      setLoading(false);
    });
    
    // Load existing photos
    fetch(`/api/missing-persons/${id}/photos`).then((r) => r.json()).then((d) => {
      setPhotos(d);
    }).catch(() => {});
  }, [id]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch(`/api/missing-persons/${id}/photos`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? 'Erreur lors de l\'upload.');
          setUploading(false);
          return;
        }
        const photo = await res.json();
        setPhotos([...photos, photo]);
      } catch (err: any) {
        setError('Erreur lors de l\'upload.');
      } finally {
        setUploading(false);
      }
    }
    e.currentTarget.value = '';
  }

  async function removePhoto(photoId: string) {
    try {
      await fetch(`/api/missing-persons/${id}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err: any) {
      setError('Erreur lors de la suppression.');
    }
  }

  if (!session?.user || !isAgent) return <div className="bg-white rounded-lg shadow-md p-12 text-center"><p className="text-gray-500">Réservé aux agents.</p><Link href="/auth/login" className="text-blue-600 mt-2 inline-block">Se connecter</Link></div>;
  if (loading) return <div className="bg-white rounded-lg shadow-md p-8 animate-pulse h-64" />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const res = await fetch(`/api/missing-persons/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, age: form.age ? parseInt(form.age) : null, dateOfBirth: form.dateOfBirth || null, imageUrl: form.imageUrl || null, lastKnownLocation: form.lastKnownLocation || null, physicalDescription: form.physicalDescription || null, medicalConditions: form.medicalConditions || null, contactPerson: form.contactPerson || null, contactPhone: form.contactPhone || null }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); setSubmitting(false); return; }
    router.push(`/missing/${id}`);
  }

  const f = (label: string, name: string, opts?: { type?: string; required?: boolean; rows?: number }) => (
    <div key={name}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{opts?.required ? ' *' : ''}</label>
      {opts?.rows ? <textarea rows={opts.rows} name={name} required={opts.required} value={(form as any)[name]} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <input type={opts?.type ?? 'text'} name={name} required={opts?.required} value={(form as any)[name]} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-800 text-white p-6"><h1 className="text-2xl font-bold">Modifier la fiche</h1></div>
        <div className="p-6">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-semibold mb-4">Informations principales</h3>
              <div className="grid grid-cols-2 gap-4">{f('Titre', 'title', { required: true })}{f('Nom complet', 'fullName', { required: true })}{f('Âge', 'age', { type: 'number' })}{f('Date de naissance', 'dateOfBirth', { type: 'date' })}{f('Date de disparition', 'dateMissing', { type: 'date', required: true })}{f('Dernier lieu', 'lastKnownLocation')}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-semibold mb-4">Détails</h3>
              <div className="space-y-4">{f('Description', 'description', { required: true, rows: 4 })}{f('Signalement physique', 'physicalDescription', { rows: 3 })}{f('Conditions médicales', 'medicalConditions', { rows: 2 })}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-semibold mb-4">Contact</h3>
              <div className="grid grid-cols-2 gap-4">{f('Personne à contacter', 'contactPerson')}{f('Téléphone', 'contactPhone')}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-semibold mb-4">Statut et image</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label><select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2"><option value="active">Disparue</option><option value="found">Retrouvée</option><option value="closed">Fermé</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label><select name="urgencyLevel" value={form.urgencyLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2"><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Élevé</option><option value="critical">Critique</option></select></div>
                {f("URL image", 'imageUrl')}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Gérer les photos</h4>
                {photos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">{photos.length} photo(s) existante(s)</p>
                    <div className="space-y-2">
                      {photos.map((photo) => (
                        <div key={photo.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                          <span className="text-sm text-gray-600">{photo.fileName}</span>
                          <button type="button" onClick={() => removePhoto(photo.id)} className="text-red-600 hover:text-red-800">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">Cliquez pour ajouter des photos</span>
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF jusqu'à 5MB par photo</p>
                </div>
                
                {uploading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Téléchargement en cours...
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Link href={`/missing/${id}`} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Annuler</Link>
              <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">{submitting ? 'Mise à jour...' : 'Mettre à jour'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
