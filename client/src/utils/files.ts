import JSZip from 'jszip';
import type { FileIssue, GeneratedFile, ScaffoldFile, TargetFormat } from '../types';
import { errorMessage } from './errors';
import { fmtNumber } from './format';

const START = /^=== ?FICHIER ?: ?(.+?) ?===\s*$/;
const END = /^=== ?FIN ?===\s*$/;
const MIN_FENCED_LINES = 2;
const SKILL_LIMITS = { nameMax: 64, descriptionMin: 60, descriptionMax: 1024, bodyMaxLines: 500 };
const OBJECT_URL_LIFETIME_MS = 2000;

const parentFolder = (path: string) => path.split('/').slice(0, -1).pop() ?? '';

function unfence(content: string): string {
  const lines = content.replace(/^\n+|\s+$/g, '').split('\n');
  if (lines.length >= MIN_FENCED_LINES && /^```/.test(lines[0]) && /^```\s*$/.test(lines[lines.length - 1])) {
    return lines.slice(1, -1).join('\n');
  }
  return lines.join('\n');
}

function safePath(raw: string): string | undefined {
  const path = raw.trim().replace(/^`|`$/g, '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').includes('..'))
    return undefined;
  return path;
}

export function parseFiles(text: string): { files: GeneratedFile[]; partial: boolean } {
  const files: GeneratedFile[] = [];
  let current: { path: string; lines: string[] } | undefined;
  for (const line of text.split('\n')) {
    const start = line.match(START);
    if (start) {
      if (current)
        files.push({ path: current.path, content: unfence(current.lines.join('\n')), origin: 'modele' });
      const path = safePath(start[1]);
      current = path ? { path, lines: [] } : undefined;
      continue;
    }
    if (END.test(line)) {
      if (current)
        files.push({
          path: current.path,
          content: unfence(current.lines.join('\n')) + '\n',
          origin: 'modele',
        });
      current = undefined;
      continue;
    }
    current?.lines.push(line);
  }
  const partial = current !== undefined;
  if (current)
    files.push({ path: current.path, content: unfence(current.lines.join('\n')), origin: 'modele' });
  return { files, partial };
}

export function stripFiles(text: string): { prose: string; count: number } {
  let count = 0;
  let inside = false;
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (START.test(line)) {
      inside = true;
      count++;
      out.push(
        `\n> **Fichier** \`${safePath(line.match(START)![1]) ?? 'fichier'}\` : voir le panneau Fichiers\n`,
      );
      continue;
    }
    if (END.test(line)) {
      inside = false;
      continue;
    }
    if (!inside) out.push(line);
  }
  return { prose: out.join('\n'), count };
}

export function archiveName(files: GeneratedFile[]): string {
  for (const f of files) {
    const m = f.path.match(
      /(?:skills|agents|commands|prompts)\/([^/]+?)(?:\.agent|\.prompt)?(?:\.md|\.toml)?(?:\/|$)/,
    );
    if (m) return m[1];
  }
  const first = files[0]?.path
    .split('/')[0]
    .replace(/^\./, '')
    .replace(/\.[a-z]+$/i, '');
  return first || 'studia';
}

export function withScaffold(files: GeneratedFile[], scaffold: ScaffoldFile[]): GeneratedFile[] {
  if (!scaffold.length || !files.length) return files;
  const name = files[0].path.split('/')[0] || 'mon-connecteur';
  const existing = new Set(files.map((f) => f.path));
  const extra = scaffold
    .map((s) => ({
      path: s.path.split('{{name}}').join(name),
      content: s.content.split('{{name}}').join(name),
    }))
    .filter((s) => !existing.has(s.path))
    .map((s) => ({ ...s, origin: 'gabarit' as const }));
  return [...files, ...extra];
}

