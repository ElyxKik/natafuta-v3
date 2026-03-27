'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MatchStatusBadge } from '@/components/UrgencyBadge';
import { Users, Zap, BarChart2, TrendingUp, Play } from 'lucide-react';

interface DashboardData {
  totalMissingPersons: number; totalFamilyMembers: number; totalMatches: number;
  pendingMatches: number; verifiedMatches: number; confirmedMatches: number; rejectedMatches: number;
  recentMatches: { id: string; confidenceScore: number; status: string; createdAt: string; missingPerson: { id: string; fullName: string }; familyMember: { id: string; fullName: string } }[];
  highConfidence: number; mediumConfidence: number; lowConfidence: number; successRate: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningMatch, setRunningMatch] = useState(false);
  const [matchResult, setMatchResult] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.userType !== 'agent') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.userType === 'agent') {
      fetch('/api/family-matching').then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
    }
  }, [status, session]);

  async function runMatching() {
    setRunningMatch(true); setMatchResult('');
    const res = await fetch('/api/run-matching', { method: 'POST' });
    const d = await res.json();
    setMatchResult(d.message ?? `${d.created} créée(s), ${d.updated} mise(s) à jour.`);
    setRunningMatch(false);
    // Refresh data
    fetch('/api/family-matching').then((r) => r.json()).then((d) => setData(d));
  }

  if (loading || !data) return <div className="animate-pulse bg-white rounded-lg shadow-md h-96" />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div><h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard Matching Familial</h1><p className="text-gray-600">Statistiques et gestion du système de matching</p></div>
        <div className="flex gap-2">
          <Link href="/matching-statistics" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"><BarChart2 className="h-4 w-4" /> Statistiques détaillées</Link>
          <button onClick={runMatching} disabled={runningMatch} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"><Play className="h-4 w-4" /> {runningMatch ? 'Exécution...' : 'Lancer le Matching'}</button>
        </div>
      </div>
      {matchResult && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded">{matchResult}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Personnes Disparues', value: data.totalMissingPersons, color: 'text-blue-500', icon: <Users className="h-10 w-10" /> },
          { label: 'Membres de Famille', value: data.totalFamilyMembers, color: 'text-purple-500', icon: <Zap className="h-10 w-10" /> },
          { label: 'Correspondances', value: data.totalMatches, color: 'text-green-500', icon: <BarChart2 className="h-10 w-10" /> },
          { label: 'Taux de Succès', value: `${data.successRate}%`, color: 'text-orange-500', icon: <TrendingUp className="h-10 w-10" /> },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center">
            <div><p className="text-gray-600 text-sm">{c.label}</p><p className="text-3xl font-bold">{c.value}</p></div>
            <div className={c.color}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Statuts des Correspondances</h2>
          {[{ label: 'En attente', value: data.pendingMatches, bg: 'bg-yellow-50', text: 'text-yellow-600' }, { label: 'Vérifiées', value: data.verifiedMatches, bg: 'bg-blue-50', text: 'text-blue-600' }, { label: 'Confirmées', value: data.confirmedMatches, bg: 'bg-green-50', text: 'text-green-600' }, { label: 'Rejetées', value: data.rejectedMatches, bg: 'bg-red-50', text: 'text-red-600' }].map((r) => (
            <div key={r.label} className={`flex justify-between items-center p-3 ${r.bg} rounded mb-2`}>
              <span className="text-gray-700">{r.label}</span><span className={`font-bold ${r.text}`}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Scores de Confiance</h2>
          {[{ label: 'Élevé (≥80%)', value: data.highConfidence, bg: 'bg-green-50', text: 'text-green-600' }, { label: 'Moyen (60-79%)', value: data.mediumConfidence, bg: 'bg-yellow-50', text: 'text-yellow-600' }, { label: 'Faible (<60%)', value: data.lowConfidence, bg: 'bg-orange-50', text: 'text-orange-600' }].map((r) => (
            <div key={r.label} className={`flex justify-between items-center p-3 ${r.bg} rounded mb-2`}>
              <span className="text-gray-700">{r.label}</span><span className={`font-bold ${r.text}`}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Correspondances Récentes</h2>
          <Link href="/family-matches" className="text-blue-600 hover:text-blue-800 text-sm">Voir toutes →</Link>
        </div>
        {data.recentMatches.length === 0 ? <p className="text-gray-500 text-center py-8">Aucune correspondance.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Membre de Famille</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Personne Disparue</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Statut</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr></thead>
              <tbody>
                {data.recentMatches.map((m) => (
                  <tr key={m.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{m.familyMember.fullName}</td>
                    <td className="px-4 py-3 text-sm"><Link href={`/missing/${m.missingPerson.id}`} className="text-blue-600 hover:text-blue-800">{m.missingPerson.fullName}</Link></td>
                    <td className="px-4 py-3 text-sm"><span className={`font-bold ${m.confidenceScore >= 80 ? 'text-green-600' : m.confidenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>{Math.round(m.confidenceScore)}%</span></td>
                    <td className="px-4 py-3 text-sm"><MatchStatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
