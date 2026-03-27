'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldOff, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  userType: string;
  isVerified: boolean;
  organization: string | null;
  badgeNumber: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const currentUser = session?.user as any;
  const isAdmin = currentUser?.userType === 'agent' && currentUser?.isAdmin === true;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && !isAdmin) router.push('/');
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false); });
    }
  }, [status, isAdmin]);

  async function promote(userId: string, newType: string) {
    setActionId(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userType: newType }),
    });
    setUsers(users.map(u => u.id === userId ? { ...u, userType: newType } : u));
    setActionId(null);
  }

  if (loading) return <div className="animate-pulse bg-white rounded-lg shadow-md h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-blue-700" />
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Utilisateur</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Rôle</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Inscrit le</th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium">{u.name ?? '—'}</p>
                  {u.organization && <p className="text-xs text-gray-500">{u.organization}</p>}
                </td>
                <td className="px-5 py-3 text-sm text-gray-700">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${u.userType === 'agent' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.userType === 'agent' ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                    {u.userType === 'agent' ? 'Agent' : 'Visiteur'}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-3">
                  {actionId === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  ) : u.userType === 'agent' ? (
                    <button onClick={() => promote(u.id, 'visitor')} className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                      <XCircle className="h-3.5 w-3.5" /> Rétrograder
                    </button>
                  ) : (
                    <button onClick={() => promote(u.id, 'agent')} className="flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" /> Promouvoir agent
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-gray-500 py-12">Aucun utilisateur.</p>}
      </div>
    </div>
  );
}
