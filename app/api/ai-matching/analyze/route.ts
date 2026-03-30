import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deepseekChat, extractJSON } from '@/lib/deepseek';

export const dynamic = 'force-dynamic';

interface AnalysisResult {
  confidence: number;
  factors: { type: 'positive' | 'negative' | 'neutral'; label: string; detail: string }[];
  summary: string;
  recommendation: string;
}

// Validation logique d'âge pour éviter les incohérences biologiques
function validateAgeCoherence(
  missingPersonAge: number | null | undefined,
  familyMemberAge: number | null | undefined,
  relationship: string
): { isValid: boolean; issue?: string } {
  if (!missingPersonAge || !familyMemberAge) return { isValid: true }; // Pas assez d'info

  const ageDiff = familyMemberAge - missingPersonAge;

  // Règles biologiques strictes
  if (relationship === 'parent' || relationship === 'père' || relationship === 'mère') {
    // Un parent doit être au minimum 15-16 ans plus âgé que son enfant
    if (ageDiff < 15) {
      return { isValid: false, issue: `Parent trop jeune : ${familyMemberAge} ans vs enfant ${missingPersonAge} ans (écart ${ageDiff} ans, minimum 15 requis)` };
    }
  }

  if (relationship === 'child' || relationship === 'enfant' || relationship === 'fils' || relationship === 'fille') {
    // Un enfant doit être au minimum 15-16 ans plus jeune que son parent
    if (ageDiff > -15) {
      return { isValid: false, issue: `Enfant trop âgé : ${missingPersonAge} ans vs parent ${familyMemberAge} ans (écart ${-ageDiff} ans, minimum 15 requis)` };
    }
  }

  if (relationship === 'sibling' || relationship === 'frère' || relationship === 'sœur') {
    // Des frères/sœurs ne doivent pas avoir plus de 50 ans d'écart (cas extrême)
    if (Math.abs(ageDiff) > 50) {
      return { isValid: false, issue: `Écart d'âge anormal pour des frères/sœurs : ${Math.abs(ageDiff)} ans` };
    }
  }

  if (relationship === 'grandparent' || relationship === 'grand-parent') {
    // Un grand-parent doit être au minimum 30 ans plus âgé
    if (ageDiff < 30) {
      return { isValid: false, issue: `Grand-parent trop jeune : ${familyMemberAge} ans vs petit-enfant ${missingPersonAge} ans (écart ${ageDiff} ans, minimum 30 requis)` };
    }
  }

  return { isValid: true };
}

