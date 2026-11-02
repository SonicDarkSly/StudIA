import type { FileIssue, GeneratedFile } from '@/types';
import { frontmatter } from '@/utils/frontmatter';

const CURSOR_COMMANDS = '.cursor/commands/';
const CODEX_AGENTS = '.codex/agents/';
const GITHUB = '.github/';
const CODEX_AGENT_KEYS = ['name', 'description', 'developer_instructions'];
const PROMPT_KEYS = ['prompt'];

export function checkHeaders(files: GeneratedFile[], requireName: boolean): FileIssue[] {
  const issues: FileIssue[] = [];
  for (const f of files.filter((f) => f.path.endsWith('.md') && !f.path.startsWith(CURSOR_COMMANDS))) {
    const fm = frontmatter(f.content);
    if (!fm) {
      issues.push({ level: 'warning', path: f.path, message: 'En-tête YAML manquant.' });
      continue;
    }
    if (!fm.description)
      issues.push({ level: 'error', path: f.path, message: 'Champ « description » manquant.' });
    if (requireName && !fm.name && !f.path.startsWith(GITHUB))
      issues.push({ level: 'error', path: f.path, message: 'Champ « name » manquant.' });
  }
  for (const f of files.filter((f) => f.path.endsWith('.toml'))) {
    const required = f.path.startsWith(CODEX_AGENTS) ? CODEX_AGENT_KEYS : PROMPT_KEYS;
    for (const key of required)
      if (!new RegExp(`^${key}\\s*=`, 'm').test(f.content))
        issues.push({ level: 'error', path: f.path, message: `Clé TOML « ${key} » manquante.` });
  }
  return issues;
}
