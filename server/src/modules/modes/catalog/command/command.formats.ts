import type { TargetFormats } from '../../domain/ai-target.js';

const SKILL_AS_COMMAND = (
  dir: string,
  how: string,
) => `Cet outil n'a pas de commande slash de projet : livrer à la place une skill
invocable, qui joue le même rôle.
Emplacement : ${dir}/<nom>/SKILL.md, en-tête YAML avec name (identique au dossier) et description.
Le corps est la consigne de la commande. ${how}
Un seul fichier : SKILL.md. Ni script, ni README, ni package.json, ni licence : l'agent lance lui-même les
commandes décrites dans la consigne. Les explications pour l'utilisateur restent hors du fichier.

Exemple complet (${dir}/resume-diff/SKILL.md) :
---
name: resume-diff
description: Résume les modifications en cours avant un commit, quand l'utilisateur demande un résumé de ses changements
---
1. Lance git diff --stat, puis lis le détail (git diff), limité au chemin donné par l'utilisateur s'il y en a un.
2. Regroupe les modifications par intention (correctif, nouveauté, nettoyage).
3. Réponds par une liste courte : intention, fichiers concernés, point à vérifier avant le commit.
Ne modifie aucun fichier.`;

export const COMMAND_FORMATS: TargetFormats = {
  claude: {
    status: 'natif',
    summary: 'Fichier .claude/commands/<nom>.md, lancé en tapant /nom dans Claude Code.',
    paths: ['.claude/commands/'],
    instructions: `Emplacement : .claude/commands/<nom>.md
En-tête YAML :
---
description: ce que fait la commande, en une phrase (affichée dans le menu /)
argument-hint: [ce que l'utilisateur peut ajouter après /nom] (facultatif)
allowed-tools: outils permis sans demande, le plus restreint possible, par ex. Read, Grep, Bash(npm run typecheck *)
---
Dans allowed-tools, Bash(npm run typecheck *) permet la commande avec ou sans arguments ; sans *, seule la
commande exacte est permise.
Corps : la consigne. $ARGUMENTS reçoit tout le texte tapé après la commande ; $0 le premier mot, $1 le deuxième.
Sans $ARGUMENTS dans la consigne, ce texte est ajouté à la fin (ARGUMENTS: …).
Facultatif : !\`commande\` (point d'exclamation collé à la commande entre accents graves) insère la sortie de
la commande avant l'envoi. Elle doit être permise dans allowed-tools, et si elle échoue, toute la commande slash
est annulée : la réserver aux commandes d'information qui réussissent toujours (git status, git diff, git log).
Une vérification qui peut échouer (typecheck, tests, lint, build) est lancée par l'agent : la consigne le lui
demande, et ses commandes restent permises dans allowed-tools.
Le fichier ne contient que l'en-tête et la consigne : les explications pour l'utilisateur restent hors du fichier.

Exemple complet (.claude/commands/resume-diff.md) :
---
description: Résume les modifications en cours avant un commit
argument-hint: [dossier ou fichier à cibler]
allowed-tools: Read, Bash(git diff *)
---
Modifications en cours : !\`git diff --stat\`

1. Lis le détail des modifications (git diff), limité à $ARGUMENTS si un chemin est donné.
2. Regroupe-les par intention (correctif, nouveauté, nettoyage).
3. Réponds par une liste courte : intention, fichiers concernés, point à vérifier avant le commit.
Ne modifie aucun fichier.`,
  },
  codex: {
    status: 'adapte',
    summary:
      'Codex a remplacé ses commandes par les skills : StudIA livre une skill .agents/skills/<nom>/, appelée avec $nom.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND('.agents/skills', "L'utilisateur la lance avec $nom suivi de son texte."),
  },
  copilot: {
    status: 'natif',
    summary:
      'Fichier .github/prompts/<nom>.prompt.md, lancé avec /nom dans le chat de VS Code (pas dans Copilot CLI).',
    paths: ['.github/prompts/'],
    instructions: `Emplacement : .github/prompts/<nom>.prompt.md
En-tête YAML (tous facultatifs) :
---
description: ce que fait la commande, en une phrase
argument-hint: ce que l'utilisateur peut ajouter
agent: agent
tools: ['search', 'read', 'edit', 'execute']
---
Outils : search (chercher), read (lire), edit (modifier), execute (lancer des commandes dans le terminal) ;
n'en garder que le nécessaire.
Corps : la consigne. Variables : \${input:nom:indice} (demande une valeur), \${selection} (texte sélectionné) ;
#file:chemin joint un fichier. Préciser dans « À vérifier » que ces fichiers ne fonctionnent que dans VS Code et Visual Studio.`,
  },
  cursor: {
    status: 'natif',
    summary: 'Fichier .cursor/commands/<nom>.md (Markdown simple), lancé avec /nom dans le chat de Cursor.',
    paths: ['.cursor/commands/'],
    instructions: `Emplacement : .cursor/commands/<nom>.md
Markdown simple, sans en-tête YAML : un titre, puis la consigne. Le texte tapé après /nom est ajouté à la fin.
Signaler dans « À vérifier » que Cursor propose désormais de convertir les commandes en skills (/migrate-to-skills).`,
  },
  gemini: {
    status: 'natif',
    summary: 'Fichier .gemini/commands/<nom>.toml, lancé avec /nom dans Gemini CLI.',
    paths: ['.gemini/commands/'],
    instructions: `Emplacement : .gemini/commands/<nom>.toml (un sous-dossier crée un espace de noms : git/commit.toml devient /git:commit).
Format TOML :
description = "Ce que fait la commande, en une phrase"
prompt = """
La consigne.
"""
{{args}} est remplacé par le texte tapé après la commande : le placer là où ce texte sert (sans {{args}}, il est
ajouté à la fin ; ne pas l'écrire si la commande n'en a pas besoin).
!{commande shell} insère la sortie d'une commande, après confirmation de l'utilisateur : la consigne travaille
alors sur cette sortie et ne demande pas de relancer la commande. @{chemin} insère le contenu d'un fichier.
Le fichier doit être du TOML valide (chaînes multilignes entre triples guillemets) : rien après le """ final.`,
  },
  antigravity: {
    status: 'adapte',
    summary:
      'Antigravity transforme chaque skill en commande : StudIA livre une skill .agents/skills/<nom>/, appelée avec /nom.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND('.agents/skills', "L'utilisateur la lance avec /nom suivi de son texte."),
  },
  portable: {
    status: 'adapte',
    summary:
      'Pas de format de commande commun : StudIA livre une skill .agents/skills/<nom>/, appelable dans la plupart des outils.',
    paths: ['.agents/skills/'],
    instructions: SKILL_AS_COMMAND(
      '.agents/skills',
      'Rappeler dans « À vérifier » comment l’appeler : $nom (Codex), /nom (Copilot, Cursor, Gemini, Antigravity), et copier le dossier dans .claude/skills/ pour Claude.',
    ),
  },
};
