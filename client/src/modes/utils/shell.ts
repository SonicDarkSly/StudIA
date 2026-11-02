import type { FileIssue, GeneratedFile } from '@/types';

const GNU_ONLY_COMMANDS = [
  { pattern: /\bdate\s+(-d|--date)\b/, command: 'date -d' },
  { pattern: /\breadlink\s+-f\b/, command: 'readlink -f' },
  { pattern: /\bsed\s+-i\s+(?!''|"")/, command: 'sed -i sans suffixe' },
  { pattern: /\bgrep\s+-\w*P/, command: 'grep -P' },
];

export function gnuOnlyIssue(file: GeneratedFile): FileIssue | undefined {
  const found = GNU_ONLY_COMMANDS.filter(({ pattern }) => pattern.test(file.content)).map((c) => c.command);
  if (!found.length) return undefined;
  return {
    level: 'warning',
    path: file.path,
    message: `Commande(s) propre(s) à Linux, absente(s) de macOS : ${found.join(', ')}. Le script échouera sur un Mac.`,
  };
}
