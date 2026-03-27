'use client';

import Link from 'next/link';
import { AlertCircle, MapPin, Calendar, Phone } from 'lucide-react';

interface MissingPersonCardProps {
  id: string;
  title: string;
  fullName: string;
  imageUrl?: string;
  lastKnownLocation?: string;
  dateMissing: string;
  urgencyLevel: string;
  status: string;
  contactPhone?: string;
}

export function MissingPersonCard({
  id,
  title,
  fullName,
  imageUrl,
  lastKnownLocation,
  dateMissing,
  urgencyLevel,
  status,
  contactPhone,
}: MissingPersonCardProps) {
  const urgencyColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    found: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <Link href={`/missing-persons/${id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        {imageUrl && (
          <div className="relative h-48 bg-gray-200">
            <img
              src={imageUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{fullName}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>

          <div className="space-y-2 mb-4">
            {lastKnownLocation && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {lastKnownLocation}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(dateMissing).toLocaleDateString('fr-FR')}
            </div>
            {contactPhone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {contactPhone}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                urgencyColors[urgencyLevel as keyof typeof urgencyColors]
              }`}
            >
              {urgencyLevel}
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                statusColors[status as keyof typeof statusColors]
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
