'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PersonCard } from '@/components/PersonCard';
import { Search, Send, PlusCircle } from 'lucide-react';

interface MissingPerson {
  id: string;
  title: string;
  fullName: string;
  imageUrl?: string | null;
  lastKnownLocation?: string | null;
  dateMissing: string;
  urgencyLevel: string;
  status: string;
  createdAt: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [persons, setPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/missing-persons?page=1')
      .then((r) => r.json())
      .then((d) => { setPersons(d.persons?.slice(0, 6) ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <section className="bg-blue-800 text-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Bienvenue sur Natafuta</h1>
        <p className="text-xl mb-6">Application de recherche de personnes disparues</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/missing" className="bg-white text-blue-800 hover:bg-blue-100 px-6 py-3 rounded-lg font-semibold transition-colors">
            Consulter les fiches
          </Link>
          {!session?.user && (
            <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 border border-white px-6 py-3 rounded-lg font-semibold transition-colors">
              S&apos;inscrire
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Personnes disparues récentes</h2>
          <Link href="/missing" className="text-blue-600 hover:text-blue-800">Voir toutes →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-lg shadow-md h-64 animate-pulse" />)}
          </div>
        ) : persons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {persons.map((p) => (
              <PersonCard key={p.id} id={p.id} title={p.title} fullName={p.fullName}
                imageUrl={p.imageUrl} lastKnownLocation={p.lastKnownLocation}
                dateMissing={p.dateMissing} urgencyLevel={p.urgencyLevel}
                status={p.status} createdAt={p.createdAt} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">Aucune fiche disponible pour le moment.</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 mb-4"><Search className="h-12 w-12" /></div>
          <h3 className="text-xl font-semibold mb-2">Recherche avancée</h3>
          <p className="text-gray-600 mb-4">Trouvez rapidement des personnes disparues grâce à notre système de recherche.</p>
          <Link href="/missing" className="text-blue-600 hover:text-blue-800">Rechercher →</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 mb-4"><Send className="h-12 w-12" /></div>
          <h3 className="text-xl font-semibold mb-2">Signalements</h3>
          <p className="text-gray-600 mb-4">Contribuez en signalant si vous avez vu une personne disparue.</p>
          <Link href="/missing" className="text-blue-600 hover:text-blue-800">Contribuer →</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-blue-600 mb-4"><PlusCircle className="h-12 w-12" /></div>
          <h3 className="text-xl font-semibold mb-2">Création de fiches</h3>
          <p className="text-gray-600 mb-4">Les agents peuvent créer et gérer des fiches de personnes disparues.</p>
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-800">Devenir agent →</Link>
        </div>
      </section>
    </div>
  );
}
