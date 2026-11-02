Une commande de vérification.

=== FICHIER: .claude/commands/verifier.md ===
---
description: Lance le typecheck
allowed-tools: Bash(tsc)
---
! tsc --noEmit
Contexte : !`npm run typecheck`

echo "=== Résumé ==="
if [ -n "$ARGUMENTS" ]; then
  echo "filtre"
fi

À vérifier :
- tsconfig.json existe.
