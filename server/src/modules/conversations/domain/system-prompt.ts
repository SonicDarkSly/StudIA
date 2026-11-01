import { CHARS_PER_TOKEN } from '../../models/domain/tokens.js';

export interface ProjectExtract {
  name: string;
  text: string;
}

const PROJECTS_SHARE = 0.55;

export function buildSystemPrompt(
  generatorPrompt: string,
  extraInstructions: string | undefined,
  projects: ProjectExtract[],
  contextSize: number,
): string {
  const parts = [generatorPrompt];
  if (extraInstructions?.trim())
    parts.push(`CONSIGNES PERSONNELLES DE L'UTILISATEUR :\n${extraInstructions.trim()}`);
  if (projects.length) {
    const perProject = Math.floor((contextSize * PROJECTS_SHARE * CHARS_PER_TOKEN) / projects.length);
    const blocks = projects.map(({ text }) =>
      text.length > perProject
        ? `${text.slice(0, perProject)}\n[… contexte tronqué pour tenir dans la fenêtre]`
        : text,
    );
    parts.push(
      `CONTEXTE : PROJETS DE L'UTILISATEUR (lus sur son disque, en lecture seule)\n\n${blocks.join('\n\n---\n\n')}`,
    );
  }
  return parts.join('\n\n');
}
