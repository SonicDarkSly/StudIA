const PERCENT = 100;

const CHARS_PER_TOKEN = 3.8;

export const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const approxTokens = (text: string) => Math.round(text.length / CHARS_PER_TOKEN);

export const percentOf = (part: number, total: number) =>
  Math.min(PERCENT, Math.round((part / Math.max(1, total)) * PERCENT));

export const uid = (): string => crypto.randomUUID();
