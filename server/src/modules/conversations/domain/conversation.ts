import { AggregateRoot } from '@nestjs/cqrs';
import { z } from 'zod';
import { partialSettingsSchema, type GenerationSettings } from '../../models/domain/generation-settings.js';
import { isTargetKey, type TargetKey } from '../../modes/domain/ai-target.js';
import { DEFAULT_MODE, DEFAULT_TARGET } from '../../modes/domain/consts.js';
import { toModeKey, type ModeKey } from '../../modes/domain/mode.js';
import { chatMessageSchema, type ChatMessage } from './chat-message.js';

export interface ConversationSnapshot {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  modeKey: ModeKey;
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
  modeKey: ModeKey;
  targetKey: TargetKey;
  modelKey: string;
  messageCount: number;
}

export const conversationInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  modeKey: z.string().optional(),
  generatorKey: z.string().optional(),
  targetKey: z.string().optional(),
  modelKey: z.string().optional(),
  projectNames: z.array(z.string()).optional(),
  settings: partialSettingsSchema.optional().catch({}),
  systemPrompt: z.string().optional(),
  messages: z.array(z.unknown()),
});

export type ConversationInput = z.infer<typeof conversationInputSchema>;

export class InvalidConversationError extends Error {}

const ID = /^[a-z0-9-]{8,64}$/;
const MAX_MESSAGES = 400;
const MAX_TITLE_LENGTH = 120;
const MAX_PROJECTS = 12;
const MAX_INSTRUCTIONS_LENGTH = 20_000;

export class Conversation extends AggregateRoot {
  private constructor(private readonly state: ConversationSnapshot) {
    super();
  }

  static restore(raw: ConversationInput): Conversation {
    if (!ID.test(raw.id)) throw new InvalidConversationError('Identifiant de conversation invalide');
    const messages = raw.messages
      .flatMap((m) => {
        const parsed = chatMessageSchema.safeParse(m);
        return parsed.success ? [parsed.data] : [];
      })
      .slice(-MAX_MESSAGES);
    const now = new Date().toISOString();
    return new Conversation({
      id: raw.id,
      title: (raw.title || 'Sans titre').slice(0, MAX_TITLE_LENGTH),
      createdAt: raw.createdAt || now,
      updatedAt: raw.updatedAt || now,
      modeKey: toModeKey(raw.modeKey ?? raw.generatorKey) ?? DEFAULT_MODE,
      targetKey: isTargetKey(raw.targetKey) ? raw.targetKey : DEFAULT_TARGET,
      modelKey: raw.modelKey ?? '',
      projectNames: (raw.projectNames ?? []).slice(0, MAX_PROJECTS),
      settings: raw.settings ?? {},
      systemPrompt: raw.systemPrompt?.slice(0, MAX_INSTRUCTIONS_LENGTH) ?? '',
      messages,
    });
  }

  static isValidId(id: string): boolean {
    return ID.test(id);
  }

  get id(): string {
    return this.state.id;
  }

  snapshot(): ConversationSnapshot {
    return this.state;
  }

  summary(): ConversationSummary {
    const s = this.state;
    return {
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt,
      modeKey: s.modeKey,
      targetKey: s.targetKey,
      modelKey: s.modelKey,
      messageCount: s.messages.length,
    };
  }
}
