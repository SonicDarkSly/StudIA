import type { TargetFormats } from '../../domain/ai-target.js';

const HOOK_SCRIPT_RULES = `Livrer TOUJOURS le fichier de configuration ET le ou les scripts : sans configuration, un script n'est jamais lancé.
Scripts bash : #!/usr/bin/env bash puis set -euo pipefail, rapides, chemins entre guillemets.
Ils reçoivent un JSON sur l'entrée standard : le lire avec jq. Expliquer dans le texte comment les rendre
exécutables (chmod +x) et comment fusionner le fichier de configuration avec l'existant.`;

export const HOOKS_FORMATS: TargetFormats = {
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
Refus, au choix : exit 2 avec un message texte sur stderr ; ou { "permissionDecision": "deny",
"permissionDecisionReason": "…" } sur stdout (sans >&2) puis exit 0. Jamais ce JSON sur stderr : il ne serait pas lu.
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
