'use server';

import { generateAiText, enforceAiCooldown } from '@/ai/client';
import { z } from 'zod';

const PortfolioProjectSchema = z.object({
  name: z.string(),
  title: z.string(),
  technologies: z.string(),
  description: z.string(),
  link: z.string().optional().nullable(),
});

const PortfolioExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  description: z.string(),
});

const PortfolioContactSchema = z.object({
  name: z.string(),
  value: z.string(),
  href: z.string(),
});

const PortfolioSnapshotSchema = z.object({
  aboutMe: z.string(),
  skills: z.array(z.string()),
  projects: z.array(PortfolioProjectSchema),
  experience: z.array(PortfolioExperienceSchema),
  contact: z.array(PortfolioContactSchema),
});

const GenerateAskResponseInputSchema = z.object({
  question: z.string(),
  portfolio: PortfolioSnapshotSchema,
});

export type GenerateAskResponseInput = z.infer<typeof GenerateAskResponseInputSchema>;

const GenerateAskResponseOutputSchema = z.object({
  answer: z.string(),
});

export type GenerateAskResponseOutput = z.infer<typeof GenerateAskResponseOutputSchema>;

const buildAskPrompt = (input: GenerateAskResponseInput) => {
  const portfolioJson = JSON.stringify(input.portfolio, null, 2);
  return `You are a helpful portfolio chatbot for a terminal-style website.

Use only the PORTFOLIO DATA below to answer the QUESTION. Decide which sections are relevant (aboutMe, skills, projects, experience, contact) and summarize them naturally.

If the answer cannot be found in the data, say you do not have that information and suggest the closest command (projects, project <name>, skills, experience, contact).

Reply in the same language as the question. Keep the answer concise (2-6 sentences).

Return only a JSON object with a single key "answer".

QUESTION:
${input.question}

PORTFOLIO DATA:
${portfolioJson}
`;
};

export async function generateAskResponse(
  input: GenerateAskResponseInput
): Promise<GenerateAskResponseOutput> {
  const parsedInput = GenerateAskResponseInputSchema.parse(input);
  await enforceAiCooldown('ask');
  const response = await generateAiText({
    systemPrompt: 'Return only JSON. Do not wrap in markdown.',
    userPrompt: buildAskPrompt(parsedInput),
  });
  const parsed = JSON.parse(response);
  return GenerateAskResponseOutputSchema.parse(parsed);
}
