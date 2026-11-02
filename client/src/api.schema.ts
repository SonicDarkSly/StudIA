import { z } from '@/utils/zod';
import {
  MODE_KEYS,
  TARGET_KEYS,
  type AiTarget,
  type ChatEvent,
  type ChatMessage,
  type ClaudeItem,
  type Conversation,
  type ConversationSummary,
  type FolderListing,
  type GenerationSettings,
  type MachineProfile,
  type MessageStats,
  type Mode,
  type ModelView,
  type ProjectContext,
  type ProjectSummary,
  type RuntimeStatus,
  type ScaffoldFile,
  type TargetFormat,
} from '@/types';

const modeKeySchema = z.enum(MODE_KEYS);
const targetKeySchema = z.enum(TARGET_KEYS);

const settingsSchema = z.object({
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

const partialSettingsSchema = settingsSchema.partial() satisfies z.ZodType<Partial<GenerationSettings>>;

const machineSchema = z.object({
  platform: z.string(),
  arch: z.string(),
  cpu: z.string(),
  cores: z.number(),
  totalRamGb: z.number(),
  freeRamGb: z.number(),
  gpu: z.enum(['metal', 'cuda', 'vulkan']).optional(),
  gpuNames: z.array(z.string()),
  vramGb: z.number().optional(),
  unifiedMemory: z.boolean(),
  usableGb: z.number(),
  memoryOverridden: z.boolean(),
  limitsIgnored: z.boolean(),
}) satisfies z.ZodType<MachineProfile>;

const modelSchema = z.object({
  key: z.string(),
  label: z.string(),
  publisher: z.string(),
  family: z.string(),
  sizeGb: z.number(),
  ramGb: z.number(),
  capabilities: z.array(z.string()),
  idealFor: z.array(z.string()),
  description: z.string(),
  pros: z.string(),
  cons: z.string(),
  license: z.string(),
  thinking: z.boolean(),
  thinkingAlways: z.boolean().optional(),
  recommended: partialSettingsSchema,
  status: z.enum(['absent', 'present', 'downloading', 'error']),
  foundIn: z.string().optional(),
  progress: z.number().optional(),
  error: z.string().optional(),
  loaded: z.boolean(),
  fit: z.object({ level: z.enum(['ok', 'limite', 'trop-lourd']), needGb: z.number(), reason: z.string() }),
}) satisfies z.ZodType<ModelView>;

const runtimeSchema = z.object({
  loadedKey: z.string().optional(),
  loadingKey: z.string().optional(),
  busy: z.boolean(),
  gpuLayers: z.number().optional(),
  totalLayers: z.number().optional(),
  trainContextSize: z.number().optional(),
  idleMinutes: z.number(),
}) satisfies z.ZodType<RuntimeStatus>;

export const modelsResponseSchema = z.object({
  models: z.array(modelSchema),
  runtime: runtimeSchema,
  machine: machineSchema,
});

export const downloadStartedSchema = z.object({ started: z.boolean() });

export const deletedSchema = z.object({ deleted: z.boolean() });

export const acknowledgedSchema = z.unknown();

const scaffoldSchema = z.object({ path: z.string(), content: z.string() }) satisfies z.ZodType<ScaffoldFile>;

const formatSchema = z.object({
  status: z.enum(['natif', 'adapte', 'indisponible']),
  summary: z.string(),
  paths: z.array(z.string()),
  instructions: z.string(),
  scaffold: z.array(scaffoldSchema).optional(),
  skill: z
    .object({
      fields: z.array(z.string()),
      toolNames: z.array(z.string()).optional(),
      configFiles: z.array(z.string()).optional(),
      scriptPrefix: z.string().optional(),
    })
    .optional(),
  plugin: z
    .object({
      manifest: z.string(),
      schema: z.string().optional(),
      mcpFile: z.string().optional(),
      mcpNeedsType: z.boolean().optional(),
    })
    .optional(),
}) satisfies z.ZodType<TargetFormat>;

const modeSchema = z.object({
  key: modeKeySchema,
  label: z.string(),
  short: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  recommendedModel: z.string(),
  recommendedSettings: partialSettingsSchema,
  needsProject: z.boolean(),
  scaffold: z.array(scaffoldSchema),
  systemPrompt: z.string(),
  usesFiles: z.boolean(),
  formats: z.record(targetKeySchema, formatSchema),
}) satisfies z.ZodType<Mode>;

const targetSchema = z.object({
  key: targetKeySchema,
  label: z.string(),
  vendor: z.string(),
  tools: z.string(),
  description: z.string(),
}) satisfies z.ZodType<AiTarget>;

export const modesResponseSchema = z.object({ modes: z.array(modeSchema), targets: z.array(targetSchema) });

const claudeItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
}) satisfies z.ZodType<ClaudeItem>;

export const projectSchema = z.object({
  name: z.string(),
  path: z.string(),
  description: z.string().optional(),
  stack: z.array(z.string()),
  hasClaudeMd: z.boolean(),
  hasAgentsMd: z.boolean(),
  skills: z.array(claudeItemSchema),
  commands: z.array(claudeItemSchema),
  agents: z.array(claudeItemSchema),
  hasHooks: z.boolean(),
  launchers: z.array(z.string()),
}) satisfies z.ZodType<ProjectSummary>;

export const projectsSchema = z.array(projectSchema);

export const folderListingSchema = z.object({
  path: z.string(),
  parent: z.string().optional(),
  home: z.string(),
  entries: z.array(z.object({ name: z.string(), path: z.string(), markers: z.array(z.string()) })),
}) satisfies z.ZodType<FolderListing>;

export const projectContextSchema = z.object({
  name: z.string(),
  text: z.string(),
  chars: z.number(),
  approxTokens: z.number(),
}) satisfies z.ZodType<ProjectContext>;

const statsSchema = z.object({
  modelKey: z.string(),
  promptTokens: z.number(),
  outputTokens: z.number(),
  contextUsed: z.number(),
  contextSize: z.number(),
  seconds: z.number(),
  firstTokenSeconds: z.number().optional(),
  tokensPerSecond: z.number(),
  stopReason: z.string(),
}) satisfies z.ZodType<MessageStats>;

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  thought: z.string().optional(),
  stats: statsSchema.optional(),
  createdAt: z.string().optional(),
  error: z.string().optional(),
}) satisfies z.ZodType<ChatMessage>;

export const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  modeKey: modeKeySchema,
  targetKey: targetKeySchema,
  modelKey: z.string(),
  projectNames: z.array(z.string()),
  settings: partialSettingsSchema,
  systemPrompt: z.string().optional(),
  messages: z.array(messageSchema),
}) satisfies z.ZodType<Conversation>;

export const conversationSummariesSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    updatedAt: z.string(),
    modeKey: modeKeySchema,
    targetKey: targetKeySchema.optional(),
    modelKey: z.string(),
    messageCount: z.number(),
  }) satisfies z.ZodType<ConversationSummary>,
);

export const infoSchema = z.object({
  name: z.string(),
  author: z.string(),
  lan: z.boolean(),
  node: z.string(),
});

export const chatEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('status'),
    phase: z.enum(['queued', 'loading', 'reading', 'thinking', 'writing']),
    detail: z.string().optional(),
  }),
  z.object({ type: z.literal('thought'), text: z.string() }),
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('done'), stats: statsSchema, systemTokens: z.number() }),
  z.object({ type: z.literal('error'), message: z.string() }),
]) satisfies z.ZodType<ChatEvent>;

export const errorBodySchema = z.object({ message: z.union([z.string(), z.array(z.string())]).optional() });
