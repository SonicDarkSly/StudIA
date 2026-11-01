import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ModelsModule } from '../models/models.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import {
  ClearConversationsHandler,
  DeleteConversationHandler,
} from './application/commands/delete-conversation.command.js';
import { GenerateReplyHandler } from './application/commands/generate-reply.command.js';
import { SaveConversationHandler } from './application/commands/save-conversation.command.js';
import { ReplyGeneratedHandler } from './application/events/reply-generated.handler.js';
import { GetConversationHandler } from './application/queries/get-conversation.query.js';
import { ListConversationsHandler } from './application/queries/list-conversations.query.js';
import { CONVERSATION_REPOSITORY } from './domain/conversation.repository.js';
import { FileConversationRepository } from './infrastructure/file-conversation.repository.js';
import { ChatController } from './api/chat.controller.js';
import { ConversationsController } from './api/conversations.controller.js';

@Module({
  imports: [CqrsModule, ModelsModule, ProjectsModule],
  controllers: [ChatController, ConversationsController],
  providers: [
    { provide: CONVERSATION_REPOSITORY, useClass: FileConversationRepository },
    GenerateReplyHandler,
    SaveConversationHandler,
    DeleteConversationHandler,
    ClearConversationsHandler,
    ListConversationsHandler,
    GetConversationHandler,
    ReplyGeneratedHandler,
  ],
})
export class ConversationsModule {}
