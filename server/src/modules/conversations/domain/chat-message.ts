import { z } from 'zod';

export interface MessageStats {
  modelKey: string;
  promptTokens: number;
  outputTokens: number;
  contextUsed: number;
  contextSize: number;
  seconds: number;
  firstTokenSeconds?: number;
  tokensPerSecond: number;
  stopReason: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  stats?: MessageStats;
  error?: string;
  createdAt?: string;
}

export const messageStatsSchema = z.object({
  modelKey: z.string(),
  promptTokens: z.number(),
  outputTokens: z.number(),
  contextUsed: z.number(),
  contextSize: z.number(),
  seconds: z.number(),
  firstTokenSeconds: z.number().optional(),
  tokensPerSecond: z.number(),
  stopReason: z.string(),
}) satisfies z.ZodType<MessageStats>;

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  thought: z.string().optional(),
  stats: messageStatsSchema.optional(),
  error: z.string().optional(),
  createdAt: z.string().optional(),
}) satisfies z.ZodType<ChatMessage>;
