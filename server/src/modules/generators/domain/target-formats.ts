import type { TargetFormat, TargetKey } from './ai-target.js';
import type { ScaffoldFile } from './generator.js';

type Formats = Record<TargetKey, TargetFormat>;

const SKILL_COMMON = `Format Agent Skills (standard ouvert). SKILL.md commence exactement ainsi, la ligne --- en
toute première ligne, sans bloc \`\`\` autour de l'en-tête ni du corps :
---
name: nom-de-la-skill
description: Ce que la skill produit et quand l'utiliser, avec les mots de l'utilisateur.
---
name : identique au nom du dossier, minuscules, chiffres et tirets, 64 caractères max ; description : 1 024
caractères max. Tous les champs de l'en-tête sont entre ces deux lignes ---, aucun après le corps. Puis le corps en
Markdown. Fichiers d'appui dans le même dossier : references/, assets/, et scripts/ seulement si indispensable.`;

const CLAUDE_TOOLS = [
  'Agent',
  'Artifact',
  'AskUserQuestion',
  'Bash',
  'CronCreate',
  'CronDelete',
  'CronList',
  'Edit',
  'EndConversation',
  'EnterPlanMode',
  'EnterWorktree',
  'ExitPlanMode',
  'ExitWorktree',
  'Glob',
  'Grep',
  'ListAgents',
  'ListMcpResourcesTool',
  'LSP',
  'Monitor',
  'NotebookEdit',
  'PowerShell',
  'PushNotification',
  'Read',
  'ReadMcpResourceTool',
  'RemoteTrigger',
  'ReportFindings',
  'ScheduleWakeup',
  'SendFeedback',
  'SendMessage',
  'SendUserFile',
  'ShareOnboardingGuide',
  'Skill',
  'SubagentHandback',
  'TaskCreate',
  'TaskGet',
  'TaskList',
  'TaskStop',
  'TaskUpdate',
  'TodoWrite',
  'ToolSearch',
  'WaitForMcpServers',
  'WebFetch',
  'WebSearch',
  'Workflow',
  'Write',
];

