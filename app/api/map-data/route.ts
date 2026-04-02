import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Coordonnées approximatives des provinces / villes connues RDC
const RDC_GEO: Record<string, [number, number]> = {
  // Provinces
  'kinshasa': [-4.3217, 15.3222],
  'lubumbashi': [-11.6609, 27.4794],
  'mbuji-mayi': [-6.1500, 23.6000],
  'kananga': [-5.8960, 22.4167],
  'kisangani': [0.5167, 25.2000],
  'bukavu': [-2.5083, 28.8608],
  'goma': [-1.6792, 29.2228],
  'bunia': [1.5654, 30.2419],
  'beni': [0.4893, 29.4732],
  'butembo': [-0.1404, 29.2918],
  'uvira': [-3.4130, 29.1380],
  'kalemie': [-5.9333, 29.1833],
  'kolwezi': [-10.7154, 25.4731],
  'likasi': [-10.9814, 26.7331],
  'matadi': [-5.8196, 13.4600],
  'bandundu': [-3.3197, 17.3814],
  'mbandaka': [0.0481, 18.2561],
  'gemena': [3.2569, 19.7731],
  'nord-kivu': [-0.8328, 29.1142],
  'sud-kivu': [-2.5083, 28.8608],
  'ituri': [1.4419, 29.5163],
  'maniema': [-3.0000, 26.0000],
  'kasai': [-5.0000, 22.0000],
  'kasai-oriental': [-6.0000, 24.0000],
  'kasai-central': [-6.0000, 22.0000],
  'tanganyika': [-6.5000, 29.0000],
  'haut-katanga': [-10.5000, 27.5000],
  'lualaba': [-9.0000, 25.0000],
  'bas-uele': [3.5000, 24.0000],
  'haut-uele': [2.5000, 28.0000],
  'tshopo': [0.5000, 25.5000],
  'kwango': [-6.5000, 17.5000],
  'kwilu': [-4.5000, 18.5000],
  'mai-ndombe': [-2.5000, 18.5000],
  'sankuru': [-4.0000, 24.5000],
  'lomami': [-6.0000, 25.5000],
  'haut-lomami': [-8.5000, 26.0000],
  'mongala': [1.5000, 21.5000],
  'nord-ubangi': [3.5000, 20.0000],
  'sud-ubangi': [2.0000, 19.5000],
  'equateur': [0.0000, 22.0000],
  'tshuapa': [-0.5000, 23.0000],
  // Pays voisins (réfugiés)
  'rwanda': [-1.9403, 29.8739],
  'burundi': [-3.3731, 29.9189],
  'ouganda': [1.3733, 32.2903],
  'tanzanie': [-6.3690, 34.8888],
  'zambie': [-13.1339, 27.8493],
  'angola': [-11.2027, 17.8739],
  'centrafrique': [6.6111, 20.9394],
  'congo': [-0.2280, 15.8277],
  'soudan du sud': [6.8770, 31.3070],
};

function guessCoords(location: string | null | undefined): [number, number] | null {
  if (!location) return null;
  const lower = location.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, coords] of Object.entries(RDC_GEO)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower.includes(normKey)) return coords;
  }
  return null;
}

// Légère dispersion aléatoire pour éviter les superpositions exactes
function jitter(coords: [number, number], radius = 0.05): [number, number] {
  return [
    coords[0] + (Math.random() - 0.5) * radius,
    coords[1] + (Math.random() - 0.5) * radius,
  ];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const camps = await (prisma as any).camp.findMany({
    where: { status: 'active' },
    select: {
      id: true, name: true, type: true, location: true, province: true,
      capacity: true, currentOccupancy: true, status: true,
      latitude: true, longitude: true,
      contactPerson: true, contactPhone: true,
      _count: { select: { persons: true } },
    },
  });
  const persons = await prisma.missingPerson.findMany({
    where: {
      status: 'active',
      personType: { in: ['refugee', 'displaced'] },
    },
    select: {
      id: true, fullName: true, personType: true, age: true, gender: true,
      lastKnownLocation: true, originLocation: true,
      urgencyLevel: true, reunificationStatus: true,
      dossierNumber: true, arrivalDate: true,
      ethnicity: true,
      camp: { select: { id: true, name: true, location: true } },
    },
  });

  // Résoudre les coordonnées des camps
  const campFeatures = camps.map((c: any) => {
    const lat = c.latitude ?? guessCoords(c.location)?.[0] ?? guessCoords(c.province)?.[0];
    const lng = c.longitude ?? guessCoords(c.location)?.[1] ?? guessCoords(c.province)?.[1];
    return { ...c, lat, lng };
  }).filter((c: any) => c.lat && c.lng);

  // Résoudre les coordonnées des personnes
  const personFeatures = persons.map((p: any) => {
    let coords = guessCoords(p.camp?.location) ?? guessCoords(p.lastKnownLocation) ?? guessCoords(p.originLocation);
    if (!coords) return null;
    coords = jitter(coords, 0.08);
    return { ...p, lat: coords[0], lng: coords[1] };
  }).filter(Boolean);

  // Statistiques par province
  const statsByProvince: Record<string, { refugees: number; displaced: number }> = {};
  for (const p of persons as any[]) {
    const loc = p.camp?.location || p.lastKnownLocation || p.originLocation || '';
    const lower = loc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let province = 'Autre';
    for (const key of Object.keys(RDC_GEO)) {
      const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normKey)) { province = key; break; }
    }
    if (!statsByProvince[province]) statsByProvince[province] = { refugees: 0, displaced: 0 };
    if (p.personType === 'refugee') statsByProvince[province].refugees++;
    else statsByProvince[province].displaced++;
  }

  return NextResponse.json({
    camps: campFeatures,
    persons: personFeatures,
    stats: {
      totalCamps: camps.length,
      totalRefugees: (persons as any[]).filter((p: any) => p.personType === 'refugee').length,
      totalDisplaced: (persons as any[]).filter((p: any) => p.personType === 'displaced').length,
      byProvince: statsByProvince,
    },
  });
}
