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
      max_tokens: 3000,
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

export function buildPrompt(
  moduleName: string,
  outputName: string,
  title: string,
  sections: { label: string; value: string }[]
): { system: string; user: string } {
  const system = `You are an expert Product Manager assistant inside PM OS. Your job is to generate professional, actionable PM deliverables.

Rules:
- Write in clear, professional prose suitable for sharing with stakeholders
- Use markdown formatting: ## for sections, - for bullets, **bold** for emphasis
- Be specific and actionable, not generic
- Add analysis, recommendations, and insights beyond what the user provided
- Structure the output as a complete, ready-to-share ${outputName}
- Start with a one-paragraph executive summary
- End with concrete next steps`;

  const filledSections = sections.filter(s => s.value.trim());
  const sectionText = filledSections.map(s => `### ${s.label}\n${s.value}`).join('\n\n');

  const user = `Generate a complete, professional ${outputName} titled "${title}".

Here is the information provided:

${sectionText}

Generate a comprehensive ${outputName} that:
1. Starts with an executive summary
2. Expands on each section with professional analysis and recommendations  
3. Identifies gaps or risks the user may have missed
4. Ends with prioritized next steps
5. Uses proper markdown formatting

Output the full ${outputName} in markdown:`;

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