const SKILL: Formats = {
  claude: {
    status: 'natif',
    summary:
      'Dossier .claude/skills/<nom>/ : Claude Code charge la skill quand la demande correspond, ou via /nom.',
    paths: ['.claude/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .claude/skills/<nom>/SKILL.md
Champs facultatifs reconnus par Claude Code : argument-hint (l'argument se lit dans le corps avec $ARGUMENTS),
disable-model-invocation (true = seulement via /nom, uniquement si l'utilisateur le demande), allowed-tools (outils
autorisés sans confirmation).
allowed-tools s'écrit sur une ligne, séparé par des espaces, avec les vrais noms d'outils de Claude Code : Read,
Write, Edit, Glob, Grep, Bash(commande *), WebFetch. Exemple : allowed-tools: Read Write Bash(git status *)
Si la skill a un script (rare), il se cite avec \${CLAUDE_SKILL_DIR} (dossier de la skill) :
« Lancer \`bash \${CLAUDE_SKILL_DIR}/scripts/<script>.sh <fichier>\` », et s'autorise par
allowed-tools: Bash(bash \${CLAUDE_SKILL_DIR}/scripts/<script>.sh *)`,
    skill: {
      scriptPrefix: '${CLAUDE_SKILL_DIR}/',
      fields: [
        'name',
        'description',
        'when_to_use',
        'argument-hint',
        'arguments',
        'disable-model-invocation',
        'user-invocable',
        'allowed-tools',
        'disallowed-tools',
        'model',
        'effort',
        'context',
        'agent',
        'background',
        'hooks',
        'paths',
        'shell',
        'metadata',
        'license',
        'compatibility',
      ],
      toolNames: CLAUDE_TOOLS,
    },
  },
  codex: {
    status: 'natif',
    summary: 'Dossier .agents/skills/<nom>/ : Codex la déclenche seul ou avec $nom.',
    paths: ['.agents/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .agents/skills/<nom>/SKILL.md (Codex lit .agents/skills du dossier courant jusqu'à la racine du dépôt).
N'utiliser que name et description dans l'en-tête. L'utilisateur peut l'appeler explicitement avec $nom.
Seulement si l'utilisateur demande qu'elle ne se déclenche que sur appel ($nom), ajouter agents/openai.yaml dans le
dossier de la skill :
policy:
  allow_implicit_invocation: false
Si la skill a un script (rare), il se cite par son chemin depuis la racine de la skill : « Lancer \`bash scripts/<script>.sh\` ».`,
    skill: { fields: ['name', 'description'], configFiles: ['agents/openai.yaml'] },
  },
  copilot: {
    status: 'natif',
    summary:
      'Dossier .github/skills/<nom>/ : lu par Copilot dans VS Code, en ligne de commande et sur GitHub.',
    paths: ['.github/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .github/skills/<nom>/SKILL.md
Attention : un name invalide fait ignorer la skill sans message d'erreur. Champs facultatifs : argument-hint,
user-invocable, disable-model-invocation (uniquement si l'utilisateur veut un appel manuel). Pas de champ
allowed-tools.
Les fichiers de la skill (références, script éventuel) se citent par un chemin relatif à SKILL.md : [nom du script](./scripts/<script>.sh).`,
    skill: {
      fields: [
        'name',
        'description',
        'argument-hint',
        'user-invocable',
        'disable-model-invocation',
        'context',
      ],
    },
  },
  cursor: {
    status: 'natif',
    summary: 'Dossier .cursor/skills/<nom>/ : Cursor la charge quand la demande correspond.',
    paths: ['.cursor/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .cursor/skills/<nom>/SKILL.md
Champs facultatifs : paths, liste de motifs de fichiers (ex. ["src/**/*.tsx"]) pour limiter le déclenchement ;
disable-model-invocation (true = seulement via /nom, uniquement si l'utilisateur le demande). Pas de champ
allowed-tools.
Si la skill a un script (rare), il se cite par son chemin depuis la racine de la skill : « Lancer \`bash scripts/<script>.sh\` ».`,
    skill: {
      fields: [
        'name',
        'description',
        'paths',
        'globs',
        'disable-model-invocation',
        'icon',
        'color',
        'metadata',
      ],
    },
  },
  gemini: {
    status: 'natif',
    summary: 'Dossier .gemini/skills/<nom>/ : Gemini CLI la charge quand la demande correspond.',
    paths: ['.gemini/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .gemini/skills/<nom>/SKILL.md. N'utiliser que name et description dans l'en-tête.
Si la skill a un script (rare), il se cite par son chemin complet depuis le projet :
« Lancer \`bash .gemini/skills/<nom>/scripts/<script>.sh\` ».`,
    skill: { fields: ['name', 'description'], scriptPrefix: '{{dossier}}' },
  },
  portable: {
    status: 'natif',
    summary:
      'Dossier .agents/skills/<nom>/ : lu par Codex, Copilot, Cursor et Gemini CLI. Pour Claude, copier le dossier dans .claude/skills/.',
    paths: ['.agents/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .agents/skills/<nom>/SKILL.md. N'utiliser que les champs du standard (name, description, et si utile
license, compatibility, metadata). Aucune syntaxe propre à un outil dans le corps.
Si la skill a un script (rare), il se cite par son chemin depuis la racine de la skill : « Lancer \`bash scripts/<script>.sh\` ».
Dans « À vérifier », rappeler que Claude Code ne lit que .claude/skills/ : y copier le même dossier.`,
    skill: { fields: ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'] },
  },
};

const SKILL_AS_COMMAND = (
  dir: string,
  how: string,
) => `Cet outil n'a pas de commande slash de projet : livrer à la place une skill
invocable, qui joue le même rôle.
Emplacement : ${dir}/<nom>/SKILL.md, en-tête YAML avec name (identique au dossier) et description.
Le corps est la consigne de la commande. ${how}`;

const COMMAND: Formats = {
  claude: {
    status: 'natif',
    summary: 'Fichier .claude/commands/<nom>.md, lancé en tapant /nom dans Claude Code.',
    paths: ['.claude/commands/'],
    instructions: `Emplacement : .claude/commands/<nom>.md
En-tête YAML :
---
description: ce que fait la commande, en une phrase (affichée dans le menu /)
argument-hint: [ce que l'utilisateur peut ajouter après /nom] (facultatif)
allowed-tools: outils autorisés, par ex. Bash(npm run typecheck:*), Read, Grep (facultatif, le plus restreint possible)
---
Corps : la consigne. $ARGUMENTS reçoit tout le texte tapé après la commande ; $1, $2… les arguments séparés.
Une ligne qui commence par ! suivi d'une commande entre accents graves exécute cette commande avant l'envoi
(l'autoriser dans allowed-tools).`,
  },
  codex: {
    status: 'adapte',
    summary:
      'Codex a remplacé ses commandes par les skills : StudIA livre une skill .agents/skills/<nom>/, appelée avec $nom.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND('.agents/skills', "L'utilisateur la lance avec $nom suivi de son texte."),
  },
  copilot: {
    status: 'natif',
    summary:
      'Fichier .github/prompts/<nom>.prompt.md, lancé avec /nom dans le chat de VS Code (pas dans Copilot CLI).',
    paths: ['.github/prompts/'],
    instructions: `Emplacement : .github/prompts/<nom>.prompt.md
En-tête YAML (tous facultatifs) :
---
description: ce que fait la commande, en une phrase
argument-hint: ce que l'utilisateur peut ajouter
agent: agent
tools: ['search', 'edit', 'runCommands']
---
Corps : la consigne. Variables : \${input:nom:indice} (demande une valeur), \${selection} (texte sélectionné),
\${file} (fichier ouvert). Préciser dans « À vérifier » que ces fichiers ne fonctionnent que dans VS Code et Visual Studio.`,
  },
  cursor: {
    status: 'natif',
    summary: 'Fichier .cursor/commands/<nom>.md (Markdown simple), lancé avec /nom dans le chat de Cursor.',
    paths: ['.cursor/commands/'],
    instructions: `Emplacement : .cursor/commands/<nom>.md
Markdown simple, sans en-tête YAML : un titre, puis la consigne. Le texte tapé après /nom est ajouté à la fin.
Signaler dans « À vérifier » que Cursor propose désormais de convertir les commandes en skills (/migrate-to-skills).`,
  },
  gemini: {
    status: 'natif',
    summary: 'Fichier .gemini/commands/<nom>.toml, lancé avec /nom dans Gemini CLI.',
    paths: ['.gemini/commands/'],
    instructions: `Emplacement : .gemini/commands/<nom>.toml (un sous-dossier crée un espace de noms : git/commit.toml devient /git:commit).
Format TOML :
description = "Ce que fait la commande, en une phrase"
prompt = """
La consigne. {{args}} est remplacé par le texte tapé après la commande.
!{commande shell} insère la sortie d'une commande ; @{chemin} insère le contenu d'un fichier.
"""
Le fichier doit être du TOML valide (chaînes multilignes entre triples guillemets).`,
  },
  portable: {
    status: 'adapte',
    summary:
      'Pas de format de commande commun : StudIA livre une skill .agents/skills/<nom>/, appelable dans la plupart des outils.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND(
      '.agents/skills',
      'Rappeler dans « À vérifier » comment l’appeler : $nom (Codex), /nom (Copilot, Cursor, Gemini), et copier le dossier dans .claude/skills/ pour Claude.',
    ),
  },
};

const AGENT: Formats = {
  claude: {
    status: 'natif',
    summary:
      'Fichier .claude/agents/<nom>.md : Claude Code lui délègue les tâches qui correspondent à sa description.',
    paths: ['.claude/agents/'],
    instructions: `Emplacement : .claude/agents/<nom>.md
En-tête YAML :
---
name: nom-en-minuscules-avec-tirets (obligatoire)
description: QUAND déléguer à ce sous-agent, déclencheurs concrets (obligatoire)
tools: Read, Grep, Glob (liste minimale ; omettre pour hériter de tous les outils)
model: inherit
---
Corps : le prompt système du sous-agent. Sans name ou sans description, le fichier est ignoré sans message.`,
  },
  codex: {
    status: 'natif',
    summary: 'Fichier .codex/agents/<nom>.toml : un sous-agent que Codex peut lancer.',
    paths: ['.codex/agents/'],
    instructions: `Emplacement : .codex/agents/<nom>.toml
Format TOML, trois clés obligatoires :
name = "nom-du-sous-agent"
description = "Quand l'utiliser, en une phrase"
developer_instructions = """
Le prompt système complet du sous-agent.
"""
Clés facultatives : model, model_reasoning_effort ("low", "medium", "high").
Le fichier doit être du TOML valide.`,
  },
  copilot: {
    status: 'natif',
    summary:
      'Fichier .github/agents/<nom>.agent.md : un agent personnalisé choisi dans le menu des agents de Copilot.',
    paths: ['.github/agents/'],
    instructions: `Emplacement : .github/agents/<nom>.agent.md
En-tête YAML :
---
name: nom-de-l-agent
description: ce que fait l'agent et quand le choisir (obligatoire)
tools: ['read', 'search']   (liste minimale ; omettre pour tous les outils)
---
Corps : les instructions de l'agent (30 000 caractères maximum).`,
  },
  cursor: {
    status: 'natif',
    summary: 'Fichier .cursor/agents/<nom>.md : un sous-agent que Cursor lance pour une tâche précise.',
    paths: ['.cursor/agents/'],
    instructions: `Emplacement : .cursor/agents/<nom>.md
En-tête YAML :
---
name: nom-du-sous-agent
description: quand l'utiliser
model: inherit
readonly: true   (true si l'agent n'a pas à modifier de fichiers)
---
Corps : le prompt système du sous-agent.`,
  },
  gemini: {
    status: 'natif',
    summary: 'Fichier .gemini/agents/<nom>.md : un sous-agent que Gemini CLI peut appeler.',
    paths: ['.gemini/agents/'],
    instructions: `Emplacement : .gemini/agents/<nom>.md
En-tête YAML :
---
name: nom_du_sous_agent (minuscules, tirets ou soulignés ; obligatoire)
description: quand l'utiliser (obligatoire)
tools: [read_file, list_directory]   (facultatif, liste minimale)
---
Corps : le prompt système du sous-agent.`,
  },
  portable: {
    status: 'adapte',
    summary:
      'Format Claude (.claude/agents/<nom>.md), également lu par Copilot et Cursor. Codex et Gemini ont leur propre format.',
    paths: ['.claude/agents/'],
    instructions: `Emplacement : .claude/agents/<nom>.md (ce dossier est aussi lu par GitHub Copilot et Cursor).
En-tête YAML limité aux champs communs :
---
name: nom-en-minuscules-avec-tirets
description: quand déléguer à ce sous-agent
---
Corps : le prompt système. Signaler dans « À vérifier » que Codex (.codex/agents/*.toml) et Gemini CLI (.gemini/agents/)
demandent un autre format.`,
  },
};

const MEMORY_STRUCTURE = `STRUCTURE RECOMMANDÉE (titres en français) :
# <Projet> : consignes pour les agents
Une phrase : ce que fait le projet et pour qui.
## Principes directeurs (ce à quoi l'utilisateur tient), avec le pourquoi
## Stack et architecture : versions, ports, dossiers clés et leur rôle
## Commandes : installation, développement, vérification (typecheck, tests), lanceurs
## Conventions : code, interface, commits, langue
## Pièges connus : ce qui a déjà cassé et comment l'éviter`;

const CLAUDEMD: Formats = {
  claude: {
    status: 'natif',
    summary: 'Fichier CLAUDE.md à la racine du projet, lu par Claude Code à chaque session.',
    paths: ['CLAUDE.md'],
    instructions: `Fichier : CLAUDE.md à la racine du projet.\n${MEMORY_STRUCTURE}`,
  },
  codex: {
    status: 'natif',
    summary: 'Fichier AGENTS.md à la racine, lu par Codex à chaque session (32 Kio maximum par défaut).',
    paths: ['AGENTS.md'],
    instructions: `Fichier : AGENTS.md à la racine du projet. Rester sous 32 Kio (limite de lecture par défaut de Codex).\n${MEMORY_STRUCTURE}`,
  },
  copilot: {
    status: 'natif',
    summary: 'Fichier .github/copilot-instructions.md, ajouté à chaque demande faite à Copilot.',
    paths: ['.github/copilot-instructions.md'],
    instructions: `Fichier : .github/copilot-instructions.md (Markdown simple, sans en-tête).
Copilot l'ajoute à chaque demande : rester court et concret.\n${MEMORY_STRUCTURE}`,
  },
  cursor: {
    status: 'natif',
    summary:
      'Règle .cursor/rules/projet.mdc appliquée à toutes les conversations (les .md simples y sont ignorés).',
    paths: ['.cursor/rules/'],
    instructions: `Fichier : .cursor/rules/projet.mdc (extension .mdc obligatoire, un .md serait ignoré).
En-tête YAML :
---
description: Consignes générales du projet
alwaysApply: true
---
Puis le contenu en Markdown.\n${MEMORY_STRUCTURE}`,
  },
  gemini: {
    status: 'natif',
    summary: 'Fichier GEMINI.md à la racine, lu par Gemini CLI à chaque session.',
    paths: ['GEMINI.md'],
    instructions: `Fichier : GEMINI.md à la racine du projet.\n${MEMORY_STRUCTURE}`,
  },
  portable: {
    status: 'natif',
    summary:
      'Fichier AGENTS.md, lu par Codex, Copilot et Cursor ; Claude Code le lit s’il n’y a pas de CLAUDE.md.',
    paths: ['AGENTS.md'],
    instructions: `Fichier : AGENTS.md à la racine du projet, rédigé de façon neutre (aucune syntaxe propre à un outil).
Dans « À vérifier », rappeler : Claude Code ne le lit que si aucun CLAUDE.md n'existe ; Gemini CLI le lit si
settings.json contient "context": { "fileName": ["AGENTS.md", "GEMINI.md"] }.\n${MEMORY_STRUCTURE}`,
  },
};

const HOOK_SCRIPT_RULES = `Scripts bash : #!/usr/bin/env bash puis set -euo pipefail, rapides, chemins entre guillemets.
Ils reçoivent un JSON sur l'entrée standard : le lire avec jq. Expliquer dans le texte comment les rendre
exécutables (chmod +x) et comment fusionner le fichier de configuration avec l'existant.`;

const HOOKS: Formats = {
  claude: {
    status: 'natif',
    summary: 'Clé "hooks" de .claude/settings.json + scripts dans .claude/hooks/.',
    paths: ['.claude/'],
    instructions: `Fichiers : .claude/settings.json (uniquement la clé "hooks") et .claude/hooks/<nom>.sh
Format :
{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "\\"$CLAUDE_PROJECT_DIR\\"/.claude/hooks/<nom>.sh" } ] } ] } }
Événements : PreToolUse, PostToolUse (matcher = nom d'outil : Bash, Edit, Write, Read… ou « Edit|Write »),
UserPromptSubmit, Stop, SubagentStop, SessionStart, SessionEnd, PreCompact, Notification.
Entrée : tool_name, tool_input.command, tool_input.file_path…
Sortie : code 0 = on continue ; code 2 = on bloque et le message écrit sur stderr est renvoyé à Claude
(le code 1 ne bloque pas).
${HOOK_SCRIPT_RULES}`,
  },
  codex: {
    status: 'natif',
    summary:
      'Fichier .codex/hooks.json + scripts dans .codex/hooks/ (chaque hook doit être approuvé avec /hooks).',
    paths: ['.codex/'],
    instructions: `Fichiers : .codex/hooks.json et .codex/hooks/<nom>.sh
Format (même structure que Claude Code, timeout en secondes) :
{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": ".codex/hooks/<nom>.sh", "timeout": 30 } ] } ] } }
Événements : PreToolUse, PostToolUse, PermissionRequest, UserPromptSubmit, Stop, SubagentStart, SubagentStop,
SessionStart, SessionEnd, PreCompact, PostCompact.
Sortie : code 0 = on continue ; code 2 = on bloque, le message de stderr est renvoyé au modèle.
Rappeler dans « À vérifier » : les hooks d'un projet ne se chargent que si le projet est approuvé, et chaque hook
doit être validé avec la commande /hooks.
${HOOK_SCRIPT_RULES}`,
  },
  copilot: {
    status: 'natif',
    summary: 'Fichier .github/hooks/<nom>.json + script, pour Copilot CLI et l’agent de GitHub.',
    paths: ['.github/hooks/'],
    instructions: `Fichiers : .github/hooks/<nom>.json et .github/hooks/<nom>.sh
Format :
{ "version": 1, "hooks": { "preToolUse": [ { "type": "command", "bash": "./.github/hooks/<nom>.sh", "timeoutSec": 30 } ] } }
Événements (camelCase) : sessionStart, sessionEnd, userPromptSubmitted, preToolUse, postToolUse,
postToolUseFailure, subagentStart, subagentStop, agentStop, errorOccurred.
Attention : dans preToolUse, tout code de sortie différent de 0 refuse l'action ; un dépassement de délai la laisse passer.
${HOOK_SCRIPT_RULES}`,
  },
  cursor: {
    status: 'natif',
    summary: 'Fichier .cursor/hooks.json + scripts dans .cursor/hooks/.',
    paths: ['.cursor/'],
    instructions: `Fichiers : .cursor/hooks.json et .cursor/hooks/<nom>.sh
Format :
{ "version": 1, "hooks": { "beforeShellExecution": [ { "command": ".cursor/hooks/<nom>.sh" } ] } }
Événements : sessionStart, beforeSubmitPrompt, preToolUse, postToolUse, beforeShellExecution, beforeMCPExecution,
beforeReadFile, afterFileEdit, stop, subagentStop, preCompact.
Sortie : code 0 = on lit le JSON écrit sur stdout ; code 2 = refus. JSON possible :
{ "permission": "deny", "user_message": "…", "agent_message": "…" }.
${HOOK_SCRIPT_RULES}`,
  },
  gemini: {
    status: 'natif',
    summary: 'Clé "hooks" de .gemini/settings.json + scripts dans .gemini/hooks/.',
    paths: ['.gemini/'],
    instructions: `Fichiers : .gemini/settings.json (uniquement la clé "hooks") et .gemini/hooks/<nom>.sh
Format (timeout en millisecondes) :
{ "hooks": { "BeforeTool": [ { "matcher": "run_shell_command", "hooks": [ { "type": "command", "command": ".gemini/hooks/<nom>.sh", "timeout": 30000 } ] } ] } }
Événements : BeforeTool, AfterTool, BeforeAgent, AfterAgent, BeforeModel, AfterModel, SessionStart, SessionEnd,
Notification, PreCompress. Outils courants : run_shell_command, write_file, replace, read_file.
Sortie : stdout ne doit contenir QUE du JSON ; code 2 = blocage ; JSON possible : { "decision": "deny", "reason": "…" }.
${HOOK_SCRIPT_RULES}`,
  },
  portable: {
    status: 'indisponible',
    summary: 'Chaque outil a son propre format de hooks : choisis une IA précise.',
    paths: [],
    instructions: '',
  },
};

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
};
const mcpFormat = (key: Exclude<TargetKey, 'portable'>): TargetFormat => ({
  status: 'natif',
  summary: `Serveur MCP universel ; configuration prête pour ${key === 'copilot' ? 'VS Code' : key === 'claude' ? 'Claude Code et Claude Desktop' : key === 'codex' ? 'Codex' : key === 'cursor' ? 'Cursor' : 'Gemini CLI'}.`,
  paths: [],
  instructions: `Le code du serveur est le même pour tous les outils. L'application ajoute le fichier de configuration du client.
Dans le README, section « Installation », expliquer : ${MCP_WHERE[key]}`,
  scaffold: [MCP_CONFIGS[key]],
});

const MCP: Formats = {
  claude: mcpFormat('claude'),
  codex: mcpFormat('codex'),
  copilot: mcpFormat('copilot'),
  cursor: mcpFormat('cursor'),
  gemini: mcpFormat('gemini'),
  portable: {
    status: 'natif',
    summary: 'Serveur MCP universel, avec une configuration prête pour chaque outil (dossier config/).',
    paths: [],
    instructions: `Le code du serveur est le même pour tous les outils. L'application ajoute un fichier de configuration par client
dans config/. Dans le README, section « Installation », un paragraphe par outil :
${Object.values(MCP_WHERE)
  .map((w) => `- ${w}`)
  .join('\n')}`,
    scaffold: Object.values(MCP_CONFIGS),
  },
};

const CHAT_FORMAT: TargetFormat = {
  status: 'natif',
  summary: 'Conversation libre : les exemples et chemins cités tiennent compte de l’IA choisie.',
  paths: [],
  instructions: '',
};
const CHAT: Formats = {
  claude: CHAT_FORMAT,
  codex: CHAT_FORMAT,
  copilot: CHAT_FORMAT,
  cursor: CHAT_FORMAT,
  gemini: CHAT_FORMAT,
  portable: CHAT_FORMAT,
};

export const TARGET_FORMATS: Record<string, Formats> = {
  chat: CHAT,
  skill: SKILL,
  mcp: MCP,
  command: COMMAND,
  agent: AGENT,
  claudemd: CLAUDEMD,
  hooks: HOOKS,
};
