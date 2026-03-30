'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const EMPTY = {
  name: '', type: 'refugee', location: '', province: '',
  capacity: '', currentOccupancy: '', status: 'active',
  latitude: '', longitude: '',
  contactPerson: '', contactPhone: '', description: '',
};

export default function CreateCampPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!session?.user || !isAgent) return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <p className="text-gray-500">Réservé aux agents connectés.</p>
      <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">Se connecter</Link>
    </div>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    const res = await fetch('/api/camps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); setSubmitting(false); return; }
    const camp = await res.json();
    router.push(`/camps/${camp.id}`);
  }

  const field = (label: string, name: string, opts?: { type?: string; required?: boolean; rows?: number; placeholder?: string }) => (
    <div key={name}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{opts?.required ? ' *' : ''}</label>
      {opts?.rows ? (
        <textarea rows={opts.rows} name={name} required={opts.required} value={(form as any)[name]} onChange={handleChange}
          placeholder={opts.placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      ) : (
        <input type={opts?.type ?? 'text'} name={name} required={opts?.required} value={(form as any)[name]} onChange={handleChange}
          placeholder={opts?.placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-800 text-white p-6">
          <h1 className="text-2xl font-bold">Nouveau camp</h1>
          <p className="text-indigo-200 mt-1">Enregistrer un camp de réfugiés ou de déplacés internes</p>
        </div>
        <div className="p-6">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Informations principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('Nom du camp', 'name', { required: true, placeholder: 'ex: Camp Mugunga' })}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de camp *</label>
                  <select name="type" value={form.type} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="refugee">Camp de réfugiés</option>
                    <option value="displaced">Camp de déplacés internes</option>
                  </select>
                </div>
                {field('Localisation / Ville', 'location', { required: true, placeholder: 'ex: Goma' })}
                {field('Province', 'province', { placeholder: 'ex: Nord-Kivu' })}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Capacité et statut</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {field('Capacité totale', 'capacity', { type: 'number', placeholder: 'ex: 5000' })}
                {field('Occupation actuelle', 'currentOccupancy', { type: 'number', placeholder: 'ex: 3200' })}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="active">Actif</option>
                    <option value="full">Plein</option>
                    <option value="closed">Fermé</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Coordonnées GPS (optionnel)</h3>
              <div className="grid grid-cols-2 gap-4">
                {field('Latitude', 'latitude', { type: 'number', placeholder: 'ex: -1.6797' })}
                {field('Longitude', 'longitude', { type: 'number', placeholder: 'ex: 29.2228' })}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Contact et description</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {field('Personne de contact', 'contactPerson', { placeholder: 'Nom du responsable' })}
                {field('Téléphone', 'contactPhone')}
              </div>
              {field('Description du camp', 'description', { rows: 3, placeholder: 'Informations supplémentaires, services disponibles...' })}
            </div>

            <div className="flex justify-between">
              <Link href="/camps" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Annuler</Link>
              <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : 'Créer le camp'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
