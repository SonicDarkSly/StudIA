Ce connecteur MCP « projets-locaux » permet d'interagir avec les projets stockés dans le dossier ~/projets. Il propose deux outils en lecture seule :
1. `lister_projets` : liste tous les dossiers présents dans ~/projets.
2. `lire_claude_md` : lit le contenu du fichier CLAUDE.md d'un projet donné.

Les outils sont sécurisés : ils ne permettent que des lectures, et les chemins sont validés pour éviter l'accès en dehors de ~/projets. Le connecteur est configuré pour fonctionner avec les clients MCP standards (Claude, Cursor, VSCode, etc.).

À vérifier :
- Le dossier ~/projets existe bien et contient des sous-dossiers.
- Les fichiers CLAUDE.md sont présents dans les projets si on utilise `lire_claude_md`.

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
      description: "Liste tous les dossiers présents dans le dossier ~/projets. Utile pour connaître les projets disponibles.",
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
              text: dossiers.length > 0 ? dossiers.join("\n") : "Aucun projet trouvé dans ~/projets.",
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
      title: "Lire le CLAUDE.md d'un projet",
      description: "Lit le contenu du fichier CLAUDE.md d'un projet donné. Utile pour obtenir les informations spécifiques à un projet.",
      inputSchema: z.object({
        nom_projet: z.string().describe("Nom du dossier du projet (ex: 'mon-projet')"),
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
              text: `Accès refusé : le projet '${nom_projet}' est en dehors du dossier autorisé.`,
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
              text: `Impossible de lire le fichier CLAUDE.md pour le projet '${nom_projet}'.`,
            },
          ],
        };
      }
    },
  );

  return server;
}

void serveStdio(createServer);
=== FIN ===

=== FICHIER: projets-locaux/README.md ===
# Connecteur MCP « projets-locaux »

Ce connecteur permet d'interagir avec les projets stockés dans le dossier `~/projets`.

## Outils

### lister_projets
Liste tous les dossiers présents dans le dossier `~/projets`. Utile pour connaître les projets disponibles.

### lire_claude_md
Lit le contenu du fichier `CLAUDE.md` d'un projet donné. Utile pour obtenir les informations spécifiques à un projet.

## Installation

1. npm install
2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
3. npm run inspect (tester les outils dans l'inspecteur MCP)
4. Configuration : voir le paragraphe de votre outil ci-dessous.
5. Remplacer /CHEMIN/ABSOLU/VERS par le chemin réel du dossier du connecteur.

### Configuration pour Claude Code
Fusionner le contenu suivant dans `.mcp.json` à la racine du projet (ou dans `claude_desktop_config.json` pour Claude Desktop) :

```json
{
  "mcpServers": {
    "projets-locaux": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
    }
  }
}
```

### Configuration pour Codex
Ajouter le contenu suivant dans `~/.codex/config.toml` (ou `.codex/config.toml` d’un projet approuvé) :

```toml
[mcp_servers.projets-locaux]
command = "node"
args = ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
```

### Configuration pour VSCode
Fusionner le contenu suivant dans `.vscode/mcp.json` :

```json
{
  "servers": {
    "projets-locaux": {
      "type": "stdio",
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
    }
  }
}
```

### Configuration pour Cursor
Fusionner le contenu suivant dans `.cursor/mcp.json` du projet ou `~/.cursor/mcp.json` :

```json
{
  "mcpServers": {
    "projets-locaux": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
    }
  }
}
```

### Configuration pour Gemini
Fusionner le contenu suivant dans `.gemini/settings.json` du projet ou `~/.gemini/settings.json` :

```json
{
  "mcpServers": {
    "projets-locaux": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
    }
  }
}
```

### Configuration pour Antigravity
Fusionner le contenu suivant dans `.agents/mcp_config.json` du projet ou `~/.gemini/config/mcp_config.json` :

```json
{
  "mcpServers": {
    "projets-locaux": {
      "command": "node",
      "args": ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
    }
  }
}
```
=== FIN ===