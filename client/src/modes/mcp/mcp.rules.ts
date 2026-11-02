import type { FileIssue, GeneratedFile, ModeRules } from '@/types';
import { parseJson } from '@/utils/json';
import { z } from '@/utils/zod';

const LEGACY_SDK = /@modelcontextprotocol\/sdk/;
const ERROR_WITHOUT_CONTENT = /isError:\s*true\s*,\s*(?:message|error|text)\s*:/;
const RELATIVE_ON_STRING = /\)\s*\.relative\(/;
const LEGACY_STDIO = /\.connect\(\s*new\s+StdioServerTransport/;
const SERVER_FILE = 'src/index.ts';
const README_FILE = /(^|\/)README\.md$/;
const CONFIG_FOLDER = '/config/';
const CODE_FILE = /\.(ts|js|mjs|json)$/;
const FENCE_LINE = /^```/m;
const CODE_BLOCK = /```\w*\n([\s\S]*?)```/g;
const PREFIX_CHECK = /\.startsWith\(\s*[\w.]*(dir|root|base)\w*\s*\)/i;
const TOML_SECTION = /^\[([\w-]+)\./m;
const INSTALL_STEPS = ['npm install', 'npm run build'];
const PATH_PLACEHOLDER = '/CHEMIN/ABSOLU/VERS';
const TILDE_PATH = /(resolve|join|readFile|readdir|stat|access|existsSync|open)\w*\(\s*["'`]~/;
const RELATIVE_RESULT = /(?:const|let)\s+(\w+)\s*=\s*(?:path\.)?relative\(/g;
const ABSOLUTE_CHECK = /isAbsolute\(\s*(\w+)\s*\)/g;

const clientConfigSchema = z.record(z.string(), z.unknown());

function configKey(file: GeneratedFile): string | undefined {
  if (file.path.endsWith('.toml')) return file.content.match(TOML_SECTION)?.[1];
  const json = parseJson(file.content, clientConfigSchema);
  return json ? Object.keys(json)[0] : undefined;
}

function checkServer(index: GeneratedFile): FileIssue[] {
  const issues: FileIssue[] = [];
  if (!/registerTool\(|\.tool\(/.test(index.content))
    issues.push({ level: 'warning', path: index.path, message: 'Aucun outil déclaré (registerTool).' });
  if (LEGACY_SDK.test(index.content))
    issues.push({
      level: 'error',
      path: index.path,
      message:
        'Import de l’ancien SDK @modelcontextprotocol/sdk : le package.json fourni installe @modelcontextprotocol/server (v2), la compilation échouera.',
    });
  else if (LEGACY_STDIO.test(index.content))
    issues.push({
      level: 'warning',
      path: index.path,
      message:
        'server.connect(new StdioServerTransport()) ne sert que les anciens clients : utiliser serveStdio(createServer).',
    });
  if (!/serveStdio|createMcpHandler|StdioServerTransport|StreamableHTTPServerTransport/.test(index.content))
    issues.push({
      level: 'error',
      path: index.path,
      message: 'Aucun transport : le serveur ne pourra pas communiquer.',
    });
  if (RELATIVE_ON_STRING.test(index.content))
    issues.push({
      level: 'error',
      path: index.path,
      message:
        'relative() appelé sur une chaîne : la fonction cheminAutorise a été modifiée et ne compilera pas. Écrire path.relative(DOSSIER_AUTORISE, chemin).',
    });
  if (ERROR_WITHOUT_CONTENT.test(index.content))
    issues.push({
      level: 'error',
      path: index.path,
      message:
        'Réponse d’erreur sans content : écrire { isError: true, content: [{ type: "text", text: "…" }] }, sinon la compilation échoue.',
    });
  if (/console\.log\(/.test(index.content))
    issues.push({
      level: 'error',
      path: index.path,
      message: 'console.log écrit sur stdout et casse le protocole : utiliser console.error.',
    });
  if (PREFIX_CHECK.test(index.content))
    issues.push({
      level: 'warning',
      path: index.path,
      message:
        'Dossier autorisé vérifié par startsWith : « ~/projets-secret » commence aussi par « ~/projets ». Utiliser path.relative et refuser un résultat qui commence par « .. ».',
    });
  if (TILDE_PATH.test(index.content))
    issues.push({
      level: 'error',
      path: index.path,
      message:
        'Chemin commençant par « ~ » : Node ne le remplace pas par le dossier personnel, le dossier ne sera jamais trouvé. Utiliser os.homedir().',
    });
  const relativeResults = new Set([...index.content.matchAll(RELATIVE_RESULT)].map((m) => m[1]));
  const misplaced = [...index.content.matchAll(ABSOLUTE_CHECK)]
    .map((m) => m[1])
    .filter((name) => relativeResults.size && !relativeResults.has(name));
  if (misplaced.length)
    issues.push({
      level: 'error',
      path: index.path,
      message: `path.isAbsolute(${misplaced.join(', ')}) teste un chemin résolu, toujours absolu : tout serait refusé. Le tester sur le résultat de path.relative.`,
    });
  return issues;
}

const citesConfig = (readme: GeneratedFile, names: string[]): boolean =>
  names.some((name) => readme.content.includes(name)) ||
  (names.length === 1 && readme.content.includes(CONFIG_FOLDER.slice(1)));

function checkReadme(readme: GeneratedFile, configs: GeneratedFile[]): FileIssue[] {
  const issues: FileIssue[] = [];
  const missingSteps = INSTALL_STEPS.filter((step) => !readme.content.includes(step));
  if (missingSteps.length)
    issues.push({
      level: 'error',
      path: readme.path,
      message: `Le README n’indique pas ${missingSteps.join(' ni ')} : sans compilation, dist/index.js n’existe pas et le connecteur ne démarre pas.`,
    });
  const prose = readme.content.replace(CODE_BLOCK, '');
  if (configs.some((c) => c.content.includes(PATH_PLACEHOLDER)) && !prose.includes(PATH_PLACEHOLDER))
    issues.push({
      level: 'warning',
      path: readme.path,
      message: `Le README ne dit pas de remplacer ${PATH_PLACEHOLDER} par le chemin réel du connecteur.`,
    });
  const names = configs.map((c) => c.path.slice(c.path.indexOf(CONFIG_FOLDER) + 1));
  const keys = configs.map(configKey).filter((key): key is string => key !== undefined);
  const configBlocks = [...readme.content.matchAll(CODE_BLOCK)]
    .map((m) => m[1])
    .filter((block) => block.includes('command'));
  const isExpected = (block: string) => keys.some((key) => block.includes(key));
  if (keys.length && configBlocks.some((block) => !isExpected(block)))
    issues.push({
      level: 'error',
      path: readme.path,
      message: `Configuration recopiée dans le README au mauvais format (clé attendue : ${keys.join(' ou ')}) : renvoyer au fichier ${names.join(', ')}.`,
    });
  else if (!citesConfig(readme, names) && !configBlocks.some(isExpected))
    issues.push({
      level: 'warning',
      path: readme.path,
      message: `Le README n’explique pas la configuration : renvoyer au fichier fourni (${names.join(', ')}).`,
    });
  return issues;
}

export function checkMcp(files: GeneratedFile[]): FileIssue[] {
  const issues: FileIssue[] = [];
  const index = files.find((f) => f.path.endsWith(SERVER_FILE));
  if (index) issues.push(...checkServer(index));
  else issues.push({ level: 'error', message: `${SERVER_FILE} manquant.` });
  for (const f of files.filter((file) => CODE_FILE.test(file.path) && FENCE_LINE.test(file.content)))
    issues.push({
      level: 'error',
      path: f.path,
      message: 'Ligne ``` dans le code : le fichier ne compilera pas.',
    });
  const readme = files.find((f) => f.origin === 'modele' && README_FILE.test(f.path));
  const configs = files.filter((f) => f.path.includes(CONFIG_FOLDER));
  if (readme && configs.length) issues.push(...checkReadme(readme, configs));
  return issues;
}

export const MCP_RULES: ModeRules = { check: (files) => checkMcp(files) };
