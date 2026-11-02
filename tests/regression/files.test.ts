import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isTargetKey } from '../../server/src/modules/modes/domain/ai-target.js';
import { MODES } from '../../server/src/modules/modes/catalog/index.js';
import { parseFiles, stripFiles, validateFiles, withScaffold } from '@/utils/files';
import { placeFiles } from '@/modes';

const FIXTURES = new URL('../fixtures/', import.meta.url);
const SECTION = '\n\n';

function report(text: string, modeKey: string, targetKey: string): string {
  const mode = MODES.find((g) => g.key === modeKey);
  if (!mode || !isTargetKey(targetKey)) throw new Error(`Exemple inconnu : ${modeKey}/${targetKey}`);
  const format = mode.formats[targetKey];
  const parsed = parseFiles(text);
  const files = withScaffold(placeFiles(mode.key, parsed.files, format), [
    ...mode.scaffold,
    ...(format.scaffold ?? []),
  ]);
  const issues = validateFiles(mode.key, files, format);
  return [
    `réponse coupée : ${parsed.partial ? 'oui' : 'non'}`,
    issues.map((i) => `[${i.level}] ${i.path ?? '-'} : ${i.message}`).join('\n'),
    ...files.map(
      (f) =>
        `=== ${f.path} (${f.origin})${(f.fixes ?? []).map((fix) => `\n# réparé : ${fix}`).join('')}\n${f.content}`,
    ),
    `=== texte affiché\n${stripFiles(text).prose}`,
  ].join(SECTION);
}

for (const mode of readdirSync(FIXTURES)) {
  describe(`réponses réelles du mode ${mode}`, () => {
    for (const file of readdirSync(new URL(`${mode}/`, FIXTURES))) {
      const name = file.replace(/\.md$/, '');
      const target = name.split('.')[0];
      it(name, async () => {
        const text = readFileSync(new URL(`${mode}/${file}`, FIXTURES), 'utf8');
        await expect(report(text, mode, target)).toMatchFileSnapshot(`./files/${mode}/${name}.txt`);
      });
    }
  });
}
