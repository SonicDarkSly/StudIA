export interface ClaudeItem {
  name: string;
  description?: string;
}

export interface RegisteredProject {
  name: string;
  path: string;
  addedAt: string;
}

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

export const STACK_MARKERS: Record<string, string> = {
  '@nestjs/core': 'NestJS',
  '@nestjs/cqrs': 'CQRS',
  react: 'React',
  vite: 'Vite',
  antd: 'Ant Design',
  next: 'Next.js',
  typescript: 'TypeScript',
  'node-llama-cpp': 'node-llama-cpp',
  cesium: 'Cesium',
  'satellite.js': 'satellite.js',
  'pdfjs-dist': 'PDF',
  mammoth: 'DOCX',
  express: 'Express',
  '@modelcontextprotocol/sdk': 'MCP',
  zod: 'zod',
  tailwindcss: 'Tailwind',
};

export const PROJECT_MARKERS = [
  'package.json',
  'CLAUDE.md',
  'AGENTS.md',
  'GEMINI.md',
  'README.md',
  '.git',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
];

export class InvalidProjectFolderError extends Error {}

export class ProjectNotFoundError extends Error {
  constructor(readonly name: string) {
    super(`Projet inconnu : ${name}`);
  }
}
