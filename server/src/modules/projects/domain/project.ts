import { z } from 'zod';

export interface ClaudeItem {
  name: string;
  description?: string;
}

export interface RegisteredProject {
  name: string;
  path: string;
  addedAt: string;
}

export const registeredProjectSchema = z.object({
  name: z.string(),
  path: z.string(),
  addedAt: z.string(),
}) satisfies z.ZodType<RegisteredProject>;

export interface ProjectSummary {
  name: string;
  path: string;
  description?: string;
  stack: string[];
  hasClaudeMd: boolean;
  hasAgentsMd: boolean;
  skills: ClaudeItem[];
  commands: ClaudeItem[];
  agents: ClaudeItem[];
  hasHooks: boolean;
  launchers: string[];
}

export interface ProjectContext {
  name: string;
  text: string;
  chars: number;
  approxTokens: number;
}

export class InvalidProjectFolderError extends Error {}

export class ProjectNotFoundError extends Error {
  constructor(readonly name: string) {
    super(`Projet inconnu : ${name}`);
  }
}
