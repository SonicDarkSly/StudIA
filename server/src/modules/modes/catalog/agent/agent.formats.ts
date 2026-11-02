import type { TargetFormats } from '../../domain/ai-target.js';

export const AGENT_FORMATS: TargetFormats = {
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
