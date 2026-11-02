Ce hook empêche l'exécution de commandes potentiellement destructrices, comme `rm -rf` ou `git push --force`, en vérifiant le contenu de la commande exécutée via `run_command`. Il est utile pour éviter les erreurs graves liées à ces commandes. Le script lit la commande depuis l'entrée standard, la compare avec les motifs bloqués, et refuse l'exécution si nécessaire.

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

# Lecture de la commande depuis stdin
command_line=$(jq -r '.toolCall.args.CommandLine // empty' <&0)

# Vérification des commandes dangereuses
if [[ "$command_line" == *"rm -rf"* ]] || [[ "$command_line" == *"git push --force"* ]]; then
  echo '{"decision": "deny", "reason": "Commande bloquée car dangereuse : '"$command_line"'"}'
  exit 0
fi

# Autorisation par défaut
echo '{"decision": "allow"}'
exit 0
=== FIN ===

À vérifier :
- Assure-toi que le fichier `block-dangerous-commands.sh` est exécutable (`chmod +x .agents/hooks/block-dangerous-commands.sh`).
- Vérifie que le fichier `.agents/hooks.json` est fusionné correctement avec ton configuration existante.