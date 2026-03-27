const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-reasoner';
const API_KEY = process.env.DEEPSEEK_API_KEY ?? '';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  content: string;
  reasoning: string | null;
}

export async function deepseekChat(
  messages: DeepSeekMessage[],
  temperature = 0.3,
): Promise<DeepSeekResponse> {
  if (!API_KEY || API_KEY === 'your-deepseek-api-key-here') {
    throw new Error('DEEPSEEK_API_KEY non configurée.');
  }

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return {
    content: choice?.message?.content ?? '',
    reasoning: choice?.message?.reasoning_content ?? null,
  };
}

export function extractJSON<T>(text: string): T | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}
