Ce hook bloque les commandes potentiellement dangereuses comme `rm -rf` ou `git push --force`, qui peuvent entraîner une perte de données irréversible. Il vérifie l'entrée standard pour détecter ces motifs et empêche leur exécution en retournant un code d'erreur. Le script est rapide, sécurisé et ne modifie pas d'état.

=== FICHIER: .codex/hooks/block-dangerous-commands.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de l'entrée standard (JSON)
input=$(cat)

# Extraction de la commande
command=$(jq -r '.tool_input.command // empty' <<< "$input")

# Vérification des commandes dangereuses
if [[ "$command" == *"rm -rf"* ]] || [[ "$command" == *"git push --force"* ]]; then
  echo "Commande bloquée : ${command}" >&2
  exit 2
fi

# Si aucune commande dangereuse, on continue
exit 0
=== FIN ===

=== FICHIER: .codex/hooks.json ===
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".codex/hooks/block-dangerous-commands.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
=== FIN ===

À vérifier :
- Assure-toi que le fichier .codex/hooks/block-dangerous-commands.sh est exécutable (chmod +x).
- Fusionne le contenu de .codex/hooks.json avec ton fichier de configuration existant.
- Ce hook ne s'applique qu'aux projets approuvés et nécessite l'approbation via la commande /hooks.