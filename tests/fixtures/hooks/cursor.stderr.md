Ce hook empêche l'exécution de commandes potentiellement dangereuses comme `rm -rf` ou `git push --force`. Cela protège contre les erreurs humaines ou les exécutions accidentelles qui pourraient causer des pertes de données irréversibles. Le script vérifie la commande entrante via stdin, et refuse l'exécution si elle correspond à ces motifs.

=== FICHIER: .cursor/hooks/block-dangerous-commands.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de la commande depuis stdin
input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

# Vérification si la commande contient des motifs dangereux
if [[ "$command" == *"rm -rf"* ]] || [[ "$command" == *"git push --force"* ]]; then
  echo '{"permission": "deny", "user_message": "Exécution bloquée : cette commande est potentiellement destructive.", "agent_message": "La commande contient un motif dangereux et a été bloquée."}' >&2
  exit 2
fi

# Autorisation par défaut
echo '{"permission": "allow"}'
exit 0
=== FIN ===

=== FICHIER: .cursor/hooks.json ===
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": ".cursor/hooks/block-dangerous-commands.sh"
      }
    ]
  }
}
=== FIN ===

À vérifier :
- Assurez-vous que le script `.cursor/hooks/block-dangerous-commands.sh` est exécutable : `chmod +x .cursor/hooks/block-dangerous-commands.sh`.
- Vérifiez que le fichier `.cursor/hooks.json` est fusionné correctement avec votre configuration existante.