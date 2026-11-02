Ce plugin « revue-code » est conçu pour aider les développeurs à vérifier leurs modifications en cours avant de les valider avec un commit. Il inclut une skill qui analyse les fichiers modifiés via `git diff --cached`, résume les changements et propose des suggestions d'amélioration ou d'erreurs courantes. Le plugin est compatible avec Claude Desktop et suit strictement le format requis.

=== FICHIER: revue-code/.claude-plugin/plugin.json ===
{
  "name": "revue-code",
  "version": "1.0.0",
  "description": "Analyse les modifications en attente de commit (git diff --cached) et propose une revue technique des changements.",
  "author": {
    "name": "Utilisateur"
  }
}
=== FIN ===

=== FICHIER: revue-code/skills/revue-code/SKILL.md ===
name: revue-code
description: Analyse les modifications en attente de commit (git diff --cached) et fournit un résumé technique, des suggestions d'amélioration et des alertes sur des erreurs fréquentes. Utilisez cette skill avant de valider un commit pour éviter des erreurs courantes.
=== FIN ===

=== FICHIER: revue-code/commands/revue.md ===
description: Analyse les modifications en attente de commit (git diff --cached) et propose une revue technique.
argument-hint: Aucun argument requis.
allowed-tools: ["git", "shell"]
=== FIN ===

=== FICHIER: revue-code/hooks/hooks.json ===
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/revue.sh"
          }
        ]
      }
    ]
  }
}
=== FIN ===

=== FICHIER: revue-code/hooks/revue.sh ===
#!/bin/bash
# Vérifie si git est disponible
if ! command -v git &> /dev/null; then
  echo "git n'est pas installé ou non accessible." >&2
  exit 2
fi

# Vérifie s'il y a des modifications en attente de commit
if ! git diff --cached --quiet; then
  # Affiche un message d'alerte
  cat << EOF
⚠️  Attention : des modifications sont en attente de commit.
Utilisez /revue-code:revue pour analyser les changements avant de valider.
EOF
fi
exit 0
=== FIN ===

=== FICHIER: revue-code/README.md ===
# Plugin `revue-code`

Ce plugin permet de relire les modifications en cours (en attente de commit) via `git diff --cached` et d'obtenir une revue technique des changements. Il inclut :

- Une **skill** `revue-code` pour analyser les fichiers modifiés.
- Une **commande** `/revue-code:revue` pour lancer la revue.
- Un **hook** qui s'active avant toute lecture/écriture pour avertir si des modifications sont en attente.

## Installation

1. Placez le dossier `revue-code` dans votre répertoire de plugins.
2. Lancez Claude avec le plugin activé :
   ```bash
   claude --plugin-dir ./revue-code
   ```
3. Validez l'installation :
   ```bash
   claude plugin validate ./revue-code
   ```

## Utilisation

- Pour lancer la revue des modifications en attente de commit, utilisez :
  ```
  /revue-code:revue
  ```

Le plugin affiche un résumé des changements et propose des suggestions d'amélioration ou des erreurs courantes.

## À vérifier
- Le script `revue.sh` peut nécessiter des ajustements selon les conventions de votre projet (ex : lancer une analyse plus poussée avec un outil comme `lint`).
- L’outil `git` doit être disponible dans le PATH.
- Si vous souhaitez intégrer une analyse statique (ex : `eslint`, `prettier`), il faudra ajouter des commandes supplémentaires et adapter les `allowed-tools`.
=== FIN ===

À vérifier
- Le script `revue.sh` affiche un avertissement mais ne fait pas d’analyse technique avancée (à compléter si besoin).
- Aucun outil de linting ou d’analyse statique n’est intégré par défaut ; à ajouter si souhaité.
- Le hook est actif sur toutes les opérations Read/Write : vérifiez que cela ne perturbe pas le flux normal.