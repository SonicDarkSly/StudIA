import type { FileIssue, GeneratedFile, ModeCompanion, ModeRules } from '@/types';
import { frontmatter } from '@/utils/frontmatter';

const CLAUDE_MD = 'CLAUDE.md';
const AGENTS_MD = 'AGENTS.md';

function agentsMdCopy(files: GeneratedFile[]): ModeCompanion | undefined {
  const claudeMd = files.find((f) => f.path === CLAUDE_MD);
  if (!claudeMd || files.some((f) => f.path === AGENTS_MD)) return undefined;
  return {
    label: `+ copie ${AGENTS_MD}`,
    hint: `${AGENTS_MD} est lu par Codex, Cursor, Copilot… : même contenu, autre nom.`,
    file: { path: AGENTS_MD, content: claudeMd.content, origin: 'gabarit' },
  };
}

function checkInstructions(files: GeneratedFile[]): FileIssue[] {
  const issues: FileIssue[] = [];
  for (const f of files.filter((f) => f.path.endsWith('.mdc'))) {
    const fm = frontmatter(f.content);
    if (!fm || fm.alwaysApply !== 'true')
      issues.push({
        level: 'warning',
        path: f.path,
        message: 'En-tête « alwaysApply: true » absent : la règle ne sera pas appliquée partout.',
      });
  }
  for (const f of files.filter((f) =>
    /(CLAUDE|AGENTS|GEMINI|copilot-instructions)\.md$|\.mdc$/.test(f.path),
  )) {
    const todo = (f.content.match(/À compléter/g) ?? []).length;
    if (todo)
      issues.push({
        level: 'warning',
        path: f.path,
        message: `${todo} point(s) « À compléter » à renseigner.`,
      });
  }
  return issues;
}

export const INSTRUCTIONS_RULES: ModeRules = {
  check: (files) => checkInstructions(files),
  companion: agentsMdCopy,
};
