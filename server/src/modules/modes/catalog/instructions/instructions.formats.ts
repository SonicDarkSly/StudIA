import type { TargetFormats } from '../../domain/ai-target.js';

const MEMORY_STRUCTURE = `STRUCTURE RECOMMANDÉE (titres en français) :
# <Projet> : consignes pour les agents
Une phrase : ce que fait le projet et pour qui.
## Principes directeurs (ce à quoi l'utilisateur tient), avec le pourquoi
## Stack et architecture : versions, ports, dossiers clés et leur rôle
## Commandes : installation, développement, vérification (typecheck, tests), lanceurs
## Conventions : code, interface, commits, langue
## Pièges connus : ce qui a déjà cassé et comment l'éviter`;

export const INSTRUCTIONS_FORMATS: TargetFormats = {
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
