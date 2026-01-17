'use client';
import React from 'react';
import { COMMANDS, ABOUTME_TEXT, PROJECTS, EXPERIENCE, CONTACT_INFO } from './data';
import { generateSkillsList } from '@/ai/flows/generate-skills-list';
import { generateProjectDescription } from '@/ai/flows/generate-project-description';
import { useToast } from "@/hooks/use-toast"

type AiErrorInfo = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
};

const parseAiError = (error: unknown): AiErrorInfo => {
  const message = error instanceof Error ? error.message : '';
  if (message.startsWith('AI_COOLDOWN:')) {
    const [, secondsRaw] = message.split(':');
    const seconds = Number.parseInt(secondsRaw ?? '', 10);
    const duration = Number.isFinite(seconds) && seconds > 0 ? `${seconds} seconds` : 'a moment';
    return {
      title: 'Cooldown active',
      description: `Please wait ${duration} before running this AI command again.`,
      variant: 'default',
    };
  }
  if (message.startsWith('Missing')) {
    return {
      title: 'AI configuration missing',
      description: `${message} Add it to your server environment (.env.local).`,
      variant: 'destructive',
    };
  }
  if (message.startsWith('Provider')) {
    return {
      title: 'AI provider error',
      description: 'The AI provider returned an error. Please try again later.',
      variant: 'destructive',
    };
  }
  return {
    title: 'AI Error',
    description: 'Failed to get response from AI model. Please check the server console or your API key.',
    variant: 'destructive',
  };
};

const AiError = ({ title, description, variant = 'destructive' }: AiErrorInfo) => {
  const { toast } = useToast();
  React.useEffect(() => {
    toast({
      title,
      description,
      variant,
    })
  }, [description, title, toast, variant]);
  return <p className="text-destructive">{description}</p>;
}

const renderAiError = (error: unknown) => {
  const info = parseAiError(error);
  return <AiError {...info} />;
};

const getEditDistance = (source: string, target: string) => {
  const sourceLength = source.length;
  const targetLength = target.length;
  const distance = Array.from({ length: sourceLength + 1 }, () => Array(targetLength + 1).fill(0));

  for (let i = 0; i <= sourceLength; i += 1) {
    distance[i][0] = i;
  }

  for (let j = 0; j <= targetLength; j += 1) {
    distance[0][j] = j;
  }

  for (let i = 1; i <= sourceLength; i += 1) {
    for (let j = 1; j <= targetLength; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + cost,
      );
    }
  }

  return distance[sourceLength][targetLength];
};

const getClosestCommand = (input: string) => {
  const normalizedInput = input.toLowerCase();
  const maxDistance = normalizedInput.length <= 4 ? 1 : 2;
  let closestCommand = '';
  let closestDistance = Number.POSITIVE_INFINITY;

  COMMANDS.forEach(command => {
    const distance = getEditDistance(normalizedInput, command);
    if (distance < closestDistance) {
      closestCommand = command;
      closestDistance = distance;
    }
  });

  return closestDistance <= maxDistance ? closestCommand : '';
};


const getHelp = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
    {COMMANDS.map(cmd => <span key={cmd}>{cmd}</span>)}
  </div>
);

const getAboutMe = () => (
  <p className="whitespace-pre-wrap">{ABOUTME_TEXT}</p>
);

const getSkills = async () => {
  try {
    const skills = await generateSkillsList({});
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        {skills.map(skill => <span key={skill}>{skill}</span>)}
      </div>
    );
  } catch (error) {
    console.error(error);
    return renderAiError(error);
  }
};

const getProjects = () => (
  <div>
    <p>Here are my projects. Use 'project &lt;name&gt;' to see details.</p>
    <ul className="list-disc list-inside mt-2">
      {PROJECTS.map(p => (
        <li key={p.name}>
          <span className="font-bold w-36 inline-block">{p.name}</span> - {p.title}
        </li>
      ))}
    </ul>
  </div>
);

const getProjectDetails = async (name: string) => {
  const project = PROJECTS.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (!project) {
    return <p>Project not found: {name}. Try 'projects' to see a list of available projects.</p>;
  }
  
  try {
    const { projectDescription } = await generateProjectDescription({
      projectName: project.title,
      technologies: project.technologies,
      briefOverview: project.briefOverview
    });

    return (
        <div>
            <h3 className="text-lg font-bold text-accent">{project.title}</h3>
            <p className="font-mono text-sm text-muted-foreground">{project.technologies}</p>
            <p className="mt-2 whitespace-pre-wrap">{projectDescription}</p>
            {project.link && <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mt-2 inline-block">View on GitHub</a>}
        </div>
    );
  } catch (error) {
    console.error(error);
    return renderAiError(error);
  }
};


const getExperience = () => (
    <div className="space-y-4">
      {EXPERIENCE.map((exp, index) => (
        <div key={index}>
          <h3 className="font-bold text-accent">{exp.role} @ {exp.company}</h3>
          <p className="text-sm text-muted-foreground">{exp.period}</p>
          <p className="mt-1">{exp.description}</p>
        </div>
      ))}
    </div>
);

const getContact = () => (
  <div className="space-y-2">
    {CONTACT_INFO.map(item => (
      <div key={item.name} className="flex items-center gap-4">
        <span className="w-16">{item.name}:</span>
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline">
          <item.icon className="w-4 h-4" />
          <span>{item.value}</span>
        </a>
      </div>
    ))}
  </div>
);

export const getCommandOutput = async (commandStr: string): Promise<React.ReactNode> => {
  const [command, ...args] = commandStr.trim().toLowerCase().split(' ');

  switch(command) {
    case 'help':
      return getHelp();
    case 'aboutme':
      return getAboutMe();
    case 'skills':
      return await getSkills();
    case 'projects':
      return getProjects();
    case 'project':
      if (args.length === 0) return <p>Please specify a project name. Use 'projects' to see a list.</p>;
      return await getProjectDetails(args[0]);
    case 'experience':
      return getExperience();
    case 'contact':
      return getContact();
    case 'clear':
      return ''; // special case handled in terminal component
    default:
      if (!command) return '';
      const closestCommand = getClosestCommand(command);
      if (closestCommand) {
        return (
          <p>
            Command not found: {command}. Did you mean: <span className="text-accent">{closestCommand}</span>?
          </p>
        );
      }
      return <p>Command not found: {command}. Type 'help' for a list of commands.</p>;
  }
};
