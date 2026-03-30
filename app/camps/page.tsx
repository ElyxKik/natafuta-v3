'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Tent, Filter, ChevronLeft, ChevronRight, Plus, Users, MapPin } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = { refugee: 'Réfugiés', displaced: 'Déplacés internes' };
const STATUS_LABELS: Record<string, string> = { active: 'Actif', closed: 'Fermé', full: 'Plein' };
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
  full: 'bg-yellow-100 text-yellow-800',
};
const TYPE_COLORS: Record<string, string> = {
  refugee: 'bg-green-700',
  displaced: 'bg-orange-700',
};

export default function CampsPage() {
  const { data: session } = useSession();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [camps, setCamps] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [province, setProvince] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (province) params.set('province', province);
    const res = await fetch(`/api/camps?${params}`);
    const data = await res.json();
    setCamps(data.camps ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [search, type, status, province, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Tent className="h-8 w-8 text-indigo-600" />
            Camps
          </h1>
          <p className="text-gray-500 mt-1">{total} camp(s) enregistré(s)</p>
        </div>
        {isAgent && (
          <Link href="/camps/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="h-4 w-4" /> Nouveau camp
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un camp..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="outline-none text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous types</option>
            <option value="refugee">Réfugiés</option>
            <option value="displaced">Déplacés internes</option>
          </select>
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="full">Plein</option>
          <option value="closed">Fermé</option>
        </select>
        <input type="text" placeholder="Province..." value={province}
          onChange={e => { setProvince(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-lg shadow h-48 animate-pulse" />)}
        </div>
      ) : camps.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Tent className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun camp enregistré.</p>
          {isAgent && <Link href="/camps/create" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">Créer un camp →</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camps.map(c => {
            const occupancy = c.capacity ? Math.round((c.currentOccupancy / c.capacity) * 100) : null;
            return (
              <Link key={c.id} href={`/camps/${c.id}`} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className={`${TYPE_COLORS[c.type] ?? 'bg-indigo-700'} text-white px-4 py-2 flex items-center justify-between`}>
                  <span className="text-xs font-medium uppercase tracking-wide">{TYPE_LABELS[c.type] ?? c.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{c.location}{c.province ? `, ${c.province}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {c.currentOccupancy ?? 0} personnes
                      {c.capacity ? ` / capacité ${c.capacity}` : ''}
                    </span>
                  </div>
                  {occupancy !== null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Occupation</span><span>{occupancy}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {c.contactPerson && <p className="text-xs text-gray-400 mt-2">Contact : {c.contactPerson}</p>}
                </div>
              </Link>
            );
          })}
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
