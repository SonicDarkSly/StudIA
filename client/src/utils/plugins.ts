import type { FileIssue, GeneratedFile, PluginRules, TargetFormat } from '@/types';
import { KEBAB } from './consts';
import { gnuOnlyIssue } from './skills';

const MCP_FILE_NAMES = ['.mcp.json', 'mcp.json', 'mcp_config.json'];
const AGENT_PLUGIN_FORBIDDEN_KEYS = ['hooks', 'agents', 'commands', 'mcpServers'];
const README = 'README.md';
const SHELL_SCRIPT = '.sh';
const SHEBANG = '#!';

type JsonObject = Record<string, unknown>;

const rootOf = (path: string) => path.split('/')[0] ?? '';

function parseObject(content: string): JsonObject | undefined {
  try {
    const json: unknown = JSON.parse(content);
    return json && typeof json === 'object' && !Array.isArray(json)
      ? Object.fromEntries(Object.entries(json))
      : undefined;
  } catch {
    return undefined;
  }
}

function checkManifest(manifest: GeneratedFile, root: string, rules: PluginRules): FileIssue[] {
  const json = parseObject(manifest.content);
  if (!json) return [];
  const issues: FileIssue[] = [];
  const name = json.name;
  if (typeof name !== 'string' || !name)
    issues.push({
      level: 'error',
      path: manifest.path,
      message: 'Champ « name » manquant dans le manifeste.',
    });
  else {
    if (!KEBAB.test(name))
      issues.push({
        level: 'error',
        path: manifest.path,
        message: '« name » : minuscules, chiffres et tirets.',
      });
    if (name !== root)
      issues.push({
        level: 'warning',
        path: manifest.path,
        message: `« name » (${name}) devrait être identique au dossier du plugin (${root}).`,
      });
  }
  if (rules.schema && json.$schema !== rules.schema)
    issues.push({
      level: 'error',
      path: manifest.path,
      message: `« $schema » doit valoir exactement ${rules.schema} : sinon le plugin est refusé.`,
    });
  if (rules.mcpNeedsType) {
    const forbidden = AGENT_PLUGIN_FORBIDDEN_KEYS.filter((key) => key in json);
    if (forbidden.length)
      issues.push({
        level: 'error',
        path: manifest.path,
        message: `Champ(s) interdit(s) dans plugin.json : ${forbidden.join(', ')}. Les serveurs MCP vont dans mcp.json.`,
      });
  }
  return issues;
}

function checkMcpFile(file: GeneratedFile, rules: PluginRules): FileIssue[] {
  const json = parseObject(file.content);
  if (!json) return [];
  const servers = json.mcpServers;
  if (!servers || typeof servers !== 'object')
    return [{ level: 'error', path: file.path, message: 'Clé « mcpServers » absente.' }];
  const issues: FileIssue[] = [];
  if (rules.mcpNeedsType) {
    if (!json.$schema)
      issues.push({
        level: 'warning',
        path: file.path,
        message: '« $schema » absent du fichier MCP du plugin.',
      });
    const untyped = Object.entries(servers)
      .filter(([, server]) => !(server && typeof server === 'object' && 'type' in server))
      .map(([name]) => name);
    if (untyped.length)
      issues.push({
        level: 'error',
        path: file.path,
        message: `« type » obligatoire (stdio ou streamable-http) pour : ${untyped.join(', ')}.`,
      });
  }
  return issues;
}

function checkScripts(files: GeneratedFile[]): FileIssue[] {
  const issues: FileIssue[] = [];
  for (const script of files.filter((f) => f.path.endsWith(SHELL_SCRIPT))) {
    if (!script.content.startsWith(SHEBANG))
      issues.push({ level: 'warning', path: script.path, message: 'Ligne #! manquante en tête du script.' });
    const gnuOnly = gnuOnlyIssue(script);
    if (gnuOnly) issues.push(gnuOnly);
  }
  return issues;
}

export function checkPlugin(files: GeneratedFile[], format?: TargetFormat): FileIssue[] {
  const rules = format?.plugin;
  const own = files.filter((f) => f.origin === 'modele');
  if (!rules || !own.length) return [];
  const roots = [...new Set(own.map((f) => rootOf(f.path)))];
  const root = roots[0];
  const issues: FileIssue[] = [];
  if (roots.length > 1)
    issues.push({
      level: 'warning',
      message: `Fichiers répartis dans ${roots.length} dossiers (${roots.join(', ')}) : un plugin tient dans un seul dossier.`,
    });
  const manifest = files.find((f) => f.path === `${root}/${rules.manifest}`);
  if (manifest) issues.push(...checkManifest(manifest, root, rules));
  else
    issues.push({
      level: 'error',
      message: `Manifeste ${root}/${rules.manifest} absent : l’outil ne reconnaîtra pas le plugin.`,
    });
  for (const file of files.filter((f) => rootOf(f.path) === root)) {
    const rest = file.path.slice(root.length + 1);
    if (rest === rules.mcpFile) issues.push(...checkMcpFile(file, rules));
    else if (MCP_FILE_NAMES.includes(rest))
      issues.push({
        level: 'warning',
        path: file.path,
        message: `Fichier MCP au mauvais nom pour l’IA choisie : ${rules.mcpFile ? `attendu ${root}/${rules.mcpFile}` : 'les serveurs se déclarent dans le manifeste'}.`,
      });
  }
  if (!files.some((f) => f.path === `${root}/${README}`))
    issues.push({
      level: 'warning',
      message: `${root}/${README} absent : rien n’explique comment installer le plugin.`,
    });
  issues.push(...checkScripts(files));
  return issues;
}
