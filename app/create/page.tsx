'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Upload, X, Loader2, Search, Globe, MapPin } from 'lucide-react';

type PersonType = 'missing' | 'refugee' | 'displaced';

const TYPE_OPTIONS: { value: PersonType; label: string; desc: string; color: string; icon: React.ElementType }[] = [
  { value: 'missing', label: 'Personne disparue', desc: 'Avis de recherche pour une personne portée disparue', color: 'blue', icon: Search },
  { value: 'refugee', label: 'Réfugié', desc: 'Enregistrement d\'un réfugié congolais', color: 'green', icon: Globe },
  { value: 'displaced', label: 'Déplacé interne', desc: 'Enregistrement d\'un déplacé interne', color: 'orange', icon: MapPin },
];

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', header: 'bg-blue-800', iconBg: 'bg-blue-100' },
  green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', btn: 'bg-green-600 hover:bg-green-700', header: 'bg-green-800', iconBg: 'bg-green-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700', header: 'bg-orange-800', iconBg: 'bg-orange-100' },
};

export default function CreatePersonPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [step, setStep] = useState<'select' | 'form'>('select');
  const [personType, setPersonType] = useState<PersonType>('missing');
  const [camps, setCamps] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; fileName: string }>>([]);

  const [form, setForm] = useState({
    fullName: '', age: '', dateOfBirth: '', gender: '', ethnicity: '', languages: '',
    fatherName: '', motherName: '', originLocation: '', physicalDescription: '',
    medicalConditions: '', description: '', contactPerson: '', contactPhone: '',
    imageUrl: '',
    // missing-only
    title: '', dateMissing: '', lastKnownLocation: '', circumstances: '',
    urgencyLevel: 'medium', status: 'active',
    // refugee/displaced-only
    arrivalDate: '', dossierNumber: '', reunificationStatus: 'pending', campId: '',
  });

  useEffect(() => {
    if (step === 'form' && (personType === 'refugee' || personType === 'displaced')) {
      fetch(`/api/camps?type=${personType}&pageSize=100`)
        .then(r => r.json())
        .then(d => setCamps(d.camps ?? []))
        .catch(() => {});
    }
  }, [step, personType]);

  if (!session?.user || !isAgent) return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <p className="text-gray-500">Réservé aux agents connectés.</p>
      <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">Se connecter</Link>
    </div>
  );

  const colors = COLOR_MAP[TYPE_OPTIONS.find(t => t.value === personType)!.color as keyof typeof COLOR_MAP];
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.currentTarget.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', files[i]);
      try {
        const res = await fetch('/api/missing-persons/temp/photos', { method: 'POST', body: fd });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur upload.'); break; }
        const photo = await res.json();
        setUploadedPhotos(p => [...p, photo]);
      } catch { setError('Erreur upload.'); }
      finally { setUploading(false); }
    }
    e.currentTarget.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const endpoint = personType === 'missing' ? '/api/missing-persons' : '/api/refugees';
    const body = personType === 'missing'
      ? { ...form, age: form.age ? parseInt(form.age) : null, dateOfBirth: form.dateOfBirth || null, lastKnownLocation: form.lastKnownLocation || null, physicalDescription: form.physicalDescription || null, medicalConditions: form.medicalConditions || null, contactPerson: form.contactPerson || null, contactPhone: form.contactPhone || null, gender: form.gender || null, ethnicity: form.ethnicity || null, languages: form.languages || null, circumstances: form.circumstances || null, fatherName: form.fatherName || null, motherName: form.motherName || null, originLocation: form.originLocation || null, imageUrl: form.imageUrl || null }
      : { ...form, personType, age: form.age ? parseInt(form.age) : null, dateOfBirth: form.dateOfBirth || null, arrivalDate: form.arrivalDate || null, dossierNumber: form.dossierNumber || null, campId: form.campId || null, contactPerson: form.contactPerson || null, contactPhone: form.contactPhone || null, gender: form.gender || null, ethnicity: form.ethnicity || null, languages: form.languages || null, fatherName: form.fatherName || null, motherName: form.motherName || null, physicalDescription: form.physicalDescription || null, medicalConditions: form.medicalConditions || null, imageUrl: form.imageUrl || null };

    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); setSubmitting(false); return; }
    const person = await res.json();

    for (const photo of uploadedPhotos) {
      await fetch(`/api/missing-persons/${person.id}/photos/from-temp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempFileName: photo.id }),
      });
    }

    const dest = personType === 'missing' ? `/missing/${person.id}` : `/${personType === 'refugee' ? 'refugees' : 'displaced'}/${person.id}`;
    router.push(dest);
  }

  const field = (label: string, name: string, opts?: { type?: string; required?: boolean; rows?: number }) => (
    <div key={name}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{opts?.required ? ' *' : ''}</label>
      {opts?.rows ? (
        <textarea rows={opts.rows} name={name} required={opts?.required} value={(form as any)[name]} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <input type={opts?.type ?? 'text'} name={name} required={opts?.required} value={(form as any)[name]} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );

  if (step === 'select') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-800 text-white p-6">
            <h1 className="text-2xl font-bold">Nouvelle fiche</h1>
            <p className="text-blue-200 mt-1">Sélectionnez le type de fiche à créer</p>
          </div>
          <div className="p-6 space-y-4">
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const c = COLOR_MAP[opt.color as keyof typeof COLOR_MAP];
              const selected = personType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPersonType(opt.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selected ? `${c.border} ${c.bg}` : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selected ? c.iconBg : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${selected ? c.text : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${selected ? c.text : 'text-gray-800'}`}>{opt.label}</p>
                      <p className="text-sm text-gray-500">{opt.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="flex justify-between pt-4">
              <Link href="/" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Annuler</Link>
              <button onClick={() => setStep('form')} className={`${colors.btn} text-white px-6 py-2 rounded-lg`}>
                Continuer →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`${colors.header} text-white p-6`}>
          <button onClick={() => setStep('select')} className="text-sm opacity-70 hover:opacity-100 mb-1 flex items-center gap-1">← Changer le type</button>
          <h1 className="text-2xl font-bold">
            {personType === 'missing' ? 'Fiche personne disparue' : personType === 'refugee' ? 'Fiche réfugié' : 'Fiche déplacé interne'}
          </h1>
        </div>
        <div className="p-6">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations communes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personType === 'missing' && field('Titre de l\'avis', 'title', { required: true })}
                {field('Nom complet', 'fullName', { required: true })}
                {field('Âge', 'age', { type: 'number' })}
                {field('Date de naissance', 'dateOfBirth', { type: 'date' })}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Non précisé</option>
                    <option value="male">Masculin</option>
                    <option value="female">Féminin</option>
                  </select>
                </div>
                {field('Ethnie / Tribu', 'ethnicity')}
                {field('Langues parlées', 'languages')}
                {field('Province / Lieu d\'origine', 'originLocation')}
                {field('Nom du père', 'fatherName')}
                {field('Nom de la mère', 'motherName')}
              </div>
            </div>

            {/* Champs spécifiques personnes disparues */}
            {personType === 'missing' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold mb-4 text-blue-800">Détails de la disparition</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('Date de disparition', 'dateMissing', { type: 'date', required: true })}
                  {field('Dernier lieu connu', 'lastKnownLocation')}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
                    <select name="urgencyLevel" value={form.urgencyLevel} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Élevé</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="active">Disparue</option>
                      <option value="found">Retrouvée</option>
                      <option value="closed">Fermé</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  {field('Circonstances de la disparition', 'circumstances', { rows: 3 })}
                </div>
              </div>
            )}

            {/* Champs spécifiques réfugié / déplacé */}
            {(personType === 'refugee' || personType === 'displaced') && (
              <div className={`p-4 rounded-lg border ${personType === 'refugee' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                <h3 className={`font-semibold mb-4 ${personType === 'refugee' ? 'text-green-800' : 'text-orange-800'}`}>
                  Informations d'enregistrement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('Date d\'arrivée / déplacement', 'arrivalDate', { type: 'date' })}
                  {field('Numéro de dossier', 'dossierNumber')}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut réunification</label>
                    <select name="reunificationStatus" value={form.reunificationStatus} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="pending">En attente</option>
                      <option value="in_progress">En cours</option>
                      <option value="reunified">Réunifié</option>
                      <option value="closed">Fermé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Camp d'affectation</label>
                    <select name="campId" value={form.campId} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option value="">Aucun / Non affecté</option>
                      {camps.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.location}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Description commune */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Description</h3>
              <div className="space-y-4">
                {field('Description générale', 'description', { required: true, rows: 4 })}
                {field('Description physique (taille, corpulence, signes distinctifs)', 'physicalDescription', { rows: 3 })}
                {field('Conditions médicales', 'medicalConditions', { rows: 2 })}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                {field('Personne à contacter', 'contactPerson')}
                {field('Téléphone', 'contactPhone')}
              </div>
            </div>

            {/* Photos */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Photo</h3>
              {field("URL de l'image (optionnel)", 'imageUrl')}
              <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">Télécharger des photos</span>
                  <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</p>
              </div>
              {uploading && <div className="mt-3 flex items-center gap-2 text-sm text-blue-600"><Loader2 className="h-4 w-4 animate-spin" />Téléchargement...</div>}
              {uploadedPhotos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedPhotos.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                      <span className="text-sm text-gray-600">{p.fileName}</span>
                      <button type="button" onClick={() => setUploadedPhotos(prev => prev.filter(x => x.id !== p.id))} className="text-red-600 hover:text-red-800">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep('select')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Retour</button>
              <button type="submit" disabled={submitting} className={`${colors.btn} text-white px-6 py-2 rounded-lg disabled:opacity-50`}>
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Création...</span> : 'Créer la fiche'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
