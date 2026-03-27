import Link from 'next/link';
import { Calendar, MapPin, User } from 'lucide-react';
import { UrgencyBadge, StatusBadge } from './UrgencyBadge';

interface PersonCardProps {
  id: string;
  title: string;
  fullName: string;
  imageUrl?: string | null;
  lastKnownLocation?: string | null;
  dateMissing: string | Date;
  urgencyLevel: string;
  status: string;
  createdAt: string | Date;
}

export function PersonCard({ id, title, fullName, imageUrl, lastKnownLocation, dateMissing, urgencyLevel, status, createdAt }: PersonCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <User className="h-16 w-16" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={status} />
        </div>
        <div className="absolute top-2 right-2">
          <UrgencyBadge level={urgencyLevel} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2 truncate">{title}</h3>
        <p className="text-gray-600 mb-3 truncate">{fullName}</p>
        <p className="text-gray-500 text-sm mb-2 flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          Disparue le: {new Date(dateMissing).toLocaleDateString('fr-FR')}
        </p>
        {lastKnownLocation && (
          <p className="text-gray-500 text-sm mb-3 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {lastKnownLocation}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Signalée le: {new Date(createdAt).toLocaleDateString('fr-FR')}
          </span>
          <Link href={`/missing/${id}`} className="text-blue-600 hover:text-blue-800 font-medium">
            Détails →
          </Link>
        </div>
      </div>
    </div>
  );
}
