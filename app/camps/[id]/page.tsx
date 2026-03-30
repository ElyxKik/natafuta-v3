'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MapPin, Users, Phone, Tent, Globe, Edit2, Loader2, ChevronLeft, ArrowRight } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = { refugee: 'Réfugiés', displaced: 'Déplacés internes' };
const STATUS_LABELS: Record<string, string> = { active: 'Actif', closed: 'Fermé', full: 'Plein' };
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800', closed: 'bg-red-100 text-red-800', full: 'bg-yellow-100 text-yellow-800',
};
const REUNI_LABELS: Record<string, string> = {
  pending: 'En attente', in_progress: 'En cours', reunified: 'Réunifié', closed: 'Fermé',
};
const REUNI_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800',
  reunified: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-700',
};

export default function CampDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch(`/api/camps/${id}`)
      .then(r => r.json())
      .then(d => {
        setCamp(d);
        setForm({
          name: d.name ?? '', type: d.type ?? 'refugee', location: d.location ?? '',
          province: d.province ?? '', capacity: d.capacity ?? '', currentOccupancy: d.currentOccupancy ?? 0,
          status: d.status ?? 'active', contactPerson: d.contactPerson ?? '',
          contactPhone: d.contactPhone ?? '', description: d.description ?? '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch(`/api/camps/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur.'); setSaving(false); return; }
    const updated = await res.json();
    setCamp((prev: any) => ({ ...prev, ...updated }));
    setEditing(false); setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce camp ? Cette action est irréversible.')) return;
    await fetch(`/api/camps/${id}`, { method: 'DELETE' });
    router.push('/camps');
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );

  if (!camp || camp.error) return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <p className="text-gray-500">Camp introuvable.</p>
      <Link href="/camps" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">← Retour aux camps</Link>
    </div>
  );

  const occupancy = camp.capacity ? Math.round((camp.currentOccupancy / camp.capacity) * 100) : null;
  const typeColor = camp.type === 'refugee' ? 'bg-green-700' : 'bg-orange-700';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`${typeColor} text-white p-6`}>
          <Link href="/camps" className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1 mb-3">
            <ChevronLeft className="h-4 w-4" /> Retour aux camps
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Tent className="h-6 w-6" />
                <span className="text-sm font-medium opacity-80">{TYPE_LABELS[camp.type] ?? camp.type}</span>
              </div>
              <h1 className="text-3xl font-bold">{camp.name}</h1>
              <div className="flex items-center gap-1 mt-2 opacity-80 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{camp.location}{camp.province ? `, ${camp.province}` : ''}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[camp.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[camp.status] ?? camp.status}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{camp.currentOccupancy ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Personnes enregistrées</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{camp.capacity ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Capacité totale</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{camp._count?.persons ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Fiches dans le système</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{occupancy !== null ? `${occupancy}%` : '—'}</p>
            <p className="text-xs text-gray-500 mt-1">Taux d'occupation</p>
          </div>
        </div>

        {/* Barre d'occupation */}
        {occupancy !== null && (
          <div className="px-6 pb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(occupancy, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Infos + Edit */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Informations</h3>
            {camp.contactPerson && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span>{camp.contactPerson}</span>
              </div>
            )}
            {camp.contactPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{camp.contactPhone}</span>
              </div>
            )}
            {camp.latitude && camp.longitude && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{camp.latitude.toFixed(4)}, {camp.longitude.toFixed(4)}</span>
              </div>
            )}
            {camp.description && (
              <p className="text-sm text-gray-600 mt-3 border-t pt-3">{camp.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">Créé par {camp.createdBy?.name ?? '—'}</p>
          </div>

          {isAgent && (
            <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <button onClick={() => setEditing(true)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                <Edit2 className="h-4 w-4" /> Modifier le camp
              </button>
              <button onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm transition-colors">
                Supprimer le camp
              </button>
            </div>
          )}
        </div>

        {/* Personnes dans le camp */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4">
              Personnes enregistrées ({camp.persons?.length ?? 0})
            </h3>
            {(!camp.persons || camp.persons.length === 0) ? (
              <p className="text-gray-500 text-sm text-center py-8">Aucune personne enregistrée dans ce camp.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {camp.persons.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/${p.personType === 'refugee' ? 'refugees' : 'displaced'}/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${p.personType === 'refugee' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        {p.personType === 'refugee' ? <Globe className="h-5 w-5 text-green-500" /> : <MapPin className="h-5 w-5 text-orange-500" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.fullName}</p>
                      <p className="text-xs text-gray-500">{p.age ? `${p.age} ans · ` : ''}{p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : ''}{p.originLocation ? ` · ${p.originLocation}` : ''}</p>
                    </div>
                    {p.reunificationStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${REUNI_COLORS[p.reunificationStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                        {REUNI_LABELS[p.reunificationStatus] ?? p.reunificationStatus}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-800 text-white p-4 rounded-t-lg">
              <h2 className="text-lg font-bold">Modifier le camp</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm">{error}</div>}
              {[
                ['Nom du camp', 'name', 'text'],
                ['Localisation', 'location', 'text'],
                ['Province', 'province', 'text'],
                ['Capacité', 'capacity', 'number'],
                ['Occupation actuelle', 'currentOccupancy', 'number'],
                ['Personne de contact', 'contactPerson', 'text'],
                ['Téléphone', 'contactPhone', 'text'],
              ].map(([label, name, type]) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} name={name} value={form[name] ?? ''} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select name="status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="active">Actif</option>
                  <option value="full">Plein</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setEditing(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Annuler</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Sauvegarde...</> : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
