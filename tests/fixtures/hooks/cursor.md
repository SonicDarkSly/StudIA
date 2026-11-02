Ce hook empêche l'exécution de commandes potentiellement destructrices, comme `rm -rf` ou `git push --force`. Il vérifie la commande entrante via stdin et refuse l’exécution si elle contient ces motifs. Cela protège contre les erreurs humaines ou les exécutions accidentelles.

=== FICHIER: .cursor/hooks/block-destructive.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de la commande via stdin
command=$(jq -r '.command // empty')

# Vérification des motifs destructifs
if [[ "$command" == *"rm -rf"* ]] || [[ "$command" == *"git push --force"* ]]; then
  echo '{"permission": "deny", "user_message": "Cette commande est bloquée pour des raisons de sécurité.", "agent_message": "Commande bloquée : '"$command"'"}' >&2
  exit 2
fi

echo '{"permission": "allow"}'
exit 0
=== FIN ===

=== FICHIER: .cursor/hooks.json ===
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": ".cursor/hooks/block-destructive.sh"
      }
    ]
  }
}
=== FIN ===

À vérifier :
- Assure-toi que le script `.cursor/hooks/block-destructive.sh` est exécutable (`chmod +x .cursor/hooks/block-destructive.sh`).
- Fusionne le contenu de `.cursor/hooks.json` avec ton fichier de configuration existant.