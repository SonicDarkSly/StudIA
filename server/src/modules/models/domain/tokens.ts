export const CHARS_PER_TOKEN = 3.5;

export const approxTokens = (text: string): number => Math.round(text.length / CHARS_PER_TOKEN);
