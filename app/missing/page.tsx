import { Suspense } from 'react';
import { MissingPersonListContent } from '@/components/MissingPersonList';

export default function MissingPersonListPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Personnes disparues</h1>
      <Suspense fallback={
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 h-20 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-lg shadow-md h-64 animate-pulse" />)}
          </div>
        </div>
      }>
        <MissingPersonListContent />
      </Suspense>
    </div>
  );
}
