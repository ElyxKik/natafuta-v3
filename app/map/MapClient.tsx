'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Tent, Users, Globe, MapPin, AlertTriangle, X, Filter, Layers, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Camp {
  id: string; name: string; type: string; location: string; province?: string;
  capacity?: number; currentOccupancy?: number; status: string;
  lat: number; lng: number;
  contactPerson?: string; contactPhone?: string;
  _count: { persons: number };
}

interface Person {
  id: string; fullName: string; personType: string; age?: number; gender?: string;
  lastKnownLocation?: string; originLocation?: string;
  urgencyLevel: string; reunificationStatus?: string;
  dossierNumber?: string; arrivalDate?: string;
  ethnicity?: string;
  camp?: { id: string; name: string; location: string };
  lat: number; lng: number;
}

interface MapStats {
  totalCamps: number; totalRefugees: number; totalDisplaced: number;
  byProvince: Record<string, { refugees: number; displaced: number }>;
}

interface MapData { camps: Camp[]; persons: Person[]; stats: MapStats; }

// Couleurs par type
const URGENCY_COLOR: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e',
};

const REUNIF_LABEL: Record<string, string> = {
  pending: 'En attente', in_progress: 'En cours', reunified: 'Réunifié ✓', closed: 'Fermé',
};

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 10, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

function CampIcon(type: string) {
  const color = type === 'refugee' ? '#3b82f6' : '#f59e0b';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="36" viewBox="0 0 30 36">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 21 15 21S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <text x="15" y="20" text-anchor="middle" font-size="14" fill="white">⛺</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [30, 36],
    iconAnchor: [15, 36],
    popupAnchor: [0, -36],
    className: '',
  });
}

