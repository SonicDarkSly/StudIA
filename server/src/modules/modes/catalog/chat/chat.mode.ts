import type { Mode } from '../../domain/mode.js';
import { BASE } from '../../utils/prompt-base.js';
import { CHAT_FORMATS } from './chat.formats.js';

const GLOSSARY = `- Skill : Une fiche de procédure que l'agent charge seulement quand la tâche se présente (standard ouvert Agent Skills). StudIA produit le dossier complet.
- Connecteur MCP : Un serveur Model Context Protocol qui expose des outils à n'importe quelle IA compatible (Claude, Cursor, VS Code, ChatGPT…). StudIA écrit le code des outils et ajoute package.json, tsconfig et la configuration à coller.
- Commande slash : Une consigne réutilisable que l’on lance en tapant /nom suivi d’arguments. Le fichier et son format dépendent de l’IA cible.
- Sous-agent : Un sous-agent auquel l’agent principal délègue une tâche précise, avec sa propre fenêtre de contexte et ses outils.
- Consignes du projet : Le fichier lu au démarrage par les agents de code. StudIA le rédige à partir du code réel du projet sélectionné (stack, commandes, structure, conventions) ; son nom dépend de l’IA cible.
- Hooks : Des scripts lancés par l’agent à un moment précis (avant un outil, après une modification, en fin de tâche). Contrairement à une consigne, ils s’exécutent à coup sûr.
- Plugin : Un plugin (ou extension) regroupe plusieurs éléments (skills, commandes, sous-agents, hooks, serveurs MCP) pour les installer en une fois et les partager. Son manifeste et sa structure dépendent de l’IA cible.`;

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

VOCABULAIRE DE RÉFÉRENCE (définitions exactes, à utiliser telles quelles) :
${GLOSSARY}`,
  usesFiles: false,
  formats: CHAT_FORMATS,
};
