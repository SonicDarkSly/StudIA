Ce connecteur MCP « projets-locaux » permet d'interagir avec les projets stockés dans le dossier ~/projets. Il propose deux outils en lecture seule :
1. `lister_projets` : liste tous les dossiers présents dans ~/projets.
2. `lire_claude_md` : lit le contenu du fichier CLAUDE.md d'un projet spécifique.

Les outils sont conçus pour fonctionner avec le protocole Model Context Protocol (MCP) et utilisent le SDK officiel pour Node.js. Le dossier autorisé est ~/projets, et les chemins sont validés pour éviter tout accès non autorisé.

À vérifier :
- Le dossier ~/projets existe bien et contient des projets.
- Les fichiers CLAUDE.md sont présents dans les dossiers de projets si on utilise `lire_claude_md`.

=== FICHIER: projets-locaux/src/index.ts ===
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
      title: "Lister les projets",
      description: "Liste tous les dossiers présents dans le dossier ~/projets.",
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
      title: "Lire CLAUDE.md d'un projet",
      description: "Lit le contenu du fichier CLAUDE.md d'un projet spécifique situé dans ~/projets.",
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
=== FIN ===

=== FICHIER: projets-locaux/README.md ===
# Connecteur MCP « projets-locaux »

Ce connecteur permet d'interagir avec les projets stockés dans le dossier `~/projets`.

## Outils

### `lister_projets`
Liste tous les dossiers présents dans le dossier `~/projets`.

### `lire_claude_md`
Lit le contenu du fichier `CLAUDE.md` d'un projet spécifique situé dans `~/projets`.

## Installation

1. npm install
2. npm run build (crée dist/index.js, le fichier lancé par l'IA)
3. npm run inspect (tester les outils dans l'inspecteur MCP)
4. Configuration : où fusionner le fichier du dossier config/ (voir FORMAT POUR L'IA CIBLE).
5. Une phrase qui dit de remplacer /CHEMIN/ABSOLU/VERS par le chemin réel du dossier du connecteur.

### Configuration pour Claude Code
Fusionner `config/claude-mcp.json` dans `.mcp.json` à la racine du projet (Claude Code) ou dans `claude_desktop_config.json` (Claude Desktop, redémarrage complet nécessaire).

### Configuration pour Codex
Ajouter `config/codex-config.toml` dans `~/.codex/config.toml` (ou `.codex/config.toml` d’un projet approuvé).

### Configuration pour VS Code
Fusionner `config/vscode-mcp.json` dans `.vscode/mcp.json` (clé "servers", différente des autres outils).

### Configuration pour Cursor
Fusionner `config/cursor-mcp.json` dans `.cursor/mcp.json` du projet ou `~/.cursor/mcp.json`.

### Configuration pour Gemini
Fusionner `config/gemini-settings.json` dans `.gemini/settings.json` du projet ou `~/.gemini/settings.json`.

### Configuration pour Antigravity
Fusionner `config/antigravity-mcp.json` dans `.agents/mcp_config.json` du projet ou `~/.gemini/config/mcp_config.json`.

Remplacer `/CHEMIN/ABSOLU/VERS` par le chemin réel du dossier du connecteur.
=== FIN ===