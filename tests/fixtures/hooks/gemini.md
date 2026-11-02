Ce hook empêche l'exécution de commandes potentiellement dangereuses comme `rm -rf` ou `git push --force`. Il vérifie la commande entrante via `jq` et refuse l'exécution si ces motifs sont présents. Le script est rapide, sécurisé et ne modifie pas d'état. Pour l'activer, il faut fusionner le fichier de configuration avec `.gemini/settings.json` et rendre le script exécutable avec `chmod +x`.

=== FICHIER: .gemini/hooks/safe_command.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de la commande via stdin
command=$(jq -r '.tool_input.command // empty' <&0)

# Vérification des commandes dangereuses
if [[ "$command" == *"rm -rf"* ]] || [[ "$command" == *"git push --force"* ]]; then
  echo '{"decision": "deny", "reason": "Commande bloquée pour des raisons de sécurité : elle peut causer une perte de données ou un réécriture inattendue du historique Git."}' >&1
  exit 0
fi

# Si aucune commande dangereuse n'est détectée, on autorise l'exécution
exit 0
=== FIN ===

=== FICHIER: .gemini/settings.json ===
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "run_shell_command",
        "hooks": [
          {
            "type": "command",
            "command": ".gemini/hooks/safe_command.sh",
            "timeout": 30000
          }
        ]
      }
    ]
  }
}
=== FIN ===

À vérifier :
- Assure-toi que le fichier `.gemini/settings.json` existe déjà ou crée-le avant de fusionner.
- Exécute `chmod +x .gemini/hooks/safe_command.sh` pour rendre le script exécutable.
- Le hook ne bloque pas les commandes avec des espaces ou des variations (ex: `rm -rf /`), mais il couvre les cas les plus courants.