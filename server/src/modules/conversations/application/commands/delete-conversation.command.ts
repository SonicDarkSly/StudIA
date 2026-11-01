import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/conversation.repository.js';

export class DeleteConversationCommand {
  constructor(readonly id: string) {}
}

@CommandHandler(DeleteConversationCommand)
export class DeleteConversationHandler implements ICommandHandler<DeleteConversationCommand, void> {
  constructor(@Inject(CONVERSATION_REPOSITORY) private readonly repository: ConversationRepository) {}

  execute({ id }: DeleteConversationCommand): Promise<void> {
    return this.repository.delete(id);
  }
}

export class ClearConversationsCommand {}

@CommandHandler(ClearConversationsCommand)
export class ClearConversationsHandler implements ICommandHandler<ClearConversationsCommand, void> {
  constructor(@Inject(CONVERSATION_REPOSITORY) private readonly repository: ConversationRepository) {}

  execute(): Promise<void> {
    return this.repository.clear();
  }
}
