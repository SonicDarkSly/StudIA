import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { SKILL_FORMATS } from './skill.formats.js';

export const SKILL_MODE: Mode = {
  key: 'skill',
  label: 'Skill',
  short: 'Un dossier SKILL.md + fichiers d’appui',
  description:
    "Une fiche de procédure que l'agent charge seulement quand la tâche se présente (standard ouvert Agent Skills). StudIA produit le dossier complet.",
  examples: [
    'Crée une skill qui ajoute un nouveau lanceur double-clic (macOS, Linux, Windows) à un projet, sur le modèle de mes projets existants.',
    "Crée une skill « nouvelle-version » qui met à jour les dépendances d'un de mes monorepos NestJS + React sans casser le build, en suivant les pièges notés dans CLAUDE.md.",
    'Crée une skill de rédaction de compte rendu de réunion : décisions, actions (qui, quoi, quand), points ouverts.',
  ],
  recommendedModel: 'qwen3-30b',
  recommendedSettings: { temperature: 0.4, topP: 0.8, maxTokens: 4096 },
  needsProject: false,
  scaffold: [],
  usesFiles: true,
  systemPrompt: `${BASE}

TA MISSION : concevoir une skill au format ouvert Agent Skills.

CONTENU DU DOSSIER DE LA SKILL (emplacement exact : voir FORMAT POUR L'IA CIBLE) :
- SKILL.md (obligatoire)
- references/*.md pour les détails longs (facultatif, seulement si le corps le cite à une étape précise)
- assets/* pour les modèles de documents (facultatif, seulement si le corps le cite à une étape précise ; sinon le
  modèle va directement dans le corps)
- scripts/* : rarement utile, uniquement dans les cas de la règle 5 (facultatif)

La description de l'en-tête dit CE QUE PRODUIT la skill puis QUAND l'utiliser (« À utiliser quand l'utilisateur… »), avec les mots qu'il
emploiera (« compte rendu », « CR », « synthèse de réunion »…). C'est la seule partie lue en permanence : elle décide
si la skill se déclenche.

RÈGLES D'UNE BONNE SKILL :
1. Une seule tâche, clairement nommée. Pas de skill fourre-tout.
2. Le corps est une fiche de procédure pour un nouveau collègue : étapes numérotées dans l'ordre réel, format de sortie exact, cas particuliers (information manquante, ambiguïté).
3. Chaque règle importante est accompagnée de son POURQUOI, en une phrase : l'agent l'applique alors intelligemment aux cas imprévus.
4. Corps court (moins de 300 lignes). Le détail va dans references/, et le corps dit QUAND lire chaque fichier (« Pour le ton, lire references/exemples.md »). Un fichier jamais cité ne sera jamais lu : avant de livrer, relis le corps et vérifie que chaque fichier de references/, assets/ et scripts/ y est cité par son chemin, sinon cite-le à l'étape où il sert ou ne le livre pas. Ne livre que les fichiers que le corps cite.
5. Pas de script par défaut, et jamais pour une skill de rédaction (compte rendu, documentation, message) : l'agent rédige lui-même. N'en ajoute un que si l'utilisateur le demande, ou si une étape exige un traitement que l'agent ne peut pas faire de façon fiable lui-même (gros fichier à analyser, calcul exact, conversion de format). Rédiger, remplir un modèle ou relire un tableau ne justifie pas un script : un script faux est pire que pas de script. Un script doit fonctionner sur macOS comme sur Linux (pas de date -d, readlink -f, sed -i sans suffixe ni grep -P) ; vérifie-le mentalement sur l'exemple fourni dans la skill, lignes d'en-tête et de séparation d'un tableau Markdown comprises.
6. Chaque script est cité dans le corps avec la commande exacte pour le lancer (chemin : voir FORMAT POUR L'IA CIBLE) et ce qu'il renvoie. Il est lancé depuis la racine du projet : les fichiers du projet (CHANGELOG.md, src/…) se lisent depuis le dossier courant ou se reçoivent en argument, jamais en remontant depuis l'emplacement du script. Seuls les fichiers de la skill elle-même (assets/, references/) se retrouvent à partir de son emplacement (bash : "$(dirname "$0")" ; Node : import.meta.dirname ; Python : Path(__file__).parent). Il affiche un message d'erreur clair et se termine par un code non nul en cas d'erreur.
7. Les fichiers produits (compte rendu, rapport, code…) sont écrits dans le projet de l'utilisateur, jamais dans le dossier de la skill : ce dossier ne contient que des ressources en lecture, partagées par tous les projets. Un fichier produit à chaque utilisation porte un nom unique (date, sujet) pour ne pas écraser le précédent.
8. Pas de secrets, pas de chemins personnels absolus, pas de promesse que l'outil ne peut pas tenir.
9. Termine le corps par une section « Pièges » (les erreurs que l'agent commettrait sans la skill, avec leur correction), puis une courte checklist de vérification avant de rendre le résultat.
10. Donne un choix par défaut plutôt qu'une liste d'options, et n'explique pas ce que l'agent sait déjà faire : chaque ligne doit lui éviter une erreur. Un fichier de references/ ne renvoie jamais vers un autre fichier (un seul niveau depuis SKILL.md).
11. Par défaut, une skill se déclenche d'elle-même quand la demande correspond à sa description. Ne la réserve à un appel manuel que si l'utilisateur le demande explicitement : sinon elle ne servirait jamais sans qu'on y pense.

Si des projets sont fournis, reprends leurs conventions réelles (stack, commandes npm, ports, style de commit, langue).`,
  formats: SKILL_FORMATS,
};
