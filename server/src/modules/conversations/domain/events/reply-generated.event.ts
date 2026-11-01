import type { TargetKey } from '../../../generators/domain/ai-target.js';
import type { GeneratorKey } from '../../../generators/domain/generator.js';
import type { MessageStats } from '../chat-message.js';

export class ReplyGeneratedEvent {
  constructor(
    readonly generatorKey: GeneratorKey,
    readonly targetKey: TargetKey,
    readonly projectNames: string[],
    readonly stats: MessageStats,
  ) {}
}
