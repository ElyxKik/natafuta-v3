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

const SYSTEM_PROMPT = `Tu es un expert en recherche de personnes disparues en Afrique centrale.
Génère des résumés clairs et concis pour aider les agents à prioriser leur travail.
Réponds UNIQUEMENT en JSON valide :
\`\`\`json
{
  "summary": "<résumé en 2-3 phrases claires pour l'agent>",
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

  const matches = await prisma.familyMatch.findMany({
    where: { id: { in: matchIds } },
    include: {
      missingPerson: { select: { fullName: true, age: true, lastKnownLocation: true, description: true, medicalConditions: true, dateMissing: true, urgencyLevel: true } },
      familyMember: { select: { fullName: true, relationship: true, age: true, contactInfo: true } },
    },
  });

  const results: Record<string, SummaryResult> = {};

  for (const match of matches) {
    const mp = match.missingPerson;
    const fm = match.familyMember;

    const userPrompt = `Génère un résumé de cette correspondance familiale :

Personne disparue : ${mp.fullName}, ${mp.age ?? '?'} ans, disparue le ${new Date(mp.dateMissing).toLocaleDateString('fr-FR')}
Lieu : ${mp.lastKnownLocation ?? 'Inconnu'}
Urgence : ${mp.urgencyLevel}
Conditions médicales : ${mp.medicalConditions ?? 'Aucune'}

Membre de famille : ${fm.fullName} (${fm.relationship}), ${fm.age ?? '?'} ans
Contact : ${fm.contactInfo ?? 'Non renseigné'}

Score de correspondance : ${Math.round(match.confidenceScore)}% (nom: ${Math.round(match.nameSimilarity)}%, âge: ${Math.round(match.ageSimilarity)}%, lieu: ${Math.round(match.locationSimilarity)}%)
Score IA précédent : ${match.aiConfidenceScore ? Math.round(match.aiConfidenceScore) + '%' : 'Non analysé'}`;

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
