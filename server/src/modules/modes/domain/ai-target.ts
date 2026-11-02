import type { ScaffoldFile } from './mode.js';

export type TargetKey = 'claude' | 'codex' | 'copilot' | 'cursor' | 'gemini' | 'antigravity' | 'portable';

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
    description:
      'Dossier .gemini/ et GEMINI.md. Commandes en TOML, hooks et MCP dans settings.json. Pour une clé API payante ou Code Assist Standard / Enterprise ; les comptes gratuits et Google One passent à Antigravity.',
  },
  {
    key: 'antigravity',
    label: 'Antigravity',
    vendor: 'Google',
    tools: 'Antigravity CLI (agy)',
    description:
      'Dossier .agents/ et AGENTS.md : skills (aussi appelées par /nom), sous-agents, hooks.json et mcp_config.json.',
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

export const isTargetKey = (value: unknown): value is TargetKey => TARGETS.some((t) => t.key === value);

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

export interface PluginRules {
  manifest: string;
  schema?: string;
  mcpFile?: string;
  mcpNeedsType?: boolean;
}

export interface TargetFormat {
  status: SupportLevel;
  summary: string;
  paths: string[];
  instructions: string;
  scaffold?: ScaffoldFile[];
  skill?: SkillRules;
  plugin?: PluginRules;
}

export type TargetFormats = Record<TargetKey, TargetFormat>;
