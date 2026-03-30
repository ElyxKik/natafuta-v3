import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deepseekChat, extractJSON } from '@/lib/deepseek';

export const dynamic = 'force-dynamic';

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  nextSteps: string[];
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

const SYSTEM_PROMPT = `Tu es ElikIA, un agent IA humanitaire expert en réunification familiale des réfugiés et déplacés internes (PDI) en RDC.
Génère des résumés clairs et actionnables pour aider les agents humanitaires à prioriser les dossiers de réunification familiale.

Principes :
- Une réunification réussie peut changer une vie — recommande des actions concrètes et urgentes
- Tiens compte du type de personne (réfugié ou PDI) dans ton analyse
- Si le statut est déjà "in_progress" ou "reunified", adapte la recommandation en conséquence
- Cite le camp et le numéro de dossier si disponibles
- L'urgence doit refléter la situation humanitaire réelle
- COHÉRENCE BIOLOGIQUE D'ÂGE : CRITIQUE — un parent doit être au minimum 15 ans plus âgé que son enfant. Si tu détectes une incohérence d'âge, signale-la comme un problème majeur dans le résumé.

Réponds UNIQUEMENT en JSON valide :
\`\`\`json
{
  "summary": "<résumé en 2-3 phrases claires pour l'agent humanitaire>",
  "keyPoints": ["<point clé 1>", "<point clé 2>", ...],
  "urgency": "low" | "medium" | "high" | "critical",
  "nextSteps": ["<action concrète 1>", "<action concrète 2>", ...]
}
\`\`\``;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).userType !== 'agent') {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const { matchIds } = await req.json();
  if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
    return NextResponse.json({ error: 'matchIds[] requis.' }, { status: 400 });
  }

  const matches = await (prisma as any).familyMatch.findMany({
    where: { id: { in: matchIds } },
    include: {
      missingPerson: {
        select: {
          fullName: true, age: true, gender: true, lastKnownLocation: true,
          description: true, medicalConditions: true, dateMissing: true, urgencyLevel: true,
          personType: true, dossierNumber: true, arrivalDate: true, reunificationStatus: true,
          originLocation: true, ethnicity: true,
          camp: { select: { name: true, location: true } },
        },
      },
      familyMember: { select: { fullName: true, relationship: true, age: true, contactInfo: true, location: true } },
    },
  });

  const results: Record<string, SummaryResult> = {};

  for (const match of matches) {
    const mp = match.missingPerson;
    const fm = match.familyMember;

    const typeLabel = mp.personType === 'refugee' ? 'Réfugié(e)' : mp.personType === 'displaced' ? 'Déplacé(e) interne' : 'Personne disparue';
    const reunifLabels: Record<string, string> = { pending: 'En attente', in_progress: 'En cours', reunified: 'Réunifié', closed: 'Fermé' };
    const ageValidation = validateAgeCoherence(mp.age, fm.age, fm.relationship);
    const ageWarning = !ageValidation.isValid ? `\n⚠️ ALERTE INCOHÉRENCE D'ÂGE : ${ageValidation.issue}` : '';
    const userPrompt = `Génère un résumé de ce dossier de réunification familiale :${ageWarning}

PERSONNE ENREGISTRÉE : ${mp.fullName} — ${typeLabel}
- Âge : ${mp.age ?? '?'} ans | Sexe : ${mp.gender === 'male' ? 'M' : mp.gender === 'female' ? 'F' : '?'}
- Origine : ${mp.originLocation ?? 'Inconnue'} | Ethnie : ${mp.ethnicity ?? 'Non renseignée'}
- Camp : ${mp.camp?.name ?? 'Non assigné'}${mp.camp?.location ? ` (${mp.camp.location})` : ''}
- N° dossier : ${mp.dossierNumber ?? 'Aucun'}
- Date d'arrivée : ${mp.arrivalDate ? new Date(mp.arrivalDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
- Statut réunification : ${reunifLabels[mp.reunificationStatus] ?? mp.reunificationStatus ?? 'Non défini'}
- Date de déplacement : ${new Date(mp.dateMissing).toLocaleDateString('fr-FR')}
- Conditions médicales : ${mp.medicalConditions ?? 'Aucune'}

MEMBRE DE FAMILLE QUI RECHERCHE : ${fm.fullName} (${fm.relationship}), ${fm.age ?? '?'} ans
- Localisation : ${fm.location ?? 'Non renseignée'}
- Contact : ${fm.contactInfo ?? 'Non renseigné'}

SCORES DE CORRESPONDANCE :
- Global : ${Math.round(match.confidenceScore)}% (nom: ${Math.round(match.nameSimilarity)}%, âge: ${Math.round(match.ageSimilarity)}%, lieu: ${Math.round(match.locationSimilarity)}%)
- Score IA précédent : ${match.aiConfidenceScore ? Math.round(match.aiConfidenceScore) + '%' : 'Non analysé'}`;

    try {
      const response = await deepseekChat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ], 0.4);

      const result = extractJSON<SummaryResult>(response.content);
      if (result) {
        results[match.id] = result;
        await prisma.familyMatch.update({
          where: { id: match.id },
          data: { aiSummary: result.summary },
        });
      }
    } catch {
      results[match.id] = {
        summary: 'Analyse IA indisponible.',
        keyPoints: [],
        urgency: match.missingPerson.urgencyLevel as any,
        nextSteps: [],
      };
    }
  }

  return NextResponse.json({ results });
}
