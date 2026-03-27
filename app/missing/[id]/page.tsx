'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { User, Users, MapPin, Calendar, Phone, AlertTriangle, Loader2, ChevronLeft, Edit2, Trash2, Brain, Image as ImageIcon, X, Link2, FileText } from 'lucide-react';
import { UrgencyBadge, StatusBadge, SightingStatusBadge } from '@/components/UrgencyBadge';

interface Sighting {
  id: string; content: string; location?: string | null; contactInfo?: string | null;
  status: string; submittedAt: string; submittedBy?: { name?: string | null } | null;
}
interface FamilyMember {
  id: string; fullName: string; relationship: string; age?: number | null;
  matches: { confidenceScore: number; status: string }[];
}
interface CrossLink {
  missingPersonId: string; missingPersonName: string;
  relationship: string; confidence: number; reasons: string[];
}
interface MissingPerson {
  id: string; title: string; fullName: string; age?: number | null;
  dateMissing: string; lastKnownLocation?: string | null; description: string;
  physicalDescription?: string | null; medicalConditions?: string | null;
  contactPerson?: string | null; contactPhone?: string | null;
  urgencyLevel: string; status: string; imageUrl?: string | null; createdAt: string;
  aiCrossLinks?: string | null;
  sightings: Sighting[]; familyMembersSearching: FamilyMember[];
}

const REL_LABELS: Record<string, string> = {
  parent: 'Parent', child: 'Enfant', sibling: 'Frère/Sœur', spouse: 'Conjoint(e)',
  grandparent: 'Grand-parent', grandchild: 'Petit-enfant', aunt_uncle: 'Oncle/Tante',
  cousin: 'Cousin(e)', other: 'Autre',
};

