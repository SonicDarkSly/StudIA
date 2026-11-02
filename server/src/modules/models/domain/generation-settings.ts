import { z } from 'zod';

export interface GenerationSettings {
  temperature: number;
  topP: number;
  topK: number;
  minP: number;
  repeatPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repeatLastTokens: number;
  maxTokens: number;
  contextSize: number;
  seed?: number;
  thinking: boolean;
  thoughtBudget?: number;
}

export const generationSettingsSchema = z.object({
  temperature: z.number(),
  topP: z.number(),
  topK: z.number(),
  minP: z.number(),
  repeatPenalty: z.number(),
  frequencyPenalty: z.number(),
  presencePenalty: z.number(),
  repeatLastTokens: z.number(),
  maxTokens: z.number(),
  contextSize: z.number(),
  seed: z.number().optional(),
  thinking: z.boolean(),
  thoughtBudget: z.number().optional(),
}) satisfies z.ZodType<GenerationSettings>;

export const partialSettingsSchema = generationSettingsSchema.partial();

export const DEFAULT_SETTINGS: GenerationSettings = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  minP: 0,
  repeatPenalty: 1.05,
  frequencyPenalty: 0,
  presencePenalty: 0,
  repeatLastTokens: 64,
  maxTokens: 2048,
  contextSize: 8192,
  thinking: true,
};

type NumericSetting = Exclude<keyof GenerationSettings, 'thinking'>;

const LIMITS: Record<NumericSetting, { min: number; max: number }> = {
  temperature: { min: 0, max: 2 },
  topP: { min: 0.01, max: 1 },
  topK: { min: 0, max: 200 },
  minP: { min: 0, max: 1 },
  repeatPenalty: { min: 1, max: 2 },
  frequencyPenalty: { min: 0, max: 2 },
  presencePenalty: { min: 0, max: 2 },
  repeatLastTokens: { min: 0, max: 2048 },
  maxTokens: { min: 16, max: 32_768 },
  contextSize: { min: 1024, max: 131_072 },
  seed: { min: 0, max: 2_147_483_647 },
  thoughtBudget: { min: 0, max: 32_768 },
};

const DEFAULT_THOUGHT_BUDGET = 1024;

const bounded = (key: NumericSetting, v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(LIMITS[key].max, Math.max(LIMITS[key].min, n));
};

const optional = (v: unknown): unknown => (v === undefined || v === null || v === '' ? undefined : v);

export function sanitizeSettings(input: Partial<GenerationSettings> | undefined): GenerationSettings {
  const s = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  const seed = optional(s.seed);
  const budget = optional(s.thoughtBudget);
  return {
    temperature: bounded('temperature', s.temperature, DEFAULT_SETTINGS.temperature),
    topP: bounded('topP', s.topP, DEFAULT_SETTINGS.topP),
    topK: Math.round(bounded('topK', s.topK, DEFAULT_SETTINGS.topK)),
    minP: bounded('minP', s.minP, DEFAULT_SETTINGS.minP),
    repeatPenalty: bounded('repeatPenalty', s.repeatPenalty, DEFAULT_SETTINGS.repeatPenalty),
    frequencyPenalty: bounded('frequencyPenalty', s.frequencyPenalty, DEFAULT_SETTINGS.frequencyPenalty),
    presencePenalty: bounded('presencePenalty', s.presencePenalty, DEFAULT_SETTINGS.presencePenalty),
    repeatLastTokens: Math.round(
      bounded('repeatLastTokens', s.repeatLastTokens, DEFAULT_SETTINGS.repeatLastTokens),
    ),
    maxTokens: Math.round(bounded('maxTokens', s.maxTokens, DEFAULT_SETTINGS.maxTokens)),
    contextSize: Math.round(bounded('contextSize', s.contextSize, DEFAULT_SETTINGS.contextSize)),
    seed: seed === undefined ? undefined : Math.round(bounded('seed', seed, LIMITS.seed.min)),
    thinking: Boolean(s.thinking),
    thoughtBudget:
      budget === undefined ? undefined : Math.round(bounded('thoughtBudget', budget, DEFAULT_THOUGHT_BUDGET)),
  };
}
