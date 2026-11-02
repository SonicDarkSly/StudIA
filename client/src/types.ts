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

export type NumericSettingKey = Exclude<keyof GenerationSettings, 'thinking'>;

export type ModelStatus = 'absent' | 'present' | 'downloading' | 'error';

export type FitLevel = 'ok' | 'limite' | 'trop-lourd';

export interface ModelFit {
  level: FitLevel;
  needGb: number;
  reason: string;
}

export interface MachineProfile {
  platform: string;
  arch: string;
  cpu: string;
  cores: number;
  totalRamGb: number;
  freeRamGb: number;
  gpu?: 'metal' | 'cuda' | 'vulkan';
  gpuNames: string[];
  vramGb?: number;
  unifiedMemory: boolean;
  usableGb: number;
  memoryOverridden: boolean;
  limitsIgnored: boolean;
}

export interface ModelView {
  key: string;
  label: string;
  publisher: string;
  family: string;
  sizeGb: number;
  ramGb: number;
  capabilities: string[];
  idealFor: string[];
  description: string;
  pros: string;
  cons: string;
  license: string;
  thinking: boolean;
  thinkingAlways?: boolean;
  recommended: Partial<GenerationSettings>;
  status: ModelStatus;
  foundIn?: string;
  progress?: number;
  error?: string;
  loaded: boolean;
  fit: ModelFit;
}

export interface RuntimeStatus {
  loadedKey?: string;
  loadingKey?: string;
  busy: boolean;
  gpuLayers?: number;
  totalLayers?: number;
  trainContextSize?: number;
  idleMinutes: number;
}

export interface ClaudeItem {
  name: string;
  description?: string;
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

export interface FolderEntry {
  name: string;
  path: string;
  markers: string[];
}

export interface FolderListing {
  path: string;
  parent?: string;
  home: string;
  entries: FolderEntry[];
}

export interface ProjectContext {
  name: string;
  text: string;
  chars: number;
  approxTokens: number;
}

export interface ScaffoldFile {
  path: string;
  content: string;
}

export type TargetKey = 'claude' | 'codex' | 'copilot' | 'cursor' | 'gemini' | 'antigravity' | 'portable';

export type GeneratorKey = 'chat' | 'skill' | 'mcp' | 'command' | 'agent' | 'claudemd' | 'hooks' | 'plugin';

export interface AiTarget {
  key: TargetKey;
  label: string;
  vendor: string;
  tools: string;
  description: string;
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

export interface MessageStats {
  modelKey: string;
  promptTokens: number;
  outputTokens: number;
  contextUsed: number;
  contextSize: number;
  seconds: number;
  firstTokenSeconds?: number;
  tokensPerSecond: number;
  stopReason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  stats?: MessageStats;
  createdAt?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  generatorKey: GeneratorKey;
  targetKey: TargetKey;
  modelKey: string;
  projectNames: string[];
  settings: Partial<GenerationSettings>;
  systemPrompt?: string;
  messages: ChatMessage[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  generatorKey: GeneratorKey;
  targetKey?: TargetKey;
  modelKey: string;
  messageCount: number;
}

export type ChatEvent =
  | { type: 'status'; phase: 'queued' | 'loading' | 'reading' | 'thinking' | 'writing'; detail?: string }
  | { type: 'thought'; text: string }
  | { type: 'text'; text: string }
  | { type: 'done'; stats: MessageStats; systemTokens: number }
  | { type: 'error'; message: string };

export interface GeneratedFile {
  path: string;
  content: string;
  origin: 'modele' | 'gabarit';
  fixes?: string[];
}

export interface FileIssue {
  level: 'error' | 'warning' | 'ok';
  path?: string;
  message: string;
}

export type PanelTab = 'model' | 'settings' | 'projects' | 'files';

export interface SettingHelp {
  key: NumericSettingKey;
  label: string;
  min: number;
  max: number;
  step: number;
  what: string;
  effect: string;
  tip: string;
  advanced?: boolean;
}

export type ThemeMode = 'dark' | 'light';

export interface StreamState {
  active: boolean;
  phase?: string;
  detail?: string;
  systemTokens?: number;
  announcement?: string;
}
