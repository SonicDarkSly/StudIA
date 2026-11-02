import type { TargetFormat, TargetFormats } from '../../domain/ai-target.js';

const CHAT_FORMAT: TargetFormat = {
  status: 'natif',
  summary: 'Conversation libre : elle ne dépend pas de l’IA choisie.',
  paths: [],
  instructions: '',
};

export const CHAT_FORMATS: TargetFormats = {
  claude: CHAT_FORMAT,
  codex: CHAT_FORMAT,
  copilot: CHAT_FORMAT,
  cursor: CHAT_FORMAT,
  gemini: CHAT_FORMAT,
  antigravity: CHAT_FORMAT,
  portable: CHAT_FORMAT,
};
