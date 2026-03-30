'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Zap, Search, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp, Sparkles, Shield, Link2, FileSearch, Users,
  MapPin, AlertCircle
} from 'lucide-react';
import { MatchStatusBadge } from '@/components/UrgencyBadge';

interface Match {
  id: string;
  confidenceScore: number;
  aiConfidenceScore: number | null;
  aiSummary: string | null;
  aiFactors: string | null;
  aiAnalyzedAt: string | null;
  status: string;
  nameSimilarity: number;
  ageSimilarity: number;
  locationSimilarity: number;
  notes: string | null;
  missingPerson: {
    id: string; fullName: string; lastKnownLocation: string | null; urgencyLevel: string;
    aiCrossLinks: string | null; personType: string;
    dossierNumber: string | null; reunificationStatus: string | null;
    camp: { name: string; location: string } | null;
    originLocation: string | null;
  };
  familyMember: { id: string; fullName: string; relationship: string };
}

interface Factor {
  type: 'positive' | 'negative' | 'neutral';
  label: string;
  detail: string;
}

const CAPABILITIES = [
  {
    icon: FileSearch,
    title: 'Analyse de correspondances',
    desc: 'ElikIA évalue chaque correspondance entre un réfugié/déplacé et un membre de famille en croisant noms, âge, ethnie, camp d\'accueil, numéro de dossier et circonstances de déplacement. Elle produit un score enrichi et identifie les facteurs déterminants.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    icon: Link2,
    title: 'Détection de liens croisés',
    desc: 'ElikIA analyse les réfugiés et déplacés internes actifs pour détecter des familles séparées dans des camps différents. Elle utilise les noms des parents, l\'ethnie, la région d\'origine et la période d\'arrivée comme indices clés.',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    icon: Users,
    title: 'Résumés et recommandations',
    desc: 'Pour chaque dossier, ElikIA rédige un résumé humanitaire et formule une recommandation concrète à l\'agent : contacter le camp, vérifier le dossier, mettre à jour le statut de réunification ou escalader le cas.',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  {
    icon: Shield,
    title: 'Contexte humanitaire & terrain',
    desc: 'ElikIA comprend les réalités des déplacements forcés en RDC : variations orthographiques des noms (Lingala, Swahili, Kinyarwanda, Kirundi, Tshiluba), approximations d\'âge en contexte de crise, et axes migratoires des conflits Est-RDC.',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
  },
];

export default function ElikIAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCapabilities, setShowCapabilities] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as any)?.userType !== 'agent') router.push('/');
  }, [status, session, router]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/family-matches?status=${statusFilter}`);
    const d = await res.json();
    setMatches(d.matches ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.userType === 'agent') loadMatches();
  }, [status, session, loadMatches]);

  async function analyzeMatch(matchId: string) {
    setAnalyzingId(matchId);
    setMsg(null);
    try {
      const res = await fetch('/api/ai-matching/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Erreur ElikIA');
      setMsg({ type: 'success', text: `ElikIA a terminé l'analyse de "${matches.find(m => m.id === matchId)?.missingPerson.fullName}" — Score : ${Math.round(d.analysis.confidence)}%` });
      await loadMatches();
      setExpandedId(matchId);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setAnalyzingId(null);
    }
  }

  async function analyzeAllPending() {
    setSummaryLoading(true);
    setMsg(null);
    const pending = matches.filter(m => !m.aiAnalyzedAt);
    if (pending.length === 0) {
      setMsg({ type: 'success', text: 'Toutes les correspondances ont déjà été analysées par ElikIA.' });
      setSummaryLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/ai-matching/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchIds: pending.map(m => m.id) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Erreur ElikIA');
      setMsg({ type: 'success', text: `ElikIA a généré ${Object.keys(d.results).length} résumés.` });
      await loadMatches();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSummaryLoading(false);
    }
  }

  const getScoreColor = (score: number) =>
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-orange-600';

  const getScoreBg = (score: number) =>
    score >= 80 ? 'bg-green-100 border-green-300' : score >= 60 ? 'bg-yellow-100 border-yellow-300' : 'bg-orange-100 border-orange-300';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  );

  const analyzedCount = matches.filter(m => m.aiAnalyzedAt).length;
  const pendingCount = matches.filter(m => !m.aiAnalyzedAt).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Hero ElikIA ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-purple-900 via-purple-800 to-blue-900 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative px-8 py-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 shadow-lg ring-2 ring-white/20">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">ElikIA</h1>
              <span className="text-xs bg-purple-500/60 border border-purple-400/40 px-2.5 py-1 rounded-full font-medium">
                Agent IA Spécialisé
              </span>
            </div>
            <p className="mt-2 text-purple-100 text-sm leading-relaxed max-w-2xl">
              Agent IA humanitaire spécialisé dans la <strong className="text-white">réunification familiale des réfugiés et déplacés internes</strong> en RDC.
              ElikIA analyse chaque dossier en tenant compte du camp, du numéro de dossier, de l'ethnie et des circonstances de déplacement pour guider les agents vers les bonnes décisions.
            </p>
          </div>
          <button
            onClick={() => setShowCapabilities(!showCapabilities)}
            className="shrink-0 flex items-center gap-2 text-sm text-purple-200 hover:text-white border border-purple-500/50 hover:border-purple-300 px-3 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            {showCapabilities ? 'Masquer' : 'Voir les capacités'}
          </button>
        </div>
      </div>

      {/* ── Capabilities ── */}
      {showCapabilities && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className={`rounded-xl border p-5 ${cap.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${cap.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${cap.color}`}>{cap.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{matches.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Correspondances</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{analyzedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Analysées par ElikIA</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">En attente d'analyse</p>
        </div>
      </div>

      {/* ── Message ── */}
      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm">{msg.text}</p>
          <button onClick={() => setMsg(null)} className="ml-auto opacity-50 hover:opacity-100 text-sm">✕</button>
        </div>
      )}

      {/* ── Matches list ── */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-5 py-4 border-b bg-gray-50">
          <div className="flex gap-1">
            {[
              { v: 'pending', l: 'En attente' },
              { v: 'verified', l: 'Vérifiées' },
              { v: 'confirmed', l: 'Confirmées' },
              { v: 'rejected', l: 'Rejetées' },
            ].map(t => (
              <button key={t.v} onClick={() => setStatusFilter(t.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === t.v ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>
                {t.l}
              </button>
            ))}
          </div>
          <button
            onClick={analyzeAllPending}
            disabled={summaryLoading || pendingCount === 0}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40 transition-colors shrink-0"
          >
            {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {summaryLoading ? 'ElikIA analyse...' : `Analyser les ${pendingCount} restantes`}
          </button>
        </div>

        <div className="p-4 space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-purple-200" />
              </div>
              <p className="text-gray-400 font-medium">Aucune correspondance</p>
              <p className="text-gray-300 text-sm mt-1">ElikIA n'a rien à analyser dans cette catégorie.</p>
            </div>
          ) : matches.map((m) => {
            const factors: Factor[] = m.aiFactors ? JSON.parse(m.aiFactors) : [];
            const isExpanded = expandedId === m.id;
            const isAnalyzing = analyzingId === m.id;
            const pt = m.missingPerson.personType;
            const personTypeLabel = pt === 'refugee' ? 'Réfugié' : pt === 'displaced' ? 'Déplacé interne' : 'Disparu';
            const personTypeBg = pt === 'refugee' ? 'bg-blue-100 text-blue-700' : pt === 'displaced' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
            const reunifBadge: Record<string, { label: string; cls: string }> = {
              pending: { label: 'Réunification en attente', cls: 'bg-gray-100 text-gray-500' },
              in_progress: { label: 'Réunification en cours', cls: 'bg-blue-100 text-blue-600' },
              reunified: { label: 'Réunifié ✓', cls: 'bg-green-100 text-green-700' },
              closed: { label: 'Dossier fermé', cls: 'bg-red-100 text-red-600' },
            };
            const rs = m.missingPerson.reunificationStatus;
            const personDetailPath = pt === 'refugee' ? `/refugees/${m.missingPerson.id}` : pt === 'displaced' ? `/displaced/${m.missingPerson.id}` : `/missing/${m.missingPerson.id}`;

            return (
              <div key={m.id} className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${m.aiAnalyzedAt ? 'border-purple-200' : 'border-gray-200'}`}>
                {/* Match row */}
                <div className="p-4 flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-800">{m.familyMember.fullName}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{m.familyMember.relationship}</span>
                      <span className="text-gray-300">→</span>
                      <Link href={personDetailPath} className="font-semibold text-blue-600 hover:text-blue-800 truncate">
                        {m.missingPerson.fullName}
                      </Link>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${personTypeBg}`}>{personTypeLabel}</span>
                      <MatchStatusBadge status={m.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {m.missingPerson.camp && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{m.missingPerson.camp.name}{m.missingPerson.camp.location ? ` — ${m.missingPerson.camp.location}` : ''}
                        </p>
                      )}
                      {m.missingPerson.dossierNumber && (
                        <p className="text-xs text-gray-400">N° {m.missingPerson.dossierNumber}</p>
                      )}
                      {rs && reunifBadge[rs] && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${reunifBadge[rs].cls}`}>{reunifBadge[rs].label}</span>
                      )}
                    </div>
                    {m.aiSummary && (
                      <div className="mt-2 flex gap-2 items-start bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                        <Brain className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-purple-700 leading-relaxed">{m.aiSummary}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex gap-3 items-center">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Algo</p>
                        <p className={`font-bold text-lg ${getScoreColor(m.confidenceScore)}`}>{Math.round(m.confidenceScore)}%</p>
                      </div>
                      {m.aiConfidenceScore != null && (
                        <>
                          <div className="text-gray-200">|</div>
                          <div className={`text-center px-3 py-1 rounded-lg border ${getScoreBg(m.aiConfidenceScore)}`}>
                            <p className="text-xs text-purple-500 font-semibold">ElikIA</p>
                            <p className={`font-bold text-lg ${getScoreColor(m.aiConfidenceScore)}`}>{Math.round(m.aiConfidenceScore)}%</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => analyzeMatch(m.id)}
                        disabled={isAnalyzing || summaryLoading}
                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                        {isAnalyzing ? 'ElikIA analyse...' : m.aiAnalyzedAt ? 'Ré-analyser' : 'Demander à ElikIA'}
                      </button>
                      {(factors.length > 0 || m.notes) && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : m.id)}
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs px-2 py-1.5 border rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Détails
                        </button>
                      )}
                      <Link
                        href={personDetailPath}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs px-2 py-1.5 border rounded-lg transition-colors"
                      >
                        <Search className="h-3 w-3" /> Fiche
                      </Link>
                    </div>
                    {m.aiAnalyzedAt && (
                      <p className="text-xs text-purple-400">ElikIA · {new Date(m.aiAnalyzedAt).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">

                    {/* Infos humanitaires */}
                    {(m.missingPerson.camp || m.missingPerson.dossierNumber || m.missingPerson.originLocation || rs) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Informations humanitaires</p>
                        <div className="grid grid-cols-2 gap-2">
                          {m.missingPerson.camp && (
                            <div className="bg-white border rounded-lg p-2">
                              <p className="text-xs text-gray-400">Camp</p>
                              <p className="text-sm font-medium text-gray-700">{m.missingPerson.camp.name}</p>
                              {m.missingPerson.camp.location && <p className="text-xs text-gray-400">{m.missingPerson.camp.location}</p>}
                            </div>
                          )}
                          {m.missingPerson.dossierNumber && (
                            <div className="bg-white border rounded-lg p-2">
                              <p className="text-xs text-gray-400">N° de dossier</p>
                              <p className="text-sm font-medium text-gray-700">{m.missingPerson.dossierNumber}</p>
                            </div>
                          )}
                          {m.missingPerson.originLocation && (
                            <div className="bg-white border rounded-lg p-2">
                              <p className="text-xs text-gray-400">Lieu d'origine</p>
                              <p className="text-sm font-medium text-gray-700">{m.missingPerson.originLocation}</p>
                            </div>
                          )}
                          {rs && reunifBadge[rs] && (
                            <div className="bg-white border rounded-lg p-2">
                              <p className="text-xs text-gray-400">Statut réunification</p>
                              <p className={`text-sm font-medium ${reunifBadge[rs].cls.replace('bg-', 'text-').replace('100', '700')}`}>{reunifBadge[rs].label}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Scores algorithmiques</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Nom', val: m.nameSimilarity },
                          { label: 'Âge', val: m.ageSimilarity },
                          { label: 'Lieu', val: m.locationSimilarity },
                        ].map(s => (
                          <div key={s.label} className="bg-white border rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">{s.label}</p>
                            <p className={`font-bold ${getScoreColor(s.val)}`}>{Math.round(s.val)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {factors.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facteurs détectés par ElikIA</p>
                        <div className="space-y-2">
                          {factors.map((f, i) => (
                            <div key={i} className={`flex gap-3 p-3 rounded-lg border text-sm ${
                              f.type === 'positive' ? 'bg-green-50 border-green-200' :
                              f.type === 'negative' ? 'bg-red-50 border-red-200' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="shrink-0 mt-0.5">
                                {f.type === 'positive' ? <CheckCircle className="h-4 w-4 text-green-600" /> : f.type === 'negative' ? <XCircle className="h-4 w-4 text-red-600" /> : <AlertCircle className="h-4 w-4 text-gray-500" />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">{f.label}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{f.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.notes && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex gap-2">
                        <Brain className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Recommandation ElikIA</p>
                          <p className="text-sm text-purple-800">{m.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