export default function MapClient() {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCamps, setShowCamps] = useState(true);
  const [showRefugees, setShowRefugees] = useState(true);
  const [showDisplaced, setShowDisplaced] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [selected, setSelected] = useState<Camp | Person | null>(null);
  const [selectedType, setSelectedType] = useState<'camp' | 'person' | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/map-data');
      if (!res.ok) throw new Error('Erreur chargement');
      setData(await res.json());
    } catch (e) {
      setError('Impossible de charger les données cartographiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPersons = data?.persons.filter(p => {
    if (!showRefugees && p.personType === 'refugee') return false;
    if (!showDisplaced && p.personType === 'displaced') return false;
    if (filterUrgency !== 'all' && p.urgencyLevel !== filterUrgency) return false;
    if (search && !p.fullName.toLowerCase().includes(search.toLowerCase()) &&
        !(p.dossierNumber?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }) ?? [];

  const filteredCamps = data?.camps.filter(c => {
    if (!showCamps) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) ?? [];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <MapPin className="h-8 w-8 text-blue-300 animate-pulse" />
      </div>
      <p className="text-gray-400 font-medium">Chargement de la carte...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-3">
      <AlertTriangle className="h-10 w-10 text-red-400" />
      <p className="text-red-500">{error}</p>
      <button onClick={fetchData} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <RefreshCw className="h-4 w-4" /> Réessayer
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" /> Carte humanitaire RDC
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Réfugiés, déplacés internes et camps actifs</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm border border-gray-200 hover:border-blue-300 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
        >
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Tent className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{data.stats.totalCamps}</p>
              <p className="text-xs text-gray-500">Camps actifs</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{data.stats.totalRefugees}</p>
              <p className="text-xs text-gray-500">Réfugiés</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{data.stats.totalDisplaced}</p>
              <p className="text-xs text-gray-500">Déplacés internes</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">

        {/* Sidebar filtres */}
        <div className="w-64 shrink-0 flex flex-col gap-3">

          {/* Recherche */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <input
              type="text"
              placeholder="Rechercher un nom, N° dossier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Couches */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Couches
            </p>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${showCamps ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}
                  onClick={() => setShowCamps(!showCamps)}>
                  {showCamps && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  Camps
                  <span className="text-xs text-gray-400">({filteredCamps.length})</span>
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${showRefugees ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                  onClick={() => setShowRefugees(!showRefugees)}>
                  {showRefugees && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  Réfugiés
                  <span className="text-xs text-gray-400">({data?.persons.filter(p=>p.personType==='refugee').length ?? 0})</span>
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${showDisplaced ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}
                  onClick={() => setShowDisplaced(!showDisplaced)}>
                  {showDisplaced && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="flex items-center gap-1.5 text-sm text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                  Déplacés internes
                  <span className="text-xs text-gray-400">({data?.persons.filter(p=>p.personType==='displaced').length ?? 0})</span>
                </span>
              </label>
            </div>
          </div>

          {/* Filtre urgence */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Urgence
            </p>
            <div className="space-y-1.5">
              {['all', 'critical', 'high', 'medium', 'low'].map(u => (
                <button
                  key={u}
                  onClick={() => setFilterUrgency(u)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${filterUrgency === u ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}
                >
                  {u !== 'all' && <span className="w-2.5 h-2.5 rounded-full" style={{ background: URGENCY_COLOR[u] }} />}
                  {u === 'all' ? 'Toutes' : u === 'critical' ? 'Critique' : u === 'high' ? 'Élevée' : u === 'medium' ? 'Moyenne' : 'Faible'}
                </button>
              ))}
            </div>
          </div>

          {/* Légende */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Légende</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2"><span className="text-base">⛺</span> Camp réfugiés (bleu)</div>
              <div className="flex items-center gap-2"><span className="text-base">⛺</span> Camp déplacés (orange)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Réfugié</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Déplacé interne</div>
              <p className="mt-2 text-gray-400 font-medium">Taille cercle = urgence</p>
            </div>
          </div>
        </div>

        {/* Carte */}
        <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-gray-200 shadow-lg" style={{ minHeight: 520 }}>
          <MapContainer
            center={[-4.0, 24.0]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ZoomControl position="topright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Fly to selected */}
            {flyTo && <FlyTo lat={flyTo[0]} lng={flyTo[1]} />}

            {/* Camps */}
            {filteredCamps.map(camp => (
              <Marker
                key={camp.id}
                position={[camp.lat, camp.lng]}
                icon={CampIcon(camp.type)}
                eventHandlers={{
                  click: () => {
                    setSelected(camp);
                    setSelectedType('camp');
                    setFlyTo([camp.lat, camp.lng]);
                  },
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <p className="font-bold text-gray-800">{camp.name}</p>
                    <p className="text-xs text-gray-500">{camp.location}</p>
                    <p className="text-xs mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${camp.type === 'refugee' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                        {camp.type === 'refugee' ? 'Réfugiés' : 'Déplacés'}
                      </span>
                    </p>
                    <p className="text-xs mt-1 text-gray-600">{camp._count.persons} personnes enregistrées</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Personnes */}
            {filteredPersons.map(person => {
              const color = person.personType === 'refugee' ? '#3b82f6' : '#f97316';
              const urgencyRadius: Record<string, number> = { critical: 10, high: 8, medium: 6, low: 5 };
              const radius = urgencyRadius[person.urgencyLevel] ?? 6;
              return (
                <CircleMarker
                  key={person.id}
                  center={[person.lat, person.lng]}
                  radius={radius}
                  pathOptions={{
                    color: 'white',
                    weight: 1.5,
                    fillColor: color,
                    fillOpacity: 0.85,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelected(person);
                      setSelectedType('person');
                      setFlyTo([person.lat, person.lng]);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[160px]">
                      <p className="font-bold text-gray-800">{person.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {person.personType === 'refugee' ? 'Réfugié' : 'Déplacé interne'}
                        {person.age ? ` · ${person.age} ans` : ''}
                      </p>
                      {person.dossierNumber && <p className="text-xs text-gray-400 mt-0.5">N° {person.dossierNumber}</p>}
                      {person.camp && <p className="text-xs mt-1 text-blue-600">⛺ {person.camp.name}</p>}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Panel détail flottant */}
          {selected && (
            <div className="absolute bottom-4 left-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[1000]">
              <div className={`px-4 py-3 flex items-center justify-between ${selectedType === 'camp' ? 'bg-amber-50 border-b border-amber-100' : (selected as Person).personType === 'refugee' ? 'bg-blue-50 border-b border-blue-100' : 'bg-orange-50 border-b border-orange-100'}`}>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{(selected as any).name || (selected as any).fullName}</p>
                  <p className="text-xs text-gray-500">
                    {selectedType === 'camp'
                      ? `Camp · ${(selected as Camp).location}`
                      : (selected as Person).personType === 'refugee' ? 'Réfugié' : 'Déplacé interne'
                    }
                  </p>
                </div>
                <button onClick={() => { setSelected(null); setSelectedType(null); setFlyTo(null); }}
                  className="p-1 rounded-lg hover:bg-black/5 transition-colors">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-2 text-sm">
                {selectedType === 'camp' && (() => {
                  const c = selected as Camp;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Capacité</p>
                          <p className="font-bold text-gray-700">{c.capacity ?? '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">Occupation</p>
                          <p className="font-bold text-gray-700">{c._count.persons}</p>
                        </div>
                      </div>
                      {c.capacity && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Taux d'occupation</span>
                            <span>{Math.round((c._count.persons / c.capacity) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${(c._count.persons / c.capacity) > 0.9 ? 'bg-red-500' : (c._count.persons / c.capacity) > 0.7 ? 'bg-orange-400' : 'bg-green-400'}`}
                              style={{ width: `${Math.min(100, Math.round((c._count.persons / c.capacity) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {c.contactPerson && <p className="text-xs text-gray-500">Contact : {c.contactPerson} {c.contactPhone ? `· ${c.contactPhone}` : ''}</p>}
                      <Link href={`/camps/${c.id}`} className="block w-full text-center text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg transition-colors font-medium mt-1">
                        Voir le camp →
                      </Link>
                    </>
                  );
                })()}
                {selectedType === 'person' && (() => {
                  const p = selected as Person;
                  return (
                    <>
                      <div className="space-y-1">
                        {p.age && <p className="text-xs text-gray-500">Âge : <span className="text-gray-700 font-medium">{p.age} ans</span></p>}
                        {p.dossierNumber && <p className="text-xs text-gray-500">Dossier : <span className="text-gray-700 font-mono">{p.dossierNumber}</span></p>}
                        {p.originLocation && <p className="text-xs text-gray-500">Origine : <span className="text-gray-700">{p.originLocation}</span></p>}
                        {p.ethnicity && <p className="text-xs text-gray-500">Ethnie : <span className="text-gray-700">{p.ethnicity}</span></p>}
                        {p.camp && <p className="text-xs text-gray-500">Camp : <span className="text-blue-600 font-medium">⛺ {p.camp.name}</span></p>}
                        {p.reunificationStatus && (
                          <p className="text-xs text-gray-500">Réunification :
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${p.reunificationStatus === 'reunified' ? 'bg-green-100 text-green-700' : p.reunificationStatus === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                              {REUNIF_LABEL[p.reunificationStatus] ?? p.reunificationStatus}
                            </span>
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: URGENCY_COLOR[p.urgencyLevel] ?? '#6b7280' }} />
                          <span className="text-xs text-gray-500">Urgence : {p.urgencyLevel === 'critical' ? 'Critique' : p.urgencyLevel === 'high' ? 'Élevée' : p.urgencyLevel === 'medium' ? 'Moyenne' : 'Faible'}</span>
                        </div>
                      </div>
                      <Link
                        href={p.personType === 'refugee' ? `/refugees/${p.id}` : `/displaced/${p.id}`}
                        className="block w-full text-center text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors font-medium mt-1"
                      >
                        Voir la fiche →
                      </Link>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
