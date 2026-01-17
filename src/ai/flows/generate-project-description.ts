'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating project descriptions using a generative AI.
 *
 * It includes:
 * - `generateProjectDescription`:  A function that takes project details as input and returns a generated description.
 * - `GenerateProjectDescriptionInput`: The input type for the `generateProjectDescription` function, including project name, technologies used, and a brief overview.
 * - `GenerateProjectDescriptionOutput`: The output type for the `generateProjectDescription` function, containing the generated project description.
 */

import {generateAiText, enforceAiCooldown} from '@/ai/client';
import {z} from 'zod';

const GenerateProjectDescriptionInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  technologies: z.string().describe('A comma-separated list of technologies used in the project.'),
  briefOverview: z.string().describe('A brief overview of the project.'),
});
export type GenerateProjectDescriptionInput = z.infer<
  typeof GenerateProjectDescriptionInputSchema
>;

const GenerateProjectDescriptionOutputSchema = z.object({
  projectDescription: z.string().describe('A detailed description of the project.'),
});
export type GenerateProjectDescriptionOutput = z.infer<
  typeof GenerateProjectDescriptionOutputSchema
>;

const buildProjectPrompt = (input: GenerateProjectDescriptionInput) => `You are an expert software engineer specializing in creating compelling project descriptions for developer portfolios.

Based on the project's name, technologies used, and a brief overview, generate a detailed and engaging project description.

Return only a JSON object with a single key "projectDescription".

Project Name: ${input.projectName}
Technologies Used: ${input.technologies}
Brief Overview: ${input.briefOverview}
`;

export async function generateProjectDescription(
  input: GenerateProjectDescriptionInput
): Promise<GenerateProjectDescriptionOutput> {
  const parsedInput = GenerateProjectDescriptionInputSchema.parse(input);
  await enforceAiCooldown('project');
  const response = await generateAiText({
    systemPrompt: 'Return only JSON. Do not wrap in markdown.',
    userPrompt: buildProjectPrompt(parsedInput),
  });
  const parsed = JSON.parse(response);
  return GenerateProjectDescriptionOutputSchema.parse(parsed);
}
