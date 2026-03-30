'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Globe, MapPin, Phone, User, Loader2, ChevronLeft, Tent, Calendar, FileText } from 'lucide-react';

const REUNI_LABELS: Record<string, string> = {
  pending: 'En attente', in_progress: 'En cours', reunified: 'Réunifié', closed: 'Fermé',
};
const REUNI_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800',
  reunified: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-700',
};

export default function RefugeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isAgent = (session?.user as any)?.userType === 'agent';

  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/refugees/${id}`)
      .then(r => r.json())
      .then(d => { setPerson(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );

  if (!person || person.error) return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <p className="text-gray-500">Fiche introuvable.</p>
      <Link href="/refugees" className="text-green-600 hover:text-green-800 mt-2 inline-block">← Retour aux réfugiés</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-800 text-white p-6">
          <Link href="/refugees" className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1 mb-3">
            <ChevronLeft className="h-4 w-4" /> Retour aux réfugiés
          </Link>
          <div className="flex items-start gap-4">
            {person.imageUrl ? (
              <img src={person.imageUrl} alt={person.fullName} className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                <Globe className="h-10 w-10 text-white/70" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 opacity-70" />
                <span className="text-sm opacity-70 font-medium uppercase tracking-wide">Réfugié</span>
              </div>
              <h1 className="text-3xl font-bold">{person.fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {person.age && <span className="text-sm opacity-80">{person.age} ans</span>}
                {person.gender && <span className="text-sm opacity-80">{person.gender === 'male' ? 'Masculin' : person.gender === 'female' ? 'Féminin' : ''}</span>}
                {person.originLocation && (
                  <span className="flex items-center gap-1 text-sm opacity-80">
                    <MapPin className="h-3.5 w-3.5" /> {person.originLocation}
                  </span>
                )}
              </div>
              {person.reunificationStatus && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${REUNI_COLORS[person.reunificationStatus]}`}>
                  Réunification : {REUNI_LABELS[person.reunificationStatus] ?? person.reunificationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Infos d'enregistrement */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" /> Enregistrement
            </h3>
            <dl className="space-y-2 text-sm">
              {person.dossierNumber && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">N° dossier</dt><dd className="font-medium">{person.dossierNumber}</dd></div>
              )}
              {person.arrivalDate && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Date d'arrivée</dt>
                  <dd className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-gray-400" />{new Date(person.arrivalDate).toLocaleDateString('fr-FR')}</dd>
                </div>
              )}
              {person.camp && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Camp</dt>
                  <dd><Link href={`/camps/${person.camp.id}`} className="text-green-600 hover:text-green-800 flex items-center gap-1"><Tent className="h-3.5 w-3.5" />{person.camp.name}</Link></dd>
                </div>
              )}
              {person.ethnicity && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Ethnie</dt><dd className="font-medium">{person.ethnicity}</dd></div>
              )}
              {person.languages && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Langues</dt><dd className="font-medium">{person.languages}</dd></div>
              )}
            </dl>
          </div>

          {/* Famille */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" /> Famille
            </h3>
            <dl className="space-y-2 text-sm">
              {person.fatherName && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Père</dt><dd className="font-medium">{person.fatherName}</dd></div>
              )}
              {person.motherName && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Mère</dt><dd className="font-medium">{person.motherName}</dd></div>
              )}
              {person.contactPerson && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Contact</dt><dd className="font-medium">{person.contactPerson}</dd></div>
              )}
              {person.contactPhone && (
                <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Téléphone</dt>
                  <dd className="font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" />{person.contactPhone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Description */}
          {person.description && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{person.description}</p>
            </div>
          )}
          {person.physicalDescription && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-800 mb-2">Description physique</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{person.physicalDescription}</p>
            </div>
          )}
          {person.medicalConditions && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-800 mb-2">Conditions médicales</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{person.medicalConditions}</p>
            </div>
          )}
        </div>

        {/* Actions agent */}
        {isAgent && (
          <div className="px-6 pb-6 flex gap-3 flex-wrap">
            <Link href={`/family-member/new?personId=${person.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Ajouter un membre de famille chercheur
            </Link>
            <Link href={`/family-matches?personId=${person.id}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Voir les correspondances
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
