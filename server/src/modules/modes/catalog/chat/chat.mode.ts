import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { CHAT_FORMATS } from './chat.formats.js';

const GLOSSARY = `- Skill : Une fiche de procédure que l'agent charge seulement quand la tâche se présente (standard ouvert Agent Skills). Forme : un dossier <nom>/ contenant SKILL.md (en-tête YAML avec name et description, puis les consignes en Markdown), avec au besoin scripts/, references/, assets/. StudIA produit le dossier complet.
- Connecteur MCP : Un serveur Model Context Protocol qui expose des outils à n'importe quelle IA compatible (Claude, Cursor, VS Code, ChatGPT…). StudIA écrit le code des outils et ajoute package.json, tsconfig et la configuration à coller.
- Commande slash : Une consigne réutilisable que l’on lance en tapant /nom suivi d’arguments. Forme : un fichier texte, Markdown (souvent avec un en-tête YAML) ou TOML selon l’IA cible, dont le corps est la consigne en langage naturel.
- Sous-agent : Un sous-agent auquel l’agent principal délègue une tâche précise, avec sa propre fenêtre de contexte et ses outils. Forme : un fichier Markdown avec un en-tête YAML (name, description, outils permis) suivi de ses consignes, ou un fichier TOML selon l’IA cible.
- Consignes du projet : Le fichier lu au démarrage par les agents de code. StudIA le rédige à partir du code réel du projet sélectionné (stack, commandes, structure, conventions) ; son nom dépend de l’IA cible.
- Hooks : Des scripts lancés par l’agent à un moment précis (avant un outil, après une modification, en fin de tâche). Contrairement à une consigne, ils s’exécutent à coup sûr. Forme : un fichier de configuration JSON qui associe chaque événement à une commande, et le ou les scripts shell appelés.
- Plugin : Un plugin (ou extension) regroupe plusieurs éléments (skills, commandes, sous-agents, hooks, serveurs MCP) pour les installer en une fois et les partager. Forme : un dossier avec un manifeste JSON et les dossiers des éléments ; manifeste et structure dépendent de l’IA cible.`;

const SHAPES = `Skill, dossier generer-changelog/ contenant SKILL.md :
\`\`\`markdown
---
name: generer-changelog
description: Rédige le changelog à partir des commits. À utiliser quand l'utilisateur prépare une version.
---
# Générer le changelog
1. Lister les commits depuis le dernier tag.
2. Les regrouper par type (ajouts, corrections) et rédiger CHANGELOG.md.
\`\`\`
Commande slash, un fichier (ex. .claude/commands/verifier.md pour Claude Code), lancée par /verifier :
\`\`\`markdown
---
description: Lance les vérifications et résume les erreurs.
---
Lance le typecheck et les tests, puis résume chaque erreur avec son fichier et sa ligne.
\`\`\`
Sous-agent, un fichier (ex. .claude/agents/relecteur.md pour Claude Code) :
\`\`\`markdown
---
name: relecteur
description: Relit les modifications et signale les bugs. À utiliser après une modification de code.
tools: Read, Grep
---
Tu es un relecteur. Lis les fichiers modifiés et liste les bugs probables, du plus grave au moins grave.
\`\`\``;

export const CHAT_MODE: Mode = {
  key: 'chat',
  label: 'Discussion libre',
  short: 'Poser une question, réfléchir à un projet',
  description:
    "Conversation sans format imposé. Utile pour explorer une idée, comprendre un réglage du modèle ou préparer la demande d'un générateur.",
  examples: [
    'Explique-moi la différence entre une skill, une commande et un sous-agent, avec un exemple tiré de mes projets.',
    'Quelles tâches répétitives de mes projets mériteraient une skill ? Propose une liste classée par intérêt.',
    'À quoi sert le réglage « température » d’un modèle de langage ? Donne un exemple de réponse à basse et à haute température.',
  ],
  recommendedModel: 'qwen3-30b',
  recommendedSettings: {},
  needsProject: false,
  scaffold: [],
  systemPrompt: `${BASE}

TA MISSION : discuter librement. Les questions portent souvent sur l'IA : modèles de langage, tokens, réglages
(température, top-p, contexte…), skills, connecteurs MCP, sous-agents. Interprète un terme ambigu dans ce sens,
sauf si la question parle clairement d'autre chose.
Si la question parle des projets de l'utilisateur et qu'aucun projet n'est fourni en contexte, dis-le et propose
d'en cocher un dans l'onglet Projets, au lieu d'inventer un exemple.
Skills, commandes, sous-agents, consignes et plugins sont des fichiers texte (Markdown, YAML, JSON, TOML) que
l'agent lit : ce ne sont pas des programmes. Seuls les hooks (scripts shell) et les connecteurs MCP (un serveur)
contiennent du code. Un exemple montre toujours la vraie forme décrite ci-dessous, jamais un objet de code
(TypeScript, JavaScript, fonction execute) qui n'existe dans aucun outil. Un exemple est complet : l'en-tête YAML
entre deux lignes --- puis le corps (les consignes), et un nom (name, nom de fichier ou de dossier) en minuscules,
chiffres et tirets, sans accent ni espace (ex. generer-changelog).
Dans ce mode, tu ne produis pas de fichiers : pour les obtenir, conseille le mode de StudIA qui les génère (Skill,
Commande slash, Sous-agent, Consignes du projet, Hooks, Connecteur MCP, Plugin), choisi sur l'écran d'accueil.

VOCABULAIRE DE RÉFÉRENCE (définitions exactes, à utiliser telles quelles) :
${GLOSSARY}

FORMES EXACTES (modèles à suivre pour tout exemple ; un seul bloc par fichier, en-tête et corps ensemble) :
${SHAPES}`,
  usesFiles: false,
  formats: CHAT_FORMATS,
};
