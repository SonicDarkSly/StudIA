import { z } from 'zod';
import { Conversation } from '../domain/conversation.js';

export const conversationIdSchema = z
  .string()
  .refine(Conversation.isValidId, { message: 'Identifiant de conversation invalide' });
