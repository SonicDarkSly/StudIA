import type { Conversation, ConversationSummary } from './conversation.js';

export interface ConversationRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: string): Promise<Conversation | undefined>;
  list(): Promise<ConversationSummary[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');
