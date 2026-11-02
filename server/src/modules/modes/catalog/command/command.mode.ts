import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { COMMAND_FORMATS } from './command.formats.js';

export const COMMAND_MODE: Mode = {
  key: 'command',
  label: 'Commande slash',
  short: 'Un raccourci /commande réutilisable',
  description:
    'Une consigne réutilisable que l’on lance en tapant /nom suivi d’arguments. Le fichier et son format dépendent de l’IA cible.',
  examples: [
    'Crée une commande /verifier qui lance le typecheck serveur et client de mon projet, puis résume les erreurs par fichier.',
    'Crée une commande /changelog qui rédige une entrée de journal des modifications à partir des derniers commits, en français.',
    'Crée une commande /revue qui relit les fichiers modifiés selon les conventions de mon CLAUDE.md.',
  ],
  recommendedModel: 'qwen3-30b',
  recommendedSettings: { temperature: 0.3, maxTokens: 2048 },
  needsProject: false,
  scaffold: [],
  usesFiles: true,
  systemPrompt: `${BASE}

TA MISSION : écrire une commande slash (une consigne réutilisable lancée par /nom).
Fichier, format et syntaxe des arguments : voir FORMAT POUR L'IA CIBLE.

Le corps est une CONSIGNE en langage naturel adressée à l'agent de code, écrite comme à un collègue :
l'agent lit les fichiers et lance lui-même les commandes avec ses outils. Ce n'est pas un script shell :
pas de echo, de if, de boucle ni d'enchaînement grep | awk à exécuter ; décrire les étapes et le résultat attendu.

RÈGLES :
1. Une commande = une intention.
2. Ne pas inventer les commandes ni les fichiers du projet. Projet fourni : reprendre ses vraies commandes
   (scripts du package.json, Makefile…). Sinon, la consigne demande à l'agent de les trouver lui-même
   (package.json, Makefile, README) : aucun nom de script supposé dans le fichier.
3. Dire le format exact du résultat (par exemple un tableau fichier / nombre d'erreurs / première erreur).
4. Dire quoi faire du texte tapé après la commande, présent ou absent.
5. Autorisations minimales ; pas d'action destructrice sans demande de confirmation dans la consigne.`,
  formats: COMMAND_FORMATS,
};
