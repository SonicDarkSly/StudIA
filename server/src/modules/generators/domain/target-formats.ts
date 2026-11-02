import type { PluginRules, TargetFormat, TargetKey } from './ai-target.js';
import type { GeneratorKey, ScaffoldFile } from './generator.js';

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
  antigravity: {
    status: 'natif',
    summary:
      'Dossier .agents/skills/<nom>/ : Antigravity CLI la charge quand la demande correspond, ou avec /nom.',
    paths: ['.agents/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .agents/skills/<nom>/SKILL.md (Antigravity ne lit ni .gemini/skills/ ni .claude/). N'utiliser que name
et description dans l'en-tête. La skill s'appelle aussi en tapant /nom.
Si la skill a un script (rare), il se cite par son chemin complet depuis le projet :
« Lancer \`bash .agents/skills/<nom>/scripts/<script>.sh\` ».`,
    skill: { fields: ['name', 'description'], scriptPrefix: '{{dossier}}' },
  },
  portable: {
    status: 'natif',
    summary:
      'Dossier .agents/skills/<nom>/ : lu par Codex, Copilot, Cursor, Gemini CLI et Antigravity. Pour Claude, copier le dossier dans .claude/skills/.',
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
Le corps est la consigne de la commande. ${how}
Un seul fichier : SKILL.md. Ni script, ni README, ni package.json, ni licence : l'agent lance lui-même les
commandes décrites dans la consigne. Les explications pour l'utilisateur restent hors du fichier.

Exemple complet (${dir}/resume-diff/SKILL.md) :
---
name: resume-diff
description: Résume les modifications en cours avant un commit, quand l'utilisateur demande un résumé de ses changements
---
1. Lance git diff --stat, puis lis le détail (git diff), limité au chemin donné par l'utilisateur s'il y en a un.
2. Regroupe les modifications par intention (correctif, nouveauté, nettoyage).
3. Réponds par une liste courte : intention, fichiers concernés, point à vérifier avant le commit.
Ne modifie aucun fichier.`;

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
allowed-tools: outils permis sans demande, le plus restreint possible, par ex. Read, Grep, Bash(npm run typecheck *)
---
Dans allowed-tools, Bash(npm run typecheck *) permet la commande avec ou sans arguments ; sans *, seule la
commande exacte est permise.
Corps : la consigne. $ARGUMENTS reçoit tout le texte tapé après la commande ; $0 le premier mot, $1 le deuxième.
Sans $ARGUMENTS dans la consigne, ce texte est ajouté à la fin (ARGUMENTS: …).
Facultatif : !\`commande\` (point d'exclamation collé à la commande entre accents graves) insère la sortie de
la commande avant l'envoi. Elle doit être permise dans allowed-tools, et si elle échoue, toute la commande slash
est annulée : la réserver aux commandes d'information qui réussissent toujours (git status, git diff, git log).
Une vérification qui peut échouer (typecheck, tests, lint, build) est lancée par l'agent : la consigne le lui
demande, et ses commandes restent permises dans allowed-tools.
Le fichier ne contient que l'en-tête et la consigne : les explications pour l'utilisateur restent hors du fichier.

Exemple complet (.claude/commands/resume-diff.md) :
---
description: Résume les modifications en cours avant un commit
argument-hint: [dossier ou fichier à cibler]
allowed-tools: Read, Bash(git diff *)
---
Modifications en cours : !\`git diff --stat\`

1. Lis le détail des modifications (git diff), limité à $ARGUMENTS si un chemin est donné.
2. Regroupe-les par intention (correctif, nouveauté, nettoyage).
3. Réponds par une liste courte : intention, fichiers concernés, point à vérifier avant le commit.
Ne modifie aucun fichier.`,
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
tools: ['search', 'read', 'edit', 'execute']
---
Outils : search (chercher), read (lire), edit (modifier), execute (lancer des commandes dans le terminal) ;
n'en garder que le nécessaire.
Corps : la consigne. Variables : \${input:nom:indice} (demande une valeur), \${selection} (texte sélectionné) ;
#file:chemin joint un fichier. Préciser dans « À vérifier » que ces fichiers ne fonctionnent que dans VS Code et Visual Studio.`,
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
La consigne.
"""
{{args}} est remplacé par le texte tapé après la commande : le placer là où ce texte sert (sans {{args}}, il est
ajouté à la fin ; ne pas l'écrire si la commande n'en a pas besoin).
!{commande shell} insère la sortie d'une commande, après confirmation de l'utilisateur : la consigne travaille
alors sur cette sortie et ne demande pas de relancer la commande. @{chemin} insère le contenu d'un fichier.
Le fichier doit être du TOML valide (chaînes multilignes entre triples guillemets) : rien après le """ final.`,
  },
  antigravity: {
    status: 'adapte',
    summary:
      'Antigravity transforme chaque skill en commande : StudIA livre une skill .agents/skills/<nom>/, appelée avec /nom.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND('.agents/skills', "L'utilisateur la lance avec /nom suivi de son texte."),
  },
  portable: {
    status: 'adapte',
    summary:
      'Pas de format de commande commun : StudIA livre une skill .agents/skills/<nom>/, appelable dans la plupart des outils.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND(
      '.agents/skills',
      'Rappeler dans « À vérifier » comment l’appeler : $nom (Codex), /nom (Copilot, Cursor, Gemini, Antigravity), et copier le dossier dans .claude/skills/ pour Claude.',
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
  antigravity: {
    status: 'natif',
    summary: 'Fichier .agents/agents/<nom>.md : un sous-agent qu’Antigravity CLI peut appeler.',
    paths: ['.agents/agents/'],
    instructions: `Emplacement : .agents/agents/<nom>.md
En-tête YAML :
---
name: nom-du-sous-agent (obligatoire)
description: quand l'utiliser (obligatoire)
model: inherit
---
Facultatif : commandExecutionPolicy: off pour un sous-agent qui ne doit lancer aucune commande ; tools: [view_file,
grep_search] pour restreindre les outils (un nom d'outil mal écrit bloque le sous-agent : en cas de doute, ne pas
mettre tools).
Corps : le prompt système du sous-agent.`,
  },
  portable: {
    status: 'adapte',
    summary:
      'Format Claude (.claude/agents/<nom>.md), également lu par Copilot et Cursor. Codex, Gemini CLI et Antigravity ont leur propre format.',
    paths: ['.claude/agents/'],
    instructions: `Emplacement : .claude/agents/<nom>.md (ce dossier est aussi lu par GitHub Copilot et Cursor).
En-tête YAML limité aux champs communs :
---
name: nom-en-minuscules-avec-tirets
description: quand déléguer à ce sous-agent
---
Corps : le prompt système. Dans « À vérifier », écrire exactement cette ligne :
- Lu par Claude Code, GitHub Copilot et Cursor ; Codex (.codex/agents/*.toml), Gemini CLI (.gemini/agents/) et Antigravity (.agents/agents/) demandent leur propre fichier.`,
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
  antigravity: {
    status: 'natif',
    summary:
      'Fichier AGENTS.md à la racine, lu par Antigravity CLI à chaque session (GEMINI.md aussi accepté).',
    paths: ['AGENTS.md'],
    instructions: `Fichier : AGENTS.md à la racine du projet (Markdown simple, sans en-tête YAML).\n${MEMORY_STRUCTURE}`,
  },
  portable: {
    status: 'natif',
    summary:
      'Fichier AGENTS.md, lu par Codex, Copilot, Cursor et Antigravity ; Claude Code le lit s’il n’y a pas de CLAUDE.md.',
    paths: ['AGENTS.md'],
    instructions: `Fichier : AGENTS.md à la racine du projet, rédigé de façon neutre (aucune syntaxe propre à un outil).
Dans « À vérifier », rappeler : Claude Code ne le lit que si aucun CLAUDE.md n'existe ; Gemini CLI le lit si
settings.json contient "context": { "fileName": ["AGENTS.md", "GEMINI.md"] }.\n${MEMORY_STRUCTURE}`,
  },
};

const HOOK_SCRIPT_RULES = `Livrer TOUJOURS le fichier de configuration ET le ou les scripts : sans configuration, un script n'est jamais lancé.
Scripts bash : #!/usr/bin/env bash puis set -euo pipefail, rapides, chemins entre guillemets.
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
Entrée (JSON sur stdin) : tool_name, tool_input.command (commande Bash), tool_input.file_path…
Lire la commande avec : jq -r '.tool_input.command // empty'
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
Entrée (JSON sur stdin, comme Claude Code) : tool_name, tool_input.command (commande Bash), tool_input.file_path…
Lire la commande avec : jq -r '.tool_input.command // empty'
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
Entrée de preToolUse (JSON sur stdin) : toolName ("bash" pour le terminal), toolArgs (arguments de l'outil, parfois
sous forme de chaîne JSON). Lire la commande avec :
jq -r '(.toolArgs | if type == "string" then fromjson else . end).command // empty'
Refus : code 2 (message sur stderr), ou sur stdout { "permissionDecision": "deny", "permissionDecisionReason": "…" }.
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
Entrée de beforeShellExecution (JSON sur stdin) : command (la commande complète), cwd.
Lire la commande avec : jq -r '.command // empty'
Sortie : écrire sur stdout { "permission": "deny", "user_message": "…", "agent_message": "…" } pour refuser,
{ "permission": "allow" } sinon, puis exit 0 (code 2 = refus aussi ; un autre code ou un plantage laisse passer).
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
Entrée de BeforeTool (JSON sur stdin) : tool_name, tool_input (pour run_shell_command : tool_input.command).
Lire la commande avec : jq -r '.tool_input.command // empty'
Sortie : stdout ne doit contenir QUE du JSON ; refus : { "decision": "deny", "reason": "…" } puis exit 0
(code 2 = blocage aussi, avec le motif sur stderr).
${HOOK_SCRIPT_RULES}`,
  },
  antigravity: {
    status: 'natif',
    summary: 'Fichier .agents/hooks.json + scripts dans .agents/hooks/.',
    paths: ['.agents/'],
    instructions: `Fichiers : .agents/hooks.json et .agents/hooks/<nom>.sh
Format : chaque clé de premier niveau est le nom d'un groupe de hooks, sans clé "hooks" englobante :
{ "<nom-du-groupe>": { "PreToolUse": [ { "matcher": "run_command", "hooks": [ { "type": "command", "command": ".agents/hooks/<nom>.sh", "timeout": 10 } ] } ] } }
Événements : SessionStart, PreToolUse, PostToolUse, PreInvocation, PostInvocation, Stop.
Outils courants pour matcher : run_command (terminal), view_file, grep_search.
Entrée (JSON sur stdin) : toolCall.name (nom de l'outil) et toolCall.args (ses arguments) ; pour run_command la
commande est dans toolCall.args.CommandLine. Lire la commande avec : jq -r '.toolCall.args.CommandLine // empty'
Sortie : uniquement du JSON sur stdout. Dans PreToolUse, { "decision": "deny", "reason": "…" } refuse l'action,
{ "decision": "allow" } la laisse passer ; toujours terminer par exit 0 (les codes de sortie ne sont pas documentés).
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

const MCP: Formats = {
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
dans config/. Dans le README, section « Installation », un paragraphe par outil :
${Object.values(MCP_WHERE)
  .map((w) => `- ${w}`)
  .join('\n')}
${Object.values(MCP_CONFIGS).map(describeConfig).join('\n')}`,
    scaffold: Object.values(MCP_CONFIGS),
  },
};

const CHAT_FORMAT: TargetFormat = {
  status: 'natif',
  summary: 'Conversation libre : elle ne dépend pas de l’IA choisie.',
  paths: [],
  instructions: '',
};
const CHAT: Formats = {
  claude: CHAT_FORMAT,
  codex: CHAT_FORMAT,
  copilot: CHAT_FORMAT,
  cursor: CHAT_FORMAT,
  gemini: CHAT_FORMAT,
  antigravity: CHAT_FORMAT,
  portable: CHAT_FORMAT,
};

const AGENT_PLUGIN_MANIFEST = `<nom>/plugin.json (standard Agent Plugins 1.0.0) :
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "<nom>",
  "version": "1.0.0",
  "description": "Ce que contient le plugin, en une phrase"
}
Champs permis : $schema et name (obligatoires), version, description, author { name }, homepage, repository, license,
keywords. Jamais hooks, agents, commands ni mcpServers dans plugin.json.`;
const AGENT_PLUGIN_SKILLS = `<nom>/skills/<skill>/SKILL.md : une skill par dossier, au standard Agent Skills.`;
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

const PLUGIN: Formats = {
  claude: {
    status: 'natif',
    summary:
      'Plugin Claude Code : <nom>/.claude-plugin/plugin.json, avec skills/, commands/, agents/, hooks/ et .mcp.json.',
    paths: [],
    instructions: `Structure :
<nom>/.claude-plugin/plugin.json : le manifeste, seul fichier de ce dossier :
{ "name": "<nom>", "version": "1.0.0", "description": "…", "author": { "name": "…" } }   (seul name est obligatoire)
<nom>/skills/<skill>/SKILL.md : skills (aussi appelées par /<nom>:<skill>).
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
  },
  codex: {
    status: 'natif',
    summary:
      'Plugin au standard Agent Plugins : <nom>/plugin.json, skills/ et mcp.json, installé depuis une marketplace.',
    paths: [],
    instructions: `Structure :
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
  },
  copilot: {
    status: 'natif',
    summary:
      'Plugin au standard Agent Plugins pour Copilot CLI et VS Code : plugin.json, skills/, mcp.json, com.github.copilot/.',
    paths: [],
    instructions: `Structure :
${AGENT_PLUGIN_MANIFEST}
${AGENT_PLUGIN_SKILLS}
${AGENT_PLUGIN_MCP}
Éléments propres à Copilot, dans le dossier <nom>/com.github.copilot/ :
- agents/<agent>.agent.md : en-tête name, description, tools: ['read', 'search'] ;
- hooks/hooks.json : { "version": 1, "hooks": { "preToolUse": [ { "type": "command", "bash": "./hooks/<script>.sh", "timeoutSec": 30 } ] } }
  (tout code de sortie non nul refuse l'action).
Installation à décrire dans le README : copilot plugin install ./<nom> (Copilot CLI ; réinstaller après une
modification) ; dans VS Code, activer chat.plugins.enabled puis « Install a plugin from source ».`,
    plugin: AGENT_PLUGIN_RULES,
  },
  cursor: {
    status: 'natif',
    summary: 'Plugin au standard Agent Plugins (skills et MCP), copié dans ~/.cursor/plugins/local/<nom>/.',
    paths: [],
    instructions: `Structure :
${AGENT_PLUGIN_MANIFEST}
${AGENT_PLUGIN_SKILLS}
${AGENT_PLUGIN_MCP}
Cursor ne remplace pas \${PLUGIN_ROOT} : ne pas l'utiliser, préférer un serveur lancé par npx.
Sous-agents, règles et hooks ne passent pas par ce format : s'ils sont demandés, le dire dans « À vérifier ».
Installation à décrire dans le README : copier le dossier dans ~/.cursor/plugins/local/<nom>/ (pas de lien
symbolique), puis la commande « Developer: Reload Window ».`,
    plugin: AGENT_PLUGIN_RULES,
  },
  gemini: {
    status: 'natif',
    summary:
      'Extension Gemini CLI : <nom>/gemini-extension.json, GEMINI.md, commands/, skills/, installée par gemini extensions.',
    paths: [],
    instructions: `Structure :
<nom>/gemini-extension.json :
{ "name": "<nom>", "version": "1.0.0", "description": "…", "contextFileName": "GEMINI.md" }
  facultatif : "excludeTools": ["run_shell_command(rm -rf)"], "mcpServers": { "<serveur>": { "command": "npx", "args": ["-y", "<paquet>"] } }
<nom>/GEMINI.md : contexte ajouté à chaque session (seulement si utile).
<nom>/commands/<commande>.toml : description = "…" et prompt = """…""" ({{args}}, !{commande}, @{fichier}) ;
  sous-dossier = espace de noms (git/commit.toml donne /git:commit).
<nom>/skills/<skill>/SKILL.md : skills.
<nom>/agents/<agent>.md : sous-agents (en-tête name, description).
<nom>/hooks/hooks.json : { "hooks": { "BeforeTool": [ { "matcher": "read_file", "hooks": [ { "type": "command",
  "command": "\${extensionPath}/hooks/<script>.sh" } ] } ] } } ; sortie standard en JSON uniquement.
Installation à décrire dans le README : gemini extensions link ./<nom> pendant le développement, gemini extensions
install <url du dépôt> pour l'installer ailleurs.`,
    plugin: { manifest: 'gemini-extension.json' },
  },
  antigravity: {
    status: 'natif',
    summary:
      'Plugin Antigravity : <nom>/plugin.json, skills/, agents/, rules/, hooks.json et mcp_config.json.',
    paths: [],
    instructions: `Structure :
<nom>/plugin.json :
{ "$schema": "https://antigravity.google/schemas/v1/plugin.json", "name": "<nom>", "version": "1.0.0", "description": "…" }
<nom>/skills/<skill>/SKILL.md : skills (aussi appelées par /<skill>).
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
  },
};

export const TARGET_FORMATS: Record<GeneratorKey, Formats> = {
  chat: CHAT,
  skill: SKILL,
  mcp: MCP,
  command: COMMAND,
  agent: AGENT,
  claudemd: CLAUDEMD,
  hooks: HOOKS,
  plugin: PLUGIN,
};