function frontmatter(content: string): Record<string, string> | undefined {
  const m = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return undefined;
  const out: Record<string, string> = {};
  let key: string | undefined;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      out[key] = kv[2].trim();
    } else if (key && line.trim()) {
      out[key] = `${out[key]} ${line.trim()}`.trim();
    }
  }
  return out;
}

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateFiles(
  generatorKey: string,
  files: GeneratedFile[],
  format?: TargetFormat,
): FileIssue[] {
  const issues: FileIssue[] = [];
  if (!files.length) return issues;

  const expected = format?.paths ?? [];
  if (expected.length) {
    for (const f of files.filter((f) => f.origin === 'modele')) {
      if (!expected.some((p) => f.path === p || f.path.startsWith(p)))
        issues.push({
          level: 'warning',
          path: f.path,
          message: `Emplacement inattendu pour l’IA choisie : ${expected.join(' ou ')}`,
        });
    }
  }

  for (const f of files) {
    if (f.path.endsWith('.json')) {
      try {
        JSON.parse(f.content);
      } catch (e) {
        issues.push({ level: 'error', path: f.path, message: `JSON invalide : ${errorMessage(e)}` });
      }
    }
  }

  const hasSkill = files.some((f) => /(^|\/)SKILL\.md$/.test(f.path));
  if (generatorKey === 'skill' || hasSkill) {
    const skillFiles = files.filter((f) => /(^|\/)SKILL\.md$/.test(f.path));
    if (!skillFiles.length) issues.push({ level: 'error', message: 'Aucun fichier SKILL.md.' });
    for (const f of skillFiles) {
      const folder = parentFolder(f.path);
      const fm = frontmatter(f.content);
      if (!fm) {
        issues.push({
          level: 'error',
          path: f.path,
          message: 'En-tête YAML (--- name / description ---) manquant.',
        });
        continue;
      }
      if (!fm.name) issues.push({ level: 'error', path: f.path, message: 'Champ « name » manquant.' });
      else {
        if (!KEBAB.test(fm.name) || fm.name.length > SKILL_LIMITS.nameMax)
          issues.push({
            level: 'error',
            path: f.path,
            message: `« name » : minuscules, chiffres et tirets, ${SKILL_LIMITS.nameMax} caractères max.`,
          });
        if (folder && fm.name !== folder)
          issues.push({
            level: 'warning',
            path: f.path,
            message: `« name » (${fm.name}) devrait être identique au dossier (${folder}).`,
          });
      }
      if (!fm.description)
        issues.push({ level: 'error', path: f.path, message: 'Champ « description » manquant.' });
      else {
        if (fm.description.length > SKILL_LIMITS.descriptionMax)
          issues.push({
            level: 'error',
            path: f.path,
            message: `« description » dépasse ${fmtNumber(SKILL_LIMITS.descriptionMax)} caractères.`,
          });
        if (fm.description.length < SKILL_LIMITS.descriptionMin)
          issues.push({
            level: 'warning',
            path: f.path,
            message: 'Description très courte : dire QUAND l’utiliser et ce qu’elle produit.',
          });
      }
      const body = f.content.replace(/^---[\s\S]*?\n---/, '');
      const lines = body.split('\n').length;
      if (lines > SKILL_LIMITS.bodyMaxLines)
        issues.push({
          level: 'warning',
          path: f.path,
          message: `Corps long (${lines} lignes) : déplacer le détail dans references/.`,
        });
      const base = f.path.replace(/SKILL\.md$/, '');
      for (const other of files) {
        if (other === f || !other.path.startsWith(base)) continue;
        const rel = other.path.slice(base.length);
        if (!body.includes(rel) && !body.includes(rel.split('/').pop() ?? rel))
          issues.push({
            level: 'warning',
            path: other.path,
            message: 'Fichier jamais cité dans SKILL.md : il ne sera jamais lu.',
          });
      }
    }
  }

  if ((generatorKey === 'agent' || generatorKey === 'command') && !hasSkill) {
    for (const f of files.filter((f) => f.path.endsWith('.md') && !f.path.startsWith('.cursor/commands/'))) {
      const fm = frontmatter(f.content);
      if (!fm) {
        issues.push({ level: 'warning', path: f.path, message: 'En-tête YAML manquant.' });
        continue;
      }
      if (!fm.description)
        issues.push({ level: 'error', path: f.path, message: 'Champ « description » manquant.' });
      if (generatorKey === 'agent' && !fm.name && !f.path.startsWith('.github/'))
        issues.push({ level: 'error', path: f.path, message: 'Champ « name » manquant.' });
    }
    for (const f of files.filter((f) => f.path.endsWith('.toml'))) {
      const required = f.path.startsWith('.codex/agents/')
        ? ['name', 'description', 'developer_instructions']
        : ['prompt'];
      for (const key of required)
        if (!new RegExp(`^${key}\\s*=`, 'm').test(f.content))
          issues.push({ level: 'error', path: f.path, message: `Clé TOML « ${key} » manquante.` });
    }
  }

  if (generatorKey === 'mcp') {
    const index = files.find((f) => f.path.endsWith('src/index.ts'));
    if (!index) issues.push({ level: 'error', message: 'src/index.ts manquant.' });
    else {
      if (!/registerTool\(|\.tool\(/.test(index.content))
        issues.push({ level: 'warning', path: index.path, message: 'Aucun outil déclaré (registerTool).' });
      if (!/StdioServerTransport|StreamableHTTPServerTransport/.test(index.content))
        issues.push({
          level: 'error',
          path: index.path,
          message: 'Aucun transport : le serveur ne pourra pas communiquer.',
        });
      if (/console\.log\(/.test(index.content))
        issues.push({
          level: 'error',
          path: index.path,
          message: 'console.log écrit sur stdout et casse le protocole : utiliser console.error.',
        });
    }
  }

  if (generatorKey === 'hooks') {
    for (const config of files.filter((f) => f.path.endsWith('.json'))) {
      try {
        const json = JSON.parse(config.content);
        if (!json.hooks)
          issues.push({ level: 'error', path: config.path, message: 'Clé « hooks » absente.' });
        if (/^\.(cursor|github)\//.test(config.path) && json.version !== 1)
          issues.push({ level: 'warning', path: config.path, message: 'Champ « version »: 1 attendu.' });
      } catch {}
    }
    for (const f of files.filter((f) => f.path.endsWith('.sh'))) {
      if (!f.content.startsWith('#!'))
        issues.push({ level: 'warning', path: f.path, message: 'Ligne #! manquante en tête du script.' });
    }
  }

  if (generatorKey === 'claudemd') {
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
  }

  if (!issues.some((i) => i.level !== 'ok'))
    issues.push({ level: 'ok', message: 'Aucun problème détecté par les contrôles automatiques.' });
  return issues;
}

export async function downloadZip(files: GeneratedFile[], name: string): Promise<void> {
  const zip = new JSZip();
  for (const f of files) {
    const isScript = f.path.endsWith('.sh');
    zip.file(f.path, f.content, isScript ? { unixPermissions: '755' } : undefined);
  }
  const blob = await zip.generateAsync({ type: 'blob', platform: 'UNIX' });
  triggerDownload(blob, `${name}.zip`);
}

export function downloadFile(file: GeneratedFile): void {
  triggerDownload(
    new Blob([file.content], { type: 'text/plain;charset=utf-8' }),
    file.path.split('/').pop() ?? 'fichier.txt',
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_LIFETIME_MS);
}
