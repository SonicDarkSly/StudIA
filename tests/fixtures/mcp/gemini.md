Ce connecteur MCP « projets-locaux » permet d'accéder à des projets stockés localement dans le dossier ~/projets. Il propose deux outils en lecture seule : un pour lister les projets et un autre pour lire le fichier CLAUDE.md d’un projet spécifique. Les chemins sont validés pour éviter l'accès en dehors du dossier autorisé, et les erreurs sont gérées de manière claire.

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
        console.error("Erreur lors de la lecture du dossier ~/projets :", erreur);
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
      description:
        "Lit le contenu du fichier CLAUDE.md dans un projet spécifique de ~/projets. Utile pour obtenir les instructions ou notes spécifiques à un projet.",
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

Ce connecteur permet d'accéder à des projets stockés localement dans le dossier `~/projets`.

## Outils

### lister_projets
Liste tous les dossiers présents dans `~/projets`.

### lire_claude_md
Lit le contenu du fichier `CLAUDE.md` dans un projet spécifique de `~/projets`. Utile pour obtenir les instructions ou notes spécifiques à un projet.

## Installation

1. npm install
2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
3. npm run inspect (tester les outils dans l'inspecteur MCP)
4. Configuration : fusionner le contenu du fichier `config/gemini-settings.json` dans `.gemini/settings.json` du projet ou `~/.gemini/settings.json`.
5. Remplacer `/CHEMIN/ABSOLU/VERS` par le chemin réel du dossier du connecteur.

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