import type { TargetFormats } from '../../domain/ai-target.js';
import { SKILL_RULES } from '../../utils/agent-skills.js';

const SKILL_COMMON = `Format Agent Skills (standard ouvert). SKILL.md commence exactement ainsi, la ligne --- en
toute première ligne, sans bloc \`\`\` autour de l'en-tête ni du corps :
---
name: nom-de-la-skill
description: Ce que la skill produit et quand l'utiliser, avec les mots de l'utilisateur.
---
name : identique au nom du dossier, minuscules, chiffres et tirets, 64 caractères max ; description : 1 024
caractères max. Tous les champs de l'en-tête sont entre ces deux lignes ---, aucun après le corps. Puis le corps en
Markdown. Fichiers d'appui dans le même dossier : references/, assets/, et scripts/ seulement si indispensable.`;

export const SKILL_FORMATS: TargetFormats = {
  claude: {
    status: 'natif',
    summary:
      'Dossier .claude/skills/<nom>/ : Claude Code charge la skill quand la demande correspond, ou via /nom.',
    paths: ['.claude/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .claude/skills/<nom>/SKILL.md
Champs facultatifs reconnus par Claude Code : argument-hint (l'argument se lit dans le corps avec $ARGUMENTS),
disable-model-invocation (true = seulement via /nom, uniquement si l'utilisateur le demande), allowed-tools (outils
autorisés sans confirmation).
allowed-tools s'écrit sur une ligne, séparé par des espaces, avec les vrais noms d'outils de Claude Code : Read,
Write, Edit, Glob, Grep, Bash(commande *), WebFetch. Exemple : allowed-tools: Read Write Bash(git status *)
Seulement si l'utilisateur demande un script, il se cite avec \${CLAUDE_SKILL_DIR} (dossier de la skill) :
« Lancer \`bash \${CLAUDE_SKILL_DIR}/scripts/<script>.sh <fichier>\` », et s'autorise par
allowed-tools: Bash(bash \${CLAUDE_SKILL_DIR}/scripts/<script>.sh *)`,
    skill: SKILL_RULES.claude,
  },
  codex: {
    status: 'natif',
    summary: 'Dossier .agents/skills/<nom>/ : Codex la déclenche seul ou avec $nom.',
    paths: ['.agents/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .agents/skills/<nom>/SKILL.md (Codex lit .agents/skills du dossier courant jusqu'à la racine du dépôt).
N'utiliser que name et description dans l'en-tête. L'utilisateur peut l'appeler explicitement avec $nom.
Ne crée PAS de fichier agents/openai.yaml, sauf si l'utilisateur écrit explicitement que la skill ne doit se lancer
que sur appel ($nom) ; dans ce cas seulement, ajouter agents/openai.yaml dans le
dossier de la skill :
policy:
  allow_implicit_invocation: false
Seulement si l'utilisateur demande un script, il se cite par son chemin depuis la racine de la skill : « Lancer \`bash scripts/<script>.sh\` ».`,
    skill: SKILL_RULES.codex,
  },
  copilot: {
    status: 'natif',
    summary:
      'Dossier .github/skills/<nom>/ : lu par Copilot dans VS Code, en ligne de commande et sur GitHub.',
    paths: ['.github/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .github/skills/<nom>/SKILL.md
Attention : un name invalide fait ignorer la skill sans message d'erreur. Champs facultatifs : argument-hint,
user-invocable, disable-model-invocation (uniquement si l'utilisateur veut un appel manuel). Pas de champ
allowed-tools.
Les fichiers de la skill (références, script éventuel) se citent par un chemin relatif à SKILL.md : [nom du script](./scripts/<script>.sh).`,
    skill: SKILL_RULES.copilot,
  },
  cursor: {
    status: 'natif',
    summary: 'Dossier .cursor/skills/<nom>/ : Cursor la charge quand la demande correspond.',
    paths: ['.cursor/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .cursor/skills/<nom>/SKILL.md
Champs facultatifs : paths, liste de motifs de fichiers (ex. ["src/**/*.tsx"]) pour limiter le déclenchement ;
disable-model-invocation (true = seulement via /nom, uniquement si l'utilisateur le demande). Pas de champ
allowed-tools.
Seulement si l'utilisateur demande un script, il se cite par son chemin depuis la racine de la skill : « Lancer \`bash scripts/<script>.sh\` ».`,
    skill: SKILL_RULES.cursor,
  },
  gemini: {
    status: 'natif',
    summary: 'Dossier .gemini/skills/<nom>/ : Gemini CLI la charge quand la demande correspond.',
    paths: ['.gemini/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .gemini/skills/<nom>/SKILL.md. N'utiliser que name et description dans l'en-tête.
Seulement si l'utilisateur demande un script, il se cite par son chemin complet depuis le projet :
« Lancer \`bash .gemini/skills/<nom>/scripts/<script>.sh\` ».`,
    skill: SKILL_RULES.gemini,
  },
  antigravity: {
    status: 'natif',
    summary:
      'Dossier .agents/skills/<nom>/ : Antigravity CLI la charge quand la demande correspond, ou avec /nom.',
    paths: ['.agents/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .agents/skills/<nom>/SKILL.md (Antigravity ne lit ni .gemini/skills/ ni .claude/). N'utiliser que name
et description dans l'en-tête. La skill s'appelle aussi en tapant /nom.
Seulement si l'utilisateur demande un script, il se cite par son chemin complet depuis le projet :
« Lancer \`bash .agents/skills/<nom>/scripts/<script>.sh\` ».`,
    skill: SKILL_RULES.antigravity,
  },
  portable: {
    status: 'natif',
    summary:
      'Dossier .agents/skills/<nom>/ : lu par Codex, Copilot, Cursor, Gemini CLI et Antigravity. Pour Claude, copier le dossier dans .claude/skills/.',
    paths: ['.agents/skills/'],
    instructions: `${SKILL_COMMON}
Emplacement : .agents/skills/<nom>/SKILL.md. N'utiliser que les champs du standard (name, description, et si utile
license, compatibility, metadata). Aucune syntaxe propre à un outil dans le corps.
Seulement si l'utilisateur demande un script, il se cite par son chemin depuis la racine de la skill : « Lancer \`bash scripts/<script>.sh\` ».
Dans « À vérifier », rappeler que Claude Code ne lit que .claude/skills/ : y copier le même dossier.`,
    skill: SKILL_RULES.portable,
  },
};
