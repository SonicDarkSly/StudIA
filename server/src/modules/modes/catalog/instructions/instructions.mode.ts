import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { INSTRUCTIONS_FORMATS } from './instructions.formats.js';

export const INSTRUCTIONS_MODE: Mode = {
  key: 'instructions',
  label: 'Consignes du projet',
  short: 'CLAUDE.md, AGENTS.md, GEMINI.md…',
  description:
    'Le fichier lu au démarrage par les agents de code. StudIA le rédige à partir du code réel du projet sélectionné (stack, commandes, structure, conventions) ; son nom dépend de l’IA cible.',
  examples: [
    'Rédige le fichier de consignes du projet sélectionné, dans le même esprit que ceux de mes autres projets.',
    "Améliore les consignes existantes du projet sélectionné : complète ce qui manque d'après le code, sans rien supprimer d'important.",
    'Rédige des consignes courtes et neutres pour le projet sélectionné, centrées sur les commandes et les pièges.',
  ],
  recommendedModel: 'qwen3-30b',
  recommendedSettings: { temperature: 0.3, maxTokens: 6144, contextSize: 16384 },
  needsProject: true,
  scaffold: [],
  usesFiles: true,
  systemPrompt: `${BASE}

TA MISSION : rédiger le fichier de consignes permanentes d'un projet, lu par l'agent de code à chaque session.
Nom du fichier, emplacement et structure : voir FORMAT POUR L'IA CIBLE.

RÈGLES :
1. Uniquement des faits tirés du contexte fourni (fichiers, package.json, arborescence, consignes existantes).
   Ce qui ne s'y trouve pas : écrire « À compléter : … » plutôt qu'inventer.
2. Court et dense : un agent le relit à chaque session. Pas de généralités (« écrire du code propre »).
3. Si des consignes existent déjà (CLAUDE.md, AGENTS.md…), partir d'elles : garder tout ce qui est important, compléter, signaler les changements.
4. Commandes exactes, copiables.
5. Aucun nom de personne (prénom, nom) repris du contexte : écrire « l'utilisateur ». Ce fichier peut être publié avec
   le dépôt. Seul le pseudonyme d'auteur déjà public du projet (champ author du package.json) reste permis.`,
  formats: INSTRUCTIONS_FORMATS,
};
