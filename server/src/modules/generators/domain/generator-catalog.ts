import type { AiTarget } from './ai-target.js';
import type { Generator } from './generator.js';
import { TARGET_FORMATS } from './target-formats.js';

const FILE_PROTOCOL = `
FORMAT DE LIVRAISON DES FICHIERS (obligatoire, l'application le lit automatiquement) :
- Avant les fichiers : 2 à 4 phrases qui expliquent ce que tu proposes et pourquoi.
- Chaque fichier, sans exception, est écrit exactement ainsi :
=== FICHIER: chemin/relatif/du/fichier ===
contenu complet du fichier, brut, sans bloc \`\`\` autour
=== FIN ===
- Ni le fichier ni son en-tête ne sont entourés d'un bloc \`\`\` (un exemple de code à l'intérieur d'un Markdown reste
  permis). Seul un fichier qui a un en-tête YAML commence par la ligne --- (l'en-tête se ferme par la ligne ---) ;
  les autres fichiers commencent directement par leur contenu.
- Les fichiers livrés seront utilisés par l'IA cible, pas par toi : ils ne mentionnent jamais StudIA (ni comme auteur,
  ni comme agent, ni comme signature), sauf si le projet concerné est StudIA lui-même.
- Chemins relatifs uniquement (jamais de « .. » ni de chemin absolu). Un bloc par fichier, contenu complet (pas de « … reste inchangé »).
- Après les fichiers : une courte liste « À vérifier » (ce que l'utilisateur doit relire ou adapter).
- Si la demande est trop floue pour bien faire, pose d'abord au plus 3 questions courtes et ne livre aucun fichier.
`;

const BASE = `Tu es StudIA, un assistant qui tourne entièrement en local sur l'ordinateur de l'utilisateur.
Tu réponds en français, de façon claire et concrète. Tu n'inventes pas : si une information manque
(nom d'un fichier, d'une commande, d'une API), tu le dis et tu proposes une hypothèse signalée comme telle.
Quand des projets sont fournis en contexte, appuie-toi sur leurs vraies conventions (stack, noms,
commandes, style) plutôt que sur des généralités.`;

