import type { CatalogModel } from './catalog-model.js';
import type { GenerationSettings } from './generation-settings.js';

export interface RuntimeStatus {
  loadedKey?: string;
  loadingKey?: string;
  busy: boolean;
  gpuLayers?: number;
  totalLayers?: number;
  trainContextSize?: number;
  idleMinutes: number;
}

export type HistoryTurn = { role: 'user' | 'assistant'; content: string };

export type GenerationPhase = 'queued' | 'loading' | 'reading' | 'thinking' | 'writing';

export interface GenerationRequest {
  model: CatalogModel;
  path: string;
  settings: GenerationSettings;
  system: (contextSize: number) => string;
  history: HistoryTurn[];
  prompt: string;
}

export interface GenerationListener {
  phase(phase: GenerationPhase, detail?: string): void;
  thought(text: string): void;
  text(text: string): void;
}

export interface GenerationResult {
  text: string;
  thought: string;
  promptTokens: number;
  outputTokens: number;
  systemTokens: number;
  contextUsed: number;
  contextSize: number;
  seconds: number;
  firstTokenSeconds?: number;
  tokensPerSecond: number;
  stopReason: string;
}

export interface LanguageModelRuntime {
  status(): RuntimeStatus;
  generate(
    request: GenerationRequest,
    listener: GenerationListener,
    signal: AbortSignal,
  ): Promise<GenerationResult>;
  unload(): Promise<void>;
}

export const LANGUAGE_MODEL_RUNTIME = Symbol('LANGUAGE_MODEL_RUNTIME');
