import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ClearConversationsCommand,
  DeleteConversationCommand,
} from '../application/commands/delete-conversation.command.js';
import { SaveConversationCommand } from '../application/commands/save-conversation.command.js';
import { GetConversationQuery } from '../application/queries/get-conversation.query.js';
import { ListConversationsQuery } from '../application/queries/list-conversations.query.js';
import {
  InvalidConversationError,
  conversationInputSchema,
  type ConversationInput,
  type ConversationSnapshot,
  type ConversationSummary,
} from '../domain/conversation.js';
import { ZodValidationPipe } from '../../../shared/validation/zod-validation.pipe.js';
import { conversationIdSchema } from './conversation-id.schema.js';

@Controller('api/conversations')
export class ConversationsController {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Get()
  list(): Promise<ConversationSummary[]> {
    return this.queries.execute(new ListConversationsQuery());
  }

  @Get(':id')
  async get(
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
  ): Promise<ConversationSnapshot> {
    const conversation: ConversationSnapshot | undefined = await this.queries.execute(
      new GetConversationQuery(id),
    );
    if (!conversation) throw new NotFoundException('Conversation introuvable');
    return conversation;
  }

  @Put(':id')
  async save(
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
    @Body(new ZodValidationPipe(conversationInputSchema)) body: ConversationInput,
  ): Promise<ConversationSnapshot> {
    if (body.id !== id) throw new BadRequestException('Identifiant incohérent');
    try {
      return await this.commands.execute(new SaveConversationCommand(body));
    } catch (err) {
      if (err instanceof InvalidConversationError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Delete(':id')
  async delete(
    @Param('id', new ZodValidationPipe(conversationIdSchema)) id: string,
  ): Promise<{ deleted: boolean }> {
    await this.commands.execute(new DeleteConversationCommand(id));
    return { deleted: true };
  }

  @Delete()
  async clear(): Promise<{ cleared: boolean }> {
    await this.commands.execute(new ClearConversationsCommand());
    return { cleared: true };
  }
}
