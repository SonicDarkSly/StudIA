import type { GenerationSettings } from '../../models/domain/generation-settings.js';
import type { TargetFormat, TargetKey } from './ai-target.js';

export const MODE_KEYS = [
  'chat',
  'skill',
  'mcp',
  'command',
  'agent',
  'instructions',
  'hooks',
  'plugin',
] as const;

export type ModeKey = (typeof MODE_KEYS)[number];

export const isModeKey = (value: unknown): value is ModeKey => MODE_KEYS.some((key) => key === value);

const RENAMED_MODE_KEYS: Readonly<Record<string, ModeKey>> = { claudemd: 'instructions' };

export const toModeKey = (value: unknown): ModeKey | undefined => {
  if (isModeKey(value)) return value;
  return typeof value === 'string' && Object.hasOwn(RENAMED_MODE_KEYS, value)
    ? RENAMED_MODE_KEYS[value]
    : undefined;
};

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface Mode {
  key: ModeKey;
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
