'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MatchStatusBadge } from '@/components/UrgencyBadge';
import { Brain } from 'lucide-react';

interface Match {
  id: string; confidenceScore: number; status: string; createdAt: string;
  aiConfidenceScore: number | null; aiSummary: string | null; aiAnalyzedAt: string | null;
  missingPerson: { id: string; fullName: string };
  familyMember: { id: string; fullName: string; relationship: string };
}

const TABS = [{ value: 'pending', label: 'En attente' }, { value: 'verified', label: 'Vérifiées' }, { value: 'confirmed', label: 'Confirmées' }, { value: 'rejected', label: 'Rejetées' }];

export default function FamilyMatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.userType !== 'agent') router.push('/');
  }, [status, session, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/family-matches?status=${activeStatus}`);
    const d = await res.json();
    setMatches(d.matches ?? []);
    setLoading(false);
  }, [activeStatus]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.userType === 'agent') load();
  }, [status, session, load]);

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    await fetch('/api/family-matching', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: newStatus }) });
    await load();
    setUpdatingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Correspondances Familiales</h1>
        <div className="flex gap-3">
          <Link href="/ai-matching" className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
            <Brain className="h-4 w-4" /> Analyse IA
          </Link>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Dashboard</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button key={tab.value} onClick={() => setActiveStatus(tab.value)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeStatus === tab.value ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
          ) : matches.length === 0 ? <p className="text-gray-500 text-center py-8">Aucune correspondance.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Membre de Famille</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Personne Disparue</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score Algo</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-purple-600">Score IA</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr></thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/family-matches/${m.id}`)}>
                      <td className="px-4 py-3 text-sm">{m.familyMember.fullName}<span className="block text-xs text-gray-400">{m.familyMember.relationship}</span></td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-blue-600">{m.missingPerson.fullName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm"><span className={`font-bold ${m.confidenceScore >= 80 ? 'text-green-600' : m.confidenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>{Math.round(m.confidenceScore)}%</span></td>
                      <td className="px-4 py-3 text-sm">
                        {m.aiConfidenceScore != null ? (
                          <span className={`font-bold flex items-center gap-1 ${m.aiConfidenceScore >= 80 ? 'text-green-600' : m.aiConfidenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                            <Brain className="h-3 w-3 text-purple-500" />{Math.round(m.aiConfidenceScore)}%
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm"><MatchStatusBadge status={m.status} /></td>
                      <td className="px-4 py-3 text-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 items-center">
                          <Link href={`/family-matches/${m.id}`} className="bg-gray-700 hover:bg-gray-800 text-white text-xs px-2 py-1 rounded">
                            Voir
                          </Link>
                          {m.status === 'pending' && <>
                            <button onClick={() => updateStatus(m.id, 'verified')} disabled={updatingId === m.id} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50">Vérifier</button>
                            <button onClick={() => updateStatus(m.id, 'rejected')} disabled={updatingId === m.id} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50">Rejeter</button>
                          </>}
                          {m.status === 'verified' && <button onClick={() => updateStatus(m.id, 'confirmed')} disabled={updatingId === m.id} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50">Confirmer</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
