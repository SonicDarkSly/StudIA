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
