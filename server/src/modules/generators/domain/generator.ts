import type { GenerationSettings } from '../../models/domain/generation-settings.js';
import type { TargetFormat, TargetKey } from './ai-target.js';

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface Generator {
  key: string;
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
