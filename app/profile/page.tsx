'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin } from 'lucide-react';

interface Profile {
  id: string; name?: string | null; email?: string | null; image?: string | null;
  userType: string; phoneNumber?: string | null; address?: string | null;
  organization?: string | null; badgeNumber?: string | null; bio?: string | null; isVerified: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ phoneNumber: '', organization: '', badgeNumber: '', address: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (status === 'unauthenticated') router.push('/auth/login'); }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile').then((r) => r.json()).then((d) => {
        setProfile(d);
        setForm({ phoneNumber: d.phoneNumber ?? '', organization: d.organization ?? '', badgeNumber: d.badgeNumber ?? '', address: d.address ?? '', bio: d.bio ?? '' });
        setLoading(false);
      });
    }
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSuccess(false);
    const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setProfile(await res.json()); setSuccess(true); }
    setSaving(false);
  }

  if (loading || !profile) return <div className="bg-white rounded-lg shadow-md p-8 animate-pulse h-64" />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-800 text-white p-6"><h1 className="text-2xl font-bold">Profil utilisateur</h1></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              {profile.image ? <img src={profile.image} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="h-16 w-16 text-gray-400" />}
            </div>
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-gray-600 text-sm">{profile.email}</p>
            <div className="mt-3 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${profile.userType === 'agent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {profile.userType === 'agent' ? 'Agent' : 'Visiteur'}
              </span>
              {profile.isVerified && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">Vérifié</span>}
            </div>
            <div className="mt-6 w-full space-y-2 text-sm">
              {profile.email && <div className="flex gap-2"><Mail className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{profile.email}</span></div>}
              {profile.phoneNumber && <div className="flex gap-2"><Phone className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{profile.phoneNumber}</span></div>}
              {profile.address && <div className="flex gap-2"><MapPin className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{profile.address}</span></div>}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Modifier le profil</h3>
            {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded mb-4">Profil mis à jour !</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input name="phoneNumber" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Organisation</label>
                  <input name="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              {profile.userType === 'agent' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Numéro de badge</label>
                  <input value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
                <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
