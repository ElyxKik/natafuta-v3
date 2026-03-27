'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { User, Mail, MapPin, Shield, FileText } from 'lucide-react';

interface UserProfile {
  id: string; name?: string | null; email?: string | null; image?: string | null;
  userType: string; phoneNumber?: string | null; address?: string | null;
  organization?: string | null; badgeNumber?: string | null; bio?: string | null; isVerified: boolean;
  createdNotices: { id: string; title: string; fullName: string; status: string; createdAt: string }[];
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/user/${id}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d) => { setUser(d); setLoading(false); })
        .catch(() => { setError('Utilisateur introuvable.'); setLoading(false); });
    }
  }, [id, status]);

  if (loading) return <div className="bg-white rounded-lg shadow-md p-8 animate-pulse h-64" />;
  if (error || !user) return <div className="bg-white rounded-lg shadow-md p-12 text-center"><p className="text-gray-500">{error || 'Introuvable.'}</p></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-800 text-white p-6"><h1 className="text-2xl font-bold">Profil de {user.name}</h1></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              {user.image ? <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="h-14 w-14 text-gray-400" />}
            </div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.userType === 'agent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {user.userType === 'agent' ? 'Agent' : 'Visiteur'}
              </span>
              {user.isVerified && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Vérifié</span>}
            </div>
            <div className="mt-4 space-y-2 text-sm w-full">
              {user.email && <div className="flex gap-2"><Mail className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{user.email}</span></div>}
              {user.address && <div className="flex gap-2"><MapPin className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{user.address}</span></div>}
              {user.organization && <div className="flex gap-2"><Shield className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{user.organization}</span></div>}
            </div>
            {user.bio && <p className="mt-4 text-sm text-gray-600 italic">{user.bio}</p>}
          </div>

          <div className="md:col-span-2">
            {user.userType === 'agent' && user.createdNotices.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /> Fiches créées</h3>
                <div className="space-y-2">
                  {user.createdNotices.map((n) => (
                    <Link key={n.id} href={`/missing/${n.id}`} className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{n.title}</p>
                          <p className="text-xs text-gray-500">{n.fullName}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${n.status === 'active' ? 'bg-red-100 text-red-700' : n.status === 'found' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {n.status === 'active' ? 'Disparue' : n.status === 'found' ? 'Retrouvée' : 'Fermé'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {user.createdNotices.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune fiche créée par cet utilisateur.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
