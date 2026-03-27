'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { MatchStatusBadge } from '@/components/UrgencyBadge';

interface FamilyMember {
  id: string; fullName: string; relationship: string; age?: number | null; createdAt: string;
  missingPerson: { id: string; fullName: string; status: string };
  matches: { id: string; confidenceScore: number; status: string }[];
}

const REL_LABELS: Record<string, string> = { parent: 'Parent', child: 'Enfant', sibling: 'Frère/Sœur', spouse: 'Conjoint(e)', grandparent: 'Grand-parent', grandchild: 'Petit-enfant', aunt_uncle: 'Oncle/Tante', cousin: 'Cousin(e)', other: 'Autre' };

export default function MySearchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/my-searches').then((r) => r.json()).then((d) => { setMembers(d.members ?? []); setLoading(false); });
    }
  }, [status]);

  if (loading) return <div className="animate-pulse bg-white rounded-lg shadow-md h-64" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes recherches familiales</h1>
        <Link href="/missing" className="text-blue-600 hover:text-blue-800 text-sm">Voir les fiches →</Link>
      </div>
      {members.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Aucune recherche familiale soumise.</p>
          <Link href="/missing" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">Consulter les fiches</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((m) => {
            const best = m.matches.sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
            return (
              <div key={m.id} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{m.fullName}</h3>
                    <span className="text-sm text-gray-500">{REL_LABELS[m.relationship] ?? m.relationship}{m.age ? ` · ${m.age} ans` : ''}</span>
                  </div>
                  <p className="text-sm text-gray-600">Pour: <Link href={`/missing/${m.missingPerson.id}`} className="text-blue-600 hover:text-blue-800 font-medium">{m.missingPerson.fullName}</Link></p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="ml-6 text-right">
                  {best ? (<><p className={`text-xl font-bold ${best.confidenceScore >= 80 ? 'text-green-600' : best.confidenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>{Math.round(best.confidenceScore)}%</p><p className="text-xs text-gray-500">correspondance</p><MatchStatusBadge status={best.status} /></>) : <p className="text-sm text-gray-400">En cours...</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
