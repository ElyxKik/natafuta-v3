'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Upload, X, Loader2 } from 'lucide-react';

const EMPTY = { title: '', fullName: '', age: '', dateOfBirth: '', dateMissing: '', lastKnownLocation: '', description: '', physicalDescription: '', medicalConditions: '', contactPerson: '', contactPhone: '', status: 'active', urgencyLevel: 'medium', gender: '', ethnicity: '', languages: '', circumstances: '', fatherName: '', motherName: '', originLocation: '', imageUrl: '' };

export default function CreateMissingPersonPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; fileName: string }>>([]);
  const [uploading, setUploading] = useState(false);

  if (!session?.user || !isAgent) return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <p className="text-gray-500">Réservé aux agents connectés.</p>
      <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">Se connecter</Link>
    </div>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/missing-persons/temp/photos', {
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
        setUploadedPhotos([...uploadedPhotos, photo]);
      } catch (err: any) {
        setError('Erreur lors de l\'upload.');
      } finally {
        setUploading(false);
      }
    }
    e.currentTarget.value = '';
  }

  function removePhoto(photoId: string) {
    setUploadedPhotos(uploadedPhotos.filter(p => p.id !== photoId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const res = await fetch('/api/missing-persons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, age: form.age ? parseInt(form.age) : null, dateOfBirth: form.dateOfBirth || null, imageUrl: form.imageUrl || null, lastKnownLocation: form.lastKnownLocation || null, physicalDescription: form.physicalDescription || null, medicalConditions: form.medicalConditions || null, contactPerson: form.contactPerson || null, contactPhone: form.contactPhone || null, gender: form.gender || null, ethnicity: form.ethnicity || null, languages: form.languages || null, circumstances: form.circumstances || null, fatherName: form.fatherName || null, motherName: form.motherName || null, originLocation: form.originLocation || null }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); setSubmitting(false); return; }
    const person = await res.json();

    // Attach temp photos to the newly created person
    for (const photo of uploadedPhotos) {
      await fetch(`/api/missing-persons/${person.id}/photos/from-temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempFileName: photo.id }),
      });
    }

    router.push(`/missing/${person.id}`);
  }

  const field = (label: string, name: string, opts?: { type?: string; required?: boolean; rows?: number }) => (
    <div key={name}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{opts?.required ? ' *' : ''}</label>
      {opts?.rows ? (
        <textarea rows={opts.rows} name={name} required={opts.required} value={(form as any)[name]} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <input type={opts?.type ?? 'text'} name={name} required={opts?.required} value={(form as any)[name]} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-800 text-white p-6"><h1 className="text-2xl font-bold">Créer une fiche</h1></div>
        <div className="p-6">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Informations principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Titre de l\'avis', 'title', { required: true })}
                {field('Nom complet', 'fullName', { required: true })}
                {field('Âge', 'age', { type: 'number' })}
                {field('Date de naissance', 'dateOfBirth', { type: 'date' })}
                {field('Date de disparition', 'dateMissing', { type: 'date', required: true })}
                {field('Dernier lieu connu', 'lastKnownLocation')}
                {field('Lieu d\'origine / Province', 'originLocation')}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Non précisé</option>
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                  </select>
                </div>
                {field('Ethnie / Tribu', 'ethnicity')}
                {field('Langues parlées', 'languages')}
                {field('Nom du père', 'fatherName')}
                {field('Nom de la mère', 'motherName')}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Détails</h3>
              <div className="space-y-4">
                {field('Description générale', 'description', { required: true, rows: 4 })}
                {field('Signalement physique (taille, corpulence, signes distinctifs)', 'physicalDescription', { rows: 3 })}
                {field('Circonstances de la disparition', 'circumstances', { rows: 3 })}
                {field('Conditions médicales', 'medicalConditions', { rows: 2 })}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                {field('Personne à contacter', 'contactPerson')}
                {field('Téléphone', 'contactPhone')}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Statut et image</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="active">Disparue</option><option value="found">Retrouvée</option><option value="closed">Fermé</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                  <select name="urgencyLevel" value={form.urgencyLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Élevé</option><option value="critical">Critique</option>
                  </select></div>
                {field("URL de l'image", 'imageUrl')}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Télécharger des photos</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">Cliquez pour sélectionner des photos</span>
                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF jusqu'à 5MB par photo</p>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">{uploadedPhotos.length} photo(s) téléchargée(s)</p>
                    {uploadedPhotos.map((photo) => (
                      <div key={photo.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                        <span className="text-sm text-gray-600">{photo.fileName}</span>
                        <button type="button" onClick={() => removePhoto(photo.id)} className="text-red-600 hover:text-red-800">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {uploading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Téléchargement en cours...
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <Link href="/missing" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Annuler</Link>
              <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">{submitting ? 'Création...' : 'Créer'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
