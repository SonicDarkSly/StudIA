import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { ConversationSummary } from '../../domain/conversation.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/conversation.repository.js';

export class ListConversationsQuery {}

@QueryHandler(ListConversationsQuery)
export class ListConversationsHandler implements IQueryHandler<
  ListConversationsQuery,
  ConversationSummary[]
> {
  constructor(@Inject(CONVERSATION_REPOSITORY) private readonly repository: ConversationRepository) {}

  execute(): Promise<ConversationSummary[]> {
    return this.repository.list();
  }
}
