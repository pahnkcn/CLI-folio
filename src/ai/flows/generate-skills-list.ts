'use server';

/**
 * @fileOverview Generates a dynamically augmented list of skills using generative AI.
 *
 * - generateSkillsList - A function that generates the augmented skills list.
 * - GenerateSkillsListInput - The input type for the generateSkillsList function (empty object).
 * - GenerateSkillsListOutput - The return type for the generateSkillsList function (string array).
 */

import {generateAiText, enforceAiCooldown} from '@/ai/client';
import {z} from 'zod';

const GenerateSkillsListInputSchema = z.object({});
export type GenerateSkillsListInput = z.infer<typeof GenerateSkillsListInputSchema>;

const GenerateSkillsListOutputSchema = z.array(z.string());
export type GenerateSkillsListOutput = z.infer<typeof GenerateSkillsListOutputSchema>;

const skillsPrompt = `You are a DevOps Engineer expert.

Generate a list of relevant technical skills for a DevOps Engineer. These skills should be suitable to list on a portfolio website.

Focus on skills related to automation, reliability, scalability, cloud technologies, and monitoring.

Return only a JSON array of strings.

Example:
["Docker", "Kubernetes", "CI/CD", "Cloud", "Monitoring", "Terraform", "Ansible", "AWS", "GCP", "Azure"]
`;

export async function generateSkillsList(input: GenerateSkillsListInput): Promise<GenerateSkillsListOutput> {
  GenerateSkillsListInputSchema.parse(input);
  await enforceAiCooldown('skills');
  const response = await generateAiText({
    systemPrompt: 'Return only JSON. Do not wrap in markdown.',
    userPrompt: skillsPrompt,
  });
  const parsed = JSON.parse(response);
  return GenerateSkillsListOutputSchema.parse(parsed);
}
