import { z } from 'zod';
import { partialSettingsSchema } from '../../models/domain/generation-settings.js';
import type { ReplyRequest } from '../application/commands/generate-reply.command.js';
import { chatMessageSchema } from '../domain/chat-message.js';

export const chatRequestSchema = z.object({
  modelKey: z.string().min(1),
  modeKey: z.string().optional(),
  targetKey: z.string().optional(),
  projectNames: z.array(z.string()).optional(),
  settings: partialSettingsSchema.optional(),
  extraInstructions: z.string().optional(),
  messages: z.array(chatMessageSchema).min(1),
}) satisfies z.ZodType<ReplyRequest>;
