import type { ScaffoldFile } from './generator.js';

export type TargetKey = 'claude' | 'codex' | 'copilot' | 'cursor' | 'gemini' | 'portable';

export interface AiTarget {
  key: TargetKey;
  label: string;
  vendor: string;
  tools: string;
  description: string;
}

export const TARGETS: AiTarget[] = [
  {
    key: 'claude',
    label: 'Claude',
    vendor: 'Anthropic',
    tools: 'Claude Code, Claude Desktop',
    description:
      'Dossier .claude/ et CLAUDE.md. Le format le plus complet : skills, commandes, sous-agents, hooks.',
  },
  {
    key: 'codex',
    label: 'Codex',
    vendor: 'OpenAI',
    tools: 'Codex CLI, extension Codex',
    description: 'Dossiers .agents/ et .codex/, fichier AGENTS.md. Sous-agents et configuration en TOML.',
  },
  {
    key: 'copilot',
    label: 'Copilot',
    vendor: 'GitHub / Microsoft',
    tools: 'GitHub Copilot (VS Code, CLI)',
    description:
      'Dossier .github/ : instructions, prompts, agents, skills et hooks ; MCP dans .vscode/mcp.json.',
  },
  {
    key: 'cursor',
    label: 'Cursor',
    vendor: 'Anysphere',
    tools: 'Éditeur Cursor',
    description: 'Dossier .cursor/ : règles .mdc, skills, commandes, sous-agents, hooks et MCP.',
  },
  {
    key: 'gemini',
    label: 'Gemini CLI',
    vendor: 'Google',
    tools: 'Gemini CLI',
    description: 'Dossier .gemini/ et GEMINI.md. Commandes en TOML, hooks et MCP dans settings.json.',
  },
  {
    key: 'portable',
    label: 'Multi-outils',
    vendor: 'Standards ouverts',
    tools: 'AGENTS.md, Agent Skills, MCP',
    description:
      'Uniquement les formats partagés par plusieurs outils. Idéal pour un dépôt public utilisé avec des IA différentes.',
  },
];

export function findTarget(key: string | undefined): AiTarget {
  return TARGETS.find((t) => t.key === key) ?? TARGETS[0];
}

export type SupportLevel = 'natif' | 'adapte' | 'indisponible';

export interface SkillRules {
  fields: string[];
  toolNames?: string[];
  configFiles?: string[];
  scriptPrefix?: string;
}

export interface TargetFormat {
  status: SupportLevel;
  summary: string;
  paths: string[];
  instructions: string;
  scaffold?: ScaffoldFile[];
  skill?: SkillRules;
}
