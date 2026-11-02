# StudIA

Studio d'éléments pour l'IA, **100 % local**. Un chat façon Claude ou Gemini qui tourne entièrement sur
l'ordinateur et qui aide à fabriquer des **skills**, des **connecteurs MCP**, des **commandes slash**, des
**sous-agents**, des **fichiers de consignes** (CLAUDE.md, AGENTS.md, GEMINI.md…), des **hooks** et des
**plugins**, en s'appuyant sur ses propres projets.

- Aucun appel à un service en ligne : les modèles tournent avec `node-llama-cpp`, les conversations restent
  dans `server/data/conversations`.
- **Autonome** : StudIA ne parcourt aucun dossier de lui-même. Chaque utilisateur ajoute ses projets
  (bouton « Ajouter un projet »), qui sont lus en **lecture seule**. StudIA n'écrit jamais dedans : les fichiers générés s'affichent
  en aperçu et se téléchargent (fichier seul ou archive ZIP).
- **Une IA cible au choix** : Claude, Codex, GitHub Copilot, Cursor, Gemini CLI, Antigravity ou « Multi-outils ». Les
  dossiers, formats et contrôles automatiques s'adaptent à l'outil choisi.
- **Adapté à la machine** : StudIA mesure la mémoire et le processeur graphique, classe chaque modèle
  (compatible, limite, trop lourd) et bloque ceux qui ne tiendraient pas.
- Les réglages du modèle (température, top-p, top-k, min-p, pénalités, contexte, réflexion…) sont modifiables
  à la main, chacun avec une explication de son effet : c'est aussi un outil pour comprendre un LLM local.

## Lancer

| Système | Double-clic sur               |
| ------- | ----------------------------- |
| macOS   | `Lancer-StudIA-macOS.command` |
| Linux   | `Lancer-StudIA-Linux.sh`      |
| Windows | `Lancer-StudIA-Windows.bat`   |

Le lanceur installe Node.js si besoin (nvm, ou version portable sous Windows), installe les dépendances au
premier lancement puis ouvre <http://localhost:5175>. Fermer la fenêtre arrête l'application.

En ligne de commande : `npm install` puis `npm run dev` (API sur le port 3003, interface sur le port 5175).

## Modèles

Treize modèles ouverts, de 2 à 19 Go (format GGUF, quantification Q4_K_M), de six éditeurs :

| Éditeur    | Modèles                                                    |
| ---------- | ---------------------------------------------------------- |
| Alibaba    | Qwen3 30B-A3B, Qwen3 Coder 30B-A3B, Qwen3 8B, Qwen2.5 7B et 3B |
| Google     | Gemma 3 27B, Gemma 3 12B                                   |
| Mistral AI | Mistral Small 3.2 24B                                      |
| OpenAI     | gpt-oss 20B                                                |
| DeepSeek   | DeepSeek-R1 Distill 14B                                    |
| Meta       | Llama 3.1 8B, Llama 3.2 3B                                 |
| Microsoft  | Phi-4 mini                                                 |

Les modèles se téléchargent depuis l'onglet **Modèle** (une seule fois, dans `server/data/llm`). StudIA ne
parcourt aucun autre dossier de lui-même : un fichier `.gguf` déjà présent dans un projet que l'utilisateur a
ajouté (`server/data/llm`, `data/llm` ou `models`) ou dans `STUDIA_EXTRA_MODEL_DIRS` est réutilisé sans copie. Un seul modèle est
gardé en mémoire ; il est libéré après 10 minutes d'inactivité. Chaque modèle reste soumis à sa propre
licence, affichée dans l'interface. Sa carte indique aussi les modes pour lesquels il est idéal (Discussion
libre, Skill, Connecteur MCP…, champ `idealFor` de `server/models.json`).

Repères : 8 Go de mémoire → modèles de 3 à 4 Md de paramètres ; 16 Go → jusqu'à 12-14 Md ; 32 Go et plus →
tout le catalogue.

## Générateurs et IA cibles

| Élément             | Claude | Codex  | Copilot | Cursor | Gemini CLI | Antigravity | Multi-outils |
| ------------------- | ------ | ------ | ------- | ------ | ---------- | ----------- | ------------ |
| Skill               | natif  | natif  | natif   | natif  | natif      | natif       | natif        |
| Connecteur MCP      | natif  | natif  | natif   | natif  | natif      | natif       | natif        |
| Commande slash      | natif  | adapté | natif   | natif  | natif      | adapté      | adapté       |
| Sous-agent          | natif  | natif  | natif   | natif  | natif      | natif       | adapté       |
| Consignes du projet | natif  | natif  | natif   | natif  | natif      | natif       | natif        |
| Hooks               | natif  | natif  | natif   | natif  | natif      | natif       | non          |
| Plugin              | natif  | natif  | natif   | natif  | natif      | natif       | natif        |

« Adapté » : l'outil n'a pas ce format, StudIA livre l'équivalent le plus proche (par exemple une skill
appelable à la place d'une commande). Gemini CLI reste disponible avec une clé API payante ou Gemini Code
Assist Standard / Enterprise ; les comptes gratuits et Google One utilisent Antigravity CLI. Les connecteurs MCP
sont écrits avec le SDK officiel v2 (`@modelcontextprotocol/server`), compatible avec les anciens et les nouveaux
clients. Le mode Plugin suit le standard Agent Plugins (Codex, Copilot, Cursor) ou le format propre à Claude
Code, Gemini CLI et Antigravity.

## Configuration (facultative)

Variables d'environnement, ou fichier `server/.env` :

| Variable                  | Défaut                   | Effet                                                       |
| ------------------------- | ------------------------ | ----------------------------------------------------------- |
| `STUDIA_EXTRA_MODEL_DIRS` | aucun                    | Dossiers supplémentaires de `.gguf` (séparés par `;` ou `,`) |
| `STUDIA_IDLE_MINUTES`     | `10`                     | Libération du modèle après inactivité (0 = jamais)          |
| `STUDIA_MEMORY_GB`        | mémoire détectée         | Remplace la mémoire mesurée (tests, machine partagée)       |
| `STUDIA_IGNORE_LIMITS`    | aucun                    | `1` autorise les modèles jugés trop lourds                  |
| `STUDIA_LAN`              | aucun                    | `1` ouvre l'accès depuis le réseau local                    |
| `PORT`                    | `3003`                   | Port de l'API                                               |

## Architecture

- `server/` : NestJS 12 en DDD + CQRS (`@nestjs/cqrs`), contextes `models`, `projects`, `modes`,
  `conversations`. Chaque mode est un dossier indépendant (`modules/modes/catalog/<mode>/`) : ajouter ou modifier
  un mode ne touche pas les autres (isolement contrôlé par ESLint).
- Données validées par zod : entrées de l'API, fichiers lus, variables d'environnement, réponses reçues par le
  client et fichiers JSON produits par le modèle.
- `client/` : React 19 + TypeScript + Vite + Ant Design, thème néon sombre (clair disponible).

## Auteur et licence

StudIA a été conçu et développé par [**SonicDarkSly**](https://github.com/SonicDarkSly).

Distribué sous licence [Apache 2.0](LICENSE). Vous pouvez l'utiliser, le modifier et le redistribuer
librement, à condition de conserver la mention de l'auteur : le fichier [`NOTICE`](NOTICE) doit accompagner
toute copie ou version modifiée.
