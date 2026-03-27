'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PersonCard } from '@/components/PersonCard';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface MissingPerson {
  id: string; title: string; fullName: string; imageUrl?: string | null;
  lastKnownLocation?: string | null; dateMissing: string;
  urgencyLevel: string; status: string; createdAt: string;
}

export default function MissingPersonListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [persons, setPersons] = useState<MissingPerson[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const urgencyLevel = searchParams.get('urgency_level') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  const fetchPersons = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (urgencyLevel) params.set('urgency_level', urgencyLevel);
    params.set('page', String(page));
    const res = await fetch(`/api/missing-persons?${params}`);
    const data = await res.json();
    setPersons(data.persons ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [search, status, urgencyLevel, page]);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete('page');
    router.push(`/missing?${params}`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Rechercher..." defaultValue={search}
              onKeyDown={(e) => { if (e.key === 'Enter') updateParams({ search: (e.target as HTMLInputElement).value }); }}
              onBlur={(e) => updateParams({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
            <Filter className="h-4 w-4" /> Filtres
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={status} onChange={(e) => updateParams({ status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tous les statuts</option>
                <option value="active">Disparue</option>
                <option value="found">Retrouvée</option>
                <option value="closed">Dossier fermé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgence</label>
              <select value={urgencyLevel} onChange={(e) => updateParams({ urgency_level: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Toutes urgences</option>
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-gray-600">{total} personne{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}</p>
        {(search || status || urgencyLevel) && <Link href="/missing" className="text-blue-600 hover:text-blue-800 text-sm">Effacer les filtres</Link>}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-lg shadow-md h-64 animate-pulse" />)}
        </div>
      ) : persons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {persons.map((p) => (
            <PersonCard key={p.id} id={p.id} title={p.title} fullName={p.fullName}
              imageUrl={p.imageUrl} lastKnownLocation={p.lastKnownLocation}
              dateMissing={p.dateMissing} urgencyLevel={p.urgencyLevel}
              status={p.status} createdAt={p.createdAt} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune personne disparue trouvée.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Link href={`/missing?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}`}
            className={`p-2 rounded-lg ${page <= 1 ? 'text-gray-300 pointer-events-none' : 'hover:bg-gray-200'}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/missing?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(p) })}`}
              className={`px-3 py-1 rounded-lg ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}>{p}</Link>
          ))}
          <Link href={`/missing?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}`}
            className={`p-2 rounded-lg ${page >= totalPages ? 'text-gray-300 pointer-events-none' : 'hover:bg-gray-200'}`}>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
