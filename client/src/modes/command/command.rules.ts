import type { FileIssue, GeneratedFile, ModeRules } from '@/types';
import { checkHeaders } from '@/modes/utils/headers';
import { hasSkillFile, placeSkillFiles } from '@/modes/utils/skills';
import { frontmatter, listValue, markdownBody } from '@/utils/frontmatter';

const CLAUDE_COMMANDS = '.claude/commands/';
const COPILOT_PROMPTS = '.github/prompts/';
const GEMINI_COMMANDS = '.gemini/commands/';
const CODE_FENCE = /^\s*```/;
const SHELL_LINE = /^\s*(if \[|then$|fi$|else$|done$|do$|for \w+ in |while |echo |export \w+=|\w+=\$\()/;
const SHELL_LINES_MIN = 2;
const BANG_WITHOUT_BACKTICK = /^!\s*[^`\s]/m;
const INJECTED_COMMAND = /!`([^`]+)`/g;
const MAY_FAIL = /\b(typecheck|tsc|lint|eslint|test|jest|vitest|build|check)\b/;
const FAILURE_IGNORED = '|| true';
const BASH_RULE = /^Bash\((.+)\)$/;
const WILDCARD_SUFFIX = /(\s\*|:\*)$/;
const ALLOWED_TOOLS = 'allowed-tools';
const OUTDATED_COPILOT_TOOLS = ['runCommands'];
const UNDOCUMENTED_COPILOT_VARIABLES = ['${file}'];
const TRIPLE_QUOTE = /"""/g;
const PAIR = 2;
const GEMINI_SHELL = /!\{([^}]+)\}/g;

function shellLinesOutsideCode(body: string): number {
  let inCode = false;
  let count = 0;
  for (const line of body.split('\n')) {
    if (CODE_FENCE.test(line)) inCode = !inCode;
    else if (!inCode && SHELL_LINE.test(line)) count++;
  }
  return count;
}

function bashAllows(rule: string, command: string): boolean {
  const pattern = rule.match(BASH_RULE)?.[1];
  if (!pattern) return false;
  if (!WILDCARD_SUFFIX.test(pattern)) return pattern === command;
  const prefix = pattern.replace(WILDCARD_SUFFIX, '');
  return command === prefix || command.startsWith(`${prefix} `);
}

function checkClaudeCommand(file: GeneratedFile, body: string): FileIssue[] {
  const issues: FileIssue[] = [];
  if (BANG_WITHOUT_BACKTICK.test(body))
    issues.push({
      level: 'error',
      path: file.path,
      message:
        'Ligne « ! commande » sans accents graves : Claude Code ne l’exécutera pas. Écrire !`commande`, ou demander à l’agent de la lancer.',
    });
  const rules = listValue(frontmatter(file.content)?.[ALLOWED_TOOLS] ?? '');
  const injected = [...body.matchAll(INJECTED_COMMAND)].map((m) => m[1].trim());
  const refused = injected.filter((command) => !rules.some((rule) => bashAllows(rule, command)));
  const fragile = injected.filter((command) => MAY_FAIL.test(command) && !command.includes(FAILURE_IGNORED));
  if (fragile.length)
    issues.push({
      level: 'warning',
      path: file.path,
      message: `!\`${fragile[0]}\` peut échouer (erreurs trouvées) et annulerait alors toute la commande : demander plutôt à l’agent de la lancer.`,
    });
  if (refused.length)
    issues.push({
      level: 'warning',
      path: file.path,
      message: `Commande(s) !\`…\` non permise(s) par allowed-tools : ${refused.join(', ')}. Ajouter par ex. Bash(${refused[0].split(' ')[0]} *).`,
    });
  return issues;
}

function checkCopilotPrompt(file: GeneratedFile): FileIssue[] {
  const issues: FileIssue[] = [];
  const outdated = OUTDATED_COPILOT_TOOLS.filter((tool) => file.content.includes(tool));
  if (outdated.length)
    issues.push({
      level: 'warning',
      path: file.path,
      message: `Outil(s) Copilot renommé(s) : ${outdated.join(', ')}. Pour lancer des commandes, utiliser execute.`,
    });
  const variables = UNDOCUMENTED_COPILOT_VARIABLES.filter((v) => file.content.includes(v));
  if (variables.length)
    issues.push({
      level: 'warning',
      path: file.path,
      message: `Variable(s) non documentée(s) par VS Code : ${variables.join(', ')}. Préférer #file:chemin ou \${selection}.`,
    });
  return issues;
}

function checkGeminiCommand(file: GeneratedFile): FileIssue[] {
  const issues: FileIssue[] = [];
  if ((file.content.match(TRIPLE_QUOTE) ?? []).length % PAIR !== 0)
    issues.push({
      level: 'error',
      path: file.path,
      message: 'Chaîne """ non refermée : le fichier TOML est invalide.',
    });
  const twice = [...file.content.matchAll(GEMINI_SHELL)]
    .map((m) => m[1].trim())
    .filter((command) => file.content.includes(`\`${command}\``));
  if (twice.length)
    issues.push({
      level: 'warning',
      path: file.path,
      message: `${twice[0]} est injectée par !{…} et demandée en plus dans la consigne : elle tournera deux fois. Garder l’une des deux.`,
    });
  return issues;
}

export function checkCommands(files: GeneratedFile[]): FileIssue[] {
  const issues: FileIssue[] = [];
  const own = new Set(files.filter((f) => f.origin === 'modele').map((f) => f.path));
  if (own.size > 1)
    issues.push({
      level: 'warning',
      message: `${own.size} fichiers livrés : une commande tient en un seul fichier, les autres sont inutiles.`,
    });
  for (const file of files) {
    if (file.path.startsWith(GEMINI_COMMANDS)) {
      issues.push(...checkGeminiCommand(file));
      continue;
    }
    if (!file.path.endsWith('.md')) continue;
    const body = markdownBody(file.content);
    if (shellLinesOutsideCode(body) >= SHELL_LINES_MIN)
      issues.push({
        level: 'warning',
        path: file.path,
        message:
          'Le corps ressemble à un script shell : une commande est une consigne adressée à l’agent, qui lance lui-même les commandes.',
      });
    if (file.path.startsWith(CLAUDE_COMMANDS)) issues.push(...checkClaudeCommand(file, body));
    if (file.path.startsWith(COPILOT_PROMPTS)) issues.push(...checkCopilotPrompt(file));
  }
  return issues;
}

export const COMMAND_RULES: ModeRules = {
  place: placeSkillFiles,
  check: (files) => [...(hasSkillFile(files) ? [] : checkHeaders(files, false)), ...checkCommands(files)],
};
