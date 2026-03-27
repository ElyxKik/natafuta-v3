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

const SYSTEM_PROMPT = `Tu es ElikIA, un agent IA spécialisé dans la recherche de personnes disparues et la réunification familiale en Afrique centrale (RDC, Congo).
Tu as été conçu pour aider les agents humains à identifier des liens entre personnes disparues et membres de famille qui les recherchent.

Tu analyses chaque correspondance avec rigueur et empathie, en tenant compte de :
- Similarité des noms (patronymes, prénoms, noms d'ethnie, diminutifs courants en Lingala, Swahili, Kikongo, Tshiluba)
- Proximité d'âge (avec tolérance pour les erreurs déclaratives fréquentes en zone rurale ou contexte de conflit)
- Cohérence du sexe déclaré
- Appartenance ethnique commune ou liée (ethnie, tribu, clan)
- Langues parlées compatibles avec l'origine géographique ou ethnique
- Localisation géographique : cohérence entre lieu d'origine, dernier lieu connu et localisation du chercheur
- Description physique comparée entre la fiche officielle et la description du chercheur
- Conditions médicales similaires ou héréditaires
- Circonstances de la disparition (conflit, déplacement, fugue, enlèvement)
- Noms du père et de la mère : indices de filiation directe
- Cohérence du lien de parenté déclaré avec les âges respectifs
- Contexte de déplacement de population en RDC (conflits Est, axes migratoires)

Réponds UNIQUEMENT en JSON valide avec ce format exact :
\`\`\`json
{
  "confidence": <number 0-100>,
  "factors": [
    { "type": "positive" | "negative" | "neutral", "label": "<critère>", "detail": "<explication>" }
  ],
  "summary": "<résumé en 2-3 phrases>",
  "recommendation": "<action recommandée pour l'agent>"
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

  const mp = match.missingPerson;
  const fm = match.familyMember;

  const userPrompt = `Analyse la correspondance potentielle suivante :

## PERSONNE DISPARUE
- Nom complet : ${mp.fullName}
- Âge : ${mp.age ?? 'Inconnu'}
- Sexe : ${(mp as any).gender === 'male' ? 'Masculin' : (mp as any).gender === 'female' ? 'Féminin' : 'Non précisé'}
- Date de disparition : ${new Date(mp.dateMissing).toLocaleDateString('fr-FR')}
- Dernier lieu connu : ${mp.lastKnownLocation ?? 'Inconnu'}
- Lieu d'origine / Province : ${(mp as any).originLocation ?? 'Non renseigné'}
- Ethnie / Tribu : ${(mp as any).ethnicity ?? 'Non renseignée'}
- Langues parlées : ${(mp as any).languages ?? 'Non renseignées'}
- Nom du père : ${(mp as any).fatherName ?? 'Non renseigné'}
- Nom de la mère : ${(mp as any).motherName ?? 'Non renseignée'}
- Circonstances de la disparition : ${(mp as any).circumstances ?? 'Non renseignées'}
- Description générale : ${mp.description}
- Description physique : ${mp.physicalDescription ?? 'Non renseignée'}
- Conditions médicales : ${mp.medicalConditions ?? 'Aucune'}
- Contact : ${mp.contactPerson ?? 'Inconnu'} / ${mp.contactPhone ?? 'Inconnu'}

## MEMBRE DE FAMILLE QUI RECHERCHE
- Nom complet : ${fm.fullName}
- Lien de parenté déclaré : ${fm.relationship}
- Âge : ${fm.age ?? 'Inconnu'}
- Localisation du chercheur : ${(fm as any).location ?? 'Non renseignée'}
- Description physique du disparu selon le chercheur : ${(fm as any).physicalDescription ?? 'Non renseignée'}
- Informations de contact : ${fm.contactInfo ?? 'Non renseigné'}
- Recherché par : ${fm.searcher.name ?? fm.searcher.email}

## SCORES ALGORITHMIQUES ACTUELS
- Similarité de nom : ${Math.round(match.nameSimilarity)}%
- Similarité d'âge : ${Math.round(match.ageSimilarity)}%
- Similarité de localisation : ${Math.round(match.locationSimilarity)}%
- Score global algorithmique : ${Math.round(match.confidenceScore)}%

Analyse ces deux profils en profondeur. Accorde une importance particulière aux nouveaux champs (ethnie, langues, noms des parents, circonstances, description physique croisée) pour affiner la confiance.`;

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
