import { getModulePrompt } from './ai-prompts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateWithAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No output generated';
}

export function buildModulePrompt(
  category: string,
  moduleSlug: string,
  outputName: string,
  title: string,
  sections: { label: string; value: string }[]
): { system: string; user: string } {
  const modulePrompt = getModulePrompt(category, moduleSlug);

  const system = `${modulePrompt.system}

Format rules:
- Use markdown: # for title, ## for sections, ### for subsections, - for bullets, **bold** for emphasis
- Start with a one-paragraph executive summary
- Be specific and actionable — no filler or generic advice
- End with prioritized next steps
- Write as a ready-to-share professional deliverable`;

  const filledSections = sections.filter(s => s.value.trim());
  const sectionText = filledSections.map(s => `### ${s.label}\n${s.value}`).join('\n\n');

  const user = `Generate a complete, professional ${outputName} titled "${title}" using the ${modulePrompt.methodology} framework.

Here is the information provided by the PM:

${sectionText}

Produce a comprehensive ${outputName} in markdown. Add your expert analysis, identify gaps, and provide actionable recommendations beyond what was provided.`;

  return { system, user };
}

export function buildAnalysisPrompt(
  category: string,
  moduleSlug: string,
  dataDescription: string
): { system: string; user: string } {
  const modulePrompt = getModulePrompt(category, moduleSlug);

  const system = `${modulePrompt.system}

You are reviewing existing data and providing expert analysis. Be specific, actionable, and reference the methodology. Use markdown formatting.`;

  const user = `Analyze the following data and provide expert recommendations using the ${modulePrompt.methodology} framework:

${dataDescription}

Provide:
1. Key observations and patterns
2. Gaps or risks identified
3. Specific, prioritized recommendations
4. Suggested next actions`;

  return { system, user };
}

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pm-os-api-key');
}

export function setApiKey(key: string): void {
  localStorage.setItem('pm-os-api-key', key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
