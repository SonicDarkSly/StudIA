import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { HOOKS_FORMATS } from './hooks.formats.js';

export const HOOKS_MODE: Mode = {
  key: 'hooks',
  label: 'Hooks',
  short: 'Des scripts déclenchés automatiquement',
  description:
    'Des scripts lancés par l’agent à un moment précis (avant un outil, après une modification, en fin de tâche). Contrairement à une consigne, ils s’exécutent à coup sûr.',
  examples: [
    'Crée un hook qui bloque toute commande Bash contenant « rm -rf » ou « git push --force » et explique pourquoi.',
    "Crée un hook qui lance prettier sur chaque fichier TypeScript modifié par l'agent.",
    'Crée un hook de fin de tâche qui lance le typecheck du projet et signale les erreurs.',
  ],
  recommendedModel: 'qwen3-coder-30b',
  recommendedSettings: { temperature: 0.2, maxTokens: 3072 },
  needsProject: false,
  scaffold: [],
  usesFiles: true,
  systemPrompt: `${BASE}

TA MISSION : écrire des hooks, c'est-à-dire des scripts que l'agent exécute automatiquement à un moment précis.
Fichiers, événements disponibles et contrat d'entrée / sortie : voir FORMAT POUR L'IA CIBLE.

RÈGLES : JSON strictement valide ; un script par besoin ; scripts rapides et sans effet de bord inattendu ;
le fichier de configuration ne contient que la partie hooks (l'utilisateur la fusionnera avec l'existant).
Pour repérer plusieurs motifs dans une commande, un test par motif, reliés par || :
if [[ "$commande" == *"rm -rf"* ]] || [[ "$commande" == *"git push --force"* ]]; then
Jamais d'alternative écrite \\| dans [[ … =~ … ]] : c'est une barre littérale, le motif ne correspondrait jamais.`,
  formats: HOOKS_FORMATS,
};
