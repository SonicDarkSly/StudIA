import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  Conversation,
  type ConversationInput,
  type ConversationSnapshot,
} from '../../domain/conversation.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../../domain/conversation.repository.js';

export class SaveConversationCommand {
  constructor(readonly snapshot: ConversationInput) {}
}

@CommandHandler(SaveConversationCommand)
export class SaveConversationHandler implements ICommandHandler<
  SaveConversationCommand,
  ConversationSnapshot
> {
  constructor(@Inject(CONVERSATION_REPOSITORY) private readonly repository: ConversationRepository) {}

  async execute({ snapshot }: SaveConversationCommand): Promise<ConversationSnapshot> {
    const conversation = Conversation.restore(snapshot);
    await this.repository.save(conversation);
    return conversation.snapshot();
  }
}
