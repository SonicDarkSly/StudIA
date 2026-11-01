import type { FileIssue, GeneratedFile, TargetFormat } from '../types';
import { fmtNumber } from './format';
import { frontmatter, KEBAB, listValue, markdownBody } from './frontmatter';

const SKILL_FILE = 'SKILL.md';
const SKILL_PATH = /(^|\/)SKILL\.md$/;
const SKILL_LIMITS = { nameMax: 64, descriptionMin: 60, descriptionMax: 1024, bodyMaxLines: 500 };
const FALLBACK_SKILL_NAME = 'nouvelle-skill';
const SKILLS_ROOT = /skills\/$/;
const SCRIPTS_DIR = 'scripts/';
const SKILL_SUBFOLDER = /(^|[\s"'=(`])\.?\/?(assets|references|scripts)\//m;
const SCRIPT_LOCATION = /dirname|BASH_SOURCE|__dirname|import\.meta|__file__|CLAUDE_SKILL_DIR/;
const WRITE_INTO_SKILL =
  /(génér|écri|enregistr|sauvegard|produi)[^\n]*\bdans\s+`?\.?\/?(assets|references|scripts)\//i;
const MCP_TOOL_PREFIX = 'mcp__';
const ALLOWED_TOOLS = 'allowed-tools';

export const isSkillFile = (path: string) => SKILL_PATH.test(path);

const skillBase = (path: string) => path.slice(0, -SKILL_FILE.length);
const parentFolder = (path: string) => path.split('/').slice(0, -1).pop() ?? '';

function skillName(file: GeneratedFile): string {
  const name = frontmatter(file.content)?.name;
  if (name && KEBAB.test(name)) return name;
  const folder = parentFolder(file.path);
  return KEBAB.test(folder) ? folder : FALLBACK_SKILL_NAME;
}

export function placeSkillFiles(files: GeneratedFile[], format?: TargetFormat): GeneratedFile[] {
  const root = format?.paths[0];
  if (!format || !root || !SKILLS_ROOT.test(root)) return files;
  const inExpected = (path: string) => format.paths.some((p) => path.startsWith(p));
  const misplaced = files.filter((f) => f.origin === 'modele' && isSkillFile(f.path) && !inExpected(f.path));
  if (misplaced.length !== 1) return files;
  const base = skillBase(misplaced[0].path);
  const target = `${root}${skillName(misplaced[0])}/`;
  const fix = `Placé dans ${target} : le modèle avait oublié le dossier attendu par l’IA choisie.`;
  return files.map((f) =>
    f.origin !== 'modele' || !f.path.startsWith(base) || inExpected(f.path)
      ? f
      : { ...f, path: target + f.path.slice(base.length), fixes: [...(f.fixes ?? []), fix] },
  );
}

function checkHeader(file: GeneratedFile, fm: Record<string, string>, format?: TargetFormat): FileIssue[] {
  const issues: FileIssue[] = [];
  const folder = parentFolder(file.path);
  if (!fm.name) issues.push({ level: 'error', path: file.path, message: 'Champ « name » manquant.' });
  else {
    if (!KEBAB.test(fm.name) || fm.name.length > SKILL_LIMITS.nameMax)
      issues.push({
        level: 'error',
        path: file.path,
        message: `« name » : minuscules, chiffres et tirets, ${SKILL_LIMITS.nameMax} caractères max.`,
      });
    if (folder && fm.name !== folder)
      issues.push({
        level: 'warning',
        path: file.path,
        message: `« name » (${fm.name}) devrait être identique au dossier (${folder}).`,
      });
  }
  if (!fm.description)
    issues.push({ level: 'error', path: file.path, message: 'Champ « description » manquant.' });
  else {
    if (fm.description.length > SKILL_LIMITS.descriptionMax)
      issues.push({
        level: 'error',
        path: file.path,
        message: `« description » dépasse ${fmtNumber(SKILL_LIMITS.descriptionMax)} caractères.`,
      });
    if (fm.description.length < SKILL_LIMITS.descriptionMin)
      issues.push({
        level: 'warning',
        path: file.path,
        message: 'Description très courte : dire QUAND l’utiliser et ce qu’elle produit.',
      });
  }
  const rules = format?.frontmatter;
  if (!rules) return issues;
  const unknown = Object.keys(fm).filter((key) => !rules.fields.includes(key));
  if (unknown.length)
    issues.push({
      level: 'warning',
      path: file.path,
      message: `Champ(s) non reconnu(s) par l’IA choisie, ignoré(s) : ${unknown.join(', ')}. Champs reconnus : ${rules.fields.join(', ')}.`,
    });
  const tools = fm[ALLOWED_TOOLS];
  if (tools && rules.toolNames) {
    const known = rules.toolNames;
    const invalid = listValue(tools).filter((tool) => {
      const base = tool.split('(')[0];
      return !known.includes(base) && !base.startsWith(MCP_TOOL_PREFIX);
    });
    if (invalid.length)
      issues.push({
        level: 'error',
        path: file.path,
        message: `Outil(s) inconnu(s) dans allowed-tools : ${invalid.join(', ')}. Exemples de noms valides : Read, Write, Edit, Grep, Bash(commande *).`,
      });
  }
  return issues;
}

function checkResources(skill: GeneratedFile, files: GeneratedFile[], format?: TargetFormat): FileIssue[] {
  const issues: FileIssue[] = [];
  const base = skillBase(skill.path);
  const body = markdownBody(skill.content);
  const configFiles = format?.frontmatter?.configFiles ?? [];
  for (const other of files) {
    if (other === skill || !other.path.startsWith(base)) continue;
    const rel = other.path.slice(base.length);
    if (configFiles.includes(rel)) continue;
    if (!body.includes(rel) && !body.includes(rel.split('/').pop() ?? rel))
      issues.push({
        level: 'warning',
        path: other.path,
        message: 'Fichier jamais cité dans SKILL.md : il ne sera jamais lu ni lancé.',
      });
    if (!rel.startsWith(SCRIPTS_DIR)) continue;
    if (other.path.endsWith('.sh') && !other.content.startsWith('#!'))
      issues.push({ level: 'warning', path: other.path, message: 'Ligne #! manquante en tête du script.' });
    if (SKILL_SUBFOLDER.test(other.content) && !SCRIPT_LOCATION.test(other.content))
      issues.push({
        level: 'warning',
        path: other.path,
        message:
          'Chemins relatifs au dossier courant : lancé depuis le projet, le script ne trouvera pas ses fichiers. Partir de son emplacement : "$(dirname "$0")" en bash, import.meta.dirname en Node, Path(__file__).parent en Python.',
      });
  }
  if (WRITE_INTO_SKILL.test(body))
    issues.push({
      level: 'warning',
      path: skill.path,
      message:
        'Le résultat semble écrit dans le dossier de la skill : il doit aller dans le projet de l’utilisateur, la skill ne contient que des ressources.',
    });
  return issues;
}

export function checkSkills(files: GeneratedFile[], format?: TargetFormat): FileIssue[] {
  const skills = files.filter((f) => isSkillFile(f.path));
  if (!skills.length) return [{ level: 'error', message: 'Aucun fichier SKILL.md.' }];
  const issues: FileIssue[] = [];
  for (const skill of skills) {
    const fm = frontmatter(skill.content);
    if (fm) issues.push(...checkHeader(skill, fm, format));
    else
      issues.push({
        level: 'error',
        path: skill.path,
        message: 'En-tête YAML (--- name / description ---) manquant : l’IA ne reconnaîtra pas la skill.',
      });
    const lines = markdownBody(skill.content).split('\n').length;
    if (lines > SKILL_LIMITS.bodyMaxLines)
      issues.push({
        level: 'warning',
        path: skill.path,
        message: `Corps long (${lines} lignes) : déplacer le détail dans references/.`,
      });
    issues.push(...checkResources(skill, files, format));
  }
  return issues;
}
