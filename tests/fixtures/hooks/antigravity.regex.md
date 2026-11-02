Ce hook empêche l'exécution de commandes potentiellement dangereuses comme `rm -rf` ou `git push --force`. Il est utile pour éviter les erreurs graves ou la perte de données. Le script vérifie si la commande contient ces motifs et refuse l’exécution en cas de correspondance.

=== FICHIER: .agents/hooks.json ===
{
  "DangerousCommands": {
    "PreToolUse": [
      {
        "matcher": "run_command",
        "hooks": [
          {
            "type": "command",
            "command": ".agents/hooks/block-dangerous-commands.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
=== FIN ===

=== FICHIER: .agents/hooks/block-dangerous-commands.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de l'entrée standard (JSON)
input=$(cat)

# Extraction de la commande exécutée
command_line=$(jq -r '.toolCall.args.CommandLine // empty' <<< "$input")

# Vérification des motifs dangereux
if [[ "$command_line" =~ rm\ -rf\|git\ push\ --force ]]; then
  # Refuser l'exécution
  echo '{"decision": "deny", "reason": "Commande bloquée car dangereuse : '"$command_line"'"}'
  exit 0
fi

# Autoriser l'exécution
echo '{"decision": "allow"}'
exit 0
=== FIN ===

À vérifier :
- Assurez-vous que le fichier `block-dangerous-commands.sh` est exécutable avec `chmod +x .agents/hooks/block-dangerous-commands.sh`.
- Vérifiez que le fichier `.agents/hooks.json` est fusionné correctement avec votre configuration existante.