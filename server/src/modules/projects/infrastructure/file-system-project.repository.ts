import { Injectable } from '@nestjs/common';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, parse, relative } from 'node:path';
import { PROJECTS_FILE, REPO_ROOT } from '../../../shared/config/paths.js';
import { toPrettyJson } from '../../../shared/json.js';
import { approxTokens } from '../../models/domain/tokens.js';
import { STACK_MARKERS } from '../domain/consts.js';
import {
  InvalidProjectFolderError,
  ProjectNotFoundError,
  type ClaudeItem,
  type ProjectContext,
  type ProjectSummary,
  type RegisteredProject,
} from '../domain/project.js';
import type { ProjectRepository } from '../domain/project.repository.js';

const MAX_CHARS = {
  frontmatter: 20_000,
  readmeSummary: 2000,
  claudeMd: 12_000,
  agentsMd: 6000,
  readme: 5000,
};
const FIRST_DUPLICATE_SUFFIX = 2;

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  'data',
  'logs',
  'coverage',
  '.node',
  '.cache',
  '.turbo',
  '.idea',
  '.vscode',
]);
const SECRET_FILE = /^(\.env.*|.*\.(pem|key|p12|pfx)|id_[a-z0-9]+|.*secret.*|.*credentials.*)$/i;

const readText = (path: string, max: number): string | undefined => {
  try {
    if (!existsSync(path) || SECRET_FILE.test(basename(path))) return undefined;
    const text = readFileSync(path, 'utf8');
    return text.length > max ? `${text.slice(0, max)}\n[… tronqué à ${max} caractères]` : text;
  } catch {
    return undefined;
  }
};

interface PackageJson {
  name?: string;
  description?: string;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ClaudeSettings {
  hooks?: unknown;
}

const readJson = <T>(path: string): T | undefined => {
  try {
    const value: T = JSON.parse(readFileSync(path, 'utf8'));
    return value;
  } catch {
    return undefined;
  }
};

function frontmatter(path: string): Record<string, string> {
  const text = readText(path, MAX_CHARS.frontmatter) ?? '';
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  const out: Record<string, string> = {};
  if (!m) return out;
  let key: string | undefined;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      out[key] = kv[2].replace(/^["'>|-]\s*|["']$/g, '').trim();
    } else if (key && line.trim()) {
      out[key] = `${out[key]} ${line.trim()}`.trim();
    }
  }
  return out;
}

const isInside = (child: string, parent: string): boolean => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

@Injectable()
export class FileSystemProjectRepository implements ProjectRepository {
  private registry(): RegisteredProject[] {
    try {
      const raw: { projects?: RegisteredProject[] } = JSON.parse(readFileSync(PROJECTS_FILE, 'utf8'));
      return Array.isArray(raw.projects) ? raw.projects : [];
    } catch {
      return [];
    }
  }

  private save(projects: RegisteredProject[]): void {
    mkdirSync(dirname(PROJECTS_FILE), { recursive: true });
    const tmp = `${PROJECTS_FILE}.tmp`;
    writeFileSync(tmp, toPrettyJson({ projects }));
    renameSync(tmp, PROJECTS_FILE);
  }

  private available(): RegisteredProject[] {
    return this.registry().filter((p) => {
      try {
        return statSync(p.path).isDirectory();
      } catch {
        return false;
      }
    });
  }

  private resolve(name: string): string {
    const project = this.available().find((p) => p.name === name);
    if (!project) throw new ProjectNotFoundError(name);
    return project.path;
  }

