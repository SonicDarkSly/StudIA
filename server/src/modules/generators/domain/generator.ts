import type { GenerationSettings } from '../../models/domain/generation-settings.js';
import type { TargetFormat, TargetKey } from './ai-target.js';

export const GENERATOR_KEYS = ['chat', 'skill', 'mcp', 'command', 'agent', 'claudemd', 'hooks'] as const;

export type GeneratorKey = (typeof GENERATOR_KEYS)[number];

export const isGeneratorKey = (value: unknown): value is GeneratorKey =>
  GENERATOR_KEYS.some((key) => key === value);

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface Generator {
  key: GeneratorKey;
  label: string;
  short: string;
  description: string;
  examples: string[];
  recommendedModel: string;
  recommendedSettings: Partial<GenerationSettings>;
  needsProject: boolean;
  scaffold: ScaffoldFile[];
  systemPrompt: string;
  usesFiles: boolean;
  formats: Record<TargetKey, TargetFormat>;
}
