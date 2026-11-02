import type { FileIssue, GeneratedFile, ModeRules } from '@/types';
import { shellIssues } from '@/modes/utils/shell';
import { parseJson } from '@/utils/json';
import { z } from '@/utils/zod';

const NAMED_HOOK_GROUPS = '.agents/hooks.json';
const VERSIONED_CONFIG = /^\.(cursor|github)\//;
const DENY_JSON_ON_STDERR = /\bdeny\\?"[^\n]*>&2/;
const CONFIG_VERSION = 1;

const hooksConfigSchema = z
  .looseObject({
    hooks: z.record(z.string(), z.unknown()).optional().catch(undefined),
    version: z.number().optional().catch(undefined),
  })
  .catch({});

function checkHooks(files: GeneratedFile[]): FileIssue[] {
  const issues: FileIssue[] = [];
  for (const config of files.filter((f) => f.path.endsWith('.json'))) {
    const json = parseJson(config.content, hooksConfigSchema);
    if (!json) continue;
    if (config.path === NAMED_HOOK_GROUPS) {
      if (json.hooks)
        issues.push({
          level: 'error',
          path: config.path,
          message: 'Pas de clé « hooks » englobante ici : chaque clé est le nom d’un groupe de hooks.',
        });
    } else if (!json.hooks)
      issues.push({ level: 'error', path: config.path, message: 'Clé « hooks » absente.' });
    if (VERSIONED_CONFIG.test(config.path) && json.version !== CONFIG_VERSION)
      issues.push({ level: 'warning', path: config.path, message: 'Champ « version »: 1 attendu.' });
  }
  const configs = files.filter((f) => f.path.endsWith('.json'));
  if (!configs.length)
    issues.push({
      level: 'error',
      message: 'Aucun fichier de configuration des hooks : les scripts ne seront jamais lancés.',
    });
  for (const f of files.filter((f) => f.path.endsWith('.sh'))) {
    const scriptName = f.path.split('/').pop() ?? f.path;
    if (configs.length && !configs.some((config) => config.content.includes(scriptName)))
      issues.push({
        level: 'warning',
        path: f.path,
        message: 'Script cité par aucun fichier de configuration : il ne sera jamais lancé.',
      });
    if (!f.content.startsWith('#!'))
      issues.push({ level: 'warning', path: f.path, message: 'Ligne #! manquante en tête du script.' });
    if (DENY_JSON_ON_STDERR.test(f.content))
      issues.push({
        level: 'warning',
        path: f.path,
        message:
          'Décision de refus (JSON) écrite sur stderr : l’outil la lit sur stdout, le motif ne sera pas affiché (le code 2 bloque quand même). Retirer >&2.',
      });
    issues.push(...shellIssues(f));
  }
  return issues;
}

export const HOOKS_RULES: ModeRules = { check: (files) => checkHooks(files) };
