Ce hook est conçu pour bloquer deux commandes potentiellement dangereuses : `rm -rf` (qui supprime de manière irréversible des fichiers ou dossiers) et `git push --force` (qui peut écraser l'historique Git). Il vérifie si la commande exécutée contient l'une de ces séquences, et si oui, bloque l'exécution en renvoyant un code d'erreur. Cela permet de protéger les données sensibles ou l'historique de versionning.

=== FICHIER: .codex/hooks/safe_rm_git.sh ===
#!/usr/bin/env bash
set -euo pipefail

# Lecture de l'entrée standard (JSON contenant la commande)
input=$(cat)

# Extraction de la commande à partir du JSON
command=$(echo "$input" | jq -r '.command')

# Vérification si la commande contient rm -rf ou git push --force
if [[ "$command" == *"rm -rf"* ]] || [[ "$command" == *"git push --force"* ]]; then
  echo "Commande bloquée pour des raisons de sécurité : $command" >&2
  exit 2
fi

# Si la commande est autorisée, on laisse continuer
exit 0
=== FIN ===

À vérifier :
- Le hook ne bloque que les commandes exactement comme spécifié (il pourrait être trop strict ou trop permissif selon le contexte).
- Assurez-vous que le fichier `.codex/hooks/safe_rm_git.sh` est exécutable (`chmod +x .codex/hooks/safe_rm_git.sh`).
- Le hook ne s'applique qu'aux commandes exécutées via l'événement `PreToolUse`.