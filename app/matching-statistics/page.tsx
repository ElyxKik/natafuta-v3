'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart2 } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  name_similarity: 'Similarité de nom', age_proximity: "Proximité d'âge",
  location_match: 'Localisation', combined: 'Combiné',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', verified: 'Vérifiée', confirmed: 'Confirmée', rejected: 'Rejetée',
};

interface Stats {
  matchTypes: Record<string, number>;
  byStatus: Record<string, number>;
  last12Months: { month: string; count: number }[];
  total: number;
}

export default function MatchingStatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.userType !== 'agent') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.userType === 'agent') {
      fetch('/api/matching-statistics').then((r) => r.json()).then((d) => { setStats(d); setLoading(false); });
    }
  }, [status, session]);

  if (loading || !stats) return <div className="bg-white rounded-lg shadow-md p-8 animate-pulse h-96" />;

  const maxMonthly = Math.max(...stats.last12Months.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="h-6 w-6 text-blue-600" /> Statistiques du Matching</h1>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">← Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Par type de correspondance</h2>
          <div className="space-y-3">
            {Object.entries(stats.matchTypes).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{TYPE_LABELS[type] ?? type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} /></div>
                  <span className="text-sm font-bold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Par statut</h2>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([s, count]) => {
              const colors: Record<string, string> = { pending: 'bg-yellow-500', verified: 'bg-blue-500', confirmed: 'bg-green-500', rejected: 'bg-red-500' };
              return (
                <div key={s} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{STATUS_LABELS[s] ?? s}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2"><div className={`${colors[s] ?? 'bg-gray-500'} h-2 rounded-full`} style={{ width: `${(count / stats.total) * 100}%` }} /></div>
                    <span className="text-sm font-bold w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Correspondances par mois (12 derniers mois)</h2>
        <div className="flex items-end gap-2 h-48">
          {stats.last12Months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">{m.count}</span>
              <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? '4px' : '0' }} />
              <span className="text-[10px] text-gray-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">{m.month.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center"><p className="text-gray-500 text-sm">Total: <strong>{stats.total}</strong> correspondances</p></div>
    </div>
  );
}
