'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  User, MapPin, Calendar, Phone, CheckCircle, XCircle,
  Shield, Brain, Loader2, AlertTriangle, Clock, ChevronLeft,
  FileText, Users, BarChart2, AlertCircle
} from 'lucide-react';
import { MatchStatusBadge, UrgencyBadge } from '@/components/UrgencyBadge';

const REL_LABELS: Record<string, string> = {
  parent: 'Parent', child: 'Enfant', sibling: 'Frère/Sœur', spouse: 'Conjoint(e)',
  grandparent: 'Grand-parent', grandchild: 'Petit-enfant',
  aunt_uncle: 'Oncle/Tante', cousin: 'Cousin(e)', other: 'Autre',
};

interface Match {
  id: string;
  status: string;
  confidenceScore: number;
  nameSimilarity: number;
  ageSimilarity: number;
  locationSimilarity: number;
  matchType: string;
  notes: string | null;
  aiConfidenceScore: number | null;
  aiSummary: string | null;
  aiFactors: string | null;
  aiAnalyzedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  missingPerson: {
    id: string; title: string; fullName: string; age: number | null;
    dateMissing: string; lastKnownLocation: string | null; description: string;
    physicalDescription: string | null; medicalConditions: string | null;
    contactPerson: string | null; contactPhone: string | null;
    urgencyLevel: string; status: string; imageUrl: string | null; createdAt: string;
  };
  familyMember: {
    id: string; fullName: string; relationship: string; age: number | null;
    dateOfBirth: string | null; contactInfo: string | null; createdAt: string;
    searcher: { id: string; name: string | null; email: string };
  };
  verifiedBy: { id: string; name: string | null; email: string } | null;
}

