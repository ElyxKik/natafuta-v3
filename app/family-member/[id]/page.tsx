'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Users, MapPin, User } from 'lucide-react';
import { MatchStatusBadge } from '@/components/UrgencyBadge';

const REL_LABELS: Record<string, string> = {
  parent: 'Parent', child: 'Enfant', sibling: 'Frère/Sœur', spouse: 'Conjoint(e)',
  grandparent: 'Grand-parent', grandchild: 'Petit-enfant', aunt_uncle: 'Oncle/Tante',
  cousin: 'Cousin(e)', other: 'Autre',
};

interface Match {
  id: string; confidenceScore: number; status: string; matchType: string;
  nameSimilarity: number; ageSimilarity: number; locationSimilarity: number;
  missingPerson: { id: string; fullName: string };
}

interface FamilyMemberData {
  id: string; fullName: string; relationship: string; age?: number | null;
  contactInfo?: string | null; createdAt: string;
  missingPerson: { id: string; fullName: string; status: string; lastKnownLocation?: string | null };
  matches: Match[];
  searcher: { id: string; name?: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  name_similarity: 'Similarité de nom', age_proximity: "Proximité d'âge",
  location_match: 'Correspondance de localisation', combined: 'Correspondance combinée',
};

export default function FamilyMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fm, setFm] = useState<FamilyMemberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/family-member/${id}`).then((r) => r.json()).then((d) => { setFm(d); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [id, status]);

  if (loading) return <div className="bg-white rounded-lg shadow-md p-8 animate-pulse h-64" />;
  if (!fm) return <div className="bg-white rounded-lg shadow-md p-12 text-center"><p className="text-gray-500">Membre introuvable.</p></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Accueil</Link> / <Link href="/my-searches" className="hover:text-blue-600">Mes recherches</Link> / <span>{fm.fullName}</span>
      </nav>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-purple-800 text-white p-6">
          <h1 className="text-2xl font-bold flex items-center gap-3"><Users className="h-6 w-6" /> {fm.fullName}</h1>
          <p className="text-purple-200 mt-1">{REL_LABELS[fm.relationship] ?? fm.relationship}{fm.age ? ` · ${fm.age} ans` : ''}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Recherche pour</p>
              <Link href={`/missing/${fm.missingPerson.id}`} className="text-blue-600 hover:text-blue-800 font-medium">{fm.missingPerson.fullName}</Link>
            </div>
            <div>
              <p className="text-gray-500">Soumis par</p>
              <p className="font-medium">{fm.searcher.name}</p>
            </div>
            {fm.contactInfo && <div><p className="text-gray-500">Contact</p><p className="font-medium">{fm.contactInfo}</p></div>}
            <div><p className="text-gray-500">Date</p><p className="font-medium">{new Date(fm.createdAt).toLocaleDateString('fr-FR')}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Correspondances ({fm.matches.length})</h2>
        {fm.matches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune correspondance trouvée.</p>
        ) : (
          <div className="space-y-4">
            {fm.matches.map((m) => (
              <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link href={`/missing/${m.missingPerson.id}`} className="text-blue-600 hover:text-blue-800 font-semibold">{m.missingPerson.fullName}</Link>
                    <p className="text-xs text-gray-500 mt-1">{TYPE_LABELS[m.matchType] ?? m.matchType}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${m.confidenceScore >= 80 ? 'text-green-600' : m.confidenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {Math.round(m.confidenceScore)}%
                    </p>
                    <MatchStatusBadge status={m.status} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-500">Nom</p>
                    <p className="font-bold">{Math.round(m.nameSimilarity)}%</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-500">Âge</p>
                    <p className="font-bold">{Math.round(m.ageSimilarity)}%</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-gray-500">Localisation</p>
                    <p className="font-bold">{Math.round(m.locationSimilarity)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
