import type { TargetFormat, TargetFormats, TargetKey } from '../../domain/ai-target.js';
import type { ScaffoldFile } from '../../domain/mode.js';

const mcpConfig = (path: string, content: string): ScaffoldFile => ({
  path: `{{name}}/config/${path}`,
  content,
});

const JSON_MCP_SERVERS = `{
  "mcpServers": {
    "{{name}}": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/{{name}}/dist/index.js"]
    }
  }
}
`;

const MCP_CONFIGS: Record<Exclude<TargetKey, 'portable'>, ScaffoldFile> = {
  claude: mcpConfig('claude-mcp.json', JSON_MCP_SERVERS),
  codex: mcpConfig(
    'codex-config.toml',
    `[mcp_servers.{{name}}]
command = "node"
args = ["/CHEMIN/ABSOLU/VERS/{{name}}/dist/index.js"]
`,
  ),
  copilot: mcpConfig(
    'vscode-mcp.json',
    `{
  "servers": {
    "{{name}}": {
      "type": "stdio",
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/{{name}}/dist/index.js"]
    }
  }
}
`,
  ),
  cursor: mcpConfig('cursor-mcp.json', JSON_MCP_SERVERS),
  gemini: mcpConfig('gemini-settings.json', JSON_MCP_SERVERS),
  antigravity: mcpConfig('antigravity-mcp.json', JSON_MCP_SERVERS),
};

const MCP_WHERE: Record<Exclude<TargetKey, 'portable'>, string> = {
  claude:
    'config/claude-mcp.json : à fusionner dans .mcp.json à la racine du projet (Claude Code) ou dans claude_desktop_config.json (Claude Desktop, redémarrage complet nécessaire).',
  codex:
    'config/codex-config.toml : à ajouter dans ~/.codex/config.toml (ou .codex/config.toml d’un projet approuvé).',
  copilot:
    'config/vscode-mcp.json : à fusionner dans .vscode/mcp.json (clé "servers", différente des autres outils).',
  cursor: 'config/cursor-mcp.json : à fusionner dans .cursor/mcp.json du projet ou ~/.cursor/mcp.json.',
  gemini:
    'config/gemini-settings.json : à fusionner dans .gemini/settings.json du projet ou ~/.gemini/settings.json.',
  antigravity:
    'config/antigravity-mcp.json : à fusionner dans .agents/mcp_config.json du projet ou ~/.gemini/config/mcp_config.json.',
};

const MCP_CLIENTS: Record<Exclude<TargetKey, 'portable'>, string> = {
  claude: 'Claude Code et Claude Desktop',
  codex: 'Codex',
  copilot: 'VS Code',
  cursor: 'Cursor',
  gemini: 'Gemini CLI',
  antigravity: 'Antigravity CLI',
};

const describeConfig = (config: ScaffoldFile): string =>
  `Pour information, contenu de ${config.path.replace('{{name}}/', '')}, fourni par l'application (ne pas le livrer ; <nom> = nom du connecteur) :\n${config.content.split('{{name}}').join('<nom>')}`;

const mcpFormat = (key: Exclude<TargetKey, 'portable'>): TargetFormat => ({
  status: 'natif',
  summary: `Serveur MCP universel ; configuration prête pour ${MCP_CLIENTS[key]}.`,
  paths: [],
  instructions: `Le code du serveur est le même pour tous les outils. L'application ajoute le fichier de configuration du client.
Dans le README, section « Installation », expliquer : ${MCP_WHERE[key]}
${describeConfig(MCP_CONFIGS[key])}`,
  scaffold: [MCP_CONFIGS[key]],
});

export const MCP_FORMATS: TargetFormats = {
  claude: mcpFormat('claude'),
  codex: mcpFormat('codex'),
  copilot: mcpFormat('copilot'),
  cursor: mcpFormat('cursor'),
  gemini: mcpFormat('gemini'),
  antigravity: mcpFormat('antigravity'),
  portable: {
    status: 'natif',
    summary: 'Serveur MCP universel, avec une configuration prête pour chaque outil (dossier config/).',
    paths: [],
    instructions: `Le code du serveur est le même pour tous les outils. L'application ajoute un fichier de configuration par client
dans config/. Dans le README, la ligne 4 de « Installation » est « 4. Configuration : voir le paragraphe de votre
outil ci-dessous. », puis un paragraphe par outil, sans en oublier aucun :
${Object.values(MCP_WHERE)
  .map((w) => `- ${w}`)
  .join('\n')}
${Object.values(MCP_CONFIGS).map(describeConfig).join('\n')}`,
    scaffold: Object.values(MCP_CONFIGS),
  },
};
