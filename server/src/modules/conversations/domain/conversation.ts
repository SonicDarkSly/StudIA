import { AggregateRoot } from '@nestjs/cqrs';
import type { GenerationSettings } from '../../models/domain/generation-settings.js';
import { isTargetKey, type TargetKey } from '../../generators/domain/ai-target.js';
import { DEFAULT_GENERATOR, DEFAULT_TARGET } from '../../generators/domain/consts.js';
import { isGeneratorKey, type GeneratorKey } from '../../generators/domain/generator.js';
import type { ChatMessage } from './chat-message.js';

export interface ConversationSnapshot {
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
  targetKey: TargetKey;
  modelKey: string;
  messageCount: number;
}

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

  static restore(raw: ConversationSnapshot): Conversation {
    if (!raw || typeof raw !== 'object') throw new InvalidConversationError('Conversation invalide');
    if (!ID.test(String(raw.id))) throw new InvalidConversationError('Identifiant de conversation invalide');
    if (!Array.isArray(raw.messages)) throw new InvalidConversationError('Messages manquants');
    const messages = raw.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_MESSAGES);
    const now = new Date().toISOString();
    return new Conversation({
      id: raw.id,
      title: String(raw.title || 'Sans titre').slice(0, MAX_TITLE_LENGTH),
      createdAt: raw.createdAt || now,
      updatedAt: raw.updatedAt || now,
      generatorKey: isGeneratorKey(raw.generatorKey) ? raw.generatorKey : DEFAULT_GENERATOR,
      targetKey: isTargetKey(raw.targetKey) ? raw.targetKey : DEFAULT_TARGET,
      modelKey: String(raw.modelKey || ''),
      projectNames: Array.isArray(raw.projectNames)
        ? raw.projectNames.map(String).slice(0, MAX_PROJECTS)
        : [],
      settings: raw.settings && typeof raw.settings === 'object' ? raw.settings : {},
      systemPrompt:
        typeof raw.systemPrompt === 'string' ? raw.systemPrompt.slice(0, MAX_INSTRUCTIONS_LENGTH) : '',
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
      generatorKey: s.generatorKey,
      targetKey: s.targetKey,
      modelKey: s.modelKey,
      messageCount: s.messages.length,
    };
  }
}
