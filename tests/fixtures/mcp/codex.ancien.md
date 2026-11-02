Ce connecteur MCP « projets-locaux » permet de lister les projets dans le dossier ~/projets et de lire le fichier CLAUDE.md d’un projet spécifique. Il respecte les bonnes pratiques de sécurité en limitant l’accès aux fichiers à ce dossier uniquement, et utilise Zod pour valider les entrées.

À vérifier :
- Le chemin ~/projets doit exister sur la machine cible.
- Les projets doivent avoir un fichier CLAUDE.md pour que l’outil lire_claude_md fonctionne correctement.
- Le fichier de configuration du client Codex doit être ajouté à ~/.codex/config.toml comme indiqué dans le README.

=== FICHIER: projets-locaux/src/index.ts ===
```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const DOSSIER_AUTORISE = join(homedir(), "projets");

function cheminAutorise(...parties: string[]): string | undefined {
  const chemin = resolve(DOSSIER_AUTORISE, ...parties);
  const relatif = resolve(DOSSIER_AUTORISE).relative(chemin);
  return relatif.startsWith("..") || relatif.includes("..") ? undefined : chemin;
}

function createServer(): McpServer {
  const server = new McpServer({ name: "projets-locaux", version: "1.0.0" });

  server.registerTool(
    "lister_projets",
    {
      title: "Lister les projets locaux",
      description: "Retourne la liste des dossiers présents dans ~/projets.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const entrees = await readdir(DOSSIER_AUTORISE, { withFileTypes: true });
        const projets = entrees
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(projets),
            },
          ],
        };
      } catch (error) {
        console.error("Erreur lors de la lecture du dossier ~/projets :", error);
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
      title: "Lire le fichier CLAUDE.md d’un projet",
      description:
        "Lit le contenu du fichier CLAUDE.md dans un projet spécifique de ~/projets. Utile pour obtenir les instructions ou notes spécifiques à un projet.",
      inputSchema: z.object({
        nom_projet: z.string().describe("Nom du dossier du projet (ex: mon-projet)"),
      }),
    },
    async ({ nom_projet }) => {
      const chemin = cheminAutorise(nom_projet, "CLAUDE.md");
      if (!chemin) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Accès refusé : le projet "${nom_projet}" n’est pas dans ~/projets ou le fichier CLAUDE.md est introuvable.`,
            },
          ],
        };
      }

      try {
        const contenu = await readFile(chemin, "utf-8");
        return {
          content: [
            {
              type: "text",
              text: contenu,
            },
          ],
        };
      } catch (error) {
        console.error(`Erreur lors de la lecture de ${chemin} :`, error);
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
# Connecteur MCP : projets-locaux

Ce connecteur permet de lister les projets dans le dossier `~/projets` et de lire le fichier `CLAUDE.md` d’un projet spécifique.

## Outils

### lister_projets
Retourne la liste des dossiers présents dans ~/projets.

### lire_claude_md
Lit le contenu du fichier CLAUDE.md dans un projet spécifique de ~/projets. Utile pour obtenir les instructions ou notes spécifiques à un projet.

## Installation

1. npm install
2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
3. npm run inspect (tester les outils dans l'inspecteur MCP)
4. Configuration : fusionner le contenu du fichier `config/codex-config.toml` dans votre fichier de configuration Codex :
   - Pour un projet : `~/.codex/config.toml`
   - Pour tous les projets : `~/.codex/config.toml` (ou un fichier spécifique à un projet)
5. Remplacer `/CHEMIN/ABSOLU/VERS` par le chemin réel du dossier du connecteur.

Exemple de configuration dans `~/.codex/config.toml` :
```toml
[mcp_servers.projets-locaux]
command = "node"
args = ["/CHEMIN/ABSOLU/VERS/projets-locaux/dist/index.js"]
```
```
=== FIN ===