import { CHARS_PER_TOKEN } from './consts.js';

export const approxTokens = (text: string): number => Math.round(text.length / CHARS_PER_TOKEN);
