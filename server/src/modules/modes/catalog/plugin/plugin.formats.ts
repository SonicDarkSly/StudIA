import type { PluginRules, TargetFormats } from '../../domain/ai-target.js';
import type { SkillRules, TargetKey } from '../../domain/ai-target.js';
import { SKILL_RULES } from '../../utils/agent-skills.js';

const AGENT_PLUGIN_MANIFEST = `<nom>/plugin.json (standard Agent Plugins 1.0.0) :
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "<nom>",
  "version": "1.0.0",
  "description": "Ce que contient le plugin, en une phrase"
}
Champs permis : $schema et name (obligatoires), version, description, author { name }, homepage, repository, license,
keywords. Jamais hooks, agents, commands ni mcpServers dans plugin.json.`;

const PLUGIN_SKILL = `<nom>/skills/<skill>/SKILL.md : une skill par dossier, exactement sous cette forme (en-tête entre
deux lignes ---, puis le corps ; les étapes vont dans le corps, jamais dans l'en-tête) :
---
name: <skill>
description: Ce que fait la skill. À utiliser quand l'utilisateur … (ses mots)
---
1. Première étape, concrète.
2. Étape suivante…
Format du résultat attendu.`;

const AGENT_PLUGIN_SKILLS = PLUGIN_SKILL;

const AGENT_PLUGIN_MCP = `<nom>/mcp.json, seulement si un serveur MCP est demandé :
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "<serveur>": { "type": "stdio", "command": "npx", "args": ["-y", "<paquet>"] }
  }
}
"type" est obligatoire pour chaque serveur ("stdio" ou "streamable-http" avec "url").`;

const AGENT_PLUGIN_RULES: PluginRules = {
  manifest: 'plugin.json',
  schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  mcpFile: 'mcp.json',
  mcpNeedsType: true,
};

const skillRulesInPlugin = (key: TargetKey): SkillRules => ({
  fields: SKILL_RULES[key].fields,
  toolNames: SKILL_RULES[key].toolNames,
  configFiles: SKILL_RULES[key].configFiles,
});

