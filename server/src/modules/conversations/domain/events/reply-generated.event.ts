import type { TargetKey } from '../../../modes/domain/ai-target.js';
import type { ModeKey } from '../../../modes/domain/mode.js';
import type { MessageStats } from '../chat-message.js';

export class ReplyGeneratedEvent {
  constructor(
    readonly modeKey: ModeKey,
    readonly targetKey: TargetKey,
    readonly projectNames: string[],
    readonly stats: MessageStats,
  ) {}
}
