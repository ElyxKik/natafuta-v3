'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Globe, Filter, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const REUNIFICATION_LABELS: Record<string, string> = {
  pending: 'En attente', in_progress: 'En cours', reunified: 'Réunifié', closed: 'Fermé',
};
const REUNIFICATION_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800',
  reunified: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-700',
};

export default function RefugeesPage() {
  const { data: session } = useSession();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [persons, setPersons] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [reunificationStatus, setReunificationStatus] = useState('');
  const [province, setProvince] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ personType: 'refugee', page: String(page) });
    if (search) params.set('search', search);
    if (reunificationStatus) params.set('reunificationStatus', reunificationStatus);
    if (province) params.set('province', province);
    const res = await fetch(`/api/refugees?${params}`);
    const data = await res.json();
    setPersons(data.persons ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [search, reunificationStatus, province, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-8 w-8 text-green-600" />
            Réfugiés enregistrés
          </h1>
          <p className="text-gray-500 mt-1">{total} enregistrement(s)</p>
        </div>
        {isAgent && (
          <Link href="/create" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" /> Nouvelle fiche
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Rechercher..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="outline-none text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={reunificationStatus} onChange={e => { setReunificationStatus(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="reunified">Réunifié</option>
            <option value="closed">Fermé</option>
          </select>
        </div>
        <input type="text" placeholder="Province..." value={province}
          onChange={e => { setProvince(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-lg shadow h-40 animate-pulse" />)}
        </div>
      ) : persons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun réfugié enregistré.</p>
          {isAgent && <Link href="/create" className="text-green-600 hover:text-green-800 mt-2 inline-block">Créer une fiche →</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {persons.map(p => (
            <Link key={p.id} href={`/refugees/${p.id}`} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="bg-green-700 text-white px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide">Réfugié</span>
                {p.reunificationStatus && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${REUNIFICATION_COLORS[p.reunificationStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                    {REUNIFICATION_LABELS[p.reunificationStatus] ?? p.reunificationStatus}
                  </span>
                )}
              </div>
              <div className="p-4 flex gap-3">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.fullName} className="w-14 h-14 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Globe className="h-7 w-7 text-green-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{p.fullName}</h3>
                  {p.age && <p className="text-sm text-gray-500">{p.age} ans · {p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : '?'}</p>}
                  {p.originLocation && <p className="text-xs text-gray-400 mt-1 truncate">Origine : {p.originLocation}</p>}
                  {p.camp && <p className="text-xs text-green-600 mt-1 truncate">Camp : {p.camp.name}</p>}
                  {p.dossierNumber && <p className="text-xs text-gray-400 mt-0.5">Dossier : {p.dossierNumber}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>
          <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-sm disabled:opacity-40">
            Suivant <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
