import { describe, expect, it } from 'vitest';
import type { GeneratedFile } from '@/types';
import { modeCompanion } from '@/modes';

const claudeMd: GeneratedFile = { path: 'CLAUDE.md', content: '# Projet\n', origin: 'modele' };

describe('fichier compagnon proposé par un mode', () => {
  it('le mode Consignes propose une copie AGENTS.md de CLAUDE.md', () => {
    const companion = modeCompanion('instructions', [claudeMd]);
    expect(companion?.file).toEqual({ path: 'AGENTS.md', content: claudeMd.content, origin: 'gabarit' });
  });

  it('rien à proposer quand AGENTS.md est déjà livré', () => {
    const agentsMd: GeneratedFile = { ...claudeMd, path: 'AGENTS.md' };
    expect(modeCompanion('instructions', [claudeMd, agentsMd])).toBeUndefined();
  });

  it('les autres modes ne proposent rien', () => {
    expect(modeCompanion('skill', [claudeMd])).toBeUndefined();
  });
});
