import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deepseekChat, extractJSON } from '@/lib/deepseek';

export const dynamic = 'force-dynamic';

interface CrossLink {
  missingPersonId: string;
  missingPersonName: string;
  relationship: string;
  confidence: number;
  reasons: string[];
}

interface PredictResult {
  crossLinks: CrossLink[];
  groupSummary: string;
  commonFactors: string[];
}

const SYSTEM_PROMPT = `Tu es ElikIA, un agent IA spécialisé dans la recherche de personnes disparues et la réunification familiale en Afrique centrale (RDC, Congo).
Ton expertise unique est de détecter des liens CACHÉS entre plusieurs personnes disparues qui pourraient appartenir au même groupe familial ou avoir disparu dans des circonstances liées.
Cherche des patterns comme :
- Même famille (noms de famille similaires, diminutifs, noms ethniques — Lingala, Swahili, Kikongo, Tshiluba ; noms du père ou de la mère identiques)
- Même ethnie, tribu ou clan
- Langues parlées identiques ou proches
- Même sexe + tranche d'âge compatible avec un lien de fratrie ou parent/enfant
- Même zone géographique : lieu d'origine, dernier lieu connu, ou axe de déplacement similaire
- Circonstances similaires (même période, même type — conflit, déplacement, fugue, enlèvement)
- Conditions médicales héréditaires similaires
- Descriptions physiques compatibles avec un lien familial biologique

Réponds UNIQUEMENT en JSON valide :
\`\`\`json
{
  "crossLinks": [
    {
      "missingPersonId": "<id>",
      "missingPersonName": "<nom>",
      "relationship": "<type de lien potentiel>",
      "confidence": <0-100>,
      "reasons": ["<raison 1>", "<raison 2>"]
    }
  ],
  "groupSummary": "<résumé des liens détectés>",
  "commonFactors": ["<facteur commun 1>", "<facteur commun 2>"]
}
\`\`\`
Si aucun lien n'est détecté, retourne crossLinks vide.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const { missingPersonId } = await req.json();
  if (!missingPersonId) return NextResponse.json({ error: 'missingPersonId requis.' }, { status: 400 });

  const target = await prisma.missingPerson.findUnique({ where: { id: missingPersonId } });
  if (!target) return NextResponse.json({ error: 'Personne introuvable.' }, { status: 404 });

  const others = await prisma.missingPerson.findMany({
    where: { id: { not: missingPersonId }, status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (others.length === 0) {
    return NextResponse.json({ crossLinks: [], groupSummary: 'Aucune autre personne disparue à comparer.', commonFactors: [] });
  }

  const targetInfo = `
PERSONNE CIBLE :
- ID : ${target.id}
- Nom : ${target.fullName}
- Âge : ${target.age ?? 'Inconnu'}
- Sexe : ${(target as any).gender === 'male' ? 'Masculin' : (target as any).gender === 'female' ? 'Féminin' : 'Non précisé'}
- Ethnie / Tribu : ${(target as any).ethnicity ?? 'Non renseignée'}
- Langues parlées : ${(target as any).languages ?? 'Non renseignées'}
- Nom du père : ${(target as any).fatherName ?? 'Non renseigné'}
- Nom de la mère : ${(target as any).motherName ?? 'Non renseignée'}
- Lieu d'origine : ${(target as any).originLocation ?? 'Non renseigné'}
- Dernier lieu connu : ${target.lastKnownLocation ?? 'Inconnu'}
- Circonstances : ${(target as any).circumstances ?? 'Non renseignées'}
- Description : ${target.description}
- Physique : ${target.physicalDescription ?? 'Non renseigné'}
- Médical : ${target.medicalConditions ?? 'Aucun'}
- Date disparition : ${new Date(target.dateMissing).toLocaleDateString('fr-FR')}`;

  const othersInfo = others.map((p) => `
- ID : ${p.id}
- Nom : ${p.fullName}
- Âge : ${p.age ?? '?'}
- Sexe : ${(p as any).gender === 'male' ? 'M' : (p as any).gender === 'female' ? 'F' : '?'}
- Ethnie : ${(p as any).ethnicity ?? '?'}
- Langues : ${(p as any).languages ?? '?'}
- Père : ${(p as any).fatherName ?? '?'} / Mère : ${(p as any).motherName ?? '?'}
- Origine : ${(p as any).originLocation ?? '?'}
- Dernier lieu : ${p.lastKnownLocation ?? 'Inconnu'}
- Circonstances : ${(p as any).circumstances ?? '?'}
- Description : ${p.description.slice(0, 120)}...
- Médical : ${p.medicalConditions ?? 'Aucun'}
- Date : ${new Date(p.dateMissing).toLocaleDateString('fr-FR')}`).join('\n');

  const userPrompt = `${targetInfo}

AUTRES PERSONNES DISPARUES À COMPARER (${others.length}) :
${othersInfo}

Analyse les liens potentiels entre la PERSONNE CIBLE et les AUTRES. Retiens uniquement les liens avec confidence >= 40.`;

  try {
    const response = await deepseekChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], 0.2);

    const result = extractJSON<PredictResult>(response.content);
    if (!result) {
      return NextResponse.json({ error: 'Réponse IA invalide.', raw: response.content }, { status: 500 });
    }

    await prisma.missingPerson.update({
      where: { id: missingPersonId },
      data: { aiCrossLinks: JSON.stringify(result.crossLinks) },
    });

    return NextResponse.json({ ...result, reasoning: response.reasoning });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur IA.' }, { status: 500 });
  }
}
