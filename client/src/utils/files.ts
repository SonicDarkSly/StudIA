import JSZip from 'jszip';
import type { FileIssue, GeneratedFile, ModeKey, ScaffoldFile, TargetFormat } from '@/types';
import { errorMessage } from './errors';
import { FIX_MESSAGES } from './consts';
import { cleanContent, dropTrailingSeparator } from './frontmatter';
import { checkModeFiles } from '@/modes';

const START = /^=== ?FICHIER ?: ?(.+?) ?===\s*$/;
const END = /^=== ?FIN ?(?:===)?\s*$/;
const CHECKLIST = /^\s*(?:\*\*|#+\s*)?À vérifier\b[^\n]*:/;
const PLUGIN_MANIFEST = /^([^/]+)\/(?:\.claude-plugin\/plugin|plugin|gemini-extension)\.json$/;
const README = /(^|\/)README[^/]*$/i;
const PROMPT_LEAK = /FORMAT POUR L'IA CIBLE|TA MISSION :/;
const BINARY_FILE =
  /\.(png|jpe?g|gif|webp|ico|icns|bmp|tiff?|pdf|zip|gz|tgz|7z|rar|exe|dll|dmg|app|woff2?|ttf|otf|mp3|mp4|wav|mov)$/i;
const OBJECT_URL_LIFETIME_MS = 2000;

function safePath(raw: string): string | undefined {
  const path = raw.trim().replace(/^`|`$/g, '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').includes('..'))
    return undefined;
  return path;
}

type FileEnd = 'fin' | 'suivant' | 'coupe' | 'liste';

function toFile(path: string, lines: string[], end: FileEnd): GeneratedFile {
  const cleaned = cleanContent(path, lines.join('\n'));
  const withoutSeparator =
    end === 'suivant' || end === 'liste' ? dropTrailingSeparator(cleaned.content) : undefined;
  const content = withoutSeparator ?? cleaned.content;
  const separatorFixes =
    withoutSeparator === undefined ? cleaned.fixes : [...cleaned.fixes, FIX_MESSAGES.trailingSeparator];
  const fixes = end === 'liste' ? [...separatorFixes, FIX_MESSAGES.checklistInFile] : separatorFixes;
  return {
    path,
    content: end === 'coupe' ? content : `${content}\n`,
    origin: 'modele',
    ...(fixes.length ? { fixes } : {}),
  };
}

function dropIdenticalDuplicates(files: GeneratedFile[]): GeneratedFile[] {
  const kept: GeneratedFile[] = [];
  for (const file of files) {
    const index = kept.findIndex((k) => k.path === file.path && k.content === file.content);
    if (index < 0) kept.push(file);
    else
      kept[index] = {
        ...kept[index],
        fixes: [...new Set([...(kept[index].fixes ?? []), FIX_MESSAGES.identicalDuplicate])],
      };
  }
  return kept;
}

export function parseFiles(text: string): { files: GeneratedFile[]; partial: boolean } {
  const files: GeneratedFile[] = [];
  let current: { path: string; lines: string[] } | undefined;
  for (const line of text.split('\n')) {
    const start = line.match(START);
    if (start) {
      if (current) files.push(toFile(current.path, current.lines, 'suivant'));
      const path = safePath(start[1]);
      current = path ? { path, lines: [] } : undefined;
      continue;
    }
    if (END.test(line)) {
      if (current) files.push(toFile(current.path, current.lines, 'fin'));
      current = undefined;
      continue;
    }
    if (current && !README.test(current.path) && CHECKLIST.test(line)) {
      files.push(toFile(current.path, current.lines, 'liste'));
      current = undefined;
      continue;
    }
    current?.lines.push(line);
  }
  const partial = current !== undefined;
  if (current) files.push(toFile(current.path, current.lines, 'coupe'));
  return { files: dropIdenticalDuplicates(files), partial };
}

export function stripFiles(text: string): { prose: string; count: number } {
  let count = 0;
  let inside: string | undefined;
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const start = line.match(START);
    if (start) {
      inside = safePath(start[1]) ?? 'fichier';
      count++;
      out.push(`\n> **Fichier** \`${inside}\` : voir le panneau Fichiers\n`);
      continue;
    }
    if (END.test(line)) {
      inside = undefined;
      continue;
    }
    if (inside !== undefined && !README.test(inside) && CHECKLIST.test(line)) inside = undefined;
    if (inside === undefined) out.push(line);
  }
  return { prose: out.join('\n'), count };
}

export function archiveName(files: GeneratedFile[]): string {
  const plugin = files.map((f) => f.path.match(PLUGIN_MANIFEST)?.[1]).find(Boolean);
  if (plugin) return plugin;
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
  const provided = new Map<string, GeneratedFile>(
    scaffold.map((s) => {
      const path = s.path.split('{{name}}').join(name);
      return [path, { path, content: s.content.split('{{name}}').join(name), origin: 'gabarit' }];
    }),
  );
  const kept = files.map((f) => {
    const own = provided.get(f.path);
    if (!own) return f;
    return own.content.trim() === f.content.trim() ? own : { ...own, fixes: [FIX_MESSAGES.scaffoldWins] };
  });
  const existing = new Set(files.map((f) => f.path));
  return [...kept, ...[...provided.values()].filter((s) => !existing.has(s.path))];
}

export function validateFiles(modeKey: ModeKey, files: GeneratedFile[], format?: TargetFormat): FileIssue[] {
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

  for (const f of files.filter((f) => f.origin === 'modele' && PROMPT_LEAK.test(f.content)))
    issues.push({
      level: 'warning',
      path: f.path,
      message:
        'Consigne destinée au modèle recopiée dans le fichier (« FORMAT POUR L’IA CIBLE »…) : la remplacer par le vrai texte.',
    });

  for (const f of files.filter((f) => BINARY_FILE.test(f.path)))
    issues.push({
      level: 'error',
      path: f.path,
      message:
        'Fichier binaire écrit en texte par le modèle : il est inutilisable. Le retirer ou le fournir soi-même.',
    });

  for (const f of files) {
    if (f.path.endsWith('.json')) {
      try {
        JSON.parse(f.content);
      } catch (e) {
        issues.push({ level: 'error', path: f.path, message: `JSON invalide : ${errorMessage(e)}` });
      }
    }
  }

  const seen = new Set<string>();
  for (const f of files) {
    if (seen.has(f.path))
      issues.push({
        level: 'warning',
        path: f.path,
        message: 'Fichier livré plusieurs fois : seule la dernière version est gardée dans le ZIP.',
      });
    seen.add(f.path);
  }

  for (const f of files)
    for (const fix of f.fixes ?? [])
      issues.push({ level: 'ok', path: f.path, message: `Corrigé automatiquement : ${fix}` });

  issues.push(...checkModeFiles(modeKey, files, format));

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
