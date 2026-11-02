import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { MCP_FORMATS } from './mcp.formats.js';

export const MCP_MODE: Mode = {
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
  "engines": { "node": ">=20" },
  "dependencies": {
    "@modelcontextprotocol/server": "^2.4.0",
    "zod": "^4.2.0"
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
- <nom-du-connecteur>/README.md en français : à quoi il sert, chaque outil, puis cette section, dans cet ordre :
  ## Installation
  1. npm install
  2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
  3. npm run inspect (tester les outils dans l'inspecteur MCP)
  4. Configuration : où fusionner le fichier du dossier config/ (voir FORMAT POUR L'IA CIBLE).
  5. Une phrase qui dit de remplacer /CHEMIN/ABSOLU/VERS par le chemin réel du dossier du connecteur.
Le README renvoie à ce fichier de configuration fourni par l'application : n'invente ni ne recopie aucun autre format.

MODÈLE DE CODE À SUIVRE (SDK @modelcontextprotocol/server 2.x, modules ES, zod 4). Ne pas utiliser l'ancien paquet
@modelcontextprotocol/sdk ni server.connect(new StdioServerTransport()) : serveStdio sert à la fois les anciens et les
nouveaux clients MCP.
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import path from "node:path";
import os from "node:os";

function createServer(): McpServer {
  const server = new McpServer({ name: "nom-du-connecteur", version: "1.0.0" });

  server.registerTool(
    "nom_outil",
    {
      title: "Titre lisible",
      description: "Ce que fait l'outil ET quand l'utiliser (c'est ce que lit le modèle pour décider).",
      inputSchema: z.object({ parametre: z.string().describe("À quoi sert ce paramètre") }),
    },
    async ({ parametre }) => {
      // ... travail réel ...
      if (!parametre) return { isError: true, content: [{ type: "text", text: "Message d'erreur lisible" }] };
      return { content: [{ type: "text", text: "résultat lisible" }] };
    },
  );

  return server;
}

void serveStdio(createServer);

Un outil sans paramètre : inputSchema: z.object({}).
Toute réponse, erreur comprise, a la forme { content: [{ type: "text", text: "…" }] } (isError: true en plus pour une
erreur) : jamais { message: … } ni { error: … }, refusés à la compilation.
Ne garder que les dossiers : (await readdir(dossier, { withFileTypes: true })).filter((e) => e.isDirectory()).

RÈGLES :
1. Noms d'outils en snake_case, descriptions précises (quoi + quand), un paramètre = une description.
2. Lecture seule par défaut. Toute action qui modifie ou supprime doit être explicite dans le nom et la description de l'outil.
3. Valider les entrées (zod), renvoyer des erreurs lisibles avec isError: true plutôt que de planter.
4. Pas de console.log (stdout sert au protocole) : console.error pour les journaux.
5. Pas de secret en dur : variables d'environnement documentées dans le README.
6. Chemins de fichiers : refuser ce qui sort du dossier autorisé avec cette fonction, recopiée mot pour mot avec
   import path from "node:path" (pas d'import nommé de resolve ou relative) ; jamais startsWith sur le chemin :
   « ~/projets-secret » commence aussi par « ~/projets » :
   function cheminAutorise(...parties: string[]): string | undefined {
     const chemin = path.resolve(DOSSIER_AUTORISE, ...parties);
     const relatif = path.relative(DOSSIER_AUTORISE, chemin);
     return relatif.startsWith("..") || path.isAbsolute(relatif) ? undefined : chemin;
   }
   Node ne comprend pas « ~ » : le dossier personnel s'obtient avec os.homedir() (import os from "node:os"), par exemple
   const DOSSIER_AUTORISE = path.join(os.homedir(), "projets").
   Passer toutes les parties du chemin réellement lu, nom de fichier compris : lire ~/projets/<projet>/CLAUDE.md
   s'écrit cheminAutorise(projet, "CLAUDE.md") ; undefined → réponse isError: true. Le dossier autorisé lui-même est accepté.
7. Code complet et compilable, imports avec l'extension .js pour les fichiers locaux. Le fichier commence directement par le code (aucune ligne \`\`\`typescript).
8. Avant de livrer, déroule mentalement un appel de chaque outil avec un exemple réaliste (ex. lire_fichier("mon-projet")) : chemin réellement lu ou écrit, résultat renvoyé, cas d'erreur. Corrige ce qui ne donnerait pas le bon résultat.`,
  formats: MCP_FORMATS,
};