  list(): ProjectSummary[] {
    return this.available()
      .map((p) => this.summary(p.name, p.path))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  folders(): { name: string; path: string }[] {
    return this.available().map(({ name, path }) => ({ name, path }));
  }

  add(rawPath: string): ProjectSummary {
    const input = String(rawPath ?? '').trim();
    if (!input || !isAbsolute(input))
      throw new InvalidProjectFolderError(
        'Indique le chemin complet du dossier (ex. /Users/moi/projets/mon-app).',
      );
    let path: string;
    try {
      path = realpathSync(input);
      if (!statSync(path).isDirectory()) throw new Error();
    } catch {
      throw new InvalidProjectFolderError(`Dossier introuvable : ${input}`);
    }
    if (parse(path).root === path)
      throw new InvalidProjectFolderError('La racine du disque ne peut pas être un projet.');
    const self = realpathSync(REPO_ROOT);
    if (isInside(path, self) || isInside(self, path))
      throw new InvalidProjectFolderError(
        'Ce dossier contient StudIA lui-même : choisis le dossier d’un projet.',
      );

    const projects = this.registry();
    const existing = projects.find((p) => p.path === path);
    if (existing) return this.summary(existing.name, existing.path);
    const base = basename(path);
    let name = base;
    for (let i = FIRST_DUPLICATE_SUFFIX; projects.some((p) => p.name === name); i++) name = `${base}-${i}`;
    projects.push({ name, path, addedAt: new Date().toISOString() });
    this.save(projects);
    return this.summary(name, path);
  }

  remove(name: string): void {
    const projects = this.registry();
    if (!projects.some((p) => p.name === name)) throw new ProjectNotFoundError(name);
    this.save(projects.filter((p) => p.name !== name));
  }

  private packageJsons(dir: string): { path: string; json: PackageJson }[] {
    const out: { path: string; json: PackageJson }[] = [];
    const root = readJson<PackageJson>(join(dir, 'package.json'));
    if (root) out.push({ path: 'package.json', json: root });
    const workspaces: string[] = Array.isArray(root?.workspaces)
      ? root.workspaces
      : (root?.workspaces?.packages ?? []);
    for (const ws of workspaces) {
      if (ws.includes('*')) continue;
      const json = readJson<PackageJson>(join(dir, ws, 'package.json'));
      if (json) out.push({ path: `${ws}/package.json`, json });
    }
    return out;
  }

  private stack(dir: string): string[] {
    const found = new Set<string>();
    for (const { json } of this.packageJsons(dir)) {
      const deps = { ...(json.dependencies ?? {}), ...(json.devDependencies ?? {}) };
      for (const [dep, label] of Object.entries(STACK_MARKERS)) if (deps[dep]) found.add(label);
    }
    return [...found];
  }

  private items(dir: string, kind: 'skills' | 'commands' | 'agents'): ClaudeItem[] {
    const base = join(dir, '.claude', kind);
    if (!existsSync(base)) return [];
    const out: ClaudeItem[] = [];
    for (const entry of readdirSync(base)) {
      const path = join(base, entry);
      const file = kind === 'skills' ? join(path, 'SKILL.md') : path;
      if (!existsSync(file) || (kind !== 'skills' && !entry.endsWith('.md'))) continue;
      const fm = frontmatter(file);
      out.push({ name: fm.name || entry.replace(/\.md$/, ''), description: fm.description || undefined });
    }
    return out;
  }

  private summary(name: string, dir: string): ProjectSummary {
    const pkg = readJson<PackageJson>(join(dir, 'package.json'));
    const readme = readText(join(dir, 'README.md'), MAX_CHARS.readmeSummary);
    const firstLine = readme
      ?.split('\n')
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith('#') && !l.startsWith('!['));
    const settings = readJson<ClaudeSettings>(join(dir, '.claude', 'settings.json'));
    return {
      name,
      path: dir,
      description: pkg?.description || firstLine || undefined,
      stack: this.stack(dir),
      hasClaudeMd: existsSync(join(dir, 'CLAUDE.md')),
      hasAgentsMd: existsSync(join(dir, 'AGENTS.md')),
      skills: this.items(dir, 'skills'),
      commands: this.items(dir, 'commands'),
      agents: this.items(dir, 'agents'),
      hasHooks: !!settings?.hooks,
      launchers: readdirSync(dir).filter((f) => /^(Lancer|Launch|Start)[-_ ]/i.test(f)),
    };
  }

  private tree(dir: string, maxDepth = 3, maxLines = 220): string {
    const lines: string[] = [];
    const walk = (current: string, depth: number, prefix: string) => {
      if (lines.length >= maxLines) return;
      let entries: string[];
      try {
        entries = readdirSync(current).filter((e) => !e.startsWith('.') || e === '.claude');
      } catch {
        return;
      }
      entries.sort((a, b) => a.localeCompare(b));
      for (const entry of entries) {
        if (lines.length >= maxLines) {
          lines.push(`${prefix}…`);
          return;
        }
        if (IGNORED_DIRS.has(entry) || SECRET_FILE.test(entry)) continue;
        const path = join(current, entry);
        let isDir: boolean;
        try {
          isDir = statSync(path).isDirectory();
        } catch {
          continue;
        }
        if (!isDir && /\.(gguf|bin|png|jpe?g|gif|webp|ico|pdf|zip|lock)$/i.test(entry)) continue;
        lines.push(`${prefix}${entry}${isDir ? '/' : ''}`);
        if (isDir && depth < maxDepth) walk(path, depth + 1, `${prefix}  `);
      }
    };
    walk(dir, 1, '');
    return lines.join('\n');
  }

  context(name: string): ProjectContext {
    const dir = this.resolve(name);
    const s = this.summary(name, dir);
    const parts: string[] = [`# Projet ${name}`];
    if (s.description) parts.push(s.description);
    if (s.stack.length) parts.push(`Stack détectée : ${s.stack.join(', ')}`);

    const claudeMd = readText(join(dir, 'CLAUDE.md'), MAX_CHARS.claudeMd);
    if (claudeMd) parts.push(`## CLAUDE.md (consignes existantes)\n${claudeMd}`);
    const agentsMd = readText(join(dir, 'AGENTS.md'), MAX_CHARS.agentsMd);
    if (agentsMd) parts.push(`## AGENTS.md\n${agentsMd}`);
    if (!claudeMd) {
      const readme = readText(join(dir, 'README.md'), MAX_CHARS.readme);
      if (readme) parts.push(`## README.md\n${readme}`);
    }

    for (const { path, json } of this.packageJsons(dir)) {
      const brief = {
        name: json.name,
        description: json.description,
        scripts: json.scripts,
        workspaces: json.workspaces,
        dependencies: json.dependencies,
        devDependencies: json.devDependencies,
      };
      parts.push(`## ${path}\n\`\`\`json\n${toPrettyJson(brief)}\n\`\`\``);
    }

    parts.push(`## Arborescence (sans node_modules, data, dist)\n\`\`\`\n${this.tree(dir)}\n\`\`\``);

    const claudeLines: string[] = [];
    for (const [label, list] of [
      ['Skills', s.skills],
      ['Commandes', s.commands],
      ['Sous-agents', s.agents],
    ] as const) {
      for (const item of list)
        claudeLines.push(`- ${label} : ${item.name}${item.description ? ` : ${item.description}` : ''}`);
    }
    if (s.hasHooks) claudeLines.push('- Hooks configurés dans .claude/settings.json');
    if (claudeLines.length) parts.push(`## Éléments .claude existants\n${claudeLines.join('\n')}`);
    if (s.launchers.length) parts.push(`## Lanceurs\n${s.launchers.join(', ')}`);

    const text = parts.join('\n\n');
    return { name, text, chars: text.length, approxTokens: approxTokens(text) };
  }
}