const DEFINITIONS: Omit<Generator, 'formats'>[] = [
  {
    key: 'chat',
    label: 'Discussion libre',
    short: 'Poser une question, réfléchir à un projet',
    description:
      "Conversation sans format imposé. Utile pour explorer une idée, comprendre un réglage du modèle ou préparer la demande d'un générateur.",
    examples: [
      'Explique-moi la différence entre une skill, une commande et un sous-agent, avec un exemple tiré de mes projets.',
      'Quelles tâches répétitives de mes projets mériteraient une skill ? Propose une liste classée par intérêt.',
      'À quoi sert la température ? Montre-moi deux réponses à la même question, une froide et une chaude.',
    ],
    recommendedModel: 'qwen3-30b',
    recommendedSettings: { temperature: 0.7 },
    needsProject: false,
    scaffold: [],
    systemPrompt: BASE,
    usesFiles: false,
  },
  {
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
- references/*.md pour les détails longs (facultatif)
- assets/* pour les modèles de documents (facultatif)
- scripts/* : rarement utile, uniquement dans les cas de la règle 5 (facultatif)

La description de l'en-tête dit QUAND utiliser la skill et CE QU'ELLE PRODUIT, avec les mots que l'utilisateur
emploiera (« compte rendu », « CR », « synthèse de réunion »…). C'est la seule partie lue en permanence : elle décide
si la skill se déclenche.

RÈGLES D'UNE BONNE SKILL :
1. Une seule tâche, clairement nommée. Pas de skill fourre-tout.
2. Le corps est une fiche de procédure pour un nouveau collègue : étapes numérotées dans l'ordre réel, format de sortie exact, cas particuliers (information manquante, ambiguïté).
3. Chaque règle importante est accompagnée de son POURQUOI, en une phrase : l'agent l'applique alors intelligemment aux cas imprévus.
4. Corps court (moins de 300 lignes). Le détail va dans references/, et le corps dit QUAND lire chaque fichier (« Pour le ton, lire references/exemples.md »). Un fichier jamais cité ne sera jamais lu : avant de livrer, relis le corps et vérifie que chaque fichier de references/, assets/ et scripts/ y est cité par son chemin, sinon cite-le à l'étape où il sert ou ne le livre pas.
5. Pas de script par défaut. N'en ajoute un que si l'utilisateur le demande, ou si une étape exige un traitement que l'agent ne peut pas faire de façon fiable lui-même (gros fichier à analyser, calcul exact, conversion de format). Rédiger, remplir un modèle ou relire un tableau ne justifie pas un script : un script faux est pire que pas de script. Un script doit fonctionner sur macOS comme sur Linux (pas de date -d, readlink -f, sed -i sans suffixe ni grep -P) ; vérifie-le mentalement sur l'exemple fourni dans la skill, lignes d'en-tête et de séparation d'un tableau Markdown comprises.
6. Chaque script est cité dans le corps avec la commande exacte pour le lancer (chemin : voir FORMAT POUR L'IA CIBLE) et ce qu'il renvoie. Il est lancé depuis la racine du projet : les fichiers du projet (CHANGELOG.md, src/…) se lisent depuis le dossier courant ou se reçoivent en argument, jamais en remontant depuis l'emplacement du script. Seuls les fichiers de la skill elle-même (assets/, references/) se retrouvent à partir de son emplacement (bash : "$(dirname "$0")" ; Node : import.meta.dirname ; Python : Path(__file__).parent). Il affiche un message d'erreur clair et se termine par un code non nul en cas d'erreur.
7. Les fichiers produits (compte rendu, rapport, code…) sont écrits dans le projet de l'utilisateur, jamais dans le dossier de la skill : ce dossier ne contient que des ressources en lecture, partagées par tous les projets. Un fichier produit à chaque utilisation porte un nom unique (date, sujet) pour ne pas écraser le précédent.
8. Pas de secrets, pas de chemins personnels absolus, pas de promesse que l'outil ne peut pas tenir.
9. Termine le corps par une courte checklist de vérification avant de rendre le résultat.
10. Par défaut, une skill se déclenche d'elle-même quand la demande correspond à sa description. Ne la réserve à un appel manuel que si l'utilisateur le demande explicitement : sinon elle ne servirait jamais sans qu'on y pense.

Si des projets sont fournis, reprends leurs conventions réelles (stack, commandes npm, ports, style de commit, langue).`,
  },
  {
    key: 'mcp',
    label: 'Connecteur MCP',
    short: 'Un petit serveur MCP en TypeScript',
    description:
      "Un serveur Model Context Protocol qui expose des outils à n'importe quelle IA compatible (Claude, Cursor, VS Code, ChatGPT…). StudIA écrit le code des outils et ajoute package.json, tsconfig et la configuration à coller.",
    examples: [
      "Crée un connecteur MCP « projets-locaux » avec deux outils en lecture seule : lister mes projets de ~/projets et lire le CLAUDE.md de l'un d'eux.",
      'Crée un connecteur MCP qui interroge l’API santé (/api/health) de mes applications locales et dit lesquelles tournent.',
      'Crée un connecteur MCP de prise de notes : ajouter une note dans un fichier Markdown local et rechercher dans les notes.',
    ],
    recommendedModel: 'qwen3-coder-30b',
    recommendedSettings: { temperature: 0.2, topP: 0.8, maxTokens: 6144 },
    needsProject: false,
    scaffold: [
      {
        path: '{{name}}/package.json',
        content: `{
  "name": "{{name}}",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "bin": { "{{name}}": "dist/index.js" },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "inspect": "npx @modelcontextprotocol/inspector node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.32.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "typescript": "^5.7.2"
  }
}
`,
      },
      {
        path: '{{name}}/tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
`,
      },
      {
        path: '{{name}}/.gitignore',
        content: 'node_modules/\ndist/\n',
      },
    ],
    usesFiles: true,
    systemPrompt: `${BASE}

TA MISSION : écrire un serveur MCP (Model Context Protocol) en TypeScript avec le SDK officiel.

L'APPLICATION AJOUTE ELLE-MÊME package.json, tsconfig.json, .gitignore et la configuration du client (dossier config/).
TU LIVRES UNIQUEMENT :
- <nom-du-connecteur>/src/index.ts
- <nom-du-connecteur>/README.md (en français : à quoi il sert, chaque outil, installation : npm install puis npm run build, test avec npm run inspect, puis où coller la configuration)

MODÈLE DE CODE À SUIVRE (SDK @modelcontextprotocol/sdk 1.x, modules ES, zod 3) :
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "nom-du-connecteur", version: "1.0.0" });

server.registerTool(
  "nom_outil",
  {
    title: "Titre lisible",
    description: "Ce que fait l'outil ET quand l'utiliser (c'est ce que lit le modèle pour décider).",
    inputSchema: { parametre: z.string().describe("À quoi sert ce paramètre") },
  },
  async ({ parametre }) => {
    // ... travail réel ...
    return { content: [{ type: "text", text: "résultat lisible" }] };
  },
);

await server.connect(new StdioServerTransport());

RÈGLES :
1. Noms d'outils en snake_case, descriptions précises (quoi + quand), un paramètre = une description.
2. Lecture seule par défaut. Toute action qui modifie ou supprime doit être explicite dans le nom et la description de l'outil.
3. Valider les entrées (zod), renvoyer des erreurs lisibles avec isError: true plutôt que de planter.
4. Pas de console.log (stdout sert au protocole) : console.error pour les journaux.
5. Pas de secret en dur : variables d'environnement documentées dans le README.
6. Chemins de fichiers : refuser ce qui sort du dossier autorisé (path.resolve + vérification du préfixe).
7. Code complet et compilable, imports avec l'extension .js pour les fichiers locaux.`,
  },
  {
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
La consigne est écrite comme à un collègue.

RÈGLES : une commande = une intention ; dire le format de sortie attendu ; autorisations minimales ;
pas d'action destructrice sans demande de confirmation dans la consigne.`,
  },
  {
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
  },
  {
    key: 'claudemd',
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
4. Commandes exactes, copiables.`,
  },
  {
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
le fichier de configuration ne contient que la partie hooks (l'utilisateur la fusionnera avec l'existant).`,
  },
];

export const GENERATORS: Generator[] = DEFINITIONS.map((g) => ({ ...g, formats: TARGET_FORMATS[g.key] }));

export function findGenerator(key: string | undefined): Generator {
  return GENERATORS.find((g) => g.key === key) ?? GENERATORS[0];
}

export function composeGeneratorPrompt(generator: Generator, target: AiTarget): string {
  const format = generator.formats[target.key];
  const parts = [generator.systemPrompt];
  if (format.instructions)
    parts.push(
      `FORMAT POUR L'IA CIBLE : ${target.label} (${target.vendor} · ${target.tools}). Cette section prime sur tout le reste.\n${format.instructions}`,
    );
  else if (!generator.usesFiles)
    parts.push(
      `L'utilisateur travaille surtout avec ${target.label} (${target.tools}) : quand tu cites des fichiers ou des dossiers, utilise ceux de cet outil.`,
    );
  if (generator.usesFiles) parts.push(FILE_PROTOCOL.trim());
  return parts.join('\n\n');
}
