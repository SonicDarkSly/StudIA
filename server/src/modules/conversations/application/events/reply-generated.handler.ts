import { Logger } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { STOP_REASONS } from '../../domain/consts.js';
import { ReplyGeneratedEvent } from '../../domain/events/reply-generated.event.js';

@EventsHandler(ReplyGeneratedEvent)
export class ReplyGeneratedHandler implements IEventHandler<ReplyGeneratedEvent> {
  private readonly logger = new Logger('Réponse');

  handle({ modeKey, targetKey, projectNames, stats: s }: ReplyGeneratedEvent): void {
    const projects = projectNames.length ? ` · projets : ${projectNames.join(', ')}` : '';
    this.logger.log(
      `${modeKey} pour ${targetKey} · ${s.modelKey} · ${s.promptTokens} tokens lus, ${s.outputTokens} écrits en ` +
        `${s.seconds.toFixed(1)} s (${s.tokensPerSecond.toFixed(1)} tok/s, ${STOP_REASONS[s.stopReason] ?? s.stopReason})${projects}`,
    );
  }
}
