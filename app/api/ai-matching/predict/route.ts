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

// Validation logique d'âge pour éviter les incohérences biologiques
function validateAgeCoherence(
  age1: number | null | undefined,
  age2: number | null | undefined,
  relationship: string
): { isValid: boolean; issue?: string } {
  if (!age1 || !age2) return { isValid: true };

  const ageDiff = Math.abs(age1 - age2);

  if (relationship.includes('parent') || relationship.includes('père') || relationship.includes('mère')) {
    if (ageDiff < 15) {
      return { isValid: false, issue: `Parent trop jeune (écart ${ageDiff} ans, minimum 15)` };
    }
  }

  if (relationship.includes('sibling') || relationship.includes('frère') || relationship.includes('sœur')) {
    if (ageDiff > 50) {
      return { isValid: false, issue: `Écart d'âge anormal pour fratrie (${ageDiff} ans)` };
    }
  }

  if (relationship.includes('grandparent') || relationship.includes('grand-parent')) {
    if (ageDiff < 30) {
      return { isValid: false, issue: `Grand-parent trop jeune (écart ${ageDiff} ans, minimum 30)` };
    }
  }

  return { isValid: true };
}

const SYSTEM_PROMPT = `Tu es ElikIA, un agent IA humanitaire spécialisé dans la réunification familiale des réfugiés et déplacés internes (PDI) en Afrique centrale (RDC, Congo).
Ton expertise unique est de détecter des liens CACHÉS entre des personnes enregistrées dans des camps ou sites de déplacement qui pourraient appartenir au même groupe familial ou avoir été séparées lors du même événement.

Contexte spécifique RDC :
- Les familles sont souvent séparées brutalement lors de conflits armés, puis enregistrées dans des camps différents
- Les noms peuvent être orthographiés différemment selon la langue du recensement (Swahili, Lingala, Kinyarwanda, Kirundi, Tshiluba, Kikongo)
- Les âges déclarés sont souvent approximatifs, surtout pour les enfants
- Les personnes du même village ou clan fuient souvent ensemble — l'ethnie et le lieu d'origine sont des indices forts
- Un même numéro de dossier ou une même date d'arrivée peut indiquer une arrivée groupée

Cherche des patterns comme :
- Même famille (noms de famille similaires, noms du père ou de la mère identiques ou proches)
- Même ethnie, tribu ou clan + même région d'origine
- Langues parlées identiques ou du même groupe linguistique
- Tranche d'âge compatible avec un lien parent/enfant ou fratrie
- Même camp ou camps proches + période d'arrivée similaire
- Circonstances similaires (même type de conflit, même axe de fuite)
- Conditions médicales héréditaires similaires
- Descriptions physiques compatibles avec un lien biologique
- COHÉRENCE BIOLOGIQUE D'ÂGE : CRITIQUE — un parent doit être au minimum 15 ans plus âgé que son enfant. Si tu détectes une incohérence d'âge, réduis drastiquement la confiance ou rejette le lien.

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

  const target = await (prisma as any).missingPerson.findUnique({
    where: { id: missingPersonId },
    include: { camp: { select: { name: true, location: true, province: true } } },
  });
  if (!target) return NextResponse.json({ error: 'Personne introuvable.' }, { status: 404 });
  if (target.personType !== 'refugee' && target.personType !== 'displaced') {
    return NextResponse.json({ error: 'La détection de liens croisés est réservée aux réfugiés et déplacés internes.' }, { status: 400 });
  }

  const others = await (prisma as any).missingPerson.findMany({
    where: { id: { not: missingPersonId }, status: 'active', personType: { in: ['refugee', 'displaced'] } },
    include: { camp: { select: { name: true, location: true, province: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const typeLabel = target.personType === 'refugee' ? 'réfugié' : 'déplacé interne';
  if (others.length === 0) {
    return NextResponse.json({ crossLinks: [], groupSummary: `Aucun autre ${typeLabel} actif à comparer.`, commonFactors: [] });
  }

  const targetInfo = `
PERSONNE CIBLE (${typeLabel.toUpperCase()}) :
- ID : ${target.id}
- Type : ${typeLabel}
- Nom : ${target.fullName}
- Âge : ${target.age ?? 'Inconnu'}
- Sexe : ${target.gender === 'male' ? 'Masculin' : target.gender === 'female' ? 'Féminin' : 'Non précisé'}
- Ethnie / Tribu : ${target.ethnicity ?? 'Non renseignée'}
- Langues parlées : ${target.languages ?? 'Non renseignées'}
- Nom du père : ${target.fatherName ?? 'Non renseigné'}
- Nom de la mère : ${target.motherName ?? 'Non renseignée'}
- Lieu d'origine / Province : ${target.originLocation ?? 'Non renseigné'}
- Camp actuel : ${target.camp?.name ?? 'Non assigné'}${target.camp?.location ? ` (${target.camp.location})` : ''}
- N° dossier : ${target.dossierNumber ?? 'Aucun'}
- Date d'arrivée : ${target.arrivalDate ? new Date(target.arrivalDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
- Statut réunification : ${target.reunificationStatus ?? 'Non défini'}
- Circonstances : ${target.circumstances ?? 'Non renseignées'}
- Description : ${target.description}
- Physique : ${target.physicalDescription ?? 'Non renseigné'}
- Médical : ${target.medicalConditions ?? 'Aucun'}
- Date de déplacement : ${new Date(target.dateMissing).toLocaleDateString('fr-FR')}`;

  const othersInfo = others.map((p: any) => `
- ID : ${p.id}
- Type : ${p.personType}
- Nom : ${p.fullName}
- Âge : ${p.age ?? '?'} | Sexe : ${p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : '?'}
- Ethnie : ${p.ethnicity ?? '?'} | Langues : ${p.languages ?? '?'}
- Père : ${p.fatherName ?? '?'} | Mère : ${p.motherName ?? '?'}
- Origine : ${p.originLocation ?? '?'} | Camp : ${p.camp?.name ?? '?'}${p.camp?.location ? ` (${p.camp.location})` : ''}
- N° dossier : ${p.dossierNumber ?? 'Aucun'} | Arrivée : ${p.arrivalDate ? new Date(p.arrivalDate).toLocaleDateString('fr-FR') : '?'}
- Circonstances : ${(p.circumstances ?? '?').slice(0, 80)}
- Description : ${p.description.slice(0, 100)}
- Médical : ${p.medicalConditions ?? 'Aucun'}`).join('\n');

  const userPrompt = `${targetInfo}

AUTRES RÉFUGIÉS / DÉPLACÉS À COMPARER (${others.length}) :
${othersInfo}

Analyse les liens familiaux potentiels entre la PERSONNE CIBLE et les AUTRES. Focus sur : noms du père/mère identiques, même ethnie + même région, même période d'arrivée au camp. Retiens uniquement les liens avec confidence >= 40.`;

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
