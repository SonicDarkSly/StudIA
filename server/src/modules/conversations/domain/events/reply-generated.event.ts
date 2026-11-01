import type { MessageStats } from '../chat-message.js';

export class ReplyGeneratedEvent {
  constructor(
    readonly generatorKey: string,
    readonly targetKey: string,
    readonly projectNames: string[],
    readonly stats: MessageStats,
  ) {}
}
