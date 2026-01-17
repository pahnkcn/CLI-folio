'use server';

import { z } from 'zod';
import { generateAiText, enforceAiCooldown } from '@/ai/client';
import { extractJsonPayload } from '@/ai/extract-json-payload';
import { getPortfolioSnapshot } from '@/lib/data';

type PromptSuggestion = {
  label: string;
  question: string;
};

const PromptSuggestionSchema = z.object({
  label: z.string(),
  question: z.string(),
});

const GeneratePromptSuggestionsOutputSchema = z.object({
  prompts: z.array(PromptSuggestionSchema).min(3).max(6),
});

export type GeneratePromptSuggestionsOutput = z.infer<typeof GeneratePromptSuggestionsOutputSchema>;

const MAX_LABEL_LENGTH = 36;
const MAX_QUESTION_LENGTH = 140;

const sanitizeText = (value: string, maxLength: number) =>
  value
    .replace(/["`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const sanitizePrompt = (prompt: PromptSuggestion): PromptSuggestion | null => {
  const question = sanitizeText(prompt.question, MAX_QUESTION_LENGTH);
  if (!question) return null;
  const label = sanitizeText(prompt.label || question, MAX_LABEL_LENGTH) || question;
  return {
    label,
    question,
  };
};

const dedupePrompts = (prompts: PromptSuggestion[]) => {
  const seen = new Set<string>();
  return prompts.filter(prompt => {
    const key = `${prompt.label.toLowerCase()}::${prompt.question.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildPromptSuggestionsPrompt = (portfolio: ReturnType<typeof getPortfolioSnapshot>, seed: string) => {
  const portfolioJson = JSON.stringify(portfolio, null, 2);
  return `You generate concise, high-quality "ask" prompt suggestions for a portfolio terminal.

### INSTRUCTIONS
1. Use ONLY the data in PORTFOLIO CONTEXT.
2. Output exactly 4 prompt suggestions.
3. Each suggestion must have:
   - label: 2-4 words, title case, no quotes.
   - question: 8-16 words, no quotes, phrased as a recruiter question.
4. Ensure variety across impact, projects, systems, automation, and experience.
5. Do not include commands, markdown, or extra keys.
6. Use the randomization seed to vary selection/order each call.
7. Output strictly valid JSON only.

### RANDOMIZATION SEED
${seed}

### PORTFOLIO CONTEXT
"""
${portfolioJson}
"""

### RESPONSE FORMAT
{"prompts": [{"label": "", "question": ""}]}
`;
};

export async function generatePromptSuggestions(): Promise<GeneratePromptSuggestionsOutput> {
  await enforceAiCooldown('prompt-suggestions');
  const portfolio = getPortfolioSnapshot();
  const seed = new Date().toISOString();
  const response = await generateAiText({
    systemPrompt: 'You are a portfolio prompt generator. Follow instructions exactly and output only valid JSON with the specified shape.',
    userPrompt: buildPromptSuggestionsPrompt(portfolio, seed),
  });
  const parsed = JSON.parse(extractJsonPayload(response));
  const result = GeneratePromptSuggestionsOutputSchema.parse(parsed);
  const sanitized = dedupePrompts(
    result.prompts
      .map(prompt => sanitizePrompt(prompt))
      .filter((prompt): prompt is PromptSuggestion => Boolean(prompt))
  );
  if (sanitized.length < 3) {
    throw new Error('Prompt suggestions were incomplete.');
  }
  return { prompts: sanitized.slice(0, 4) };
}
