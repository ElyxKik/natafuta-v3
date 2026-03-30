'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MatchStatusBadge } from '@/components/UrgencyBadge';
import {
  Users, Zap, BarChart2, TrendingUp, Play, Globe, MapPin, Tent,
  Search, Brain, Map, CheckCircle2, Clock, AlertTriangle,
  ArrowRight, RefreshCw, Heart, Shield
} from 'lucide-react';

interface DashboardData {
  totalMissingPersons: number; totalFamilyMembers: number; totalMatches: number;
  pendingMatches: number; verifiedMatches: number; confirmedMatches: number; rejectedMatches: number;
  recentMatches: {
    id: string; confidenceScore: number; status: string; createdAt: string;
    missingPerson: { id: string; fullName: string; personType?: string };
    familyMember: { id: string; fullName: string };
  }[];
  highConfidence: number; mediumConfidence: number; lowConfidence: number; successRate: number;
}

interface GlobalStats {
  missing: number; refugee: number; displaced: number; camps: number;
  reunified: number; reunificationInProgress: number;
}

function StatCard({ label, value, icon, color, bg, border, href, trend }: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; bg: string; border: string; href: string; trend?: string;
}) {
  return (
    <Link href={href} className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-all group`}>
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">{trend}</span>}
      </div>
      <div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </Link>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningMatch, setRunningMatch] = useState(false);
  const [matchResult, setMatchResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const agentName = (session?.user as any)?.name ?? 'Agent';

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.userType !== 'agent') router.push('/');
  }, [status, session, router]);

  const loadData = () => {
    setError(null);
    Promise.all([
      fetch('/api/family-matching', { credentials: 'include' })
        .then(r => {
          if (!r.ok) {
            console.error('family-matching API error:', r.status);
            throw new Error(`API error: ${r.status}`);
          }
          return r.json().catch(e => {
            console.error('JSON parse error:', e);
            throw new Error('Invalid JSON response');
          });
        })
        .catch(e => {
          console.error('Error fetching family-matching:', e);
          return null;
        }),
      fetch('/api/stats', { credentials: 'include' })
        .then(r => {
          if (!r.ok) {
            console.error('stats API error:', r.status);
            throw new Error(`API error: ${r.status}`);
          }
          return r.json().catch(e => {
            console.error('JSON parse error:', e);
            throw new Error('Invalid JSON response');
          });
        })
        .catch(e => {
          console.error('Error fetching stats:', e);
          return null;
        }),
    ]).then(([matchData, statsData]) => {
      if (matchData && statsData) {
        setData(matchData);
        setStats(statsData);
      } else {
        setError('Impossible de charger les données du dashboard. Veuillez rafraîchir la page.');
        // Fallback avec données par défaut
        setData({
          totalMissingPersons: 0, totalFamilyMembers: 0, totalMatches: 0,
          pendingMatches: 0, verifiedMatches: 0, confirmedMatches: 0, rejectedMatches: 0,
          recentMatches: [],
          highConfidence: 0, mediumConfidence: 0, lowConfidence: 0, successRate: 0,
        });
        setStats({ missing: 0, refugee: 0, displaced: 0, camps: 0, reunified: 0, reunificationInProgress: 0 });
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.userType === 'agent') {
      loadData();
    }
  }, [status, session]);

  async function runMatching() {
    setRunningMatch(true); setMatchResult(null);
    try {
      const res = await fetch('/api/run-matching', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const d = await res.json();
      setMatchResult({ type: 'success', msg: d.message ?? `${d.created} créée(s), ${d.updated} mise(s) à jour.` });
      fetch('/api/family-matching', { credentials: 'include' })
        .then(r => {
          if (!r.ok) throw new Error(`API error: ${r.status}`);
          return r.json();
        })
        .then(d => setData(d))
        .catch(e => console.error('Error reloading data:', e));
    } catch (e) {
      console.error('Matching error:', e);
      setMatchResult({ type: 'error', msg: 'Erreur lors de l\'exécution du matching.' });
    } finally {
      setRunningMatch(false);
    }
  }

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}</div>
      <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div>
    </div>
  );

  if (!data || !stats) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertTriangle className="h-12 w-12 text-red-400" />
      <p className="text-gray-600 font-medium">Erreur de chargement</p>
      <p className="text-gray-400 text-sm">{error || 'Impossible de charger les données du dashboard.'}</p>
      <button
        onClick={loadData}
        className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Réessayer
      </button>
    </div>
  );

  const totalHumanitarian = stats.refugee + stats.displaced;
  const reunifRate = totalHumanitarian > 0 ? Math.round((stats.reunified / totalHumanitarian) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <div className="bg-linear-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Bienvenue, {agentName}</p>
            <h1 className="text-2xl font-bold">Dashboard humanitaire</h1>
            <p className="text-blue-200 text-sm mt-1">Suivi en temps réel — réfugiés, déplacés internes, camps & réunification familiale</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/map" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-xl text-sm transition-colors">
              <Map className="h-4 w-4" /> Carte
            </Link>
            <Link href="/matching-statistics" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-xl text-sm transition-colors">
              <BarChart2 className="h-4 w-4" /> Statistiques
            </Link>
            <button
              onClick={runMatching} disabled={runningMatch}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {runningMatch ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {runningMatch ? 'Matching...' : 'Lancer le matching'}
            </button>
          </div>
        </div>
        {matchResult && (
          <div className={`mt-4 relative flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${matchResult.type === 'success' ? 'bg-green-500/20 border-green-400/40 text-green-100' : 'bg-red-500/20 border-red-400/40 text-red-100'}`}>
            {matchResult.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {matchResult.msg}
          </div>
        )}
      </div>

      {/* KPIs humanitaires */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Base de données humanitaire</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Personnes disparues" value={stats.missing} color="text-gray-600" bg="bg-gray-50" border="border-gray-200" icon={<Search className="h-5 w-5" />} href="/missing" />
          <StatCard label="Réfugiés" value={stats.refugee} color="text-blue-600" bg="bg-blue-50" border="border-blue-200" icon={<Globe className="h-5 w-5" />} href="/refugees" />
          <StatCard label="Déplacés internes" value={stats.displaced} color="text-orange-600" bg="bg-orange-50" border="border-orange-200" icon={<MapPin className="h-5 w-5" />} href="/displaced" />
          <StatCard label="Camps actifs" value={stats.camps} color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-200" icon={<Tent className="h-5 w-5" />} href="/camps" />
          <StatCard label="Réunifications ✓" value={stats.reunified} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-200" icon={<Heart className="h-5 w-5" />} href="/family-matches" />
          <StatCard label="Réunif. en cours" value={stats.reunificationInProgress} color="text-yellow-600" bg="bg-yellow-50" border="border-yellow-200" icon={<Clock className="h-5 w-5" />} href="/family-matches" />
        </div>
      </div>

      {/* Taux de réunification + matching */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Taux réunification */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Heart className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="font-semibold text-gray-800">Taux de réunification</h2>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl font-bold text-emerald-600">{reunifRate}%</span>
            <span className="text-sm text-gray-400 mb-1.5">des dossiers actifs</span>
          </div>
          <ProgressBar value={stats.reunified} max={totalHumanitarian} color="bg-emerald-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>{stats.reunified} réunifiés</span>
            <span>{totalHumanitarian} total</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-gray-600"><Clock className="h-3.5 w-3.5 text-yellow-500" /> En cours</span>
              <span className="font-semibold text-yellow-600">{stats.reunificationInProgress}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-gray-600"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Réunifiés</span>
              <span className="font-semibold text-emerald-600">{stats.reunified}</span>
            </div>
          </div>
        </div>

        {/* Matching correspondances */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="font-semibold text-gray-800">Correspondances</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'En attente', value: data.pendingMatches, total: data.totalMatches, bar: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
              { label: 'Vérifiées', value: data.verifiedMatches, total: data.totalMatches, bar: 'bg-blue-400', text: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Confirmées', value: data.confirmedMatches, total: data.totalMatches, bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Rejetées', value: data.rejectedMatches, total: data.totalMatches, bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{r.label}</span>
                  <span className={`font-bold ${r.text}`}>{r.value}</span>
                </div>
                <ProgressBar value={r.value} max={r.total} color={r.bar} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Taux de succès</span>
            <span className="font-bold text-green-600">{data.successRate}%</span>
          </div>
        </div>

        {/* Scores de confiance IA */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Brain className="h-4 w-4 text-purple-500" />
              </div>
              <h2 className="font-semibold text-gray-800">Scores de confiance</h2>
            </div>
            <Link href="/ai-matching" className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-0.5">
              ElikIA <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Élevé ≥80%', value: data.highConfidence, bar: 'bg-green-500', text: 'text-green-600', desc: 'Forte probabilité' },
              { label: 'Moyen 60–79%', value: data.mediumConfidence, bar: 'bg-yellow-400', text: 'text-yellow-600', desc: 'À vérifier' },
              { label: 'Faible <60%', value: data.lowConfidence, bar: 'bg-orange-400', text: 'text-orange-600', desc: 'Incertain' },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <div>
                    <span className="text-gray-700 font-medium">{r.label}</span>
                    <span className="text-xs text-gray-400 ml-1.5">{r.desc}</span>
                  </div>
                  <span className={`font-bold ${r.text}`}>{r.value}</span>
                </div>
                <ProgressBar value={r.value} max={data.totalMatches} color={r.bar} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total correspondances</span>
              <span className="font-bold text-gray-700">{data.totalMatches}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accès rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/refugees/create', label: 'Nouveau réfugié', icon: <Globe className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { href: '/create', label: 'Nouveau déplacé', icon: <MapPin className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            { href: '/family-matches', label: 'Gérer correspondances', icon: <Zap className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { href: '/ai-matching', label: 'ElikIA — Analyse IA', icon: <Brain className="h-5 w-5" />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
          ].map(a => (
            <Link key={a.href} href={a.href} className={`${a.bg} border ${a.border} rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-all group`}>
              <div className={`${a.color} group-hover:scale-110 transition-transform`}>{a.icon}</div>
              <span className={`text-sm font-medium ${a.color}`}>{a.label}</span>
              <ArrowRight className={`h-3.5 w-3.5 ml-auto ${a.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          ))}
        </div>
      </div>

      {/* Correspondances récentes */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-800">Correspondances récentes</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{data.recentMatches.length}</span>
          </div>
          <Link href="/family-matches" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Voir toutes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {data.recentMatches.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Aucune correspondance</p>
            <p className="text-gray-300 text-sm mt-1">Lancez le matching pour détecter des liens familiaux.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Chercheur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Personne</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentMatches.map(m => {
                  const pt = (m.missingPerson as any).personType;
                  const ptLabel = pt === 'refugee' ? 'Réfugié' : pt === 'displaced' ? 'Déplacé' : 'Disparu';
                  const ptColor = pt === 'refugee' ? 'bg-blue-100 text-blue-700' : pt === 'displaced' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
                  const detailPath = pt === 'refugee' ? `/refugees/${m.missingPerson.id}` : pt === 'displaced' ? `/displaced/${m.missingPerson.id}` : `/missing/${m.missingPerson.id}`;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">{m.familyMember.fullName}</td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={detailPath} className="text-blue-600 hover:text-blue-800 font-medium">{m.missingPerson.fullName}</Link>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ptColor}`}>{ptLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${m.confidenceScore >= 80 ? 'text-green-600' : m.confidenceScore >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                            {Math.round(m.confidenceScore)}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${m.confidenceScore >= 80 ? 'bg-green-500' : m.confidenceScore >= 60 ? 'bg-yellow-400' : 'bg-orange-400'}`}
                              style={{ width: `${m.confidenceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm"><MatchStatusBadge status={m.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
