'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
      <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      <p className="text-gray-400 font-medium">Chargement de la carte...</p>
    </div>
  ),
});

export default function MapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAgent = status === 'authenticated' && (session?.user as any)?.userType === 'agent';

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && !isAgent) router.push('/');
  }, [status, isAgent, router]);

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
    </div>
  );

  if (!isAgent) return null;

  return <MapClient />;
}