interface Factor {
  type: 'positive' | 'negative' | 'neutral';
  label: string;
  detail: string;
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending: [
    { label: 'Vérifier', next: 'verified', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Rejeter', next: 'rejected', color: 'bg-red-600 hover:bg-red-700' },
  ],
  verified: [
    { label: 'Confirmer la réunification', next: 'confirmed', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Rejeter', next: 'rejected', color: 'bg-red-600 hover:bg-red-700' },
  ],
  confirmed: [],
  rejected: [
    { label: 'Remettre en attente', next: 'pending', color: 'bg-gray-600 hover:bg-gray-700' },
  ],
};

const scoreBar = (val: number) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${val >= 80 ? 'bg-green-500' : val >= 60 ? 'bg-yellow-500' : 'bg-orange-400'}`}
        style={{ width: `${val}%` }}
      />
    </div>
    <span className={`text-sm font-bold w-10 text-right ${val >= 80 ? 'text-green-600' : val >= 60 ? 'text-yellow-600' : 'text-orange-500'}`}>
      {Math.round(val)}%
    </span>
  </div>
);

export default function FamilyMatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesEdit, setShowNotesEdit] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/family-matches/${id}`)
      .then(r => r.json())
      .then(d => {
        setMatch(d);
        setNotes(d.notes ?? '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    setMsg(null);
    const res = await fetch('/api/family-matching', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus, notes }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/family-matches/${id}`).then(r => r.json());
      setMatch(updated);
      setNotes(updated.notes ?? '');
      setShowNotesEdit(false);
      setMsg({ type: 'success', text: `Statut mis à jour : ${newStatus}` });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la mise à jour.' });
    }
    setUpdating(false);
  }

  async function runAIAnalysis() {
    setAnalyzing(true);
    setMsg(null);
    const res = await fetch('/api/ai-matching/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: id }),
    });
    const d = await res.json();
    if (res.ok) {
      const updated = await fetch(`/api/family-matches/${id}`).then(r => r.json());
      setMatch(updated);
      setMsg({ type: 'success', text: `Analyse IA terminée — Score : ${Math.round(d.analysis.confidence)}%` });
    } else {
      setMsg({ type: 'error', text: d.error ?? 'Erreur IA.' });
    }
    setAnalyzing(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
  if (!match) return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <p className="text-gray-500">Correspondance introuvable.</p>
      <Link href="/family-matches" className="text-blue-600 mt-2 inline-block">← Retour</Link>
    </div>
  );

  const factors: Factor[] = match.aiFactors ? JSON.parse(match.aiFactors) : [];
  const transitions = STATUS_TRANSITIONS[match.status] ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/family-matches" className="hover:text-blue-600 flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Correspondances
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Réf. #{id.slice(0, 8).toUpperCase()}</span>
      </div>

      {/* Message */}
      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm">{msg.text}</p>
          <button onClick={() => setMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className={`px-6 py-4 flex flex-col sm:flex-row justify-between items-start gap-4 ${
          match.status === 'confirmed' ? 'bg-green-700' :
          match.status === 'verified' ? 'bg-blue-700' :
          match.status === 'rejected' ? 'bg-red-700' : 'bg-blue-800'
        } text-white`}>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">Correspondance familiale</h1>
              <MatchStatusBadge status={match.status} />
            </div>
            <p className="text-sm opacity-75 mt-1">
              Créée le {new Date(match.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {/* Score global */}
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <p className="text-xs opacity-70 uppercase">Score Algo</p>
              <p className="text-2xl font-bold">{Math.round(match.confidenceScore)}%</p>
            </div>
            {match.aiConfidenceScore != null && (
              <div className="text-center bg-purple-700/50 rounded-lg px-3 py-1.5">
                <p className="text-xs opacity-70 uppercase">Score ElikIA</p>
                <p className="text-2xl font-bold">{Math.round(match.aiConfidenceScore)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Scores breakdown */}
        <div className="px-6 py-4 bg-gray-50 border-b grid grid-cols-3 gap-4">
          {[
            { label: 'Similarité nom', val: match.nameSimilarity },
            { label: 'Proximité âge', val: match.ageSimilarity },
            { label: 'Lieu', val: match.locationSimilarity },
          ].map(s => (
            <div key={s.label}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              {scoreBar(s.val)}
            </div>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personne disparue */}
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          <div className="bg-blue-50 border-b px-5 py-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-blue-800">Personne disparue</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {match.missingPerson.imageUrl
                  ? <img src={match.missingPerson.imageUrl} alt="" className="w-full h-full object-cover" />
                  : <User className="h-8 w-8 text-gray-400" />}
              </div>
              <div className="min-w-0">
                <Link href={`/missing/${match.missingPerson.id}`} className="font-bold text-blue-600 hover:text-blue-800 text-lg leading-tight">
                  {match.missingPerson.fullName}
                </Link>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <UrgencyBadge level={match.missingPerson.urgencyLevel} />
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {match.missingPerson.age && (
                <div className="flex gap-2 text-gray-600">
                  <User className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <span>{match.missingPerson.age} ans</span>
                </div>
              )}
              <div className="flex gap-2 text-gray-600">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <span>Disparu(e) le {new Date(match.missingPerson.dateMissing).toLocaleDateString('fr-FR')}</span>
              </div>
              {match.missingPerson.lastKnownLocation && (
                <div className="flex gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <span>{match.missingPerson.lastKnownLocation}</span>
                </div>
              )}
              {match.missingPerson.contactPhone && (
                <div className="flex gap-2 text-gray-600">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <span>{match.missingPerson.contactPerson} — {match.missingPerson.contactPhone}</span>
                </div>
              )}
            </div>
            {match.missingPerson.physicalDescription && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium text-gray-500 text-xs uppercase mb-1">Signalement physique</p>
                {match.missingPerson.physicalDescription}
              </div>
            )}
            {match.missingPerson.medicalConditions && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-xs uppercase mb-0.5">Conditions médicales</p>
                  {match.missingPerson.medicalConditions}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Membre de famille */}
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          <div className="bg-purple-50 border-b px-5 py-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-purple-800">Membre de famille recherchant</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <User className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{match.familyMember.fullName}</p>
                <p className="text-sm text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {REL_LABELS[match.familyMember.relationship] ?? match.familyMember.relationship}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {match.familyMember.age && (
                <div className="flex gap-2 text-gray-600">
                  <User className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <span>{match.familyMember.age} ans</span>
                </div>
              )}
              {match.familyMember.contactInfo && (
                <div className="flex gap-2 text-gray-600">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <span>{match.familyMember.contactInfo}</span>
                </div>
              )}
              <div className="flex gap-2 text-gray-600">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                <span>Enregistré le {new Date(match.familyMember.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-500 text-xs uppercase mb-1">Soumis par</p>
              <p className="text-gray-700">{match.familyMember.searcher.name ?? match.familyMember.searcher.email}</p>
              <p className="text-gray-400 text-xs">{match.familyMember.searcher.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="bg-purple-50 border-b px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-purple-800">Analyse ElikIA</h2>
          </div>
          <button
            onClick={runAIAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {analyzing ? 'ElikIA analyse...' : match.aiAnalyzedAt ? 'Ré-analyser' : 'Demander à ElikIA'}
          </button>
        </div>
        <div className="p-5">
          {!match.aiAnalyzedAt && !analyzing && (
            <p className="text-gray-400 text-sm text-center py-6">
              Cliquez sur "Demander à ElikIA" pour obtenir une analyse approfondie.
            </p>
          )}
          {analyzing && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              <p className="text-purple-600 text-sm">ElikIA analyse les profils...</p>
            </div>
          )}
          {match.aiAnalyzedAt && !analyzing && (
            <div className="space-y-4">
              {match.aiSummary && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 leading-relaxed">{match.aiSummary}</p>
                  <p className="text-xs text-purple-400 mt-2">
                    ElikIA · Analysé le {new Date(match.aiAnalyzedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {factors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Facteurs détectés par ElikIA</p>
                  {factors.map((f, i) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-lg border text-sm ${
                      f.type === 'positive' ? 'bg-green-50 border-green-200' :
                      f.type === 'negative' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
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
              )}
              {match.notes && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex gap-2">
                  <Brain className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Recommandation ElikIA</p>
                    <p className="text-sm text-purple-800">{match.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verification panel — agents only */}
      {isAgent && (
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          <div className="bg-gray-50 border-b px-5 py-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-800">Décision de l'agent</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Current status info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                Statut actuel : <MatchStatusBadge status={match.status} />
              </div>
              {match.verifiedBy && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4 text-gray-400" />
                  Vérifié par : <span className="font-medium">{match.verifiedBy.name ?? match.verifiedBy.email}</span>
                  {match.verifiedAt && <span className="text-gray-400">— {new Date(match.verifiedAt).toLocaleDateString('fr-FR')}</span>}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Notes de l'agent</label>
                {!showNotesEdit && (
                  <button onClick={() => setShowNotesEdit(true)} className="text-xs text-blue-600 hover:text-blue-800">
                    {match.notes ? 'Modifier' : 'Ajouter une note'}
                  </button>
                )}
              </div>
              {showNotesEdit ? (
                <div className="space-y-2">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Observations, raisons de la décision, informations complémentaires..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={() => setShowNotesEdit(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 min-h-[48px]">
                  {match.notes ?? <span className="text-gray-400 italic">Aucune note.</span>}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {transitions.length > 0 ? (
              <div className="flex flex-wrap gap-3 pt-2 border-t">
                {transitions.map(t => (
                  <button
                    key={t.next}
                    onClick={() => updateStatus(t.next)}
                    disabled={updating}
                    className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${t.color}`}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : t.next === 'confirmed' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : t.next === 'rejected' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                match.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}>
                {match.status === 'confirmed'
                  ? <><CheckCircle className="h-5 w-5 shrink-0" /> Réunification confirmée — dossier clôturé.</>
                  : <><XCircle className="h-5 w-5 shrink-0" /> Correspondance rejetée.</>
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