export default function MissingPersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Array<{ id: string; fileName: string }>>([]);
  const [sighting, setSighting] = useState({ content: '', location: '', contactInfo: '' });
  const [sightingOk, setSightingOk] = useState(false);
  const [sightingSending, setSightingSending] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [fam, setFam] = useState({ fullName: '', relationship: 'parent', age: '', contactInfo: '', location: '', physicalDescription: '' });
  const [famSending, setFamSending] = useState(false);
  const [crossLinks, setCrossLinks] = useState<CrossLink[]>([]);
  const [crossLinksLoading, setCrossLinksLoading] = useState(false);
  const [crossLinksRan, setCrossLinksRan] = useState(false);
  const [crossLinksSummary, setCrossLinksSummary] = useState('');

  useEffect(() => {
    fetch(`/api/missing-persons/${id}`).then((r) => r.json()).then((d) => {
      setPerson(d);
      setLoading(false);
      if (d.aiCrossLinks) {
        try { const parsed = JSON.parse(d.aiCrossLinks); setCrossLinks(parsed); setCrossLinksRan(true); } catch {}
      }
    }).catch(() => setLoading(false));
    
    // Load photos
    fetch(`/api/missing-persons/${id}/photos`).then((r) => r.json()).then((d) => {
      setPhotos(d);
    }).catch(() => {});
  }, [id]);

  async function handleDelete() {
    if (!confirm('Supprimer cette fiche ?')) return;
    await fetch(`/api/missing-persons/${id}`, { method: 'DELETE' });
    router.push('/missing');
  }

  async function handleSighting(e: React.FormEvent) {
    e.preventDefault();
    setSightingSending(true);
    await fetch('/api/sightings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missingPersonId: id, ...sighting }) });
    setSightingOk(true);
    setSighting({ content: '', location: '', contactInfo: '' });
    setSightingSending(false);
  }

  async function reviewSighting(sid: string, status: string) {
    await fetch('/api/sightings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sid, status }) });
    const res = await fetch(`/api/missing-persons/${id}`);
    setPerson(await res.json());
  }

  async function runAICrossLinks() {
    setCrossLinksLoading(true);
    try {
      const res = await fetch('/api/ai-matching/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missingPersonId: id }),
      });
      const d = await res.json();
      if (res.ok) {
        setCrossLinks(d.crossLinks ?? []);
        setCrossLinksSummary(d.groupSummary ?? '');
        setCrossLinksRan(true);
      }
    } finally {
      setCrossLinksLoading(false);
    }
  }

  async function handleFamilySubmit(e: React.FormEvent) {
    e.preventDefault();
    setFamSending(true);
    await fetch('/api/family-matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missingPersonId: id, ...fam }) });
    setFamSending(false);
    setShowFamilyForm(false);
    setFam({ fullName: '', relationship: 'parent', age: '', contactInfo: '', location: '', physicalDescription: '' });
    const res = await fetch(`/api/missing-persons/${id}`);
    setPerson(await res.json());
  }

  if (loading) return <div className="animate-pulse bg-white rounded-lg shadow-md h-96" />;
  if (!person) return <div className="bg-white rounded-lg shadow-md p-12 text-center"><p className="text-gray-500">Fiche introuvable.</p><Link href="/missing" className="text-blue-600 mt-2 inline-block">← Retour</Link></div>;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Accueil</Link> / <Link href="/missing" className="hover:text-blue-600">Recherche</Link> / <span>{person.title}</span>
      </nav>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-800 text-white p-6 flex justify-between items-start">
          <div><h1 className="text-2xl font-bold">{person.title}</h1><p className="text-blue-200 mt-1">Réf: #{person.id.slice(0, 8).toUpperCase()}</p></div>
          <div className="flex flex-col gap-2 items-end"><StatusBadge status={person.status} /><UrgencyBadge level={person.urgencyLevel} /></div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg h-56 flex items-center justify-center overflow-hidden">
              {person.imageUrl ? <img src={person.imageUrl} alt={person.title} className="w-full h-full object-cover" /> : <User className="h-20 w-20 text-gray-400" />}
            </div>
            
            {/* Photo Gallery */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Photos</h3>
              {photos.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-3">Aucune photo</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((p) => (
                    <img key={p.id} src={`/uploads/missing-persons/${p.fileName}`} alt="Photo" className="w-full h-24 object-cover rounded border" />
                  ))}
                </div>
              )}
              {isAgent && (
                <Link href={`/missing/${id}/edit`} className="text-xs text-blue-600 hover:text-blue-800 mt-3 inline-block">Ajouter des photos</Link>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2"><User className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-gray-500 text-xs">Nom</p><p className="font-semibold">{person.fullName}</p></div></div>
              <div className="flex gap-2"><Calendar className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-gray-500 text-xs">Disparue le</p><p className="font-semibold">{new Date(person.dateMissing).toLocaleDateString('fr-FR')}</p></div></div>
              {person.lastKnownLocation && <div className="flex gap-2"><MapPin className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-gray-500 text-xs">Dernier lieu</p><p className="font-semibold">{person.lastKnownLocation}</p></div></div>}
              {person.contactPhone && <div className="flex gap-2"><Phone className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-gray-500 text-xs">{person.contactPerson}</p><p className="font-semibold">{person.contactPhone}</p></div></div>}
            </div>
            {isAgent && (
              <div className="space-y-2">
                <Link href={`/missing/${id}/edit`} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"><Edit2 className="h-4 w-4" /> Modifier</Link>
                <button onClick={handleDelete} className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"><Trash2 className="h-4 w-4" /> Supprimer</button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div><h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> Description</h2><p className="text-gray-700 leading-relaxed">{person.description}</p></div>
            {person.physicalDescription && <div><h2 className="text-lg font-semibold mb-2">Signalement physique</h2><p className="text-gray-700">{person.physicalDescription}</p></div>}
            {person.medicalConditions && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                <h2 className="font-semibold text-orange-700 flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4" /> Conditions médicales</h2>
                <p className="text-orange-700">{person.medicalConditions}</p>
              </div>
            )}
            {person.sightings.filter(s => s.status === 'verified').length > 0 && (
              <div><h2 className="text-lg font-semibold mb-2">Signalements vérifiés</h2>
                {person.sightings.filter(s => s.status === 'verified').map(s => (
                  <div key={s.id} className="bg-green-50 border border-green-200 rounded p-3 mb-2"><p className="text-gray-700">{s.content}</p>{s.location && <p className="text-xs text-gray-500 mt-1"><MapPin className="inline h-3 w-3 mr-1" />{s.location}</p>}</div>
                ))}
              </div>
            )}
            {isAgent && (
              <div><h2 className="text-lg font-semibold mb-2">Tous les signalements</h2>
                {person.sightings.length === 0 ? <p className="text-gray-500 text-sm">Aucun signalement.</p> : person.sightings.map(s => (
                  <div key={s.id} className="bg-gray-50 border rounded p-3 mb-2 flex justify-between items-start">
                    <div><p className="text-gray-700 text-sm">{s.content}</p>{s.location && <p className="text-xs text-gray-500 mt-1"><MapPin className="inline h-3 w-3 mr-1" />{s.location}</p>}</div>
                    <div className="flex flex-col gap-1 ml-4 items-end">
                      <SightingStatusBadge status={s.status} />
                      {s.status === 'pending' && (
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => reviewSighting(s.id, 'verified')} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">Vérifier</button>
                          <button onClick={() => reviewSighting(s.id, 'false')} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Faux</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> Soumettre un signalement</h2>
        {sightingOk ? (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
            Merci ! Votre signalement a été soumis.
            <button onClick={() => setSightingOk(false)} className="ml-4 text-sm underline">Nouveau signalement</button>
          </div>
        ) : (
          <form onSubmit={handleSighting} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea required rows={3} value={sighting.content} onChange={(e) => setSighting({ ...sighting, content: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <input value={sighting.location} onChange={(e) => setSighting({ ...sighting, location: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Vos coordonnées</label>
                <input value={sighting.contactInfo} onChange={(e) => setSighting({ ...sighting, contactInfo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            <button type="submit" disabled={sightingSending} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50">
              {sightingSending ? 'Envoi...' : 'Soumettre'}
            </button>
          </form>
        )}
      </div>

      {isAgent && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-purple-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" /> Liens croisés — ElikIA
            </h2>
            <button
              onClick={runAICrossLinks}
              disabled={crossLinksLoading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {crossLinksLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {crossLinksLoading ? 'Analyse en cours...' : crossLinksRan ? 'Ré-analyser' : 'Analyser les liens'}
            </button>
          </div>
          {!crossLinksRan && !crossLinksLoading && (
            <p className="text-gray-400 text-sm text-center py-6">
              Cliquez sur "Analyser les liens" pour détecter des personnes disparues potentiellement liées à cette fiche.
            </p>
          )}
          {crossLinksLoading && (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              <p className="text-purple-600 text-sm">ElikIA analyse les profils...</p>
            </div>
          )}
          {crossLinksRan && !crossLinksLoading && (
            <div className="space-y-4">
              {crossLinksSummary && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">{crossLinksSummary}</p>
                </div>
              )}
              {crossLinks.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Aucun lien potentiel détecté avec d'autres personnes disparues.</p>
              ) : (
                <div className="space-y-3">
                  {crossLinks.map((cl, i) => (
                    <div key={i} className={`border rounded-lg p-4 ${cl.confidence >= 70 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          <Link href={`/missing/${cl.missingPersonId}`} className="font-semibold text-blue-600 hover:text-blue-800">
                            {cl.missingPersonName}
                          </Link>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{cl.relationship}</span>
                        </div>
                        <span className={`font-bold text-sm ${cl.confidence >= 80 ? 'text-green-600' : cl.confidence >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                          {cl.confidence}%
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {cl.reasons.map((r, j) => (
                          <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-purple-400 mt-0.5">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {session?.user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-purple-600" /> Recherche familiale</h2>
            <button onClick={() => setShowFamilyForm(!showFamilyForm)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
              {showFamilyForm ? 'Annuler' : '+ Ajouter'}
            </button>
          </div>
          {showFamilyForm && (
            <form onSubmit={handleFamilySubmit} className="mb-4 bg-purple-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Votre nom complet *</label>
                  <input required value={fam.fullName} onChange={(e) => setFam({ ...fam, fullName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lien de parenté *</label>
                  <select value={fam.relationship} onChange={(e) => setFam({ ...fam, relationship: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {Object.entries(REL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Votre âge</label>
                  <input type="number" value={fam.age} onChange={(e) => setFam({ ...fam, age: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Votre localisation</label>
                  <input placeholder="Ville, quartier, province" value={fam.location} onChange={(e) => setFam({ ...fam, location: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone / Contact</label>
                  <input value={fam.contactInfo} onChange={(e) => setFam({ ...fam, contactInfo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description physique du disparu selon vous</label>
                <textarea rows={2} placeholder="Taille, corpulence, signes distinctifs..." value={fam.physicalDescription} onChange={(e) => setFam({ ...fam, physicalDescription: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
              <button type="submit" disabled={famSending} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm">
                {famSending ? 'Enregistrement...' : 'Soumettre ma recherche'}
              </button>
            </form>
          )}
          {person.familyMembersSearching.length > 0 ? person.familyMembersSearching.map((fm) => (
            <div key={fm.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
              <div><p className="font-medium">{fm.fullName}</p><p className="text-xs text-gray-500">{REL_LABELS[fm.relationship] ?? fm.relationship}</p></div>
              {fm.matches[0] && <p className="text-sm font-bold text-purple-600">{Math.round(fm.matches[0].confidenceScore)}%</p>}
            </div>
          )) : <p className="text-gray-500 text-sm">Aucun membre de famille enregistré.</p>}
        </div>
      )}
    </div>
  );
}
