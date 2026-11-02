import { Body, Controller, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { ModelNotDownloadedError, UnknownModelError } from '../../models/domain/catalog-model.js';
import { ModelTooLargeError } from '../../models/domain/machine.js';
import { ProjectNotFoundError } from '../../projects/domain/project.js';
import {
  GenerateReplyCommand,
  InvalidChatRequestError,
  type ReplyOutcome,
  type ReplyRequest,
} from '../application/commands/generate-reply.command.js';
import { ZodValidationPipe } from '../../../shared/validation/zod-validation.pipe.js';
import { chatRequestSchema } from './chat-request.schema.js';

const EXPECTED = [
  InvalidChatRequestError,
  ModelNotDownloadedError,
  ModelTooLargeError,
  UnknownModelError,
  ProjectNotFoundError,
];

@Controller('api/chat')
export class ChatController {
  private readonly logger = new Logger('Chat');

  constructor(private readonly commands: CommandBus) {}

  @Post()
  async stream(
    @Body(new ZodValidationPipe(chatRequestSchema)) body: ReplyRequest,
    @Res() res: Response,
  ): Promise<void> {
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });
    const send = (event: object) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const outcome: ReplyOutcome = await this.commands.execute(
        new GenerateReplyCommand(
          body,
          {
            phase: (phase, detail) => send({ type: 'status', phase, detail }),
            thought: (text) => send({ type: 'thought', text }),
            text: (text) => send({ type: 'text', text }),
          },
          abort.signal,
        ),
      );
      send({ type: 'done', stats: outcome.stats, systemTokens: outcome.systemTokens });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!EXPECTED.some((E) => err instanceof E) && !abort.signal.aborted) this.logger.error(message);
      send({ type: 'error', message });
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
}
