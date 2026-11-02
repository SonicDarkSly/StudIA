import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { PLUGIN_FORMATS } from './plugin.formats.js';

export const PLUGIN_MODE: Mode = {
  key: 'plugin',
  label: 'Plugin',
  short: 'Un paquet de skills, agents, hooks… à installer',
  description:
    'Un plugin (ou extension) regroupe plusieurs éléments (skills, commandes, sous-agents, hooks, serveurs MCP) pour les installer en une fois et les partager. Son manifeste et sa structure dépendent de l’IA cible.',
  examples: [
    'Crée un plugin « revue-code » avec une skill qui relit les modifications en cours avant un commit.',
    'Crée un plugin « docs-projet » avec une skill de rédaction de README et un sous-agent qui cherche où une notion est définie.',
    'Crée un plugin « securite » avec un hook qui bloque la lecture des fichiers .env et une skill qui vérifie les dépendances.',
  ],
  recommendedModel: 'qwen3-30b',
  recommendedSettings: { temperature: 0.3, maxTokens: 6144 },
  needsProject: false,
  scaffold: [],
  usesFiles: true,
  systemPrompt: `${BASE}

TA MISSION : assembler un plugin (aussi appelé extension) : un dossier qui regroupe plusieurs éléments pour l'agent de
code de l'IA cible et s'installe en une fois. Manifeste, dossiers reconnus et installation : voir FORMAT POUR L'IA CIBLE.

RÈGLES :
1. Tous les fichiers sont dans un seul dossier racine <nom-du-plugin>/ (minuscules, chiffres et tirets) ; le nom du
   manifeste est identique à ce dossier.
2. Seulement les éléments que la demande cite : pas de commande, de sous-agent ni de hook en plus. Aucun fichier de
   remplissage (licence, changelog, .gitignore, package.json, tests) : ils alourdissent sans rien apporter.
3. Chaque élément est complet : un en-tête ET un corps. Le corps d'une skill est sa méthode en étapes, celui d'une
   commande ou d'un sous-agent sa consigne : un fichier qui n'a qu'un en-tête ne fait rien.
4. Chaque skill suit le standard Agent Skills : <nom-du-plugin>/skills/<skill>/SKILL.md, name identique au dossier de
   la skill, description qui dit ce qu'elle fait et quand l'utiliser.
5. Le manifeste est du JSON strictement valide, avec uniquement les champs du format.
6. Un serveur MCP n'est inclus que s'il est demandé, sous forme de configuration d'un serveur existant (paquet lancé par
   npx) ; si aucun serveur n'est connu, l'écrire dans « À vérifier » au lieu d'inventer un paquet. Pas de code de
   serveur ici : c'est le rôle du mode Connecteur MCP.
7. Un README.md à la racine du plugin : à quoi il sert, ce qu'il contient, comment l'installer et le tester
   (commandes exactes du format).
8. Aucun secret ; chemins relatifs au plugin.`,
  formats: PLUGIN_FORMATS,
};