const SYSTEM_PROMPT = `Tu es ElikIA, un agent IA humanitaire spécialisé dans la réunification familiale en Afrique centrale (RDC, Congo).
Tu opères dans le contexte des déplacements forcés : réfugiés fuyant leur pays et déplacés internes (PDI) fuyant les conflits à l'intérieur de la RDC.
Ta mission est d'aider les agents à identifier des liens familiaux entre des personnes enregistrées dans des camps ou sites de déplacement et les membres de famille qui les recherchent.

Tu analyses chaque correspondance avec rigueur et empathie humanitaire, en tenant compte de :
- TYPE DE PERSONNE : réfugié (venant d'un autre pays) ou déplacé interne (PDI, fuyant à l'intérieur de la RDC) — le contexte change l'analyse
- Similarité des noms (patronymes, prénoms, noms ethniques, diminutifs en Lingala, Swahili, Kikongo, Tshiluba, Kinyarwanda, Kirundi)
- Proximité d'âge (tolérance élevée : les déclarations en contexte de crise sont souvent approximatives)
- Cohérence du sexe déclaré
- Appartenance ethnique commune (ethnie, tribu, clan — indice fort en contexte de déplacement groupé)
- Langues parlées compatibles avec le pays ou la province d'origine
- Localisation géographique : cohérence entre lieu d'origine, camp d'accueil et localisation du chercheur
- Numéro de dossier officiel : si disponible, c'est un indicateur clé
- Date d'arrivée au camp : cohérence avec la période de fuite de la famille
- Description physique croisée
- Conditions médicales similaires ou héréditaires
- Noms du père et de la mère : filiation directe
- Cohérence du lien de parenté déclaré avec les âges respectifs
- Contexte de déplacement : conflits Est-RDC, axes migratoires, crises spécifiques (Kasai, Ituri, Nord-Kivu, Sud-Kivu)
- Statut de réunification actuel : s'il est déjà "in_progress" ou "reunified", cela affecte la recommandation
- COHÉRENCE BIOLOGIQUE D'ÂGE : CRITIQUE — un parent doit être au minimum 15 ans plus âgé que son enfant, un grand-parent 30 ans plus âgé. Si tu détectes une incohérence d'âge, c'est un facteur NÉGATIF majeur qui doit réduire drastiquement la confiance.

Réponds UNIQUEMENT en JSON valide avec ce format exact :
\`\`\`json
{
  "confidence": <number 0-100>,
  "factors": [
    { "type": "positive" | "negative" | "neutral", "label": "<critère>", "detail": "<explication>" }
  ],
  "summary": "<résumé en 2-3 phrases>",
  "recommendation": "<action concrète recommandée pour l'agent humanitaire>"
}
\`\`\``;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: 'matchId requis.' }, { status: 400 });

  const match = await prisma.familyMatch.findUnique({
    where: { id: matchId },
    include: {
      missingPerson: true,
      familyMember: {
        include: { searcher: { select: { name: true, email: true } } },
      },
    },
  });
  if (!match) return NextResponse.json({ error: 'Correspondance introuvable.' }, { status: 404 });

  const mp = match.missingPerson as any;
  const fm = match.familyMember as any;

  const personTypeLabel = mp.personType === 'refugee' ? 'RÉFUGIÉ' : mp.personType === 'displaced' ? 'DÉPLACÉ INTERNE (PDI)' : 'PERSONNE DISPARUE';
  const reunifLabel: Record<string, string> = { pending: 'En attente', in_progress: 'En cours', reunified: 'Réunifié', closed: 'Fermé' };

  // Vérifier la cohérence d'âge
  const ageValidation = validateAgeCoherence(mp.age, fm.age, fm.relationship);
  const ageWarning = !ageValidation.isValid ? `\n⚠️ ALERTE INCOHÉRENCE D'ÂGE : ${ageValidation.issue}` : '';

  const userPrompt = `Analyse la correspondance potentielle suivante pour une demande de réunification familiale :${ageWarning}

## PERSONNE ENREGISTRÉE — ${personTypeLabel}
- Nom complet : ${mp.fullName}
- Âge : ${mp.age ?? 'Inconnu'}
- Sexe : ${mp.gender === 'male' ? 'Masculin' : mp.gender === 'female' ? 'Féminin' : 'Non précisé'}
- Ethnie / Tribu : ${mp.ethnicity ?? 'Non renseignée'}
- Langues parlées : ${mp.languages ?? 'Non renseignées'}
- Lieu d'origine / Province : ${mp.originLocation ?? 'Non renseigné'}
- Dernier lieu connu / Site de déplacement : ${mp.lastKnownLocation ?? 'Inconnu'}
- Camp actuel : ${mp.camp?.name ?? 'Non assigné'}${mp.camp?.location ? ` (${mp.camp.location})` : ''}
- Numéro de dossier : ${mp.dossierNumber ?? 'Aucun'}
- Date d'arrivée au camp / de déplacement : ${mp.arrivalDate ? new Date(mp.arrivalDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
- Statut réunification actuel : ${reunifLabel[mp.reunificationStatus] ?? mp.reunificationStatus ?? 'Non défini'}
- Nom du père : ${mp.fatherName ?? 'Non renseigné'}
- Nom de la mère : ${mp.motherName ?? 'Non renseignée'}
- Circonstances du déplacement : ${mp.circumstances ?? 'Non renseignées'}
- Description générale : ${mp.description}
- Description physique : ${mp.physicalDescription ?? 'Non renseignée'}
- Conditions médicales : ${mp.medicalConditions ?? 'Aucune'}
- Contact : ${mp.contactPerson ?? 'Inconnu'} / ${mp.contactPhone ?? 'Inconnu'}

## MEMBRE DE FAMILLE QUI RECHERCHE
- Nom complet : ${fm.fullName}
- Lien de parenté déclaré : ${fm.relationship}
- Âge : ${fm.age ?? 'Inconnu'}
- Localisation du chercheur : ${fm.location ?? 'Non renseignée'}
- Description physique de la personne selon le chercheur : ${fm.physicalDescription ?? 'Non renseignée'}
- Informations de contact : ${fm.contactInfo ?? 'Non renseigné'}
- Enregistré par : ${fm.searcher?.name ?? fm.searcher?.email ?? 'Inconnu'}

## SCORES ALGORITHMIQUES ACTUELS
- Similarité de nom : ${Math.round(match.nameSimilarity)}%
- Similarité d'âge : ${Math.round(match.ageSimilarity)}%
- Similarité de localisation : ${Math.round(match.locationSimilarity)}%
- Score global algorithmique : ${Math.round(match.confidenceScore)}%

Contexte humanitaire : cette personne est un(e) ${personTypeLabel.toLowerCase()} en RDC. Tiens compte du contexte de déplacement forcé, des barrières linguistiques possibles dans les déclarations, et de l'urgence humanitaire. Analyse en profondeur et fournis une recommandation concrète à l'agent humanitaire.`;

  try {
    const response = await deepseekChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    const result = extractJSON<AnalysisResult>(response.content);
    if (!result) {
      return NextResponse.json({ error: 'Réponse IA invalide.', raw: response.content }, { status: 500 });
    }

    const updated = await prisma.familyMatch.update({
      where: { id: matchId },
      data: {
        aiConfidenceScore: result.confidence,
        aiSummary: result.summary,
        aiFactors: JSON.stringify(result.factors),
        aiAnalyzedAt: new Date(),
        notes: result.recommendation,
      },
    });

    return NextResponse.json({
      match: updated,
      analysis: result,
      reasoning: response.reasoning,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erreur IA.' }, { status: 500 });
  }
}
