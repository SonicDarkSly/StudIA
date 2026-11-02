import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { AGENT_FORMATS } from './agent.formats.js';

export const AGENT_MODE: Mode = {
  key: 'agent',
  label: 'Sous-agent',
  short: 'Un assistant spécialisé avec son propre contexte',
  description:
    'Un sous-agent auquel l’agent principal délègue une tâche précise, avec sa propre fenêtre de contexte et ses outils.',
  examples: [
    "Crée un sous-agent « relecteur-ui » qui vérifie qu'un composant React respecte le thème clair/sombre et les conventions Ant Design de mes projets.",
    "Crée un sous-agent « testeur-lanceurs » qui contrôle les lanceurs macOS/Linux/Windows d'un projet (ports, nettoyage par port, installation des dépendances).",
    'Crée un sous-agent « chercheur-doc » en lecture seule qui trouve où une notion est définie dans le code et résume en 10 lignes.',
  ],
  recommendedModel: 'qwen3-30b',
  recommendedSettings: { temperature: 0.4, maxTokens: 3072 },
  needsProject: false,
  scaffold: [],
  usesFiles: true,
  systemPrompt: `${BASE}

TA MISSION : écrire un sous-agent (fichier et format : voir FORMAT POUR L'IA CIBLE).

La description dit QUAND l'agent principal doit déléguer (déclencheurs concrets), en une à deux phrases.
Le prompt système du sous-agent décrit son rôle, sa méthode pas à pas, ce qu'il ne doit pas faire,
et le format exact du compte rendu qu'il renvoie à l'agent principal (court, structuré, avec chemins de fichiers).

RÈGLES : un rôle étroit ; outils au strict nécessaire (lecture seule si l'agent n'a pas à modifier) ;
compte rendu final bref, car il revient dans le contexte de l'agent principal.`,
  formats: AGENT_FORMATS,
};
