import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import type { ConversationSnapshot } from '../../domain/conversation.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/conversation.repository.js';

export class GetConversationQuery {
  constructor(readonly id: string) {}
}

@QueryHandler(GetConversationQuery)
export class GetConversationHandler implements IQueryHandler<
  GetConversationQuery,
  ConversationSnapshot | undefined
> {
  constructor(@Inject(CONVERSATION_REPOSITORY) private readonly repository: ConversationRepository) {}

  async execute({ id }: GetConversationQuery): Promise<ConversationSnapshot | undefined> {
    return (await this.repository.findById(id))?.snapshot();
  }
}
