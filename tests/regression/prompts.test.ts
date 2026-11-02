import { describe, expect, it } from 'vitest';
import { TARGETS } from '../../server/src/modules/modes/domain/ai-target.js';
import { MODES } from '../../server/src/modules/modes/catalog/index.js';
import { composeModePrompt } from '../../server/src/modules/modes/domain/compose-prompt.js';

describe('prompt système de chaque mode pour chaque IA', () => {
  for (const mode of MODES)
    for (const target of TARGETS)
      it(`${mode.key} · ${target.key}`, async () => {
        await expect(composeModePrompt(mode, target)).toMatchFileSnapshot(
          `./prompts/${mode.key}/${target.key}.txt`,
        );
      });
});
