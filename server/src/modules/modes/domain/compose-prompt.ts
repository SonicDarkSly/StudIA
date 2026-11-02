import type { AiTarget } from './ai-target.js';
import { FILE_PROTOCOL } from './file-protocol.js';
import type { Mode } from './mode.js';

export function composeModePrompt(mode: Mode, target: AiTarget): string {
  const format = mode.formats[target.key];
  const parts = [mode.systemPrompt];
  if (format.instructions)
    parts.push(
      `FORMAT POUR L'IA CIBLE : ${target.label} (${target.vendor} · ${target.tools}). Cette section prime sur tout le reste.\n${format.instructions}`,
    );
  if (mode.usesFiles) parts.push(FILE_PROTOCOL.trim());
  return parts.join('\n\n');
}