export const PLUGIN_FORMATS: TargetFormats = {
  claude: {
    status: 'natif',
    summary:
      'Plugin Claude Code : <nom>/.claude-plugin/plugin.json, avec skills/, commands/, agents/, hooks/ et .mcp.json.',
    paths: [],
    instructions: `Structure (ne créer que le manifeste, le README et les dossiers des éléments demandés) :
<nom>/.claude-plugin/plugin.json : le manifeste, seul fichier de ce dossier :
{ "name": "<nom>", "version": "1.0.0", "description": "…", "author": { "name": "…" } }   (seul name est obligatoire)
${PLUGIN_SKILL}
Les skills d'un plugin Claude s'appellent aussi par /<nom>:<skill>.
<nom>/commands/<commande>.md : commandes (en-tête description, argument-hint, allowed-tools ; corps = consigne).
<nom>/agents/<agent>.md : sous-agents (en-tête name, description, tools, model: inherit).
<nom>/hooks/hooks.json : { "hooks": { "PreToolUse": [ { "matcher": "Read|Edit|Write", "hooks": [ { "type": "command",
  "command": "\${CLAUDE_PLUGIN_ROOT}/hooks/<script>.sh" } ] } ] } } ; scripts dans <nom>/hooks/ (code 2 = blocage,
  message sur stderr). \${CLAUDE_PLUGIN_ROOT} désigne le dossier du plugin installé.
<nom>/.mcp.json : { "mcpServers": { "<serveur>": { "command": "npx", "args": ["-y", "<paquet>"] } } }
Installation à décrire dans le README : tester avec claude --plugin-dir ./<nom> ; vérifier avec
claude plugin validate ./<nom> ; partager par une marketplace (fichier .claude-plugin/marketplace.json d'un dépôt :
{ "name": "<marketplace>", "owner": { "name": "…" }, "plugins": [ { "name": "<nom>", "source": "./<nom>" } ] }),
puis /plugin marketplace add <dépôt> et /plugin install <nom>@<marketplace>.`,
    plugin: { manifest: '.claude-plugin/plugin.json', mcpFile: '.mcp.json' },
    skill: skillRulesInPlugin('claude'),
  },
  codex: {
    status: 'natif',
    summary:
      'Plugin au standard Agent Plugins : <nom>/plugin.json, skills/ et mcp.json, installé depuis une marketplace.',
    paths: [],
    instructions: `Structure (ne créer que le manifeste, le README et les dossiers des éléments demandés) :
${AGENT_PLUGIN_MANIFEST}
${AGENT_PLUGIN_SKILLS} Codex les appelle avec $<skill> : une commande demandée devient une skill.
${AGENT_PLUGIN_MCP}
Les sous-agents et hooks ne sont pas portables dans ce format : s'ils sont demandés, le dire dans « À vérifier ».
Installation à décrire dans le README : déclarer le plugin dans une marketplace locale, fichier
.agents/plugins/marketplace.json à la racine du dépôt :
{ "name": "local", "plugins": [ { "name": "<nom>", "source": { "source": "local", "path": "./<nom>" },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" }, "category": "Productivity" } ] }
puis codex plugin marketplace add . et installer le plugin depuis /plugins.`,
    plugin: AGENT_PLUGIN_RULES,
    skill: skillRulesInPlugin('codex'),
  },
  copilot: {
    status: 'natif',
    summary:
      'Plugin au standard Agent Plugins pour Copilot CLI et VS Code : plugin.json, skills/, mcp.json, com.github.copilot/.',
    paths: [],
    instructions: `Structure (ne créer que le manifeste, le README et les dossiers des éléments demandés) :
${AGENT_PLUGIN_MANIFEST}
${AGENT_PLUGIN_SKILLS}
${AGENT_PLUGIN_MCP}
Éléments propres à Copilot, seulement si la demande en contient, dans le dossier <nom>/com.github.copilot/ :
- agents/<agent>.agent.md : en-tête name, description, tools: ['read', 'search'] ;
- hooks/hooks.json : { "version": 1, "hooks": { "preToolUse": [ { "type": "command", "bash": "./hooks/<script>.sh", "timeoutSec": 30 } ] } }
  (tout code de sortie non nul refuse l'action).
Installation à décrire dans le README : copilot plugin install ./<nom> (Copilot CLI ; réinstaller après une
modification) ; dans VS Code, activer chat.plugins.enabled puis « Install a plugin from source ».`,
    plugin: AGENT_PLUGIN_RULES,
    skill: skillRulesInPlugin('copilot'),
  },
  cursor: {
    status: 'natif',
    summary: 'Plugin au standard Agent Plugins (skills et MCP), copié dans ~/.cursor/plugins/local/<nom>/.',
    paths: [],
    instructions: `Structure (ne créer que le manifeste, le README et les dossiers des éléments demandés) :
${AGENT_PLUGIN_MANIFEST}
${AGENT_PLUGIN_SKILLS}
${AGENT_PLUGIN_MCP}
Cursor ne remplace pas \${PLUGIN_ROOT} : ne pas l'utiliser, préférer un serveur lancé par npx.
Sous-agents, règles et hooks ne passent pas par ce format : s'ils sont demandés, le dire dans « À vérifier ».
Installation à décrire dans le README : copier le dossier dans ~/.cursor/plugins/local/<nom>/ (pas de lien
symbolique), puis la commande « Developer: Reload Window ».`,
    plugin: AGENT_PLUGIN_RULES,
    skill: skillRulesInPlugin('cursor'),
  },
  gemini: {
    status: 'natif',
    summary:
      'Extension Gemini CLI : <nom>/gemini-extension.json, GEMINI.md, commands/, skills/, installée par gemini extensions.',
    paths: [],
    instructions: `Structure (ne créer que le manifeste, le README et les dossiers des éléments demandés) :
<nom>/gemini-extension.json :
{ "name": "<nom>", "version": "1.0.0", "description": "…" }
  facultatif : "contextFileName": "GEMINI.md" (seulement si GEMINI.md est livré), "excludeTools": ["run_shell_command(rm -rf)"],
  "mcpServers": { "<serveur>": { "command": "npx", "args": ["-y", "<paquet>"] } }
<nom>/README.md (obligatoire) : à quoi sert l'extension, ses éléments, l'installation.
<nom>/GEMINI.md : contexte ajouté à chaque session, seulement si la demande en a besoin (il ne remplace pas le README).
Les dossiers ci-dessous seulement pour les éléments que la demande cite (une skill demandée : pas de commands/).
<nom>/commands/<commande>.toml : description = "…" et prompt = """…""" ({{args}}, !{commande}, @{fichier}) ;
  sous-dossier = espace de noms (git/commit.toml donne /git:commit).
${PLUGIN_SKILL}
<nom>/agents/<agent>.md : sous-agents (en-tête name, description).
<nom>/hooks/hooks.json : { "hooks": { "BeforeTool": [ { "matcher": "read_file", "hooks": [ { "type": "command",
  "command": "\${extensionPath}/hooks/<script>.sh" } ] } ] } } ; sortie standard en JSON uniquement.
Installation à décrire dans le README : gemini extensions link ./<nom> pendant le développement, gemini extensions
install <url du dépôt> pour l'installer ailleurs.`,
    plugin: { manifest: 'gemini-extension.json' },
    skill: skillRulesInPlugin('gemini'),
  },
  antigravity: {
    status: 'natif',
    summary:
      'Plugin Antigravity : <nom>/plugin.json, skills/, agents/, rules/, hooks.json et mcp_config.json.',
    paths: [],
    instructions: `Structure (ne créer que le manifeste, le README et les dossiers des éléments demandés) :
<nom>/plugin.json :
{ "$schema": "https://antigravity.google/schemas/v1/plugin.json", "name": "<nom>", "version": "1.0.0", "description": "…" }
${PLUGIN_SKILL}
Les skills s'appellent aussi par /<skill>.
<nom>/agents/<agent>.md : sous-agents (en-tête name, description, model: inherit).
<nom>/rules/<règle>.md : règles ; en-tête trigger: always_on, model_decision (avec description), glob (avec globs) ou manual.
<nom>/hooks.json : groupes nommés, sans clé "hooks" englobante :
{ "<groupe>": { "PreToolUse": [ { "matcher": "view_file", "hooks": [ { "type": "command", "command": "./hooks/<script>.sh", "timeout": 10 } ] } ] } }
  le script répond en JSON sur stdout, { "decision": "deny" } pour refuser.
<nom>/mcp_config.json : { "mcpServers": { "<serveur>": { "command": "npx", "args": ["-y", "<paquet>"] } } }
Installation à décrire dans le README : agy plugin validate --strict ./<nom>, puis agy plugin install ./<nom>.`,
    plugin: {
      manifest: 'plugin.json',
      schema: 'https://antigravity.google/schemas/v1/plugin.json',
      mcpFile: 'mcp_config.json',
    },
    skill: skillRulesInPlugin('antigravity'),
  },
  portable: {
    status: 'natif',
    summary: 'Standard Agent Plugins 1.0.0 (skills et MCP) : lu par Codex, Copilot, Cursor et VS Code.',
    paths: [],
    instructions: `Uniquement le standard portable, sans élément propre à un outil :
${AGENT_PLUGIN_MANIFEST}
${AGENT_PLUGIN_SKILLS}
${AGENT_PLUGIN_MCP}
Ne pas utiliser \${PLUGIN_ROOT} (Cursor ne le remplace pas) : préférer un serveur lancé par npx.
Dans « À vérifier », écrire exactement cette ligne :
- Format lu par Codex, Copilot, Cursor et VS Code ; Claude Code (.claude-plugin/), Gemini CLI (gemini-extension.json) et Antigravity (schéma Google) demandent leur propre manifeste.
Installation à décrire dans le README : Copilot CLI (copilot plugin install ./<nom>), Cursor (copie dans
~/.cursor/plugins/local/<nom>/), Codex (marketplace .agents/plugins/marketplace.json puis /plugins).`,
    plugin: AGENT_PLUGIN_RULES,
    skill: skillRulesInPlugin('portable'),
  },
};
