Ce hook bloque les commandes potentiellement dangereuses comme `rm -rf` ou `git push --force`, qui peuvent causer des pertes de données irréversibles. Il vérifie la commande entrante via stdin, et refuse l'exécution si un de ces motifs est détecté. Le script utilise `jq` pour parser le JSON d'entrée et `[[ =~ ]]` pour les motifs. Pour activer ce hook, il faut rendre le script exécutable avec `chmod +x` et fusionner la configuration dans `.github/hooks/config.json`.

=== FICHIER: .github/hooks/safe_command.json ===
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./.github/hooks/safe_command.sh",
        "timeoutSec": 30
      }
    ]
  }
}
=== FIN ===

=== FICHIER: .github/hooks/safe_command.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de la commande depuis stdin
command=$(jq -r '(.toolArgs | if type == "string" then fromjson else . end).command // empty')

# Vérification des motifs dangereux
if [[ "$command" == *"rm -rf"* ]] || [[ "$command" == *"git push --force"* ]]; then
  echo "{ \"permissionDecision\": \"deny\", \"permissionDecisionReason\": \"Commande bloquée pour cause de risque de perte de données : $command\" }" >&2
  exit 2
fi

# Autorisation par défaut
exit 0
=== FIN ===

À vérifier :
- S'assurer que le fichier `.github/hooks/config.json` existe et est fusionné avec ce hook.
- Vérifier que `jq` est installé sur la machine pour parser les entrées JSON.
- Le script nécessite l'exécution de `chmod +x .github/hooks/safe_command.sh` pour être exécuté.