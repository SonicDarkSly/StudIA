Ce connecteur MCP « projets-locaux » permet de lister les projets dans le dossier ~/projets et de lire le fichier CLAUDE.md d’un projet spécifique. Il respecte les bonnes pratiques de sécurité en limitant l’accès aux fichiers à ce dossier, et utilise Zod pour valider les entrées. Les outils sont nommés en snake_case avec des descriptions précises.

=== FICHIER: projets-locaux/src/index.ts ===
```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import path from "node:path";
import os from "node:os";
import { readdir, readFile } from "node:fs/promises";

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
      title: "Lister les projets",
      description: "Liste tous les dossiers présents dans ~/projets.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const entrees = await readdir(DOSSIER_AUTORISE, { withFileTypes: true });
        const dossiers = entrees
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        return {
          content: [
            {
              type: "text",
              text: dossiers.length > 0 ? dossiers.join("\n") : "Aucun projet trouvé.",
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
              text: "Impossible de lire le dossier des projets.",
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "lire_claude_md",
    {
      title: "Lire CLAUDE.md d’un projet",
      description: "Lit le contenu du fichier CLAUDE.md dans un projet spécifique de ~/projets.",
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
              text: `Accès refusé : le projet "${nom_projet}" est en dehors du dossier autorisé.`,
            },
          ],
        };
      }

      try {
        const contenu = await readFile(cheminFichier, "utf-8");
        return {
          content: [
            {
              type: "text",
              text: contenu,
            },
          ],
        };
      } catch (erreur) {
        console.error("Erreur lors de la lecture du fichier CLAUDE.md :", erreur);
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

Ce connecteur permet de lister les projets dans le dossier `~/projets` et de lire le fichier `CLAUDE.md` d’un projet spécifique.

## Outils

### lister_projets
Liste tous les dossiers présents dans `~/projets`.

### lire_claude_md
Lit le contenu du fichier `CLAUDE.md` dans un projet spécifique de `~/projets`.

## Installation

1. npm install
2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
3. npm run inspect (tester les outils dans l'inspecteur MCP)
4. Configuration : fusionner le contenu du dossier config/ dans `.agents/mcp_config.json` ou `~/.gemini/config/mcp_config.json`.
5. Remplacer `/CHEMIN/ABSOLU/VERS` par le chemin réel vers le dossier du connecteur.

```
{
  "mcpServers": {
    "projets-locaux": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
    }
  }
}
```
```
=== FIN ===