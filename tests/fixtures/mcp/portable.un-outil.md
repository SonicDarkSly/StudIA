Ce connecteur MCP « projets-locaux » permet de lister les projets dans le dossier ~/projets et de lire le fichier CLAUDE.md d’un projet spécifique. Il respecte les règles de sécurité en limitant l’accès aux fichiers à ce dossier autorisé, et fournit deux outils en lecture seule : `lister_projets` et `lire_claude_md`. Les outils sont conçus pour être utilisés dans des agents compatibles MCP (Claude, Cursor, VSCode, etc.) avec une configuration simple.

=== FICHIER: projets-locaux/src/index.ts ===
```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

const DOSSIER_AUTORISE = path.join(os.homedir(), "projets");

function cheminAutorise(...parties: string[]): string | undefined {
  const chemin = path.resolve(DOSSIER_AUTORISE, ...parties);
  const relatif = path.relative(DOSSIER_AUTORISE, chemin);
  return relatif.startsWith("..") || path.isAbsolute(relatif) ? undefined : chemin;
}

function createServer(): McpServer {
  const server = new McpServer({ name: "projets-locaux", version: "1.0.0" });

  server.registerTool(
    "lister_projets",
    {
      title: "Lister les projets locaux",
      description: "Liste tous les dossiers présents dans ~/projets. Utile pour savoir quels projets sont accessibles.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const entrees = await fs.readdir(DOSSIER_AUTORISE, { withFileTypes: true });
        const dossiers = entrees
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        return {
          content: [
            {
              type: "text",
              text: dossiers.length > 0
                ? `Projets disponibles : ${dossiers.join(", ")}`
                : "Aucun projet trouvé dans ~/projets.",
            },
          ],
        };
      } catch (erreur) {
        console.error("Erreur lors du listage des projets :", erreur);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Impossible de lire le dossier ~/projets.",
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "lire_claude_md",
    {
      title: "Lire le CLAUDE.md d’un projet",
      description: "Lit le contenu du fichier CLAUDE.md dans un projet donné. Utile pour obtenir les instructions spécifiques à un projet.",
      inputSchema: z.object({
        nom_projet: z.string().describe("Nom du dossier du projet (ex: mon-projet)"),
      }),
    },
    async ({ nom_projet }) => {
      const cheminFichier = cheminAutorise(nom_projet, "CLAUDE.md");
      if (!cheminFichier) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Accès refusé : le projet "${nom_projet}" n'est pas dans ~/projets ou le fichier CLAUDE.md est introuvable.`,
            },
          ],
        };
      }

      try {
        const contenu = await fs.readFile(cheminFichier, "utf-8");
        return {
          content: [
            {
              type: "text",
              text: contenu,
            },
          ],
        };
      } catch (erreur) {
        console.error(`Erreur lors de la lecture de ${cheminFichier} :`, erreur);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Impossible de lire le fichier CLAUDE.md pour le projet "${nom_projet}".`,
            },
          ],
        };
      }
    },
  );

  return server;
}

void serveStdio(createServer);
```
=== FIN ===

=== FICHIER: projets-locaux/README.md ===
```markdown
# Connecteur MCP « projets-locaux »

Ce connecteur permet d’interagir avec les projets locaux situés dans `~/projets`. Il fournit deux outils en lecture seule :
- `lister_projets` : liste tous les dossiers présents dans ce répertoire.
- `lire_claude_md` : lit le contenu du fichier `CLAUDE.md` d’un projet spécifique.

## Installation

1. npm install
2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
3. npm run inspect (tester les outils dans l'inspecteur MCP)
4. Configuration : Fusionner le contenu du fichier `config/claude-mcp.json` avec `.mcp.json` à la racine du projet (Claude Code) ou dans `claude_desktop_config.json` (Claude Desktop, redémarrage complet nécessaire).
5. Remplacer /CHEMIN/ABSOLU/VERS par le chemin réel du dossier du connecteur.

## Outils

### lister_projets
- **Description** : Liste tous les dossiers présents dans ~/projets.
- **Utilisation** : Utile pour savoir quels projets sont accessibles.

### lire_claude_md
- **Description** : Lit le contenu du fichier CLAUDE.md dans un projet donné.
- **Paramètre** :
  - `nom_projet` (chaîne) : Nom du dossier du projet (ex: mon-projet).
- **Utilisation** : Utile pour obtenir les instructions spécifiques à un projet.
```
=== FIN ===

À vérifier :
- Le dossier ~/projets existe bien et contient des sous-dossiers.
- Les fichiers CLAUDE.md sont présents dans les dossiers de projets.
- La configuration du client MCP est correctement fusionnée avec le fichier de configuration fourni.